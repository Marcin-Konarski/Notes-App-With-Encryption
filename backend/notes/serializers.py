from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework import serializers

from .models import Note, NoteItem



class NoteItemSerializer(serializers.ModelSerializer):
    encryption_key = serializers.CharField(write_only=True)
    class Meta:
        model = NoteItem
        fields = ['id', 'note', 'user_key', 'encryption_key', 'permission']


class BaseNoteSerializer(serializers.ModelSerializer):
    body = serializers.CharField(required=True, allow_blank=True)

    def validate_body(self, value):
        # if not value:
            # raise serializers.ValidationError("Body is required.")
        return value.encode(settings.DEFAULT_ENCODING)

    def to_representation(self, instance):
        data = super().to_representation(instance) # Get data
        if instance.body:
            body_bytes = bytes(instance.body) # convert body from the request to binary (cuz postgres returns memoryview object which doesn't have decode method)
            decoded_body = body_bytes.decode(settings.DEFAULT_ENCODING) # now decode the body to in order to print readable result in the JSON response
            data['body'] = decoded_body if decoded_body else ''
        else:
            data['body'] = ''

        return data


class NotesSerializer(BaseNoteSerializer):
    noteitem = NoteItemSerializer(many=True, required=False)
    encryption_key = serializers.CharField(write_only=True, required=False)
    body = serializers.CharField(required=True, allow_blank=True)

    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'owner', 'is_encrypted', 'created_at', 'encryption_key', 'noteitem']
        read_only_fields = ['owner', 'noteitem']

    def create(self, validated_data):
        request = self.context.get('request', None)
        is_encrypted = validated_data.get('is_encrypted', False)
        encryption_key = validated_data.pop('encryption_key', None)

        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser): # If request doesn't have attribute user or user if the instance of AnonymousUser
            raise serializers.ValidationError({'detail': 'No User matches the given query.'})

        # If request and hasattr(request, 'user'): 
        validated_data['owner'] = request.user # Get currently logged in user and save it as a note owner
        note = Note.objects.create(**validated_data) # create Note object

        get_user_key = self.context.get('get_user_key') # This is a function created in a NotesViewSet to verify if the user has associated UserKey object - as user without public_key cannot encrypt/decrypt the note thus UserKey record for a user is required
        if get_user_key:
            user_key = get_user_key([request.user.id])
            if not user_key:
                raise serializers.ValidationError({'non_field_errors': ['Public key is required for encrypted notes.']})

        # If note is not encrypted than don't create encryption key for this NoteItem as it's not necessary
        if request and is_encrypted == False:
            NoteItem.objects.create(
                note=note,
                user_key=user_key,
                permission='O'
            )
            return note

        # If the reuqest has is_encrypted=True but encryption_key is not provided return a response
        if not encryption_key:
            raise serializers.ValidationError({'detail': ['\'encryption_key\' field is required for encrypted notes']})

        if request and encryption_key: # If encryption_key exists and is_encrypted == True create NoteItem object with encryption key for current user
            NoteItem.objects.create(
                note=note,
                user_key=user_key,
                encryption_key=encryption_key.encode(settings.DEFAULT_ENCODING), # Convert string to bytes for BinaryField
                permission='O'
            )

        return note


class NoteMeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='note.id')
    title = serializers.CharField(source='note.title')
    body = serializers.SerializerMethodField(method_name='get_body')
    owner = serializers.CharField(source='note.owner.username')
    is_encrypted = serializers.BooleanField(source='note.is_encrypted')
    created_at = serializers.DateField(source='note.created_at')
    encryption_key = serializers.SerializerMethodField()

    class Meta:
        model = NoteItem
        fields = ['id', 'title', 'body', 'owner', 'is_encrypted', 'created_at', 'encryption_key', 'permission']

    def get_body(self, obj):
        if obj.note.body:
            body_bytes = bytes(obj.note.body)
            return body_bytes.decode(settings.DEFAULT_ENCODING)
        return ""

    def get_encryption_key(self, obj):
        if obj.encryption_key:
            return bytes(obj.encryption_key).decode(settings.DEFAULT_ENCODING) # Get encryption key if it exists (this field is empty if notes are not encrypted)
        return None


