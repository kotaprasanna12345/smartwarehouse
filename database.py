import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    """Returns a SQLite connection configured to return rows as dictionaries."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db(force_recreate=False):
    """Initializes the database schema."""
    if force_recreate and os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception as e:
            print(f"Warning removing database: {e}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            reserved_quantity INTEGER NOT NULL DEFAULT 0,
            reorder_level INTEGER NOT NULL DEFAULT 20,
            warehouse_zone TEXT NOT NULL,
            shelf TEXT NOT NULL,
            bin TEXT NOT NULL,
            status TEXT NOT NULL, -- IN STOCK, LOW STOCK, CRITICAL, OUT OF STOCK
            price REAL NOT NULL DEFAULT 0.0,
            daily_demand REAL NOT NULL DEFAULT 5.0,
            lead_time_days INTEGER NOT NULL DEFAULT 3,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            items TEXT NOT NULL, -- JSON array of items: [{sku, name, quantity, price}]
            total_amount REAL NOT NULL DEFAULT 0.0,
            priority TEXT NOT NULL, -- Normal, High, Urgent
            status TEXT NOT NULL, -- New, Allocated, Picking, Packed, Ready to Ship, Shipped, Delivered, Delayed
            warehouse_zone TEXT NOT NULL,
            picker TEXT,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            estimated_ship_time TEXT,
            priority_score INTEGER DEFAULT 50,
            tracking_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 3. Picking Tasks Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS picking_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            order_number TEXT NOT NULL,
            picker TEXT NOT NULL,
            zone TEXT NOT NULL,
            shelf TEXT,
            bin TEXT,
            items TEXT NOT NULL, -- JSON array of task items
            priority TEXT NOT NULL, -- Normal, High, Urgent
            status TEXT NOT NULL, -- Pending, In Progress, Picked, Completed, Issue Reported
            estimated_time TEXT DEFAULT '8 min',
            items_picked INTEGER DEFAULT 0,
            total_items INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
        )
    ''')

    # 4. Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, -- Critical, Warning, Information, Success
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL, -- critical, warning, info, success
            is_read INTEGER DEFAULT 0,
            action_type TEXT, -- restock, reassign, view_order, resolve
            action_payload TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Warehouse Zones Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS warehouse_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_code TEXT UNIQUE NOT NULL, -- ZONE A, ZONE B, ZONE C, ZONE D, ZONE E, RECEIVING, PACKING, SHIPPING
            zone_name TEXT NOT NULL,
            category_focus TEXT NOT NULL,
            capacity INTEGER NOT NULL DEFAULT 5000,
            occupied INTEGER NOT NULL DEFAULT 3500,
            picker_count INTEGER NOT NULL DEFAULT 2,
            congestion_level INTEGER NOT NULL DEFAULT 25, -- 0-100%
            status TEXT NOT NULL, -- Optimal, Busy, Congested, Bottleneck
            temperature TEXT DEFAULT 'Ambient (21°C)',
            speed_rating REAL DEFAULT 4.8,
            description TEXT
        )
    ''')

    # 6. System State Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Audit Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db(force_recreate=True)
