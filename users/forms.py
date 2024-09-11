from django import forms
from django.contrib.auth.forms import PasswordResetForm
from .models import User

# ვამოწმებ ემაილი არის თუ არა დატაბეისში, ანუ ფეიკი ხომ არ არის.
class CustomPasswordResetForm(PasswordResetForm):
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email address is not registered.")
        return email
