from django.views import View
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from users.models import User
from friendship.models import FriendRequest, Friendship
from posts.models import Tag, Like, Comment
from notifications.models import Notification
from django.db.models import Q, Case, When, Count, Prefetch, BooleanField, F, OuterRef, Subquery
from itertools import chain
from utils.utility import quicksort, get_user_feed
from chatAndMessages.models import Chat, Message

from django.core.cache import cache

@login_required(login_url='login')
def home(request):
    user = request.user
    
    # Cache and query notifications, only fetch necessary fields
    notifications = Notification.objects.filter(recipient=user) \
        .select_related('sender') \
        .only('id', 'sender__email', 'sender__id', 'sender__avatar', 'sender__first_name', 
              'sender__last_name', 'notification_type', 'message', 'post_Id') \
        .order_by('-timestamp')[:7]

    # Cache and retrieve tags
    tags = cache.get_or_set('tags', Tag.objects.all, timeout=604800)

    # Cache and retrieve friends list
    cache_key = f'user_friends_{user.pk}'
    user_friends = cache.get(cache_key)
    
    if not user_friends:
        # Combine both user-friend relationships in one query
        user_friends = Friendship.objects.filter(Q(user=user) | Q(friend=user)) \
            .select_related('user', 'friend') \
            .values(
                friend_first_name=F('friend__first_name'),
                friend_last_name=F('friend__last_name'),
                friend_email=F('friend__email'),
                friend_avatar=F('friend__avatar'),
                user_first_name=F('user__first_name'),
                user_last_name=F('user__last_name'),
                user_email=F('user__email'),
                user_avatar=F('user__avatar')
            )[:10]
        
        cache.set(cache_key, user_friends, timeout=604800)

    # Fetch user posts for feed
    posts = get_user_feed(request, user)
    
    # Retrieve chat data with optimized last message annotations
    last_message_subquery = Message.objects.filter(chat=OuterRef('pk')).order_by('-timestamp')
    
    chats = Chat.objects.filter(Q(con_starter=user) | Q(con_receiver=user)) \
        .annotate(
            last_message_id=Subquery(last_message_subquery.values('id')[:1]),
            last_message_content=Subquery(last_message_subquery.values('content')[:1]),
            last_message_sender_id=Subquery(last_message_subquery.values('sender')[:1]),
            last_message_receiver_id=Subquery(last_message_subquery.values('receiver')[:1]),
            last_message_timestamp=Subquery(last_message_subquery.values('timestamp')[:1])
        ) \
        .select_related('con_starter', 'con_receiver')

    # Fetch last messages in one query
    last_messages = Message.objects.filter(id__in=[chat.last_message_id for chat in chats if chat.last_message_id]) \
        .select_related('sender', 'receiver')

    # Render context
    context = {
        'initial_notifications': notifications,
        'initial_notifications_length': len(notifications),
        'tags': tags,
        'user_friends': user_friends,
        'posts': posts,
        'chats': last_messages,
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
            # Combine both user-friend relationships in one query
            user_friends = Friendship.objects.filter(Q(user=user) | Q(friend=user)) \
                .select_related('user', 'friend') \
                .values(
                    friend_first_name=F('friend__first_name'),
                    friend_last_name=F('friend__last_name'),
                    friend_email=F('friend__email'),
                    friend_avatar=F('friend__avatar'),
                    user_first_name=F('user__first_name'),
                    user_last_name=F('user__last_name'),
                    user_email=F('user__email'),
                    user_avatar=F('user__avatar')
                )[:10]
            
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
            like_count=Count('likes'),
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
            like_count=Count('likes'),
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

        user_tag_names = ''
        if request.user == user:
            if hasattr(user, 'interests') and user.interests.tags.exists():
                user_tag_names = user.interests.tags.values_list('name', flat=True)
            else:
                user_tag_names = []

        last_message_subquery = Message.objects.filter(
            chat=OuterRef('pk')
        ).order_by('-timestamp')

        # Annotate each Chat with its last message's content, sender, receiver, and timestamp
        chats = Chat.objects.filter(
            Q(con_starter=request.user) | Q(con_receiver=request.user)
        ).annotate(
            last_message_id=Subquery(last_message_subquery.values('id')[:1]),
            last_message_content=Subquery(last_message_subquery.values('content')[:1]),
            last_message_sender_id=Subquery(last_message_subquery.values('sender')[:1]),
            last_message_receiver_id=Subquery(last_message_subquery.values('receiver')[:1]),
            last_message_timestamp=Subquery(last_message_subquery.values('timestamp')[:1])
        ).select_related(
            'con_starter', 'con_receiver'
        )

        # Gather the last messages by retrieving Message instances from annotated IDs
        message_ids = [chat.last_message_id for chat in chats if chat.last_message_id]
        last_messages = Message.objects.filter(id__in=message_ids).select_related('sender', 'receiver')

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
            'serialized_tags': [tag.name for tag in tags],
            "chats": last_messages
        }

        return render(request, 'mainApp/profile.html', context)
