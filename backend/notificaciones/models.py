from django.db import models


class PushSubscription(models.Model):

    visitor_session = models.ForeignKey(
        "turnos.VisitorSession",
        on_delete=models.CASCADE,
        related_name="push_subscriptions"
    )

    fid = models.CharField(
        max_length=255,
        unique=True
    )

    active = models.BooleanField(
        default=True
    )

    last_seen_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Suscripción {self.id}"