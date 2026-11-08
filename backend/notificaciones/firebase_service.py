import firebase_admin

from pathlib import Path

from firebase_admin import credentials
from django.conf import settings


def get_firebase_app():

    try:
        return firebase_admin.get_app("queueless")

    except ValueError:

        service_account_path = Path(
            settings.FIREBASE_SERVICE_ACCOUNT_FILE
        )

        if not service_account_path.is_file():
            raise FileNotFoundError(
                f"No se encontró el archivo Firebase: "
                f"{service_account_path}"
            )

        credentials_file = credentials.Certificate(
            str(service_account_path)
        )

        app = firebase_admin.initialize_app(
            credentials_file,
            options={
                "projectId": settings.FIREBASE_PROJECT_ID
            },
            name="queueless"
        )

        return app