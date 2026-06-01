from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "카테고리"
        verbose_name_plural = "카테고리"


class Item(models.Model):
    STATUS_CHOICES = [
        ("found", "보관 중"),
        ("returned", "반환 완료"),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    location = models.CharField(max_length=100)
    found_date = models.DateField()
    image = models.ImageField(upload_to="items/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="found")
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="registered_items")
    returned_to = models.ForeignKey("Inquiry", on_delete=models.SET_NULL, null=True, blank=True, related_name="returned_item")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "분실물"
        verbose_name_plural = "분실물"
        ordering = ["-created_at"]


class ItemImage(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='items/')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class Inquiry(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="inquiries")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    contact = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.title} - {self.user.username}"

    class Meta:
        verbose_name = "문의"
        verbose_name_plural = "문의"
        ordering = ["-created_at"]


class Message(models.Model):
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
