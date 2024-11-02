from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
from users.models import UserMedia
from django.db.models import Q, Count, Prefetch, BooleanField, When, Case
from itertools import chain
from friendship.models import Friendship
from posts.models import Post, SharedPost, Like, Comment
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

def optimize_image(image):
    # Open the uploaded image
    img = Image.open(image)

    # Resize or compress the image while keeping the aspect ratio
    max_size = (800, 800)  # Define the max dimensions
    img.thumbnail(max_size, Image.Resampling.LANCZOS)  # Maintain aspect ratio, use LANCZOS resampling for better quality

    # Save the optimized image to a BytesIO object
    buffer = BytesIO()

    # Check if the image is JPEG or PNG, adjust format and quality accordingly
    if img.format.lower() in ['jpeg', 'jpg']:
        img.save(buffer, format='JPEG', quality=80)  # Compress JPEG to 80% quality
    else:
        img.save(buffer, format=img.format)  # For other formats, use default quality

    buffer.seek(0)  # Move to the beginning of the buffer

    # Create a new InMemoryUploadedFile with the optimized image
    optimized_image = InMemoryUploadedFile(
        buffer,                     # File content
        'ImageField',               # Field type
        image.name,                 # File name
        f'image/{img.format.lower()}',  # Content type (MIME)
        sys.getsizeof(buffer),      # File size
        None                        # Optional charset
    )

    return optimized_image

def create_or_update_media(user, image_field, media_type):
    if image_field:
        media_path = image_field.url
        if not UserMedia.objects.filter(user=user, media_file_link=media_path, media_type=media_type).exists():
            UserMedia.objects.create(
                user=user,
                media_file_link=media_path,
                media_type=media_type,
            )

def quicksort(arr, key):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if key(x) > key(pivot)]
    middle = [x for x in arr if key(x) == key(pivot)]
    right = [x for x in arr if key(x) < key(pivot)]
    return quicksort(left, key) + middle + quicksort(right, key)


def returnTimeString(timestamp):
    """
    this function returns time in string like 30s, 1h, 3d and etc.
    """
    if not timestamp:
        return ""
    now = timezone.now()
    diff = now - timestamp

    if diff < timedelta(minutes=1):
        return f"{int(diff.total_seconds())}s"
    elif diff < timedelta(hours=1):
        return f"{int(diff.total_seconds() // 60)}m"
    elif diff < timedelta(days=1):
        return f"{int(diff.total_seconds() // 3600)}h"
    elif diff < timedelta(days=7):
        return f"{diff.days}d"
    else:
        weeks = diff.days // 7
        return f"{weeks}w" if weeks < 5 else timestamp.strftime("%Y-%m-%d")

########################## all these for user feed ##################################

def get_user_likes(user):

    """
    retrieves all shared and casual posts that the user has
    liked to annotate these posts in the feed. 
    """

    user_likes = Like.objects.filter(user=user).values('post_id', 'shared_post_id')

    # storing these likes ids in set for fast lookups
    user_post_likes = {like['post_id'] for like in user_likes if like['post_id']}
    user_shared_likes = {like['shared_post_id'] for like in user_likes if like['shared_post_id']}

    return user_post_likes, user_shared_likes

def get_user_tags_and_friends(user):

    """
    retrieves user interests and user friends ids
    """

    cache_key = f'user_tags_friends_{user.pk}'
    data = cache.get(cache_key)
    
    if not data:
        if hasattr(user, 'interests') and user.interests.tags.exists():
            user_tags = list(user.interests.tags.values_list('id', flat=True))
        else:
            user_tags = []

        friends_ids = list(Friendship.objects.filter(Q(user=user) | Q(friend=user))
                           .values_list('user__id', 'friend__id'))
        
        # ვშლით ამ user__id, friend__id და ვაბრუნებთ ერთ ლისტად შემდეგ გადაგვაქ სეთში რათა დუპლიკატები არ გვქონდეს
        friends_ids = set(chain.from_iterable(friends_ids))
        
        data = {'user_tags': user_tags, 'friends_ids': friends_ids}
        cache.set(cache_key, data, timeout=604800)

    return data['user_tags'], data['friends_ids']

