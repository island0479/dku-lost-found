from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Item, Category, Inquiry, ItemImage
from .serializers import ItemSerializer, ItemDetailSerializer, CategorySerializer, InquirySerializer
from .forms import SignupForm


@api_view(['GET'])
def csrf(request):
    return Response({'csrfToken': get_token(request)})


@api_view(['GET'])
@ensure_csrf_cookie
def auth_me(request):
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'is_staff': request.user.is_staff,
        })
    return Response(None)


@api_view(['POST'])
def auth_login(request):
    user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
    if user:
        login(request, user)
        return Response({'id': user.id, 'username': user.username, 'is_staff': user.is_staff})
    return Response({'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def auth_logout(request):
    logout(request)
    return Response({'ok': True})


@api_view(['POST'])
def auth_signup(request):
    form = SignupForm(request.data)
    if form.is_valid():
        user = form.save()
        login(request, user)
        return Response({'id': user.id, 'username': user.username, 'is_staff': user.is_staff}, status=201)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def auth_password(request):
    if not request.user.is_authenticated:
        return Response({'error': '로그인이 필요합니다.'}, status=401)
    if not request.user.check_password(request.data.get('old_password')):
        return Response({'error': '현재 비밀번호가 올바르지 않습니다.'}, status=400)
    new_password = request.data.get('new_password', '')
    if len(new_password) < 8:
        return Response({'error': '새 비밀번호는 8자 이상이어야 합니다.'}, status=400)
    request.user.set_password(new_password)
    request.user.save()
    login(request, request.user)
    return Response({'ok': True})


@api_view(['DELETE'])
def auth_account(request):
    if not request.user.is_authenticated:
        return Response({'error': '로그인이 필요합니다.'}, status=401)
    if not request.user.check_password(request.data.get('password')):
        return Response({'error': '비밀번호가 올바르지 않습니다.'}, status=400)
    request.user.delete()
    logout(request)
    return Response({'ok': True})


@api_view(['GET'])
def category_list(request):
    return Response(CategorySerializer(Category.objects.all(), many=True).data)


@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def item_list(request):
    if request.method == 'GET':
        items = Item.objects.all()
        if q := request.GET.get('q'):
            items = items.filter(title__icontains=q)
        if cat := request.GET.get('category'):
            items = items.filter(category_id=cat)
        if st := request.GET.get('status'):
            items = items.filter(status=st)
        return Response(ItemSerializer(items, many=True).data)

    if not request.user.is_authenticated:
        return Response({'error': '로그인이 필요합니다.'}, status=401)
    serializer = ItemSerializer(data=request.data)
    if serializer.is_valid():
        item_obj = serializer.save(registered_by=request.user)
        for i, f in enumerate(request.FILES.getlist('images')):
            ItemImage.objects.create(item=item_obj, image=f, order=i)
        return Response(ItemSerializer(item_obj).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def item_detail(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response({'error': '없는 항목입니다.'}, status=404)

    can_manage = request.user.is_authenticated and (request.user.is_staff or request.user == item.registered_by)

    if request.method == 'GET':
        data = ItemDetailSerializer(item).data
        data['can_manage'] = can_manage
        if not can_manage:
            data.pop('inquiries', None)
            if request.user.is_authenticated:
                my_inq = item.inquiries.filter(user=request.user).first()
                data['my_inquiry'] = InquirySerializer(my_inq).data if my_inq else None
        return Response(data)

    if not can_manage:
        return Response({'error': '권한이 없습니다.'}, status=403)
    serializer = ItemSerializer(item, data=request.data, partial=True)
    if serializer.is_valid():
        item_obj = serializer.save()
        for i, f in enumerate(request.FILES.getlist('images')):
            ItemImage.objects.create(item=item_obj, image=f, order=item_obj.images.count() + i)
        return Response(ItemSerializer(item_obj).data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def item_return(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response({'error': '없는 항목입니다.'}, status=404)

    if not (request.user.is_staff or request.user == item.registered_by):
        return Response({'error': '권한이 없습니다.'}, status=403)

    if request.data.get('action') == 'revert':
        item.status = 'found'
        item.returned_to = None
    else:
        if inquiry_id := request.data.get('inquiry_id'):
            try:
                item.returned_to = Inquiry.objects.get(pk=inquiry_id, item=item)
            except Inquiry.DoesNotExist:
                return Response({'error': '해당 문의를 찾을 수 없습니다.'}, status=400)
        item.status = 'returned'
    item.save()
    data = ItemDetailSerializer(item).data
    data['can_manage'] = True
    return Response(data)


@api_view(['GET', 'POST'])
def inquiry_list(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response({'error': '없는 항목입니다.'}, status=404)

    can_manage = request.user.is_authenticated and (request.user.is_staff or request.user == item.registered_by)

    if request.method == 'GET':
        if not can_manage:
            return Response({'error': '권한이 없습니다.'}, status=403)
        return Response(InquirySerializer(item.inquiries.all(), many=True).data)

    if not request.user.is_authenticated:
        return Response({'error': '로그인이 필요합니다.'}, status=401)
    if request.user == item.registered_by:
        return Response({'error': '본인 게시물에는 문의할 수 없습니다.'}, status=400)
    serializer = InquirySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(item=item, user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PATCH', 'DELETE'])
def inquiry_detail(request, pk, inq_pk):
    try:
        inquiry = Inquiry.objects.get(pk=inq_pk, item_id=pk)
    except Inquiry.DoesNotExist:
        return Response({'error': '없는 문의입니다.'}, status=404)

    if request.user != inquiry.user:
        return Response({'error': '권한이 없습니다.'}, status=403)

    if request.method == 'DELETE':
        inquiry.delete()
        return Response({'ok': True})

    serializer = InquirySerializer(inquiry, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
def my_items(request):
    if not request.user.is_authenticated:
        return Response({'error': '로그인이 필요합니다.'}, status=401)
    items = Item.objects.filter(registered_by=request.user)
    return Response(ItemSerializer(items, many=True).data)
