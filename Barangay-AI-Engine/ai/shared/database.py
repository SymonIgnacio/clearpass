"""
Database connectivity utilities for Barangay AI Engine
Supports both SQLite (for demos) and MySQL (for production)
"""

import sqlite3
import json
import os
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

class DatabaseManager:
    """
    Unified database manager supporting SQLite and MySQL
    """

    def __init__(self, db_type: str = "sqlite", config: Optional[Dict] = None):
        """
        Initialize database connection

        Args:
            db_type: 'sqlite' or 'mysql'
            config: Database configuration dictionary
        """
        self.db_type = db_type.lower()
        self.config = config or self._get_default_config()
        self.connection = None

    def _get_default_config(self) -> Dict:
        """Get default database configuration"""
        if self.db_type == "sqlite":
            return {
                "database": "barangay_ai.db"
            }
        else:  # mysql
            return {
                "host": "localhost",
                "user": "root",
                "password": "",
                "database": "barangay_management"
            }

    def connect(self):
        """Establish database connection"""
        try:
            if self.db_type == "sqlite":
                self.connection = sqlite3.connect(self.config["database"])
                self.connection.row_factory = sqlite3.Row  # Enable column access by name
                print("✅ Connected to SQLite database")
            else:
                # Import MySQL connector only when needed
                import pymysql
                self.connection = pymysql.connect(**self.config)
                print("✅ Connected to MySQL database")

        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("🔌 Database connection closed")

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """
        Execute SELECT query and return results

        Args:
            query: SQL query string
            params: Query parameters (optional)

        Returns:
            List of dictionaries representing rows
        """
        if not self.connection:
            self.connect()

        try:
            cursor = self.connection.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            # Get column names
            if self.db_type == "sqlite":
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
            else:
                columns = [desc[0] for desc in cursor.description()] if cursor.description() else []

            # Convert rows to dictionaries
            results = []
            for row in cursor.fetchall():
                if self.db_type == "sqlite":
                    results.append(dict(zip(columns, row)))
                else:
                    results.append(dict(row))

            cursor.close()
            return results

        except Exception as e:
            print(f"❌ Query execution failed: {e}")
            raise

    def execute_update(self, query: str, params: Optional[tuple] = None) -> int:
        """
        Execute INSERT, UPDATE, or DELETE query

        Args:
            query: SQL query string
            params: Query parameters (optional)

        Returns:
            Number of affected rows
        """
        if not self.connection:
            self.connect()

        try:
            cursor = self.connection.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            self.connection.commit()
            affected_rows = cursor.rowcount
            cursor.close()

            return affected_rows

        except Exception as e:
            self.connection.rollback()
            print(f"❌ Update execution failed: {e}")
            raise

    def load_json_data(self, file_path: str) -> Dict:
        """
        Load data from JSON file

        Args:
            file_path: Path to JSON file

        Returns:
            Parsed JSON data
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Failed to load JSON file {file_path}: {e}")
            return {}

    def save_json_data(self, file_path: str, data: Dict):
        """
        Save data to JSON file

        Args:
            file_path: Path to save JSON file
            data: Data to save
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"✅ Data saved to {file_path}")
        except Exception as e:
            print(f"❌ Failed to save JSON file {file_path}: {e}")

    def create_tables_if_not_exist(self):
        """Create necessary tables if they don't exist"""
        if self.db_type == "sqlite":
            self._create_sqlite_tables()
        else:
            self._create_mysql_tables()

    def _create_sqlite_tables(self):
        """Create tables for SQLite database"""

        # FAQ table
        faq_table = """
        CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            keywords TEXT,  -- JSON array
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """

        # Blotter cache table
        blotter_table = """
        CREATE TABLE IF NOT EXISTS blotter_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT UNIQUE,
            date_filed DATE,
            incident_type TEXT,
            location TEXT,
            sitio_id INTEGER,
            status TEXT,
            severity TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """

        # OCR results cache
        ocr_table = """
        CREATE TABLE IF NOT EXISTS ocr_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_hash TEXT UNIQUE,
            extracted_text TEXT,
            extracted_fields TEXT,  -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """

        for table_query in [faq_table, blotter_table, ocr_table]:
            self.execute_update(table_query)

    def _create_mysql_tables(self):
        """Create tables for MySQL database"""
        # Similar to SQLite but with MySQL syntax
        # Implementation would depend on actual MySQL schema
        pass


class JSONDatabase:
    """
    Simple JSON file-based database for demos and testing
    """

    def __init__(self, data_dir: str = "data"):
        """
        Initialize JSON database

        Args:
            data_dir: Directory to store JSON files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)

    def load_collection(self, collection_name: str) -> List[Dict]:
        """
        Load a collection from JSON file

        Args:
            collection_name: Name of the collection (filename without .json)

        Returns:
            List of items in the collection
        """
        file_path = self.data_dir / f"{collection_name}.json"

        if not file_path.exists():
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get(collection_name, [])
        except Exception as e:
            print(f"❌ Failed to load collection {collection_name}: {e}")
            return []

    def save_collection(self, collection_name: str, items: List[Dict]):
        """
        Save a collection to JSON file

        Args:
            collection_name: Name of the collection
            items: List of items to save
        """
        file_path = self.data_dir / f"{collection_name}.json"
        file_path.parent.mkdir(exist_ok=True)

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump({collection_name: items}, f, indent=2, ensure_ascii=False)
            print(f"✅ Collection {collection_name} saved")
        except Exception as e:
            print(f"❌ Failed to save collection {collection_name}: {e}")

    def find_by_keywords(self, collection_name: str, keywords: List[str]) -> List[Dict]:
        """
        Find items in collection that match keywords

        Args:
            collection_name: Collection to search
            keywords: List of keywords to match

        Returns:
            Matching items
        """
        items = self.load_collection(collection_name)
        matches = []

        for item in items:
            item_keywords = item.get('keywords', [])
            if any(keyword.lower() in ' '.join(item_keywords).lower() for keyword in keywords):
                matches.append(item)

        return matches


# Global instances for easy access
db_manager = DatabaseManager()
json_db = JSONDatabase()
