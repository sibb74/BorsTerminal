import logging
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger("borsapi_client")

class BorsApiClient:
    """
    HTTP Client for communicating with the BörsAPI REST API (https://borsapi.se/api/v1).
    Handles authentication via Bearer token and provides clean data structures.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = settings.BORSAPI_BASE_URL.rstrip("/")
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "BorsTerminal-Desktop/1.0.0",
        }
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"

    async def get_companies(self, search: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch list of companies from BörsAPI."""
        if not self.api_key:
            logger.info("No BörsAPI key provided. Using local cache.")
            return []

        url = f"{self.base_url}/companies"
        params = {"limit": limit}
        if search:
            params["search"] = search

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()
                return data.get("companies", data if isinstance(data, list) else [])
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch companies from BörsAPI: {e}")
                raise e

    async def get_financial_reports(self, company_id_or_ticker: str) -> List[Dict[str, Any]]:
        """Fetch financial reports (income statement, balance sheet, cash flow) for a company."""
        if not self.api_key:
            logger.info("No BörsAPI key provided. Operating in Demo/Cache mode.")
            return []

        url = f"{self.base_url}/companies/{company_id_or_ticker}/reports"

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                return data.get("reports", data if isinstance(data, list) else [])
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch reports for {company_id_or_ticker}: {e}")
                raise e
