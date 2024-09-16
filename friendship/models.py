from django.db import models
from users.models import User

class Friendship(models.Model):
    # Intermediary table for the friendship relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_friendships')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_friendships')
    # Add any additional fields for the friendship relationship here (e.g., date added)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} - {self.friend.email}'
    
    @staticmethod
    def create_friendship(user, friend):
        if user == friend:
            raise ValueError("A user cannot be friends with themselves.")
        
        # Compare users by their ID to ensure consistent ordering
        if user.id < friend.id:
            friendship, created = Friendship.objects.get_or_create(user=user, friend=friend)
        else:
            friendship, created = Friendship.objects.get_or_create(user=friend, friend=user)
        
        return friendship

class FriendRequest(models.Model):
    """A model to represent a sent or received friend request."""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_friendrequest')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_friendreciever')

    rejected = models.BooleanField(default=False)
    accepted = models.BooleanField(default=False)

    #created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['sender', 'receiver']),
        ]

    def __str__(self):
        return f'{self.sender.email} - {self.receiver.email}'
