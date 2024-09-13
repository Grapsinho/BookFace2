from django import template

register = template.Library()

@register.filter(name='addattr')
def addattr(field, attr):
    attrs = {}
    try:
        # Split the attributes passed in
        definition = attr.split(',')
        for d in definition:
            kv = d.split('=')
            if len(kv) == 2:
                attrs[kv[0].strip()] = kv[1].strip()
        return field.as_widget(attrs=attrs)
    except IndexError:
        return field