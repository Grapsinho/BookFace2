from django.views import View
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from users.models import User
from friendship.models import FriendRequest, Friendship
from posts.models import Tag, Like, Comment
from notifications.models import Notification
from django.db.models import Q, Case, When, CharField, Count, Exists, OuterRef, Prefetch

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

        user_likes = Like.objects.filter(user=request.user, post=OuterRef('pk'))

        # Prefetch comments ordered by created_at DESC (latest first)
        comments_prefetch = Prefetch('comments', queryset=Comment.objects.select_related('user').order_by('-created_at'))

        posts_for_user = user.posts.annotate(like_count=Count('likes'), user_liked=Exists(user_likes)).prefetch_related('tags', comments_prefetch).all().order_by('-created_at')

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
            'posts_for_user': posts_for_user,
            'tags': tags
        }

        return render(request, 'mainApp/profile.html', context)
