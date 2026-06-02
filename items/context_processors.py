from .models import Inquiry


def new_inquiry_count(request):
    if not request.user.is_authenticated:
        return {'new_inquiry_count': 0}
    count = (
        Inquiry.objects
        .filter(item__registered_by=request.user)
        .exclude(messages__sender=request.user)
        .distinct()
        .count()
    )
    return {'new_inquiry_count': count}
