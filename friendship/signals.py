from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from friendship.models import Friendship
from django.core.cache import cache

# @receiver(post_save, sender=FriendRequest)
# def notify_user_on_FriendRequest(sender, instance, created, **kwargs):
#     """
#     Notify the receiver when a friend request is sent to them.
#     """
#     if created:
#         notification = Notification.objects.create(
#             recipient=instance.receiver,
#             sender=instance.sender,
#             message=f"Send You Friend Request",
#             notification_type = 'friend_request'
#         )
        
#         sender_data = {
#             'id': instance.sender.id,
#             'email': instance.sender.email,
#             'avatar': instance.sender.avatar.url,
#             'first_name': instance.sender.first_name,
#             'last_name': instance.sender.last_name,
#         }

#         #'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),

#         # Send notification to WebSocket
#         channel_layer = get_channel_layer()
#         async_to_sync(channel_layer.group_send)(
#             f"notifications_{instance.receiver.id}",
#             {
#                 'type': 'send_notification',
#                 'notification': {
#                     'message': notification.message,
#                     'notification_type': notification.notification_type,
#                     'sender': sender_data,
#                     'notification_id': notification.pk
#                 }
#             }
#         )

# @receiver(post_save, sender=FriendRequest)
# def handle_accept_or_reject_friend_request(sender, instance, created, **kwargs):
#     """
#     Handle notifications and cleanup when a friend request is accepted or rejected.
#     This will notify the sender and delete the FriendRequest record.
#     """
#     if not created:
#         if instance.accepted:
#             # Create a friendship notification
#             notification = Notification.objects.create(
#                 recipient=instance.sender,
#                 sender=instance.receiver,
#                 message=f"{instance.receiver.first_name} accepted your friend request.",
#                 notification_type='friend_acceptance'
#             )

#             receiver_data = {
#                 'first_name': instance.receiver.first_name,
#                 'last_name': instance.receiver.last_name,
#             }

#             # Notify via WebSocket
#             channel_layer = get_channel_layer()
#             async_to_sync(channel_layer.group_send)(
#                 f"notifications_{instance.sender.id}",
#                 {
#                     'type': 'send_notification',
#                     'notification': {
#                         'message': notification.message,
#                         'notification_type': notification.notification_type,
#                         'receiver': receiver_data,
#                         'notification_id': notification.pk
#                     }
#                 }
#             )

#             # Delete the FriendRequest record since it's been accepted
#             instance.delete()

#         elif instance.rejected:
#             # Create a rejection notification
#             notification = Notification.objects.create(
#                 recipient=instance.sender,
#                 sender=instance.receiver,
#                 message=f"{instance.receiver.first_name} rejected your friend request.",
#                 notification_type='friend_rejection'
#             )

#             receiver_data = {
#                 'first_name': instance.receiver.first_name,
#                 'last_name': instance.receiver.last_name,
#             }

#             # Notify via WebSocket
#             channel_layer = get_channel_layer()
#             async_to_sync(channel_layer.group_send)(
#                 f"notifications_{instance.sender.id}",
#                 {
#                     'type': 'send_notification',
#                     'notification': {
#                         'message': notification.message,
#                         'notification_type': notification.notification_type,
#                         'receiver': receiver_data,
#                         'notification_id': notification.pk
#                     }
#                 }
#             )

#             # Delete the FriendRequest record since it's been rejected
#             instance.delete()


# caching invalidation
@receiver(post_save, sender=Friendship)
def invalidate_user_friends_cache(sender, instance, **kwargs):
    # Invalidate the cache for both users in the friendship
    cache.delete(f'user_friends_{instance.user.pk}')
    cache.delete(f'user_friends_{instance.friend.pk}')

    cache.delete(f'user_tags_{instance.user.pk}')
    cache.delete(f'user_tags_{instance.friend.pk}')

    cache.delete(f'friends_ids_{instance.user.pk}')
    cache.delete(f'friends_ids_{instance.friend.pk}')

@receiver(post_delete, sender=Friendship)
def invalidate_user_friends_cache(sender, instance, **kwargs):
    # Invalidate the cache for both users in the friendship
    cache.delete(f'user_friends_{instance.user.pk}')
    cache.delete(f'user_friends_{instance.friend.pk}')

    cache.delete(f'user_tags_{instance.user.pk}')
    cache.delete(f'user_tags_{instance.friend.pk}')

    cache.delete(f'friends_ids_{instance.user.pk}')
    cache.delete(f'friends_ids_{instance.friend.pk}')