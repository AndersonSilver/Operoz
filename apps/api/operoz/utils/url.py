# Python imports
import re
from typing import Optional
from urllib.parse import urlparse, urlunparse

# Compiled regex pattern for better performance and ReDoS protection
# Using atomic groups and length limits to prevent excessive backtracking
URL_PATTERN = re.compile(
    r"(?i)"  # Case insensitive
    r"(?:"  # Non-capturing group for alternatives
    r"https?://[^\s]+"  # http:// or https:// followed by non-whitespace
    r"|"
    r"www\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*"  # noqa: E501
    r"|"
    r"(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}"  # noqa: E501
    r"|"
    r"(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)"  # noqa: E501
    r")"
)


MAX_SCAN_LENGTH = 1000


def contains_url(value: str) -> bool:
    """
    Check if the value contains a URL.

    Usado como guarda anti-spam em nome de usuario e de workspace
    (app/serializers/{user,workspace}.py).

    Protegido contra ReDoS pelo padrao pre-compilado — que e linear, sem
    quantificador aninhado — e pelo limite de tamanho da entrada.

    Args:
        value (str): The input string to check for URLs

    Returns:
        bool: True if the string contains a URL, False otherwise
    """
    # Limite de entrada: acima disto nao vale o custo de varrer.
    if len(value) > MAX_SCAN_LENGTH:
        return False

    # Varre a entrada inteira. Truncar linha em 500 caracteres, como era feito
    # antes, criava um bypass: bastava prefixar a URL com lixo suficiente para
    # empurra-la alem do corte e o guarda deixava passar.
    return URL_PATTERN.search(value) is not None


def is_valid_url(url: str) -> bool:
    """
    Validates whether the given string is a well-formed URL.

    Args:
        url (str): The URL string to validate.

    Returns:
        bool: True if the URL is valid, False otherwise.

    Example:
        >>> is_valid_url("https://example.com")
        True
        >>> is_valid_url("not a url")
        False
    """
    try:
        result = urlparse(url)
        # A valid URL should have at least scheme and netloc
        return all([result.scheme, result.netloc])
    except TypeError:
        return False


def get_url_components(url: str) -> Optional[dict]:
    """
    Parses the URL and returns its components if valid.

    Args:
        url (str): The URL string to parse.

    Returns:
        Optional[dict]: A dictionary with URL components if valid, None otherwise.

    Example:
        >>> get_url_components("https://example.com/path?query=1")
        {
        'scheme': 'https', 'netloc': 'example.com',
        'path': '/path', 'params': '',
        'query': 'query=1', 'fragment': ''}
    """
    if not is_valid_url(url):
        return None
    result = urlparse(url)
    return {
        "scheme": result.scheme,
        "netloc": result.netloc,
        "path": result.path,
        "params": result.params,
        "query": result.query,
        "fragment": result.fragment,
    }


def normalize_url_path(url: str) -> str:
    """
    Normalize the path component of a URL by
    replacing multiple consecutive slashes with a single slash.

    This function preserves the protocol, domain,
    query parameters, and fragments of the URL,
    only modifying the path portion to ensure there are no duplicate slashes.

    Args:
        url (str): The input URL string to normalize.

    Returns:
        str: The normalized URL with redundant slashes in the path removed.

    Example:
        >>> normalize_url_path('https://example.com//foo///bar//baz?x=1#frag')
        'https://example.com/foo/bar/baz?x=1#frag'
    """
    parts = urlparse(url)
    # Normalize the path
    normalized_path = re.sub(r"/+", "/", parts.path)
    # Reconstruct the URL
    return urlunparse(parts._replace(path=normalized_path))
