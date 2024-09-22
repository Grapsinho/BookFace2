from django.db import models
from users.models import User

# Create your models here.

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)  # Indexed for fast lookups

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts', db_index=True)
    text = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True)
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name='posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post by {self.user} on {self.created_at}"

    class Meta:
        ordering = ['-created_at']

class UserInterest(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='interests')
    tags = models.ManyToManyField(Tag, related_name='interested_users', blank=True)

    def __str__(self):
        return f"{self.user}'s interests"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.post}"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} liked {self.post}"
    
class SharedPost(models.Model):
    original_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='shared_posts')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shared_by} shared {self.original_post}"

    class Meta:
        unique_together = ('shared_by', 'original_post')