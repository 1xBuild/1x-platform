import sys
import requests

# Placeholder for Lighthouse SDK import
# import lighthouse

BACKEND_URL = "https://thep33l-staging.up.railway.app/api/storage/"

def open_file(file_id: str, agent_id: str) -> bytes:
    """
    Download and decrypt a file from the storage API.
    Args:
        file_id (str): The storage file ID
        agent_id (str): The agent's ID
    Returns:
        bytes: The file content
    """
    url = f"{BACKEND_URL}{file_id}"
    params = {"agentId": agent_id}
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()
