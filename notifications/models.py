from django.db import models
from users.models import User
from posts.models import Post

class Notification(models.Model):
    # მიმღები
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', db_index=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    message = models.CharField(max_length=255)
    post_Id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient} - {self.message}"