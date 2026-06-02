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
    display_name = forms.CharField(
        label="아이디",
        max_length=100,
        help_text="게시물에 표시되는 이름입니다. 한글, 영문, 숫자, 공백 모두 사용 가능",
        widget=forms.TextInput(attrs={
            "class": CTRL,
            "placeholder": "예: AI융합대학 소울 학생회",
        }),
    )
    email = forms.EmailField(
        label="학교 이메일",
        help_text="로그인에 사용됩니다. @dankook.ac.kr 이메일만 가능합니다.",
        widget=forms.EmailInput(attrs={"class": CTRL, "placeholder": "example@dankook.ac.kr"}),
    )

    class Meta:
        model = User
        fields = ["display_name", "email", "password1", "password2"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["password1"].widget.attrs["class"] = CTRL
        self.fields["password2"].widget.attrs["class"] = CTRL

    def clean_display_name(self):
        name = self.cleaned_data.get("display_name", "").strip()
        if not name:
            raise forms.ValidationError("아이디를 입력해주세요.")
        if User.objects.filter(first_name=name).exists():
            raise forms.ValidationError("이미 사용 중인 아이디입니다.")
        return name

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
        user.first_name = self.cleaned_data["display_name"]
        # username은 이메일 앞부분으로 자동 생성 (중복 시 숫자 추가)
        base = self.cleaned_data["email"].split("@")[0]
        username = base
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{n}"
            n += 1
        user.username = username
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
