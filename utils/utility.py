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
def get_user_tags(user):
    user_tags_cache_key = f'user_tags_{user.pk}'
    user_tags = cache.get(user_tags_cache_key)
    
    if not user_tags:
        if hasattr(user, 'interests') and user.interests.tags.exists():
            user_tags = list(user.interests.tags.values_list('id', flat=True))
        else:
            user_tags = [] 
        cache.set(user_tags_cache_key, user_tags, timeout=604800)
    
    return user_tags

def get_friends_ids(user):
    friends_ids_cache_key = f'friends_ids_{user.pk}'
    friends_ids = cache.get(friends_ids_cache_key)

    if not friends_ids:
        friends_ids = list(Friendship.objects.filter(Q(user=user) | Q(friend=user))
                            .values_list('user__id', 'friend__id'))
        friends_ids = set(chain.from_iterable(friends_ids))
        cache.set(friends_ids_cache_key, friends_ids, timeout=604800)
    
    return friends_ids

def get_tag_posts(user_tags, fetched_post_ids, fetched_shared_post_ids, user_shared_likes, user_post_likes, limit):
    if not user_tags:
        return Post.objects.none(), SharedPost.objects.none()

    comments_prefetch = Prefetch(
        'comments',
        queryset=Comment.objects.select_related('user').order_by('-created_at')
    )

    tag_posts = Post.objects.filter(tags__in=user_tags).exclude(pk__in=fetched_post_ids) \
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
                            ).order_by('-created_at')[0:limit]

    shared_tag_posts = SharedPost.objects.filter(original_post__tags__in=user_tags).exclude(pk__in=fetched_shared_post_ids) \
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
                                         ).order_by('-created_at')[0:limit]
    
    return tag_posts, shared_tag_posts

def get_friends_posts(friends_ids, fetched_post_ids, fetched_shared_post_ids, user_shared_likes, user_post_likes, limit):
    comments_prefetch = Prefetch(
        'comments',
        queryset=Comment.objects.select_related('user').order_by('-created_at')
    )

    friends_posts = Post.objects.filter(user_id__in=friends_ids) \
                                .exclude(pk__in=fetched_post_ids) \
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
                                ).order_by('-created_at')[0:limit]
    
    shared_friends_posts = SharedPost.objects.filter(shared_by_id__in=friends_ids) \
                                             .exclude(pk__in=fetched_shared_post_ids) \
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
                                             ).order_by('-created_at')[0:limit]
    
    return friends_posts, shared_friends_posts

def get_popular_posts(fetched_post_ids, user_post_likes, limit):
    comments_prefetch = Prefetch(
        'comments',
        queryset=Comment.objects.select_related('user').order_by('-created_at')
    )

    popular_posts = Post.objects.annotate(
        num_likes=Count('likes', distinct=True),
        num_comments=Count('comments', distinct=True),
        user_liked=Case(
            When(pk__in=user_post_likes, then=True),
            default=False,
            output_field=BooleanField()
        )
    ).filter(
        Q(num_likes__gt=1) | Q(num_comments__gt=1)
    ).exclude(pk__in=fetched_post_ids) \
    .select_related('user') \
    .prefetch_related('tags', comments_prefetch) \
    .order_by('-created_at')[0:limit]
    
    return popular_posts



def get_user_feed(request, user, offset=0, limit=7):

    is_ajax_request = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if not is_ajax_request:
        request.session['fetched_post_ids'] = set()
        request.session['fetched_shared_post_ids'] = set()

    fetched_post_ids = set(request.session['fetched_post_ids'])
    fetched_shared_post_ids = set(request.session['fetched_shared_post_ids'])

    user_tags = get_user_tags(user)
    friends_ids = get_friends_ids(user)

    # Step 1: Get likes for posts
    user_post_likes = Like.objects.filter(user=user, post__isnull=False).select_related('user', 'post').values_list('post_id', flat=True)
    user_shared_likes = Like.objects.filter(user=user, shared_post__isnull=False).select_related('user', 'shared_post').values_list('shared_post_id', flat=True)

    # Step 2: Fetch posts from different categories
    tag_posts, shared_tag_posts = get_tag_posts(user_tags, fetched_post_ids, fetched_shared_post_ids, user_shared_likes, user_post_likes, limit)
    fetched_post_ids.update(tag_posts.values_list('pk', flat=True))
    fetched_shared_post_ids.update(shared_tag_posts.values_list('pk', flat=True))

    friends_posts, shared_friends_posts = get_friends_posts(friends_ids, fetched_post_ids, fetched_shared_post_ids, user_shared_likes, user_post_likes, limit)
    fetched_post_ids.update(friends_posts.values_list('pk', flat=True))
    fetched_shared_post_ids.update(shared_friends_posts.values_list('pk', flat=True))
    
    popular_posts = get_popular_posts(fetched_post_ids, user_post_likes, limit)
    fetched_post_ids.update(popular_posts.values_list('pk', flat=True))

    # Step 3: Combine posts
    posts_combined = list(chain(tag_posts, shared_tag_posts, friends_posts, shared_friends_posts, popular_posts))

    request.session['fetched_post_ids'] = list(fetched_post_ids)
    request.session['fetched_shared_post_ids'] = list(fetched_shared_post_ids)

    return posts_combined

########################## all these for user feed ##################################