from django.views import View
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from users.models import User
from friendship.models import FriendRequest, Friendship
from posts.models import Tag, Like, Comment, SharedPost
from notifications.models import Notification
from django.db.models import Q, Case, When, CharField, Count, Prefetch, BooleanField, F
from itertools import chain
from utils.utility import quicksort

from django.core.cache import cache

@login_required(login_url='login')
def home(request):

    notifications = Notification.objects.filter(
        recipient=request.user
    ).only('id', 'sender__email', 'sender__id', 'sender__avatar', "sender__first_name", "sender__last_name", 'notification_type', 'message', 'post_Id').order_by('-timestamp')[:7]

    tags = Tag.objects.all()

    cache_key = f'user_friends_{request.user.pk}'
    user_friends = cache.get(cache_key)

    if not user_friends:
        # Fetch friends where the user is the 'user' in the Friendship model
        user_is_user_friends = Friendship.objects.filter(user=request.user).select_related('friend').values(
            friend_first_name=F('friend__first_name'),
            friend_last_name=F('friend__last_name'),
            friend_email=F('friend__email'),
            friend_avatar=F('friend__avatar')
        )[:10]

        # Fetch friends where the user is the 'friend' in the Friendship model
        user_is_friend_friends = Friendship.objects.filter(friend=request.user).select_related('user').values(
            friend_first_name=F('user__first_name'),
            friend_last_name=F('user__last_name'),
            friend_email=F('user__email'),
            friend_avatar=F('user__avatar')
        )[:10]

        # Combine both querysets using UNION
        user_friends = list(user_is_user_friends.union(user_is_friend_friends))

        # Cache the result for a week
        cache.set(cache_key, user_friends, timeout=604800)

    context = {
        'initial_notifications': notifications,
        'initial_notifications_length': len(notifications),
        'tags': tags,
        'user_friends': user_friends
    }

    return render(request, 'mainApp/home.html', context)

@method_decorator(login_required(login_url='login'), name='dispatch')
class ProfileView(View):
    def get(self, request, email, *args, **kwargs):
        user = get_object_or_404(User, email=email)
        user_media = user.user_media.all()

        cache_key = f'user_friends_{user.pk}'
        user_friends = cache.get(cache_key)

        if not user_friends:
            # Fetch friends where the user is the 'user' in the Friendship model
            user_is_user_friends = Friendship.objects.filter(user=user).select_related('friend').values(
                friend_first_name=F('friend__first_name'),
                friend_last_name=F('friend__last_name'),
                friend_email=F('friend__email'),
                friend_avatar=F('friend__avatar')
            )[:10]

            # Fetch friends where the user is the 'friend' in the Friendship model
            user_is_friend_friends = Friendship.objects.filter(friend=user).select_related('user').values(
                friend_first_name=F('user__first_name'),
                friend_last_name=F('user__last_name'),
                friend_email=F('user__email'),
                friend_avatar=F('user__avatar')
            )[:10]

            # Combine both querysets using UNION
            user_friends = list(user_is_user_friends.union(user_is_friend_friends))

            # Cache the result for a week
            cache.set(cache_key, user_friends, timeout=604800)

        notifications = Notification.objects.filter(
            recipient=request.user
        ).select_related('sender').only('id', 'sender__email', 'sender__id', 'sender__avatar', "sender__first_name", "sender__last_name", 'notification_type', 'message', 'post_Id').order_by('-timestamp')[:7]

        friend_request = FriendRequest.objects.filter(
            Q(sender=user, receiver=request.user) | Q(sender=request.user, receiver=user)
        ).first()

        friend_request_received = friend_request and friend_request.sender == user
        friend_request_sent = friend_request and friend_request.sender == request.user

        # Check if they are already friends
        are_friends = Friendship.objects.filter(
            Q(user=request.user, friend=user) | Q(user=user, friend=request.user)
        ).exists()

        comments_prefetch = Prefetch(
            'comments', 
            queryset=Comment.objects.select_related('user').order_by('-created_at')
        )

        user_post_likes = Like.objects.filter(user=request.user, post__isnull=False).values_list('post_id', flat=True)

        user_shared_likes = Like.objects.filter(user=request.user, shared_post__isnull=False).values_list('shared_post_id', flat=True)

        posts_for_user = user.posts.select_related('user').prefetch_related(
            'tags',  # Prefetch tags to avoid N+1
            comments_prefetch  # Prefetch comments for each post
        ).annotate(
            like_count=Count('likes'),  # Efficient like counting
            user_liked=Case(
                When(pk__in=user_post_likes, then=True), 
                default=False, 
                output_field=BooleanField()
            )
        ).order_by('-created_at')[:4]

        shared_posts_for_user = user.shared_posts.select_related(
            'shared_by', 'original_post__user'  # Select related fields to avoid N+1
        ).prefetch_related(
            'original_post__tags',  # Prefetch tags for the original post
            comments_prefetch  # Prefetch comments for each shared post
        ).annotate(
            like_count=Count('likes'),  # Like count for shared posts
            user_liked=Case(
                When(pk__in=user_shared_likes, then=True), 
                default=False, 
                output_field=BooleanField()
            )
        ).order_by('-created_at')[:4]

        combined_posts = list(chain(posts_for_user, shared_posts_for_user))
        all_posts = quicksort(combined_posts, key=lambda post: post.created_at)

        cache_key = f'tags'
        tags = cache.get(cache_key)

        if not tags:
            tags = Tag.objects.all()
            cache.set(cache_key, tags, timeout=604800)

        user_tag_names = user.interests.tags.values_list('name', flat=True)

        context = {
            'user_media': user_media,
            'user': user,
            'friend_request_sent': friend_request_sent,
            'are_friends': are_friends,
            'initial_notifications': notifications,
            'initial_notifications_length': len(notifications),
            'friend_request_received': friend_request_received,
            'user_friends': user_friends,
            'tags': tags,
            'all_posts': all_posts,
            'all_posts_length': len(all_posts),
            'user_tag_names': user_tag_names,
            'serialized_tags': [tag.name for tag in tags]
        }

        return render(request, 'mainApp/profile.html', context)
