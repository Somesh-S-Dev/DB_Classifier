import pyodbc
import json

# -------------------------------------------------
# CONFIGURATION
# -------------------------------------------------

DB_CONFIG = {
    "server": "DESKTOP-JR168IH\WINSSOFTSQL2022",          # or IP / hostname
    "database": "WSHTERPSDB2324",
    "username": "winssofterp",
    "password": "WsUser!@#37",
    "driver": "ODBC Driver 17 for SQL Server"
}

SCHEMA = "dbo"
OUTPUT_FILE = "db_tables_enhanced.json"

# -------------------------------------------------
# CONNECTION
# -------------------------------------------------

def get_connection():
    conn_str = (
        f"DRIVER={{{DB_CONFIG['driver']}}};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"UID={DB_CONFIG['username']};"
        f"PWD={DB_CONFIG['password']};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)


# -------------------------------------------------
# METADATA FETCHERS
# -------------------------------------------------

def fetch_tables(cursor):
    cursor.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """, SCHEMA)

    return [row.TABLE_NAME for row in cursor.fetchall()]


def fetch_columns(cursor, table_name):
    cursor.execute("""
        SELECT
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """, SCHEMA, table_name)

    return [
        {
            "name": row.COLUMN_NAME,
            "type": row.DATA_TYPE,
            "nullable": row.IS_NULLABLE == "YES"
        }
        for row in cursor.fetchall()
    ]


def fetch_primary_keys(cursor, table_name):
    cursor.execute("""
        SELECT kcu.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
         AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND tc.TABLE_SCHEMA = ?
          AND tc.TABLE_NAME = ?
        ORDER BY kcu.ORDINAL_POSITION
    """, SCHEMA, table_name)

    return [row.COLUMN_NAME for row in cursor.fetchall()]


def fetch_foreign_keys(cursor, table_name):
    cursor.execute("""
        SELECT
            kcu.COLUMN_NAME AS column_name,
            ccu.TABLE_NAME AS referenced_table,
            ccu.COLUMN_NAME AS referenced_column
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
          ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
          AND tc.TABLE_SCHEMA = ?
          AND tc.TABLE_NAME = ?
    """, SCHEMA, table_name)

    return [
        {
            "column": row.column_name,
            "references": {
                "table": row.referenced_table,
                "column": row.referenced_column
            }
        }
        for row in cursor.fetchall()
    ]


# -------------------------------------------------
# MAIN
# -------------------------------------------------

def main():
    conn = get_connection()
    cursor = conn.cursor()

    tables_metadata = []

    tables = fetch_tables(cursor)

    for table in tables:
        print("Completed extraction for table: ", table)
        tables_metadata.append({
            "table_name": table,
            "columns": fetch_columns(cursor, table),
            "primary_keys": fetch_primary_keys(cursor, table),
            "foreign_keys": fetch_foreign_keys(cursor, table)
        })

    cursor.close()
    conn.close()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"tables": tables_metadata}, f, indent=2)

    print(f"✅ Database metadata extracted successfully → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
