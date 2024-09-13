from django import forms
from users.models import User

class ProfileSetupForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['bio', 'job', 'location', 'avatar', 'background_image']

    bio = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control every_input', 'rows': 4, 'placeholder': 'Enter a short bio...', 'value': 'Enter a short bio...'
        }),
        required=False
    )
    job = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control every_input', 'placeholder': 'Enter your job...'
        }),
        required=False
    )
    location = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control every_input', 'placeholder': 'Enter your location...'
        }),
        required=False
    )
    avatar = forms.ImageField(
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control-file'
        }),
        required=False
    )
    background_image = forms.ImageField(
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control-file'
        }),
        required=False
    )

class ProfilePicturesUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['avatar', 'background_image']