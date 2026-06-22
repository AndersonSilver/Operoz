from __future__ import annotations

import time

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

MAX_SIGNATURE_AGE_SECONDS = 300


def verify_discord_signature(
    *,
    public_key_hex: str,
    signature_hex: str,
    timestamp: str,
    body: bytes,
    max_age_seconds: int = MAX_SIGNATURE_AGE_SECONDS,
) -> bool:
    """Valida X-Signature-Ed25519 conforme documentação do Discord."""
    if not public_key_hex or not signature_hex or not timestamp:
        return False

    try:
        ts = int(timestamp)
    except (TypeError, ValueError):
        return False

    if abs(time.time() - ts) > max_age_seconds:
        return False

    try:
        public_key = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        message = timestamp.encode("utf-8") + body
        public_key.verify(bytes.fromhex(signature_hex), message)
        return True
    except (ValueError, InvalidSignature):
        return False
