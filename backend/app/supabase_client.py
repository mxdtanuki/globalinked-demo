import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "agreements")

if SUPABASE_URL is None or SUPABASE_KEY is None:
	raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

