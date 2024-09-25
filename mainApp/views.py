from django.views import View
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from users.models import User
from friendship.models import FriendRequest, Friendship
from posts.models import Tag, Like, Comment, SharedPost
from notifications.models import Notification
from django.db.models import Q, Case, When, CharField, Count, Prefetch, BooleanField
from itertools import chain
from utils.utility import quicksort
import heapq

from django.core.cache import cache

@login_required(login_url='login')
def home(request):

    notifications = Notification.objects.filter(
        recipient=request.user
    ).values('id', 'sender__email', 'sender__id', 'sender__avatar', "sender__first_name", "sender__last_name", 'notification_type', 'message', 'post_Id').order_by('-timestamp')[:7]

    tags = Tag.objects.all()

    cache_key = f'user_friends_{request.user.pk}'
    user_friends = cache.get(cache_key)

    if not user_friends:
        user_friends = list(
            Friendship.objects.filter(Q(user=request.user) | Q(friend=request.user))
            .select_related('user', 'friend')
            .annotate(
                # Identify the friend (i.e., the other person in the friendship)
                friend_first_name=Case(
                    When(user=request.user, then='friend__first_name'),
                    When(friend=request.user, then='user__first_name'),
                    output_field=CharField(),
                ),
                friend_last_name=Case(
                    When(user=request.user, then='friend__last_name'),
                    When(friend=request.user, then='user__last_name'),
                    output_field=CharField(),
                ),
                friend_email=Case(
                    When(user=request.user, then='friend__email'),
                    When(friend=request.user, then='user__email'),
                    output_field=CharField(),
                ),
                friend_avatar=Case(
                    When(user=request.user, then='friend__avatar'),
                    When(friend=request.user, then='user__avatar'),
                    output_field=CharField(),
                )
            )
            .values(
                'friend_first_name', 'friend_last_name', 'friend_email', 'friend_avatar'
            )[:10]
        )
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
            user_friends = list(
                Friendship.objects.filter(Q(user=user) | Q(friend=user))
                .select_related('user', 'friend')
                .annotate(
                    friend_first_name=Case(
                        When(user=user, then='friend__first_name'),
                        When(friend=user, then='user__first_name'),
                        output_field=CharField(),
                    ),
                    friend_last_name=Case(
                        When(user=user, then='friend__last_name'),
                        When(friend=user, then='user__last_name'),
                        output_field=CharField(),
                    ),
                    friend_email=Case(
                        When(user=user, then='friend__email'),
                        When(friend=user, then='user__email'),
                        output_field=CharField(),
                    ),
                    friend_avatar=Case(
                        When(user=user, then='friend__avatar'),
                        When(friend=user, then='user__avatar'),
                        output_field=CharField(),
                    )
                )
                .values(
                    'friend_first_name', 'friend_last_name', 'friend_email', 'friend_avatar'
                )[:10]
            )
            cache.set(cache_key, user_friends, timeout=604800)

        notifications = Notification.objects.filter(
            recipient=request.user
        ).select_related('sender').values('id', 'sender__email', 'sender__id', 'sender__avatar', "sender__first_name", "sender__last_name", 'notification_type', 'message', 'post_Id').order_by('-timestamp')[:7]

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
        ).order_by('-created_at')

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
        ).order_by('-created_at')

        combined_posts = list(chain(posts_for_user, shared_posts_for_user))
        all_posts = quicksort(combined_posts, key=lambda post: post.created_at)

        cache_key = f'tags'
        tags = cache.get(cache_key)

        if not tags:
            tags = Tag.objects.all()
            cache.set(cache_key, tags, timeout=604800)

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
            'all_posts': all_posts
        }

        return render(request, 'mainApp/profile.html', context)
