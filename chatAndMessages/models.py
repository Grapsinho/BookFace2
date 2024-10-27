from django.db import models
from users.models import User
from django.utils import timezone

class Chat(models.Model):
    con_starter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_starter')
    con_receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_receiver')

    def __str__(self):
        return f'Chat between {self.con_starter} and {self.con_receiver}'
    
    def get_messages(self):
        return self.messages.all()
    
    class Meta:
        unique_together = ['con_starter', 'con_receiver']
    
    @classmethod
    def create_conversation(cls, user, friend):
        """
        this ensures that conversation will exist only once between two user.
        """

        if user.id < friend.id:
            chat, created = cls.objects.get_or_create(con_starter=user, con_receiver=friend)
        else:
            chat, created = cls.objects.get_or_create(con_starter=friend, con_receiver=user)
        
        return chat
    
    @classmethod
    def get_conversation(cls, user, friend):
        if user.id < friend.id:
            return cls.objects.filter(con_starter=user, con_receiver=friend).first()
        else:
            return cls.objects.filter(con_starter=friend, con_receiver=user).first()

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'Message from {self.sender} to {self.receiver}'
