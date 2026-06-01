from .models import Inquiry, AdminRequest


def new_inquiry_count(request):
    if not request.user.is_authenticated:
        return {'new_inquiry_count': 0, 'pending_admin_requests': 0}
    inquiry_count = (
        Inquiry.objects
        .filter(item__registered_by=request.user)
        .exclude(messages__sender=request.user)
        .distinct()
        .count()
    )
    pending = (
        AdminRequest.objects.filter(status='pending').count()
        if request.user.is_superuser else 0
    )
    return {'new_inquiry_count': inquiry_count, 'pending_admin_requests': pending}