class NotesDetailSerializer(BaseNoteSerializer):
    encryption_key = serializers.CharField(write_only=True, required=False)
    body = serializers.CharField(required=True, allow_blank=True)
    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'is_encrypted', 'created_at', 'encryption_key', 'noteitem']
        read_only_fields = ['id', 'is_encrypted', 'created_at', 'noteitem']


class UserKeyInfoSerializer(serializers.Serializer):
    user_id = serializers.CharField(source='user_key.user.id')
    key = serializers.SerializerMethodField(method_name='get_key')
    permission = serializers.CharField(required=False)

    def __init__(self, instance=None, data=None, **kwargs):
        """This method allows for dynamically defining if 'permission' field should be included in the request/response"""
        include_permissions = kwargs.pop('include_permissions', True) # Here remove this include_permissions before calling super() to avoid errors
        super().__init__(instance=instance, data=data, **kwargs)

        if not include_permissions:
            self.fields.pop('permission', None)

    def get_key(self, obj):
        if key := obj.user_key.public_key: # If user has assiciated user_key record (although always should have one) return readable representation of this key
            return bytes(key).decode(settings.DEFAULT_ENCODING)
        return None


# class ChangeEncryptionSerializer(serializers.Serializer):
#     new_body = serializers.CharField(source='note.body', required=True, allow_blank=False)
#     is_encrypted = serializers.BooleanField(source='note.is_encrypted', required=True)
#     keys = UserKeyInfoSerializer(many=True, required=False, include_permissions=False)
#     class Meta:
#         fields = ['new_body', 'is_encrypted', 'keys']


class ChangeEncryptionSerializer(serializers.Serializer):
    new_body = serializers.CharField(required=True, allow_blank=True)
    is_encrypted = serializers.BooleanField(required=True)
    keys = serializers.ListField(
        child=serializers.DictField(), 
        required=False, 
        allow_empty=True
    )

    def validate_keys(self, value): # Validate that each key has required fields
        if not value:
            return value

        errors = []
        for i, key_data in enumerate(value):
            if 'user_id' not in key_data or not key_data['user_id']:
                errors.append(f"Key {i+1}: 'user_id' field is required")
            if 'key' not in key_data or not key_data['key']:
                errors.append(f"Key {i+1}: 'key' field is required")

        if errors:
            raise serializers.ValidationError(errors)
        return value

    # def validate(self, data):
    #     is_encrypted = data.get('is_encrypted')
    #     keys = data.get('keys', [])

    #     if is_encrypted and not keys:
    #         raise serializers.ValidationError({'keys': 'Encryption keys are required when is_encrypted=true'})

    #     return data


class ShareNoteSerializer(serializers.Serializer):
    permission = serializers.ChoiceField(choices=NoteItem.PERMISSIONS_CHOICES, required=True, allow_blank=False)
    class Meta:
        fields = ['id', 'user', 'permission']


class ShareEncryptedNoteSerializer(serializers.Serializer):
    permission = serializers.ChoiceField(choices=NoteItem.PERMISSIONS_CHOICES, required=True, allow_blank=False)
    encryption_key = serializers.CharField(write_only=True)
    class Meta:
        fields = ['id', 'user', 'encryption_key', 'permission']


class GetPublicKeySerializer(serializers.Serializer):
    id = serializers.CharField()
    keys = UserKeyInfoSerializer(many=True, include_permissions=True)
    class Meta:
        fields = ['id', 'keys']

class RemoveAccessToNote(serializers.Serializer):
    note = serializers.UUIDField(required=True)
    user = serializers.UUIDField(required=True)
    class Meta:
        fields = ['note', 'user']