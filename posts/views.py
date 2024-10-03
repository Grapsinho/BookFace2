# Django Imports
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views import View
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Count, Case, When, BooleanField
from utils.utility import quicksort
from users.models import User
from itertools import chain

# Model Imports
from .models import Post, Tag, Like, Comment, SharedPost
from users.models import UserMedia
from notifications.models import Notification

# Form Imports
from .forms import PostForm

# Utility Imports
from utils.utility import optimize_image, create_or_update_media

# Authentication and Permissions Imports
from users.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

# REST Framework Imports
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.exceptions import Throttled
from rest_framework.generics import ListAPIView
from rest_framework.pagination import LimitOffsetPagination

# Exception Imports
from users.exceptions import AuthenticationRedirectException

# Other Imports
import bleach
import mimetypes
import json
from django.utils import timezone
from django.utils.timesince import timesince


def sanitize_input(user_input):
    cleaned_input = bleach.clean(user_input, tags=['p', 'strong', 'em'], attributes={'*': ['class']})
    return cleaned_input

class CreatePostView(View):
    permission_classes = [IsAuthenticated]
    permission_classes = [JWTAuthentication]

    def post(self, request, *args, **kwargs):
        form = PostForm(request.POST, request.FILES)
        uploaded_file = request.FILES.get('media')

        try:
            if uploaded_file:
                file_type = mimetypes.guess_type(uploaded_file.name)[0]  # Get MIME type

                if 'image' in file_type:
                    form.fields['video'].required = False
                    optimized_image = optimize_image(uploaded_file)
                    form.instance.image = optimized_image

                elif 'video' in file_type:
                    form.fields['image'].required = False
                                        
                    if uploaded_file.size > 10 * 1024 * 1024:
                        return JsonResponse({
                            'success': False, 
                            'errors': {'video': 'Video file is too large. Maximum size allowed is 10MB.'}
                        })
                    form.instance.video = uploaded_file

                else:
                    return JsonResponse({'success': False, 'errors': {'media': 'Unsupported file type. Only images and videos are allowed.'}})

            if form.is_valid():
                post = form.save(commit=False)
                post.user = request.user
                post.save()
                form.save_m2m()  # Save tags

                if form.instance.image:
                    create_or_update_media(user=request.user, image_field=form.instance.image, media_type='post_image')

                post_html = render_to_string('posts/text-post-in-posts.html', {'post': post})
                return JsonResponse({'success': True, 'post_html': post_html})
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class DeletePost(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = json.loads(request.body)

        try:

            post = Post.objects.get(id=data['post_id'])

            if data['imageSrc_for_userMedia'] != 'video':
                # Fetch the media object
                media_obj = UserMedia.objects.filter(user=request.user, media_file_link=data['imageSrc_for_userMedia'])

                post.image.delete()

                if media_obj:
                    # Get the file path
                    media_link = media_obj[0].media_file_link

                    # Delete the media object from the database
                    media_obj[0].delete()
            else:
                post.video.delete()

            post.delete()


            context = {"message": "Post deleted successfully"}
            
            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class EditPost(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            data = {
                'id': post.id,
                'text': post.text,
                'tags': [tag.name for tag in post.tags.all()],
                'media': post.image.url if post.image else post.video.url if post.video else None,
                'media_type': 'image' if post.image else 'video' if post.video else None
            }

            context = {"message": "Post data retrieved successfully", 'data': data}
            
            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
    
    def patch(self, request, post_id):
        try:
            post = get_object_or_404(Post, id=post_id)
            data = request.data

            # Handle text update
            if 'text' in data:
                new_text = sanitize_input(data.get('text'))
                if new_text != post.text:
                    post.text = new_text 

            # Handle tags
            tag_names = data.getlist('tags', '')
            if tag_names:
                post.tags.clear()
                for tag_name in tag_names:
                    tag_name = tag_name.strip()
                    if tag_name:  # Ensure no empty tags
                        tag = Tag.objects.get(name=tag_name)
                        post.tags.add(tag)

            if 'media' in request.FILES:
                media_file = request.FILES['media']

                if post.video:
                    post.video.delete(save=False)

                if media_file.content_type.startswith('image'):
                    post.image = optimize_image(media_file)
                    post.video = None
                elif media_file.content_type.startswith('video'):
                    if media_file.size > 10 * 1024 * 1024:
                        return JsonResponse({
                            'success': False, 
                            'errors': {'video': 'Video file is too large. Maximum size allowed is 10MB.'}
                        })
                    post.video = media_file
                    post.image = None 
                else:
                    return Response({'success': False, 'error': 'Invalid media type'}, status=status.HTTP_400_BAD_REQUEST)

            post.save()

            if 'media' in request.FILES:
                if media_file.content_type.startswith('image'):
                    create_or_update_media(user=request.user, image_field=post.image, media_type='post_image')

            data = {
                'id': post.id,
                'text': post.text,
                'tags': [tag.name for tag in post.tags.all()],
                'media': post.image.url if post.image else post.video.url if post.video else None,
                'media_type': 'image' if post.image else 'video' if post.video else None
            }

            return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        except Exception as e:
            return Response({"detail": str(e)}, status=401)
 
def postForNotification(request):
    if request.method == 'POST' and request.user.is_authenticated:
        data_arara = json.loads(request.body)

        post_id = int(data_arara['post_id'])
        comment = data_arara['comment']

        post = Post.objects.get(id=post_id)

        user_likes = Like.objects.filter(post=post).count()

        time_difference = timesince(post.created_at, timezone.now())

        comments_post2 = []

        if comment == 'yes':
            comments_post = Comment.objects.filter(post=post).select_related('user', 'post').values('text', 'id', 'user__first_name', 'user__last_name', 'user__id')[:10]
            
            comments_post2 = list(comments_post)

        post_data = {
            'title': post.text,
            'tags': [tag.name for tag in post.tags.all()],
            'created_at': time_difference,
            'media': post.image.url if post.image else post.video.url if post.video else None,
            'media_type': 'image' if post.image else 'video' if post.video else None,
            'user_likes': user_likes,
            'author': {
                'first_name': post.user.first_name,
                'last_name': post.user.last_name,
                'avatar': post.user.avatar.url,
                'email': post.user.email,
            },
            'comments': comments_post2
        }


        return JsonResponse({'success': True, 'data': post_data})
    
    return JsonResponse({'success': False, 'message': 'User not authenticated or method not allowed'})


class LikeThrottle(UserRateThrottle):
    scope = 'like'
    rate = '10/minute'

class CommentThrottle(UserRateThrottle):
    scope = 'comment'
    rate = '10/minute'

class AddLikes(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    throttle_classes = [LikeThrottle]

    def post(self, request, post_id):
        try:
            isharedOrNot = request.POST.get('shared')
            context = {}
            if isharedOrNot == 'post_post':
                post = get_object_or_404(Post, id=post_id)
                like, created = Like.objects.get_or_create(user=request.user, post=post)

                if not created:
                    like.delete()
                    context['success'] = True
                    context['message_remove'] = 'Like removed'
                    notification = Notification.objects.create(
                        recipient=post.user,
                        sender=request.user,
                        message=int(post.pk),
                        notification_type = 'post_unlike'
                    )
                else:
                    context = {"message": "Liked"}
                    notification = Notification.objects.create(
                        recipient=post.user,
                        sender=request.user,
                        message=int(post.pk),
                        notification_type = 'post_like'
                    )
            elif isharedOrNot == 'shared_post':
                post = get_object_or_404(SharedPost, id=post_id)
                like, created = Like.objects.get_or_create(user=request.user, shared_post=post)

                if not created:
                    like.delete()
                    context['success'] = True
                    context['message_remove'] = 'Like removed'
                else:
                    context = {"message": "Liked"}
            

            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
    
    def handle_exception(self, exc):
        # Custom handling for Throttled exception
        if isinstance(exc, Throttled):
            custom_response_data = {
                "message": "You have made too many login attempts. Please try again later.",
                "available_in": f"{exc.wait} seconds"
            }
            return Response(custom_response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Handle other exceptions as usual
        return super().handle_exception(exc)

class CrudComments(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    throttle_classes = [CommentThrottle]

    def post(self, request, post_id):
        try:
            user = request.user
            isharedOrNot = request.POST.get('shared')
            post = ''
            comment = ''

            text = request.data.get('text')

            if not text or text.strip() == "":
                return Response(
                    {"error": "Comment text cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST
                )


            if isharedOrNot == 'post_post':
                post = get_object_or_404(Post, id=post_id)

                comment = Comment.objects.create(
                    user=user,
                    post=post,
                    text=text.strip()
                )
                if post.user != request.user:
                    notification = Notification.objects.create(
                        recipient=post.user,
                        sender=request.user,
                        message=comment.text,
                        post_Id=post.pk,
                        notification_type = 'post_comment'
                    )
            elif isharedOrNot == 'shared_post':
                post = get_object_or_404(SharedPost, id=post_id)

                comment = Comment.objects.create(
                    user=user,
                    shared_post=post,
                    text=text.strip()
                )
            
            context = {"status": True, 'user': f"{user.first_name} {user.last_name}", 'comment_id': comment.pk}

            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
    
    def delete(self, request, comment_id):
        try:
            comment = get_object_or_404(Comment, id=comment_id)
            comment.delete()
            return Response({"status": True}, status=status.HTTP_200_OK)
        
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        
    def patch(self, request, comment_id):
        try:
            comment = get_object_or_404(Comment, id=comment_id)
            comment.text = request.data.get('text').strip()
            comment.save()
            return Response({"status": True}, status=status.HTTP_200_OK)
        
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

    def handle_exception(self, exc):
        # Custom handling for Throttled exception
        if isinstance(exc, Throttled):
            custom_response_data = {
                "message": "You have made too many login attempts. Please try again later.",
                "available_in": f"{exc.wait} seconds"
            }
            return Response(custom_response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Handle other exceptions as usual
        return super().handle_exception(exc)

class SharePost(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = get_object_or_404(Post, id=post_id)

            time_difference = timesince(post.created_at, timezone.now())

            post_data = {
                'id': post.pk,
                'title': post.text,
                'tags': [tag.name for tag in post.tags.all()],
                'created_at': time_difference,
                'media': post.image.url if post.image else post.video.url if post.video else None,
                'media_type': 'image' if post.image else 'video' if post.video else None,
                'author': {
                    'first_name': post.user.first_name,
                    'last_name': post.user.last_name,
                    'avatar': post.user.avatar.url,
                },
            }

            return JsonResponse({'success': True, 'data': post_data})

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

    def delete(self, request, sharedPost_id):
        try:
            SharedPost2 = get_object_or_404(SharedPost, id=sharedPost_id)
            SharedPost2.delete()
            return Response({"status": True}, status=status.HTTP_200_OK)
        
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

    def post(self, request, post_id):
        try:
            # Get the original post
            original_post = get_object_or_404(Post, id=post_id)
            
            # Text From user who shared a post
            message = request.data

            # Check if the user already shared this post
            if SharedPost.objects.filter(original_post=original_post, shared_by=request.user).exists():
                return JsonResponse({'error': 'You have already shared this post.'}, status=400)

            # Create the shared post
            shared_post = SharedPost.objects.create(
                original_post=original_post,
                shared_by=request.user,
                message=message
            )

            notification = Notification.objects.create(
                recipient=original_post.user,
                sender=request.user,
                message= "shared your post",
                post_Id=original_post.pk,
                notification_type = 'post_shared'
            )
            
            context = {"status": True}

            return Response(context, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)


class PostPagination(LimitOffsetPagination):
    default_limit = 4 # Number of posts to load per request
    max_limit = 50  # Max limit that can be set via the API request

class FetchPostsForScroll(ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination

    def get(self, request, email, *args, **kwargs):
        try:
            user = get_object_or_404(User, email=email)

            offset = int(request.GET.get('offset', 0))  # Start at 0
            limit = int(request.GET.get('limit', 2))

            comments_prefetch = Prefetch(
                'comments', 
                queryset=Comment.objects.select_related('user').order_by('-created_at')
            )

            user_post_likes = Like.objects.filter(user=request.user, post__isnull=False).values_list('post_id', flat=True)

            user_shared_likes = Like.objects.filter(user=request.user, shared_post__isnull=False).values_list('shared_post_id', flat=True)

            posts_for_user = user.posts.select_related('user').prefetch_related(
                'tags',
                comments_prefetch
            ).annotate(
                like_count=Count('likes'),
                user_liked=Case(
                    When(pk__in=user_post_likes, then=True), 
                    default=False, 
                    output_field=BooleanField()
                )
            ).order_by('-created_at')[offset:offset + limit]

            shared_posts_for_user = user.shared_posts.select_related(
                'shared_by', 'original_post__user'
            ).prefetch_related(
                'original_post__tags',
                comments_prefetch
            ).annotate(
                like_count=Count('likes'),
                user_liked=Case(
                    When(pk__in=user_shared_likes, then=True), 
                    default=False, 
                    output_field=BooleanField()
                )
            ).order_by('-created_at')[offset:offset + limit]

            combined_posts = list(chain(posts_for_user, shared_posts_for_user))
            all_posts = quicksort(combined_posts, key=lambda post: post.created_at)

            # Check if there are any posts to return
            if not all_posts:
                return Response({'posts': []}, status=200)

            # Render HTML for the posts
            posts_html = []
            for post in all_posts:
                if isinstance(post, Post):  # Casual Post
                    post_html = render_to_string('posts/casual-post-post.html', {'post': post, 'request': request})
                elif isinstance(post, SharedPost):  # Shared Post
                    post_html = render_to_string('posts/shared-post-posts.html', {'post': post, 'request': request})
                posts_html.append(post_html)

            return Response({'posts': posts_html}, status=200)
        
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)