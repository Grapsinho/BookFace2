from django import template

register = template.Library()

@register.filter
def first_n_items(List, i):
    return List[:int(i)]