from django.shortcuts import render, redirect
from django.views import View
from .forms import ProfileSetupForm, ProfilePicturesUpdateForm
from users.models import UserMedia, User
from rest_framework.views import APIView
from users.authentication import JWTAuthentication
from rest_framework.response import Response
from users.exceptions import AuthenticationRedirectException
from rest_framework import status
import json
from core import settings

from rest_framework.permissions import IsAuthenticated

from django.core.exceptions import ObjectDoesNotExist

def create_or_update_media(user, image_field, media_type):
    if image_field:
        media_path = image_field.url
        UserMedia.objects.create(
            user=user,
            media_file_link=media_path,
            media_type=media_type,
        )

class ProfileSetupView(View):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        form = ProfileSetupForm(instance=user)

        user.setup_profile = True
        user.save()
        return render(request, 'user_profile/profile_setup.html', {'form': form})

    def post(self, request):
        form = ProfileSetupForm(request.POST, request.FILES, instance=request.user)
        
        if form.is_valid():
            user_form = form.save()

            # Process the avatar image if uploaded
            if form.cleaned_data.get('avatar'):
                avatar_path = user_form.avatar.url  # Get the relative path to the avatar
                UserMedia.objects.create(
                    user=request.user,
                    media_file_link=avatar_path,
                    media_type='profile',  # Indicating that this is a profile image
                )

            # Process the background image if uploaded
            if form.cleaned_data.get('background_image'):
                background_image_path = user_form.background_image.url
                UserMedia.objects.create(
                    user=request.user,
                    media_file_link=background_image_path,
                    media_type='background',  # Indicating that this is a background image
                )
            return redirect('profile', email=request.user.email)  # Redirect to the profile page after saving
        else:
            return render(request, 'user_profile/profile_setup.html', {'form': form})

class UpdateJobOrLocation(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = json.loads(request.body)
        job = data.get('job', None)
        location = data.get('location', None)
        bio = data.get('bio', None)
        try:
            context = {"message": "User profile retrieved"}
            user = request.user
            fields_to_update = {}
            if job:
                context['what_updated'] = job
                fields_to_update['job'] = job
            if location:
                context['what_updated'] = location
                fields_to_update['location'] = location
            if bio:
                context['what_updated'] = bio
                fields_to_update['bio'] = bio

            if fields_to_update:
                User.objects.filter(pk=request.user.pk).update(**fields_to_update)

            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class UpdateProfilePictures(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        form = ProfilePicturesUpdateForm(request.POST, request.FILES, instance=request.user)
        
        try:
            if form.is_valid():
                user_form = form.save()

                # Process the avatar image if uploaded using helper function
                if request.POST['avatar_no'] != 'araris':
                    create_or_update_media(user=request.user, image_field=user_form.avatar, media_type='profile')

                # Process the background image if uploaded using helper function
                if request.POST['background_image_no'] != 'araris':
                    create_or_update_media(user=request.user, image_field=user_form.background_image, media_type='background')

                return Response({"redirect_url": "home"}, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        
class DeleteImages(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = json.loads(request.body)

        try:
            # Fetch the media object
            media_obj = UserMedia.objects.get(id=data)

            # Get the file path
            media_link = media_obj.media_file_link

            # Delete the media object from the database
            media_obj.delete()

            if media_obj.media_file_link == request.user.background_image.url and media_obj.media_type == 'background':
                request.user.background_image.delete(save=False)

                request.user.background_image = 'backgrounds/No Image.svg'
            elif media_obj.media_file_link == request.user.avatar.url and media_obj.media_type == 'profile':
                # Delete the current avatar image
                request.user.avatar.delete(save=False)

                if request.user.gender == 'male':
                    request.user.avatar = 'avatars/default-boy-avatar.jpg'
                else:
                    request.user.avatar = 'avatars/default-girl-avatar.jpg'

            request.user.save()

            context = {"message": "Image deleted successfully"}
            
            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        
class SetCoverOrProfile(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = json.loads(request.body)

        media_type = data['type']
        media_id = data['mediaId']

        try:
            # Fetch the media object
            media_obj = UserMedia.objects.get(id=media_id)

            user = request.user

            if media_type == 'background':
                user.background_image = media_obj.media_file_link.replace(settings.MEDIA_URL, '')
            elif media_type == 'profile':
                user.avatar = media_obj.media_file_link.replace(settings.MEDIA_URL, '')
            
            user.save()

            context = {"message": "Image updated successfully"}
            
            return Response(context, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({"detail": "Media object not found"}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)