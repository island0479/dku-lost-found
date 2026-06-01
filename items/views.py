from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden
from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.db.models import Q, Max
from .models import Item, Category, Inquiry, ItemImage, Message, AdminRequest
from .forms import ItemForm, InquiryForm, SignupForm, AdminRequestForm


def _filter_items(request):
    qs = Item.objects.select_related('category').prefetch_related('images')
    if request.user.is_authenticated:
        qs = qs.exclude(registered_by=request.user)
    q = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "")
    show_all = request.GET.get("show_all", "")
    if q:
        qs = qs.filter(title__icontains=q)
    if category_id:
        qs = qs.filter(category_id=category_id)
    if not show_all:
        qs = qs.filter(status="found")
    return qs, q, category_id, bool(show_all)


def item_list(request):
    items, q, category_id, show_all = _filter_items(request)
    if request.headers.get('HX-Request'):
        return render(request, "items/partials/item_cards.html", {"items": items})
    return render(request, "items/item_list.html", {
        "items": items,
        "categories": Category.objects.all(),
        "q": q,
        "selected_category": category_id,
        "show_all": show_all,
    })


def item_detail(request, pk):
    item = get_object_or_404(
        Item.objects.select_related('category', 'registered_by', 'returned_to__user')
                    .prefetch_related('images', 'inquiries__user'),
        pk=pk,
    )
    user = request.user
    can_manage = user.is_authenticated and (user.is_staff or user == item.registered_by)

    all_images = []
    if item.image:
        all_images.append(item.image.url)
    all_images.extend(img.image.url for img in item.images.all())

    ctx = {
        "item": item,
        "can_manage": can_manage,
        "all_images": all_images,
    }
    if can_manage:
        ctx["inquiries"] = item.inquiries.select_related("user").all()
    elif user.is_authenticated:
        ctx["my_inquiry"] = item.inquiries.filter(user=user).first()
        ctx["inquiry_form"] = InquiryForm()

    return render(request, "items/item_detail.html", ctx)


@login_required
def item_create(request):
    if request.method == "POST":
        form = ItemForm(request.POST, request.FILES)
        if form.is_valid():
            item = form.save(commit=False)
            item.registered_by = request.user
            item.save()
            for i, img in enumerate(request.FILES.getlist("images")):
                ItemImage.objects.create(item=item, image=img, order=i)
            return redirect("item_detail", pk=item.pk)
    else:
        form = ItemForm()
    return render(request, "items/item_form.html", {"form": form, "action": "등록"})


@login_required
def item_update(request, pk):
    item = get_object_or_404(Item, pk=pk)
    if not (request.user.is_staff or request.user == item.registered_by):
        return HttpResponseForbidden()
    if request.method == "POST":
        form = ItemForm(request.POST, request.FILES, instance=item)
        if form.is_valid():
            form.save()
            existing_count = item.images.count()
            for i, img in enumerate(request.FILES.getlist("images")):
                ItemImage.objects.create(item=item, image=img, order=existing_count + i)
            return redirect("item_detail", pk=item.pk)
    else:
        form = ItemForm(instance=item)

    all_images = []
    if item.image:
        all_images.append(item.image.url)
    all_images.extend(img.image.url for img in item.images.all())
    return render(request, "items/item_form.html", {
        "form": form, "action": "수정", "item": item, "all_images": all_images,
    })


@login_required
def item_delete(request, pk):
    item = get_object_or_404(Item, pk=pk)
    if not (request.user.is_staff or request.user == item.registered_by):
        return HttpResponseForbidden()
    if request.method == "POST":
        item.delete()
        messages.success(request, "분실물이 삭제됐습니다.")
        return redirect("my_items")
    return redirect("item_detail", pk=pk)


@login_required
def item_return(request, pk):
    item = get_object_or_404(Item, pk=pk)
    if not (request.user.is_staff or request.user == item.registered_by):
        return HttpResponseForbidden()
    if request.method == "POST":
        inq_id = request.POST.get("inquiry_id")
        if inq_id:
            item.returned_to = get_object_or_404(Inquiry, pk=inq_id, item=item)
        item.status = "returned"
        item.save()
    return redirect("item_detail", pk=pk)


@login_required
def item_found(request, pk):
    """발견 신고 게시글을 '해결됨'으로 처리 (누구나 가능)"""
    item = get_object_or_404(Item, pk=pk, post_type='sighting')
    if request.method == 'POST':
        item.status = 'returned'
        item.save()
    return redirect('item_detail', pk=pk)


