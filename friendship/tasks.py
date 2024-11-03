from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import FriendRequest
from notifications.models import Notification

@shared_task
def notify_user_on_friend_request(friend_request_id):
    """
    Task to notify the receiver when a friend request is sent to them.
    """
    try:
        friend_request = FriendRequest.objects.get(id=friend_request_id)
        notification = Notification.objects.create(
            recipient=friend_request.receiver,
            sender=friend_request.sender,
            message="Send You Friend Request",
            notification_type='friend_request',
            timestamp=timezone.now()
        )

        # Prepare sender data for WebSocket
        sender_data = {
            'id': friend_request.sender.id,
            'email': friend_request.sender.email,
            'avatar': friend_request.sender.avatar.url,
            'first_name': friend_request.sender.first_name,
            'last_name': friend_request.sender.last_name,
        }

        # Send notification to WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend_request.receiver.id}",
            {
                'type': 'send_notification',
                'notification': {
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'sender': sender_data,
                    'notification_id': notification.pk
                }
            }
        )
    except FriendRequest.DoesNotExist:
        pass

@shared_task
def handle_friend_request_response(friend_request_id, accepted):
    """
    Task to handle notifications and cleanup when a friend request is accepted or rejected.
    """
    try:
        friend_request = FriendRequest.objects.get(id=friend_request_id)

        if accepted:
            # Friend request accepted
            notification = Notification.objects.create(
                recipient=friend_request.sender,
                sender=friend_request.receiver,
                message=f"{friend_request.receiver.first_name} accepted your friend request.",
                notification_type='friend_acceptance',
                timestamp=timezone.now()
            )
        else:
            # Friend request rejected
            notification = Notification.objects.create(
                recipient=friend_request.sender,
                sender=friend_request.receiver,
                message=f"{friend_request.receiver.first_name} rejected your friend request.",
                notification_type='friend_rejection',
                timestamp=timezone.now()
            )

        # Prepare receiver data for WebSocket
        receiver_data = {
            'first_name': friend_request.receiver.first_name,
            'last_name': friend_request.receiver.last_name,
        }

        # Send notification to WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend_request.sender.id}",
            {
                'type': 'send_notification',
                'notification': {
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'receiver': receiver_data,
                    'notification_id': notification.pk
                }
            }
        )

        # Delete the FriendRequest record after handling
        friend_request.delete()
    except FriendRequest.DoesNotExist:
        pass
