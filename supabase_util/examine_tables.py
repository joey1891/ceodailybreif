import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from your existing .env file
load_dotenv()

class SupabaseExplorer:
    def __init__(self):
        """Initialize Supabase client using existing environment variables."""
        # Use the environment variables that already exist in your .env file
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be in your .env file")

        print(f"Connecting to Supabase at {self.supabase_url}")
        self.supabase = create_client(self.supabase_url, self.supabase_key)

    def get_table_schema(self, table_name: str) -> list[dict[str, any]]:
        """Get table schema information using raw SQL query."""
        try:
            query = f"""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM
                information_schema.columns
            WHERE
                table_schema = 'public'
                AND table_name = '{table_name}';
            """
            response = self.supabase.rpc(
                'pgql',
                {'query': query}
            ).execute()

            if response.error:
                raise Exception(response.error)

            return response.data
        except Exception as e:
            print(f"Error fetching schema from table {table_name}: {e}")
            return []

    def get_table_data(self, table_name: str, limit: int = 6) -> list[dict[str, any]]:
        """Get sample data from a specific table."""
        try:
            response = self.supabase.table(table_name).select('*').limit(limit).execute()

            if hasattr(response, 'data'):
                return response.data
            return []

        except Exception as e:
            print(f"Error fetching data from table {table_name}: {e}")
            return []

if __name__ == "__main__":
    try:
        explorer = SupabaseExplorer()
        tables_to_examine = ["posts", "url_mappings", "admin_users", "related_links", "comments", "page_contents", "page_sections", "calendar_events"]

        for table in tables_to_examine:
            print(f"\n===== Examining table: {table} =====\n")

            # Print schema information
            schema = explorer.get_table_schema(table)
            if schema:
                print("Schema:")
                for column in schema:
                    print(f"  - {column['column_name']}: {column['data_type']} (Nullable: {column['is_nullable']}, Default: {column['column_default']})")
            else:
                print(f"Could not retrieve schema for table {table}")

            data = explorer.get_table_data(table)
            if data:
                print("Sample Data:")
                for row in data:
                    print(row)
            else:
                print(f"No data found in table {table}")

    except Exception as e:
        print(f"Error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure your .env file contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
        print("2. Check if your Supabase URL and anonymous key are correct")
        print("3. Ensure you have the required Python packages installed:")
        print("   pip install python-dotenv supabase")
