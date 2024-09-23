from django import template

register = template.Library()

@register.filter
def first_n_items(List, i):
    return List[:int(i)]

@register.filter
def instanceof(obj, class_name):
    return obj.__class__.__name__ == class_name