def get_combined_posts(user, user_tags, friends_ids, fetched_post_ids, fetched_shared_post_ids, user_post_likes, user_shared_likes, limit):

    """
    fetches friend-based, tag-based and popular posts and combine them.
    """

    comments_prefetch = Prefetch(
        'comments',
        queryset=Comment.objects.select_related('user').order_by('-created_at')
    )

    # Base post query excluding already fetched posts
    posts_query = Post.objects.exclude(pk__in=fetched_post_ids) \
                              .select_related('user') \
                              .prefetch_related('tags', comments_prefetch) \
                              .annotate(
                                  num_likes=Count('likes', distinct=True),
                                  num_comments=Count('comments', distinct=True),
                                  user_liked=Case(
                                      When(pk__in=user_post_likes, then=True),
                                      default=False,
                                      output_field=BooleanField()
                                  )
                              ).order_by('-created_at')

    # Filter by user tags and friends if available
    tag_posts = posts_query.filter(tags__in=user_tags) if user_tags else Post.objects.none()
    friends_posts = posts_query.filter(user_id__in=friends_ids) if friends_ids else Post.objects.none()

    # Base shared post query excluding already fetched shared posts
    shared_posts_query = SharedPost.objects.exclude(pk__in=fetched_shared_post_ids) \
                                           .select_related('original_post__user', 'shared_by') \
                                           .prefetch_related('original_post__tags', comments_prefetch) \
                                           .annotate(
                                               num_likes=Count('likes', distinct=True),
                                               num_comments=Count('original_post__comments', distinct=True),
                                               user_liked=Case(
                                                   When(pk__in=user_shared_likes, then=True),
                                                   default=False,
                                                   output_field=BooleanField()
                                               )
                                           ).order_by('-created_at')

    shared_tag_posts = shared_posts_query.filter(original_post__tags__in=user_tags) if user_tags else SharedPost.objects.none()
    shared_friends_posts = shared_posts_query.filter(shared_by_id__in=friends_ids) if friends_ids else SharedPost.objects.none()

    # Popular posts, filtered by likes or comments
    popular_posts = posts_query.filter(Q(num_likes__gt=1) | Q(num_comments__gt=1))

    # Combine all post lists into one and eliminate duplicates by PK
    all_posts = list(chain(tag_posts, shared_tag_posts, friends_posts, shared_friends_posts, popular_posts))
    unique_posts = {post.pk: post for post in all_posts}.values()

    # Apply limit after deduplication
    posts_combined = list(unique_posts)[:limit]

    # Update fetched IDs to avoid fetching them again
    fetched_post_ids.update(post.pk for post in posts_combined if isinstance(post, Post))
    fetched_shared_post_ids.update(post.pk for post in posts_combined if isinstance(post, SharedPost))

    return posts_combined, fetched_post_ids, fetched_shared_post_ids

def get_user_feed(request, user, offset=0, limit=7):

    """
    This is the main function that generates the user feed by calling the helper functions defined above and manages session data.
    """

    is_ajax_request = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if not is_ajax_request:
        request.session['fetched_post_ids'] = set()
        request.session['fetched_shared_post_ids'] = set()

    fetched_post_ids = set(request.session['fetched_post_ids'])
    fetched_shared_post_ids = set(request.session['fetched_shared_post_ids'])

    user_tags, friends_ids = get_user_tags_and_friends(user)
    user_post_likes, user_shared_likes = get_user_likes(user)

    # Fetch combined posts
    posts_combined, fetched_post_ids, fetched_shared_post_ids = get_combined_posts(
        user, user_tags, friends_ids, fetched_post_ids, fetched_shared_post_ids, user_post_likes, user_shared_likes, limit
    )

    # Update session with fetched IDs
    request.session['fetched_post_ids'] = list(fetched_post_ids)
    request.session['fetched_shared_post_ids'] = list(fetched_shared_post_ids)

    return posts_combined

########################## all these for user feed ##################################