from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from users.models import User
# Create your views here.

@login_required(login_url='login')
def home(request):
    return render(request, 'mainApp/home.html')

@login_required(login_url='login')
def profile(request, email):

    user = User.objects.get(email=email)

    user_media = user.user_media.all()

    context = {'user_media': user_media, 'user': user}

    return render(request, 'mainApp/profile.html', context)