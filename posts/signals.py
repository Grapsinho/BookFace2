# from django.db.models.signals import post_save, post_delete
# from django.dispatch import receiver
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
# from .models import Like
# from notifications.models import Notification

# @receiver(post_save, sender=Like)
# def notify_user_on_Like(sender, instance, created, **kwargs):
#     """
#     Notify the receiver when a like is sent to them.
#     """

#     like_sender = instance.user
#     like_receiver = instance.post.user

#     if created:
#         notification = Notification.objects.create(
#             recipient=like_receiver,
#             sender=like_sender,
#             message=f"Liked Your Post",
#             notification_type = 'post_like'
#         )
        
#         sender_data = {
#             'first_name': like_sender.first_name,
#             'last_name': like_sender.last_name,
#             'email': like_sender.email,
#             'avatar': like_sender.avatar,
#         }

#         # Send notification to WebSocket
#         channel_layer = get_channel_layer()
#         async_to_sync(channel_layer.group_send)(
#             f"notifications_{like_receiver.pk}",
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

# def send_websocket_notification(like_receiver, notification, like_sender, custom_message=None):
#     """
#     Helper function to send WebSocket notifications
#     """
#     sender_data = {
#         'first_name': like_sender.first_name,
#         'last_name': like_sender.last_name,
#         'email': like_sender.email,
#         'avatar': like_sender.avatar,
#     }

#     # Notification message for like or unlike
#     message = custom_message if custom_message else notification.message

#     try:
#         channel_layer = get_channel_layer()
#         async_to_sync(channel_layer.group_send)(
#             f"notifications_{like_receiver.pk}",
#             {
#                 'type': 'send_notification',
#                 'notification': {
#                     'message': message,
#                     'notification_type': notification.notification_type if notification else 'post_unlike',
#                     'sender': sender_data,
#                     'notification_id': notification.pk if notification else None
#                 }
#             }
#         )
#     except Exception as e:
#         print(f"Error sending WebSocket notification: {e}")