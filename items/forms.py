from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Item, Inquiry

CTRL = "form-control"
SEL = "form-select"


class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ["post_type", "title", "category", "location", "found_date", "description"]
        widgets = {
            "post_type": forms.HiddenInput(),
            "title": forms.TextInput(attrs={"class": CTRL}),
            "category": forms.Select(attrs={"class": SEL}),
            "location": forms.TextInput(attrs={"class": CTRL}),
            "found_date": forms.DateInput(attrs={"type": "date", "class": CTRL}),
            "description": forms.Textarea(attrs={"rows": 4, "class": CTRL}),
        }


class SignupForm(UserCreationForm):
    email = forms.EmailField(
        label="학교 이메일",
        help_text="@dankook.ac.kr 이메일만 사용 가능합니다.",
        widget=forms.EmailInput(attrs={"class": CTRL, "placeholder": "20240001@dankook.ac.kr"}),
    )

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]
        widgets = {
            "username": forms.TextInput(attrs={
                "class": CTRL,
                "placeholder": "한글, 영문, 숫자 사용 가능",
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].label = "아이디"
        self.fields["username"].help_text = "한글, 영문, 숫자를 사용할 수 있습니다. (150자 이하)"
        self.fields["password1"].widget.attrs["class"] = CTRL
        self.fields["password2"].widget.attrs["class"] = CTRL

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if not email.endswith("@dankook.ac.kr"):
            raise forms.ValidationError("단국대학교 이메일(@dankook.ac.kr)만 가입할 수 있습니다.")
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("이미 사용 중인 이메일입니다.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user



class InquiryForm(forms.ModelForm):
    class Meta:
        model = Inquiry
        fields = ["message"]
        labels = {"message": "문의 내용"}
        widgets = {
            "message": forms.Textarea(attrs={
                "rows": 3,
                "class": CTRL,
                "placeholder": "내 물건인 것 같은 이유나 특징을 적어주세요. 등록자와 채팅으로 소통할 수 있습니다.",
            }),
        }
