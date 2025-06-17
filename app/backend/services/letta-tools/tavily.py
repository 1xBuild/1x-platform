from typing import Optional, List, Dict, Any
import requests, os

TAVILY_API_URL = "https://api.tavily.com"
TAVILY_AUTH_TOKEN = os.getenv("TAVILY_API_KEY")


def TavilySearchTool(
    query: str,
    topic: Optional[str] = None,
    search_depth: Optional[str] = "basic",
    chunks_per_source: Optional[int] = 3,
    max_results: Optional[int] = 1,
    time_range: Optional[str] = None,
    days: Optional[int] = 7,
    include_answer: Optional[bool] = True,
    include_raw_content: Optional[bool] = True,
    include_images: Optional[bool] = False,
    include_image_descriptions: Optional[bool] = False,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    country: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a search query using Tavily Search API.
    Args:
        query (str): The search query string.
        topic (Optional[str]): Topic to focus the search on.
        search_depth (Optional[str]): 'basic' or 'advanced'.
        chunks_per_source (Optional[int]): Number of chunks per source.
        max_results (Optional[int]): Maximum number of results.
        time_range (Optional[str]): Time range for results.
        days (Optional[int]): Number of days to look back.
        include_answer (Optional[bool]): Include a short answer.
        include_raw_content (Optional[bool]): Include raw content.
        include_images (Optional[bool]): Include images.
        include_image_descriptions (Optional[bool]): Include image descriptions.
        include_domains (Optional[List[str]]): Domains to include.
        exclude_domains (Optional[List[str]]): Domains to exclude.
        country (Optional[str]): Country code.
    Returns:
        dict: The JSON response from the Tavily Search API.
    """
    url = f"{TAVILY_API_URL}/search"
    headers = {
        "Authorization": f"Bearer {TAVILY_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "query": query,
        "topic": topic,
        "search_depth": search_depth,
        "chunks_per_source": chunks_per_source,
        "max_results": max_results,
        "time_range": time_range,
        "days": days,
        "include_answer": include_answer,
        "include_raw_content": include_raw_content,
        "include_images": include_images,
        "include_image_descriptions": include_image_descriptions,
        "include_domains": include_domains or [],
        "exclude_domains": exclude_domains or [],
        "country": country
    }
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()


def TavilyExtractTool(
    urls: List[str],
    include_images: Optional[bool] = False,
    extract_depth: Optional[str] = "basic",
    format: Optional[str] = "markdown"
) -> Dict[str, Any]:
    """
    Extract web page content from one or more specified URLs using Tavily Extract API.
    Args:
        urls (List[str]): List of URLs to extract content from.
        include_images (Optional[bool]): Include images in extraction.
        extract_depth (Optional[str]): 'basic' or 'advanced'.
        format (Optional[str]): Output format, e.g., 'markdown'.
    Returns:
        dict: The JSON response from the Tavily Extract API.
    """
    url = f"{TAVILY_API_URL}/extract"
    headers = {
        "Authorization": f"Bearer {TAVILY_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "urls": urls,
        "include_images": include_images,
        "extract_depth": extract_depth,
        "format": format
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()


def TavilyCrawlTool(
    url: str,
    max_depth: Optional[int] = 1,
    max_breadth: Optional[int] = 20,
    limit: Optional[int] = 50,
    instructions: Optional[str] = None,
    select_paths: Optional[List[str]] = None,
    select_domains: Optional[List[str]] = None,
    exclude_paths: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    allow_external: Optional[bool] = False,
    include_images: Optional[bool] = False,
    categories: Optional[List[str]] = None,
    extract_depth: Optional[str] = "basic",
    format: Optional[str] = "markdown"
) -> Dict[str, Any]:
    """
    Traverse a site like a graph starting from a base URL using Tavily Crawl API.
    Args:
        url (str): The base URL to start crawling from.
        max_depth (Optional[int]): Maximum depth to crawl.
        max_breadth (Optional[int]): Maximum breadth per level.
        limit (Optional[int]): Maximum number of pages to crawl.
        instructions (Optional[str]): Instructions for crawling.
        select_paths (Optional[List[str]]): Paths to include.
        select_domains (Optional[List[str]]): Domains to include.
        exclude_paths (Optional[List[str]]): Paths to exclude.
        exclude_domains (Optional[List[str]]): Domains to exclude.
        allow_external (Optional[bool]): Allow crawling external domains.
        include_images (Optional[bool]): Include images in crawl.
        categories (Optional[List[str]]): Categories to include.
        extract_depth (Optional[str]): 'basic' or 'advanced'.
        format (Optional[str]): Output format, e.g., 'markdown'.
    Returns:
        dict: The JSON response from the Tavily Crawl API.
    """
    endpoint = f"{TAVILY_API_URL}/crawl"
    headers = {
        "Authorization": f"Bearer {TAVILY_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "url": url,
        "max_depth": max_depth,
        "max_breadth": max_breadth,
        "limit": limit,
        "instructions": instructions,
        "select_paths": select_paths,
        "select_domains": select_domains,
        "exclude_paths": exclude_paths,
        "exclude_domains": exclude_domains,
        "allow_external": allow_external,
        "include_images": include_images,
        "categories": categories,
        "extract_depth": extract_depth,
        "format": format
    }
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    response = requests.post(endpoint, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()


def TavilyMapTool(
    url: str,
    max_depth: Optional[int] = 1,
    max_breadth: Optional[int] = 20,
    limit: Optional[int] = 50,
    instructions: Optional[str] = None,
    select_paths: Optional[List[str]] = None,
    select_domains: Optional[List[str]] = None,
    exclude_paths: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    allow_external: Optional[bool] = False,
    include_images: Optional[bool] = False,
    categories: Optional[List[str]] = None,
    extract_depth: Optional[str] = "basic",
    format: Optional[str] = "markdown"
) -> Dict[str, Any]:
    """
    Map a site like a graph starting from a base URL using Tavily Map API.
    Args:
        url (str): The base URL to start mapping from.
        max_depth (Optional[int]): Maximum depth to map.
        max_breadth (Optional[int]): Maximum breadth per level.
        limit (Optional[int]): Maximum number of pages to map.
        instructions (Optional[str]): Instructions for mapping.
        select_paths (Optional[List[str]]): Paths to include.
        select_domains (Optional[List[str]]): Domains to include.
        exclude_paths (Optional[List[str]]): Paths to exclude.
        exclude_domains (Optional[List[str]]): Domains to exclude.
        allow_external (Optional[bool]): Allow mapping external domains.
        include_images (Optional[bool]): Include images in map.
        categories (Optional[List[str]]): Categories to include.
        extract_depth (Optional[str]): 'basic' or 'advanced'.
        format (Optional[str]): Output format, e.g., 'markdown'.
    Returns:
        dict: The JSON response from the Tavily Map API.
    """
    endpoint = f"{TAVILY_API_URL}/map"
    headers = {
        "Authorization": f"Bearer {TAVILY_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "url": url,
        "max_depth": max_depth,
        "max_breadth": max_breadth,
        "limit": limit,
        "instructions": instructions,
        "select_paths": select_paths,
        "select_domains": select_domains,
        "exclude_paths": exclude_paths,
        "exclude_domains": exclude_domains,
        "allow_external": allow_external,
        "include_images": include_images,
        "categories": categories,
        "extract_depth": extract_depth,
        "format": format
    }
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    response = requests.post(endpoint, headers=headers, json=payload)
    response.raise_for_status()
    return response.json() 