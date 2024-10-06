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
    path('<int:post_id>/sharePost/', SharePost.as_view(), name='share_post'),
    path('<int:post_id>/getOriginalPost/', SharePost.as_view(), name='share_post_get'),
    path('<int:sharedPost_id>/delete/', SharePost.as_view(), name='share_post_delete'),
    path('<str:email>/fetch_posts_for_user/', FetchPostsForScroll.as_view(), name='FetchPostsForScroll'),
    path('<str:email>/fetch_posts_for_feed/', FetchPostsForScrollFeed.as_view(), name='FetchPostsForScrollFeed'),
]