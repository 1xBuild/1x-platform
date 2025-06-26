from typing import Optional
import requests, os

import requests

CRYPTOPANIC_API_URL = "https://cryptopanic.com/api/developer/v2/posts/"
CRYPTOPANIC_AUTH_TOKEN = os.getenv("CRYPTOPANIC_AUTH_TOKEN")

def CryptoPanicTool(
    currencies: Optional[str] = None,
    regions: Optional[str] = None,
    filter: Optional[str] = None,
    kind: Optional[str] = None,
    public: Optional[bool] = False
):
    """
    Get the latest crypto news from cryptopanic.com using the CryptoPanic API.
    Args:
        currencies (Optional[str]): Comma-separated list of currency codes to filter news by (e.g., 'BTC,ETH').
        regions (Optional[str]): Region code to filter news by (e.g., 'en', 'fr', 'es'). Default is 'en'.
        filter (Optional[str]): Filter news by type (e.g., 'rising', 'hot', 'bullish', 'bearish', 'important', 'saved', 'lol').
        kind (Optional[str]): Type of news to retrieve: 'news' or 'media'. Default is 'news'.
        public (Optional[bool]): Set to true for public usage mode (non-user-specific news).
    Returns:
        dict: The JSON response from the CryptoPanic API.
    """
    params = {
        "auth_token": CRYPTOPANIC_AUTH_TOKEN
    }
    if currencies:
        params["currencies"] = currencies
    if regions:
        params["regions"] = regions
    if filter:
        params["filter"] = filter
    if kind:
        params["kind"] = kind
    if public:
        params["public"] = "true"
    response = requests.get(CRYPTOPANIC_API_URL, params=params)
    response.raise_for_status()
    return response.json()


