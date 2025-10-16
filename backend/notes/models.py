from django.db import models

from django.conf import settings

from uuid import uuid4

class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    #! If owner_id on_delete is different than SET_NULL than change the null=False
    title = models.CharField(max_length=255)
    body = models.BinaryField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='note') # Maybe change this to make it set to the last user that has permissions to this note???
    is_encrypted = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True) # Track modifications
    # version = models.IntegerField(default=1) # Track version for conflict resolution

    def __str__(self) -> str:
        return self.title

    class Meta:
        ordering = ['title']

class NoteItem(models.Model):
    READ_PERMISSION = 'R'
    WRITE_PERMISSION = 'W'
    SHARE_PERMISSION = 'S'
    OWNER_PERMISSION = 'O'
    PERMISSIONS_CHOICES = [
        (READ_PERMISSION, 'Read'),
        (WRITE_PERMISSION, 'Write'),
        (SHARE_PERMISSION, 'Share'),
        (OWNER_PERMISSION, 'Owner')
    ]
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='noteitem')
    user_key = models.ForeignKey(settings.AUTH_USER_KEY_MODEL, on_delete=models.CASCADE, related_name='noteitem')
    encryption_key = models.BinaryField(null=True, blank=True, db_column='encrypted_symmetric_key')
    permission = models.CharField(max_length=1, choices=PERMISSIONS_CHOICES, default=READ_PERMISSION, blank=False)

    class Meta:
        unique_together = ("note", "user_key")
        ordering = ['permission']
