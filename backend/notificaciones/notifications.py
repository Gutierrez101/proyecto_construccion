from firebase_admin import messaging

from .firebase_service import get_firebase_app


def send_notification(
    fid,
    title,
    body,
    url="/",
    tag="queueless"
):

    app = get_firebase_app()

    message = messaging.Message(

        # Identificador Firebase Installation ID.
        fid=fid,

        # Información personalizada.
        data={
            "title": str(title),
            "body": str(body),
            "url": str(url),
            "tag": str(tag)
        }
    )

    response = messaging.send(
        message,
        app=app
    )

    return response