# Generated by Django 5.1.1 on 2024-09-11 15:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_background_image_user_job_user_location_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='setup_profile',
            field=models.BooleanField(default=False),
        ),
    ]