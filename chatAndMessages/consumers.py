from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Chat, Message
from users.models import User
from asgiref.sync import sync_to_async, async_to_sync
from channels.layers import get_channel_layer
import bleach
from utils.utility import returnTimeString

def sanitize_input(user_input):
    cleaned_input = bleach.clean(user_input, tags=['p', 'strong', 'em'], attributes={'*': ['class']})
    return cleaned_input

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'

        # Join chat group
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave chat group
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        delete_messageOrNot = data['delete_messageOrNot']
        sender = self.scope['user']

        try:

            if delete_messageOrNot:
                message_id = data['message_id']

                # First, retrieve the message
                messageToDelete = await sync_to_async(Message.objects.get)(id=message_id)

                # Then delete the retrieved message
                await sync_to_async(messageToDelete.delete)()

                # Send message to the chat group
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message_delete',
                        'message': "Deleted 54353",
                        "message_id": message_id
                    }
                )
            else:
                content = sanitize_input(data['content'])
                receiver_email = data['receiver']
                receiver = await sync_to_async(User.objects.get)(email=receiver_email)
                chat = await sync_to_async(Chat.create_conversation)(sender, receiver)

                # Create and save the message
                message = await self.create_message(chat, sender, receiver, content)

                # Send message to the chat group
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message',
                        'message': content,
                        'sender_email': sender.email,
                        'message_id': message.pk
                    }
                )

                # Send notification to WebSocket
                await self.channel_layer.group_send(
                    f"notifications_{receiver.id}",
                    {
                        'type': 'send_notification',
                        'notification': {
                            'notification_type': "message",
                            "content": content,
                            'chatId': chat.pk,
                            "time": returnTimeString(message.timestamp),
                            "receiver_email": receiver.email
                        }
                    }
                )

        except User.DoesNotExist:
            print("Receiver not found.")
        except Exception as e:
            print(f"Error in receive method: {e}")

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_email': event['sender_email'],
            'message_id': event['message_id'],
        }))
    
    async def chat_message_delete(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            "message_id": event["message_id"]
        }))

    @sync_to_async
    def create_message(self, chat, sender, receiver, content):
        return Message.objects.create(
            chat=chat,
            sender=sender,
            receiver=receiver,
            content=content
        )