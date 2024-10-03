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

def get_user_feed(user):
    user_tags_cache_key = f'user_tags_{user.pk}'
    user_tags = cache.get(user_tags_cache_key)

    # Check if user has interests and safely retrieve tags
    if not user_tags:
        if hasattr(user, 'interests') and user.interests.tags.exists():
            user_tags = list(user.interests.tags.values_list('id', flat=True))
        else:
            user_tags = [] 
        cache.set(user_tags_cache_key, user_tags, timeout=604800)

    friends_ids_cache_key = f'friends_ids_{user.pk}'
    friends_ids = cache.get(friends_ids_cache_key)
    if not friends_ids:
        friends_ids = list(Friendship.objects.filter(Q(user=user) | Q(friend=user))
                   .values_list('user__id', 'friend__id'))
        friends_ids = set(chain.from_iterable(friends_ids))
        cache.set(friends_ids_cache_key, friends_ids, timeout=604800)

    # Prefetch related data for comments (ordered by creation date)
    comments_prefetch = Prefetch(
        'comments', 
        queryset=Comment.objects.select_related('user').order_by('-created_at')
    )

    # User-specific like tracking for posts and shared posts
    user_post_likes = Like.objects.filter(user=user, post__isnull=False).select_related('user', 'post').values_list('post_id', flat=True)
    user_shared_likes = Like.objects.filter(user=user, shared_post__isnull=False).select_related('user', 'shared_post').values_list('shared_post_id', flat=True)

    # Step 1: Retrieve tag-based posts (priority 1) if user has tags
    if user_tags:
        tag_posts = Post.objects.filter(tags__in=user_tags).distinct() \
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
                                )[:15]

        shared_tag_posts = SharedPost.objects.filter(original_post__tags__in=user_tags).distinct() \
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
                                             )[:15]
    else:
        tag_posts = Post.objects.none()
        shared_tag_posts = SharedPost.objects.none()


    # Step 2: Retrieve friends' posts (priority 2)
    friends_posts = Post.objects.filter(user_id__in=friends_ids) \
                                .exclude(id__in=tag_posts.values('id')) \
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
                                )[:10]

    shared_friends_posts = SharedPost.objects.filter(shared_by_id__in=friends_ids) \
                                             .exclude(id__in=shared_tag_posts.values('id')) \
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
                                             )[:10]

    # Step 3: Retrieve popular posts (priority 3)
    popular_posts = Post.objects.annotate(
        num_likes=Count('likes', distinct=True),
        num_comments=Count('comments', distinct=True),
        user_liked=Case(
            When(pk__in=user_post_likes, then=True),
            default=False,
            output_field=BooleanField()
        )
    ).filter(
        Q(num_likes__gt=10) | Q(num_comments__gt=10)
    ).select_related('user').exclude(
        id__in=tag_posts.values('id')
    ).exclude(
        id__in=friends_posts.values('id')
    )[:10]

    popular_shared_posts = SharedPost.objects.annotate(
        num_likes=Count('likes', distinct=True),
        num_comments=Count('original_post__comments', distinct=True),
        user_liked=Case(
            When(pk__in=user_shared_likes, then=True),
            default=False,
            output_field=BooleanField()
        )
    ).filter(
        Q(num_likes__gt=10) | Q(num_comments__gt=10)
    ).exclude(
        id__in=shared_tag_posts.values('id')
    ).exclude(
        id__in=shared_friends_posts.values('id')
    ).select_related('original_post__user', 'shared_by').prefetch_related(
        'original_post__tags', comments_prefetch
    )[:10]

    # Step 4: Combine and prioritize results (tags -> friends -> popular)
    tag_posts_combined = list(chain(tag_posts, shared_tag_posts))
    friends_posts_combined = list(chain(friends_posts, shared_friends_posts))
    popular_posts_combined = list(chain(popular_posts, popular_shared_posts))

    # Final feed with proper prioritization: tags -> friends -> popular
    posts = list(chain(tag_posts_combined, friends_posts_combined, popular_posts_combined))

    return posts