from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import debug_toolbar

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth urls
    path('auth/', include('users.urls')),

    # mainApp urls
    path('', include('mainApp.urls')),

    # profile setup urls
    path('', include('user_profile.urls')),

    # notifications urls
    path('notifications/api/', include('notifications.urls')),

    # friendship urls
    path('friendship/', include('friendship.urls')),

    # post creation urls
    path('posts/', include('posts.urls')),

    #for development
    path("__debug__/", include(debug_toolbar.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)