@login_required
def item_revert(request, pk):
    item = get_object_or_404(Item, pk=pk)
    if not (request.user.is_staff or request.user == item.registered_by):
        return HttpResponseForbidden()
    if request.method == "POST":
        item.status = "found"
        item.returned_to = None
        item.save()
    return redirect("item_detail", pk=pk)


@login_required
def inquiry_create(request, pk):
    item = get_object_or_404(Item, pk=pk)
    if request.user.is_staff or request.user == item.registered_by:
        return HttpResponseForbidden()
    if item.inquiries.filter(user=request.user).exists():
        messages.warning(request, "이미 문의를 등록하셨습니다.")
        return redirect("item_detail", pk=pk)
    if request.method == "POST":
        form = InquiryForm(request.POST)
        if form.is_valid():
            inq = form.save(commit=False)
            inq.item = item
            inq.user = request.user
            inq.save()
            if request.headers.get('HX-Request'):
                return render(request, "items/partials/inquiry_section.html", {
                    "item": item, "my_inquiry": inq,
                })
            messages.success(request, "문의가 접수됐습니다.")
    return redirect("item_detail", pk=pk)


def inquiry_display(request, pk, inq_pk):
    item = get_object_or_404(Item, pk=pk)
    inq = get_object_or_404(Inquiry, pk=inq_pk, item=item)
    return render(request, "items/partials/inquiry_display.html", {"item": item, "inq": inq})


@login_required
def inquiry_edit_form(request, pk, inq_pk):
    item = get_object_or_404(Item, pk=pk)
    inq = get_object_or_404(Inquiry, pk=inq_pk, item=item, user=request.user)
    return render(request, "items/partials/inquiry_edit_form.html", {
        "item": item, "inq": inq, "form": InquiryForm(instance=inq),
    })


@login_required
def inquiry_save(request, pk, inq_pk):
    item = get_object_or_404(Item, pk=pk)
    inq = get_object_or_404(Inquiry, pk=inq_pk, item=item, user=request.user)
    if request.method == "POST":
        form = InquiryForm(request.POST, instance=inq)
        if form.is_valid():
            inq = form.save()
            if request.headers.get('HX-Request'):
                return render(request, "items/partials/inquiry_display.html", {
                    "item": item, "inq": inq,
                })
    return redirect("item_detail", pk=pk)


@login_required
def inquiry_delete(request, pk, inq_pk):
    item = get_object_or_404(Item, pk=pk)
    inq = get_object_or_404(Inquiry, pk=inq_pk, item=item)
    if request.user != inq.user and not request.user.is_staff:
        return HttpResponseForbidden()
    if request.method == "POST":
        inq.delete()
        if request.headers.get('HX-Request'):
            return render(request, "items/partials/inquiry_section.html", {
                "item": item, "my_inquiry": None, "inquiry_form": InquiryForm(),
            })
    return redirect("item_detail", pk=pk)


@login_required
def my_items(request):
    items = list(
        Item.objects
        .filter(registered_by=request.user)
        .prefetch_related('images', 'inquiries__messages')
        .select_related('category')
    )
    for item in items:
        item.new_inquiry_count = sum(
            1 for inq in item.inquiries.all()
            if not any(m.sender_id == request.user.pk for m in inq.messages.all())
        )
    return render(request, 'items/my_items.html', {'items': items})


def signup(request):
    if request.method == "POST":
        form = SignupForm(request.POST)
        account_type = request.POST.get("account_type", "personal")
        reason = request.POST.get("reason", "").strip()
        org_error = None

        if account_type == "org" and not reason:
            org_error = "신청 이유를 입력해주세요."

        if form.is_valid() and not org_error:
            user = form.save()
            if account_type == "org":
                AdminRequest.objects.create(
                    user=user,
                    reason=reason,
                    attachment=request.FILES.get("attachment"),
                )
            login(request, user)
            return redirect("item_list")
    else:
        form = SignupForm()
        account_type = "personal"
        org_error = None

    return render(request, "registration/signup.html", {
        "form": form,
        "account_type": account_type,
        "org_error": org_error,
    })


@login_required
def change_password(request):
    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "비밀번호가 변경됐습니다.")
            return redirect("item_list")
    else:
        form = PasswordChangeForm(request.user)
    form.fields['old_password'].label = "현재 비밀번호"
    form.fields['new_password1'].label = "새 비밀번호"
    form.fields['new_password2'].label = "새 비밀번호 확인"
    for field in form.fields.values():
        field.widget.attrs['class'] = 'form-control'
    return render(request, "auth/password.html", {"form": form})


