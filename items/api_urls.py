from django.urls import path
from . import api_views

urlpatterns = [
    path('csrf/', api_views.csrf),
    path('auth/me/', api_views.auth_me),
    path('auth/login/', api_views.auth_login),
    path('auth/logout/', api_views.auth_logout),
    path('auth/signup/', api_views.auth_signup),
    path('auth/password/', api_views.auth_password),
    path('auth/account/', api_views.auth_account),
    path('categories/', api_views.category_list),
    path('items/', api_views.item_list),
    path('items/<int:pk>/', api_views.item_detail),
    path('items/<int:pk>/return/', api_views.item_return),
    path('items/<int:pk>/inquiries/', api_views.inquiry_list),
    path('items/<int:pk>/inquiries/<int:inq_pk>/', api_views.inquiry_detail),
    path('my/items/', api_views.my_items),
]
