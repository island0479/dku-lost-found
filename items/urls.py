from django.urls import path
from . import views

urlpatterns = [
    path("", views.item_list, name="item_list"),
    path("signup/", views.signup, name="signup"),
    path("my/", views.my_items, name="my_items"),
    path("auth/password/", views.change_password, name="change_password"),
    path("auth/delete/", views.delete_account, name="delete_account"),
    path("item/new/", views.item_create, name="item_create"),
    path("item/<int:pk>/", views.item_detail, name="item_detail"),
    path("item/<int:pk>/edit/", views.item_update, name="item_update"),
    path("item/<int:pk>/delete/", views.item_delete, name="item_delete"),
    path("item/<int:pk>/return/", views.item_return, name="item_return"),
    path("item/<int:pk>/revert/", views.item_revert, name="item_revert"),
    path("item/<int:pk>/inquiry/add/", views.inquiry_create, name="inquiry_create"),
    path("item/<int:pk>/inquiry/<int:inq_pk>/", views.inquiry_display, name="inquiry_display"),
    path("item/<int:pk>/inquiry/<int:inq_pk>/edit/", views.inquiry_edit_form, name="inquiry_edit_form"),
    path("item/<int:pk>/inquiry/<int:inq_pk>/save/", views.inquiry_save, name="inquiry_save"),
    path("item/<int:pk>/inquiry/<int:inq_pk>/delete/", views.inquiry_delete, name="inquiry_delete"),
]
