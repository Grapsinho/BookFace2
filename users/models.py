from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    email = models.EmailField(null=True, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)

    gender = models.CharField(max_length=10, blank=True, null=True)

    # Birth date fields
    birth_day = models.IntegerField(blank=True, null=True)
    birth_month = models.CharField(max_length=30, blank=True, null=True)
    birth_year = models.IntegerField(blank=True, null=True)

    # Other common profile fields
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default-boy-avatar.jpg')
    location = models.CharField(max_length=255, blank=True, null=True)
    job = models.CharField(max_length=255, blank=True, null=True)
    background_image = models.ImageField(upload_to='backgrounds/', default='backgrounds/No Image.svg', blank=True, null=True)

    setup_profile = models.BooleanField(default=False)

    @property
    def full_birth_date(self):
        """Return the full birth date as a string."""
        if self.birth_day and self.birth_month and self.birth_year:
            return f'{self.birth_day}/{self.birth_month}/{self.birth_year}'
        return 'Unknown'

    # ანუ იუზერნეიმ ფიელდ იქნება ემაილი ეხლა
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()
    
    def save(self, *args, **kwargs):
        self.username = self.email  # Ensure username stays synced with email
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name_plural = _("Users")

    def __str__(self):
        return self.email
    

class UserMedia(models.Model):
    user = models.ForeignKey(User, related_name='user_media', on_delete=models.CASCADE)
    media_file_link = models.CharField(max_length=250)  # Store the media file link
    media_type = models.CharField(max_length=50)  # Profile, background, or other
    uploaded_at = models.DateTimeField(auto_now_add=True)  # Track when the media was uploaded

    def __str__(self):
        return f'{self.media_type} for {self.user.email}'