from django.urls import path
from .views import ProfileSetupView, UpdateJobOrLocation, UpdateProfilePictures, DeleteImages, SetCoverOrProfile

urlpatterns = [
    path('profile/setup/', ProfileSetupView.as_view(), name='profile_setup'),
    path('profile/Update-Job-Or-Location/', UpdateJobOrLocation.as_view(), name='UpdateJobOrLocation'),
    path('profile/Update-Profile-Pictures/', UpdateProfilePictures.as_view(), name='UpdateProfilePictures'),
    path('profile/Delete_Images/', DeleteImages.as_view(), name='DeleteImages'),
    path('profile/SetCoverOrProfile/', SetCoverOrProfile.as_view(), name='SetCoverOrProfile'),
]