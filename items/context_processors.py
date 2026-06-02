from django.db.models import Q, OuterRef, Subquery
from .models import Inquiry, Message


def new_inquiry_count(request):
    if not request.user.is_authenticated:
        return {'new_inquiry_count': 0}

    last_sender = Message.objects.filter(
        inquiry=OuterRef('pk')
    ).order_by('-created_at').values('sender_id')[:1]

    count = (
        Inquiry.objects
        .filter(Q(user=request.user) | Q(item__registered_by=request.user))
        .annotate(last_sender_id=Subquery(last_sender))
        .filter(last_sender_id__isnull=False)
        .exclude(last_sender_id=request.user.pk)
        .distinct()
        .count()
    )
    campus = request.session.get('campus', 'jukjeon')
    return {
        'new_inquiry_count': count,
        'current_campus': campus,
        'current_campus_name': '죽전' if campus == 'jukjeon' else '천안',
    }