@login_required
def chat(request, inq_pk):
    inquiry = get_object_or_404(
        Inquiry.objects.select_related('user', 'item__registered_by'), pk=inq_pk
    )
    if request.user != inquiry.user and request.user != inquiry.item.registered_by and not request.user.is_staff:
        return HttpResponseForbidden()
    chat_messages = inquiry.messages.select_related('sender').all()
    return render(request, 'items/chat.html', {
        'inquiry': inquiry, 'item': inquiry.item, 'chat_messages': chat_messages,
    })


@login_required
def chat_messages_partial(request, inq_pk):
    inquiry = get_object_or_404(Inquiry, pk=inq_pk)
    if request.user != inquiry.user and request.user != inquiry.item.registered_by and not request.user.is_staff:
        return HttpResponseForbidden()
    chat_messages = inquiry.messages.select_related('sender').all()
    return render(request, 'items/partials/chat_messages.html', {'chat_messages': chat_messages})


@login_required
def chat_send(request, inq_pk):
    inquiry = get_object_or_404(Inquiry, pk=inq_pk)
    if request.user != inquiry.user and request.user != inquiry.item.registered_by and not request.user.is_staff:
        return HttpResponseForbidden()
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        if content:
            Message.objects.create(inquiry=inquiry, sender=request.user, content=content)
    chat_messages = inquiry.messages.select_related('sender').all()
    return render(request, 'items/partials/chat_messages.html', {'chat_messages': chat_messages})


@login_required
def my_chats(request):
    inquiries = (
        Inquiry.objects
        .filter(Q(user=request.user) | Q(item__registered_by=request.user))
        .select_related('user', 'item', 'item__registered_by')
        .annotate(last_msg_time=Max('messages__created_at'))
        .order_by('-last_msg_time', '-created_at')
        .distinct()
    )
    return render(request, 'items/my_chats.html', {'inquiries': inquiries})


@login_required
def admin_request(request):
    if request.user.is_staff:
        messages.info(request, "이미 관리자 권한을 보유하고 있습니다.")
        return redirect('item_list')

    existing = AdminRequest.objects.filter(user=request.user).first()

    if request.method == 'POST':
        form = AdminRequestForm(request.POST, request.FILES, instance=existing)
        if form.is_valid():
            req = form.save(commit=False)
            req.user = request.user
            req.status = 'pending'
            req.reject_reason = ''
            req.save()
            messages.success(request, "신청이 접수됐습니다. 검토 후 결과를 알려드립니다.")
            return redirect('item_list')
    else:
        form = AdminRequestForm(instance=existing)

    return render(request, 'admin_request/form.html', {'form': form, 'existing': existing})


def admin_request_manage(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden()
    pending = AdminRequest.objects.filter(status='pending').select_related('user')
    reviewed = AdminRequest.objects.exclude(status='pending').select_related('user', 'reviewed_by')[:20]
    return render(request, 'admin_request/manage.html', {'pending': pending, 'reviewed': reviewed})


def admin_request_approve(request, req_pk):
    if not request.user.is_superuser:
        return HttpResponseForbidden()
    if request.method == 'POST':
        req = get_object_or_404(AdminRequest, pk=req_pk)
        req.status = 'approved'
        req.reviewed_by = request.user
        req.save()
        req.user.is_staff = True
        req.user.save()
        messages.success(request, f"{req.user.username}에게 관리자 권한을 부여했습니다.")
    return redirect('admin_request_manage')


def admin_request_reject(request, req_pk):
    if not request.user.is_superuser:
        return HttpResponseForbidden()
    if request.method == 'POST':
        req = get_object_or_404(AdminRequest, pk=req_pk)
        req.status = 'rejected'
        req.reject_reason = request.POST.get('reject_reason', '')
        req.reviewed_by = request.user
        req.save()
        messages.info(request, f"{req.user.username}의 신청을 거절했습니다.")
    return redirect('admin_request_manage')


@login_required
def delete_account(request):
    error = None
    if request.method == "POST":
        password = request.POST.get("password", "")
        if request.user.check_password(password):
            request.user.delete()
            return redirect("item_list")
        error = "비밀번호가 올바르지 않습니다."
    return render(request, "auth/delete.html", {"error": error})
