import os
from email.message import EmailMessage
import smtplib
import ssl
import structlog

logger = structlog.get_logger()

def send_welcome_email(to_email: str, username: str):
    host = os.getenv('SMTP_HOST')
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER')
    password = os.getenv('SMTP_PASS')
    sender = os.getenv('SMTP_FROM', user or 'no-reply@example.com')
    if not host or not user or not password:
        logger.warning('Email not configured; skipping welcome email')
        return
    msg = EmailMessage()
    msg['Subject'] = 'Welcome to 3OMLA'
    msg['From'] = sender
    msg['To'] = to_email
    msg.set_content(f"Hi {username or to_email},\n\nWelcome to 3OMLA Intelligence Hub!\n\nHappy trading,\nTeam 3OMLA")
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(msg)
        logger.info('Welcome email sent', to=to_email)
    except Exception as e:
        logger.error('Failed to send welcome email', error=str(e))


def send_verification_email(to_email: str, username: str, verify_link: str):
    host = os.getenv('SMTP_HOST')
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER')
    password = os.getenv('SMTP_PASS')
    sender = os.getenv('SMTP_FROM', user or 'no-reply@example.com')
    if not host or not user or not password:
        logger.warning('Email not configured; skipping verification email', to=to_email)
        return
    msg = EmailMessage()
    msg['Subject'] = 'Verify your email'
    msg['From'] = sender
    msg['To'] = to_email
    msg.set_content(f"Hi {username or to_email},\n\nPlease verify your email by clicking:\n{verify_link}\n\nIf you did not create an account, ignore this email.\n")
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(msg)
        logger.info('Verification email sent', to=to_email)
    except Exception as e:
        logger.error('Failed to send verification email', error=str(e))
