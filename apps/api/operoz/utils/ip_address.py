# Python imports
import ipaddress
import os
import socket
from urllib.parse import urlparse


# Short DNS resolution timeout reduces the window for DNS rebinding attacks.
_DNS_TIMEOUT_SECONDS = float(os.environ.get("DNS_VALIDATION_TIMEOUT", "3"))


def validate_url(url, allowed_ips=None):
    """
    Validate that a URL doesn't resolve to a private/internal IP address (SSRF protection).

    Args:
        url: The URL to validate.
        allowed_ips: Optional list of ipaddress.ip_network objects. IPs falling within
                     these networks are permitted even if they are private/loopback/reserved.
                     Typically sourced from the WEBHOOK_ALLOWED_IPS setting.

    Raises:
        ValueError: If the URL is invalid or resolves to a blocked IP.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        raise ValueError("Invalid URL: No hostname found")

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are allowed")

    try:
        # Low timeout shrinks the DNS rebinding window; attacker-controlled DNS
        # would need to flip the record between getaddrinfo and the TCP connect.
        old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(_DNS_TIMEOUT_SECONDS)
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        finally:
            socket.setdefaulttimeout(old_timeout)
    except socket.timeout:
        raise ValueError("Hostname DNS resolution timed out")
    except socket.gaierror:
        raise ValueError("Hostname could not be resolved")

    if not addr_info:
        raise ValueError("No IP addresses found for the hostname")

    for addr in addr_info:
        ip = ipaddress.ip_address(addr[4][0])
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            if allowed_ips and any(
                network.version == ip.version and ip in network for network in allowed_ips
            ):
                continue
            raise ValueError("Access to private/internal networks is not allowed")


# Comma-separated list of trusted reverse-proxy IPs whose X-Forwarded-For header we trust.
# When empty (default), X-Forwarded-For is ignored and REMOTE_ADDR is used directly.
_TRUSTED_PROXY_IPS: frozenset[str] = frozenset(
    ip.strip() for ip in os.environ.get("TRUSTED_PROXY_IPS", "").split(",") if ip.strip()
)


def get_client_ip(request) -> str:
    remote_addr: str = request.META.get("REMOTE_ADDR", "")
    if _TRUSTED_PROXY_IPS and remote_addr in _TRUSTED_PROXY_IPS:
        xff: str = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if xff:
            # Use the last entry — added by the trusted proxy, not forged by the client
            return xff.split(",")[-1].strip()
    return remote_addr
