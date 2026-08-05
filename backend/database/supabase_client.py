import os
import httpx
import json
from typing import Dict, Any

class SupabaseClient:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            print("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
            
        self.base_url = f"{self.supabase_url}/rest/v1"
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
    def from_table(self, table_name: str):
        return SupabaseTable(self, table_name)

class SupabaseTable:
    def __init__(self, client: SupabaseClient, table_name: str):
        self.client = client
        self.table_url = f"{client.base_url}/{table_name}"
        
    def select(self, columns: str = "*"):
        return SupabaseQuery(self, "GET", columns)
        
    def insert(self, data: Dict[str, Any]):
        return SupabaseQuery(self, "POST", data=data)
        
    def upsert(self, data: Dict[str, Any]):
        q = SupabaseQuery(self, "POST", data=data)
        q.headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        return q
        
    def update(self, data: Dict[str, Any]):
        return SupabaseQuery(self, "PATCH", data=data)
        
    def delete(self):
        return SupabaseQuery(self, "DELETE")

class SupabaseQuery:
    def __init__(self, table: SupabaseTable, method: str, columns: str = "*", data=None):
        self.table = table
        self.method = method
        self.columns = columns
        self.data = data
        self.query_params = {}
        if method == "GET":
            self.query_params["select"] = columns
        self.headers = dict(table.client.headers)
            
    def eq(self, column: str, value: Any):
        self.query_params[column] = f"eq.{value}"
        return self
        
    def is_null(self, column: str):
        self.query_params[column] = "is.null"
        return self
        
    def order(self, column: str, desc: bool = False):
        self.query_params["order"] = f"{column}.{'desc' if desc else 'asc'}"
        return self
        
    def execute(self):
        url = self.table.table_url
        
        if self.method == "GET":
            response = httpx.get(url, headers=self.headers, params=self.query_params)
        elif self.method == "POST":
            response = httpx.post(url, headers=self.headers, params=self.query_params, json=self.data)
        elif self.method == "PATCH":
            response = httpx.patch(url, headers=self.headers, params=self.query_params, json=self.data)
        elif self.method == "DELETE":
            response = httpx.delete(url, headers=self.headers, params=self.query_params)
            
        if response.status_code >= 400:
            raise Exception(f"Supabase request failed: {response.status_code} {response.text}")
            
        return SupabaseResponse(response.json() if response.text else None)

class SupabaseResponse:
    def __init__(self, data):
        self.data = data

# Singleton client instance
_client = None

def get_supabase():
    global _client
    if not _client:
        _client = SupabaseClient()
    return _client
