from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):

    sender_first_name = serializers.SerializerMethodField()
    sender_last_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    sender_id = serializers.SerializerMethodField()
    recipient_first_name = serializers.SerializerMethodField()
    recipient_last_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'sender_first_name', 'sender_last_name', 'recipient_first_name', 'recipient_last_name', 'sender_email', 'sender_avatar', 'sender_id']

    def get_sender_first_name(self, obj):
        return obj['sender__first_name']

    def get_sender_last_name(self, obj):
        return obj['sender__last_name']
    
    def get_sender_email(self, obj):
        return obj['sender__email']
    
    def get_sender_id(self, obj):
        return obj['sender__id']

    def get_sender_avatar(self, obj):
        return obj['sender__avatar']

    def get_recipient_first_name(self, obj):
        return obj['recipient__first_name']

    def get_recipient_last_name(self, obj):
        return obj['recipient__last_name']