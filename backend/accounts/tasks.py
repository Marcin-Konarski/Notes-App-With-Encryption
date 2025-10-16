from django.core.mail import BadHeaderError
from templated_mail.mail import BaseEmailMessage
from celery import shared_task

from .account_activation import create_user_account_activation_link


@shared_task
def send_verification_mail(user_id, username, email):
    link = create_user_account_activation_link(user_id) # Create a link with account's email verification link
    try:
        message = BaseEmailMessage(
            template_name='emails/verify_account.html',
            context={
                'logo': 'https://imgur.com/a/mqL4JFo',
                'username': username,
                'link': link
            }
        )
        message.send([email]) # Requires a list of recipiants  
    except BadHeaderError as e:
        print(e)
