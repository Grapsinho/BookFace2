from rest_framework import serializers
from .models import Message

# Serializer for Messages
class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender_email', 'receiver_email', 'content', 'timestamp']
        read_only_fields = ['sender', 'timestamp', 'chat']