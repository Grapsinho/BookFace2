from django import template

register = template.Library()

@register.filter
def first_n_items(List, i):
    return List[:int(i)]

# to know class instance name
@register.filter
def instanceof(obj, class_name):
    return obj.__class__.__name__ == class_name

from django.utils import timezone
from datetime import timedelta

@register.filter
def time_since(timestamp):
    """
    this function returns time in string like 30s, 1h, 3d and etc.
    """
    if not timestamp:
        return ""
    now = timezone.now()
    diff = now - timestamp

    if diff < timedelta(minutes=1):
        return f"{int(diff.total_seconds())}s"
    elif diff < timedelta(hours=1):
        return f"{int(diff.total_seconds() // 60)}m"
    elif diff < timedelta(days=1):
        return f"{int(diff.total_seconds() // 3600)}h"
    elif diff < timedelta(days=7):
        return f"{diff.days}d"
    else:
        weeks = diff.days // 7
        return f"{weeks}w" if weeks < 5 else timestamp.strftime("%Y-%m-%d")