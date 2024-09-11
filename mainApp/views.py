from django.shortcuts import render
from django.contrib.auth.decorators import login_required
# Create your views here.

@login_required(login_url='login')
def home(request):
    return render(request, 'mainApp/home.html')

@login_required(login_url='login')
def profile(request):
    return render(request, 'mainApp/profile.html')