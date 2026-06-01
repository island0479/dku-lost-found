from .models import Inquiry


def new_inquiry_count(request):
    if not request.user.is_authenticated:
        return {'new_inquiry_count': 0}
    # 내 분실물에 달린 문의 중 내가 아직 한 번도 메시지를 보내지 않은 것
    count = (
        Inquiry.objects
        .filter(item__registered_by=request.user)
        .exclude(messages__sender=request.user)
        .distinct()
        .count()
    )
    return {'new_inquiry_count': count}
