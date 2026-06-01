from rest_framework import serializers
from .models import Item, Category, Inquiry, ItemImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class InquirySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Inquiry
        fields = ['id', 'username', 'message', 'contact', 'created_at']


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    registered_by_name = serializers.CharField(source='registered_by.username', read_only=True, default=None)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'category', 'category_name', 'location',
            'found_date', 'image', 'image_url', 'images', 'description',
            'status', 'status_display', 'registered_by_name', 'created_at',
        ]
        read_only_fields = ['status', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        first = obj.images.first()
        return first.image.url if first else None

    def get_images(self, obj):
        result = []
        if obj.image:
            result.append(obj.image.url)
        for img in obj.images.all():
            result.append(img.image.url)
        return result


class ItemDetailSerializer(ItemSerializer):
    inquiries = InquirySerializer(many=True, read_only=True)
    returned_to_id = serializers.PrimaryKeyRelatedField(source='returned_to', read_only=True)
    returned_to_username = serializers.SerializerMethodField()
    returned_to_contact = serializers.SerializerMethodField()

    class Meta(ItemSerializer.Meta):
        fields = ItemSerializer.Meta.fields + [
            'inquiries', 'returned_to_id', 'returned_to_username', 'returned_to_contact',
        ]

    def get_returned_to_username(self, obj):
        return obj.returned_to.user.username if obj.returned_to else None

    def get_returned_to_contact(self, obj):
        return obj.returned_to.contact if obj.returned_to else None
