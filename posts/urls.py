from django.urls import path
from .views import *

urlpatterns = [
    path('createPost/', CreatePostView.as_view(), name='create_post'),
    path('deletePost/', DeletePost.as_view(), name='DeletePost'),
    path('<int:post_id>/edit/', EditPost.as_view(), name='get_post_data'),
    path('<int:post_id>/like/', AddLikes.as_view(), name='add_likes'),
    path('<int:post_id>/comments/', CrudComments.as_view(), name='add_comments'),
    path('<int:comment_id>/comments/delete/', CrudComments.as_view(), name='delete_comments'),
    path('<int:comment_id>/comments/edit/', CrudComments.as_view(), name='edit_comments'),
    path('postForNotification/', postForNotification, name='postForNotification'),
]