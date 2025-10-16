from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.mail import send_mail
from django.utils import timezone
from django.db import models

from uuid import uuid4

class BaseUser(AbstractBaseUser, PermissionsMixin):
    """
    An abstract base class implementing a fully featured User model with
    admin-compliant permissions. This is mostly copy paste from Django's
    implementation of AbstractUser just with only the fields the app will
    actually need. Thus no first_name, last_name fields that would clutter database

    Username, email and password are required. Other fields are optional.
    """

    username_validator = UnicodeUsernameValidator()

    email = models.EmailField(unique=True)
    username = models.CharField(
        max_length=150,
        unique=True,
        # help_text=("Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."),
        validators=[username_validator],
        error_messages={"unique": "A user with that username already exists."},
    )
    is_staff = models.BooleanField(
        ("staff status"),
        default=False,
        help_text=("Designates whether the user can log into this admin site."),
    )
    is_active = models.BooleanField(
        ("active"),
        default=True,
        help_text=(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )
    date_joined = models.DateTimeField(("date joined"), default=timezone.now)

    objects = UserManager()

    EMAIL_FIELD = "email"
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = ("user")
        verbose_name_plural = ("users")
        abstract = True

    def clean(self):
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email)

    def get_full_name(self):
        """This method is kept for the compatibility with other django functionalities."""
        return self.username.strip()

    def get_short_name(self):
        """Return the username for the user."""
        return self.username

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        send_mail(subject, message, from_email, [self.email], **kwargs)


class User(BaseUser):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    is_verified = models.BooleanField(default=False) # Whether user has confirmed their email via email verification link

    def __str__(self) -> str:
        return self.username

    class Meta(BaseUser.Meta):
        swappable = "AUTH_USER_MODEL"
        ordering = ['username']


class UserKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='keys') # If the referenced User is deleted associated AuthenticationKey record is deleted as well
    public_key = models.BinaryField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if not self.public_key:
            raise ValidationError({'public_key': 'Public key is required and cannot be empty.'})

    class Meta:
        swappable = "AUTH_USER_KEY_MODEL"
