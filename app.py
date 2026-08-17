import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from database import get_db_connection, init_db
import engine
from seed_data import seed_database

app = Flask(__name__)
app.secret_key = "smartstock-ai-hackathon-secret-key-2026"
CORS(app)

# Ensure DB exists on startup
if not os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')):
    seed_database()

# ---------------------------------------------------------
# PAGE ROUTES
# ---------------------------------------------------------

@app.route('/')
@app.route('/dashboard')
def page_dashboard():
    return render_template('index.html', active_page='dashboard')

@app.route('/inventory')
def page_inventory():
    return render_template('inventory.html', active_page='inventory')

@app.route('/orders')
def page_orders():
    return render_template('orders.html', active_page='orders')

@app.route('/fulfillment')
def page_fulfillment():
    return render_template('fulfillment.html', active_page='fulfillment')

@app.route('/warehouse')
def page_warehouse():
    return render_template('warehouse.html', active_page='warehouse')

@app.route('/analytics')
def page_analytics():
    return render_template('analytics.html', active_page='analytics')

@app.route('/alerts')
def page_alerts():
    return render_template('alerts.html', active_page='alerts')

@app.route('/ai-insights')
def page_ai_insights():
    return render_template('ai-insights.html', active_page='ai-insights')

@app.route('/settings')
def page_settings():
    return render_template('settings.html', active_page='settings')

@app.route('/login')
def page_login():
    return render_template('login.html', active_page='login')

# ---------------------------------------------------------
# REST API ENDPOINTS
# ---------------------------------------------------------

@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    """Returns complete aggregated metrics, health scores, charts data, and live alerts for Command Center."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Health & KPIs
    health = engine.calculate_warehouse_health()
    bottleneck = engine.detect_warehouse_bottlenecks()

    # 1. 7-Day Order Fulfillment Trend Data
    fulfillment_trend = {
        'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
        'orders_received': [110, 135, 125, 142, 160, 95, 128],
        'orders_fulfilled': [108, 130, 122, 138, 154, 94, 124],
        'sla_target': [105, 120, 120, 130, 145, 90, 120]
    }

    # 2. Inventory Distribution Chart Data
    cursor.execute("""
        SELECT
            SUM(CASE WHEN status = 'IN STOCK' THEN 1 ELSE 0 END) as healthy,
            SUM(CASE WHEN status = 'LOW STOCK' THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN status = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN status = 'OUT OF STOCK' THEN 1 ELSE 0 END) as out_of_stock
        FROM products
    """)
    inv_dist_row = cursor.fetchone()
    inventory_distribution = {
        'labels': ['Healthy Stock', 'Low Stock', 'Critical', 'Out of Stock'],
        'data': [
            inv_dist_row['healthy'] or 0,
            inv_dist_row['low_stock'] or 0,
            inv_dist_row['critical'] or 0,
            inv_dist_row['out_of_stock'] or 0
        ],
        'colors': ['#10B981', '#F59E0B', '#EF4444', '#64748B']
    }

    # 3. Warehouse Zone Performance Data
    cursor.execute("""
        SELECT zone_code, zone_name, occupied, capacity, picker_count, congestion_level, speed_rating
        FROM warehouse_zones
        WHERE zone_code LIKE 'ZONE%'
        ORDER BY zone_code ASC
    """)
    zones_list = [dict(z) for z in cursor.fetchall()]
    zone_performance = {
        'labels': [z['zone_code'] for z in zones_list],
        'occupancy': [int((z['occupied'] / z['capacity']) * 100) for z in zones_list],
        'congestion': [z['congestion_level'] for z in zones_list],
        'pickers': [z['picker_count'] for z in zones_list]
    }

    # 4. Order Pipeline Stage Counts
    cursor.execute("""
        SELECT
            SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as new_count,
            SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END) as allocated_count,
            SUM(CASE WHEN status = 'Picking' THEN 1 ELSE 0 END) as picking_count,
            SUM(CASE WHEN status = 'Packed' THEN 1 ELSE 0 END) as packed_count,
            SUM(CASE WHEN status = 'Ready to Ship' THEN 1 ELSE 0 END) as ready_count,
            SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped_count,
            SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_count,
            SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as delayed_count
        FROM orders
    """)
    pipe_row = cursor.fetchone()
    pipeline = {
        'new': pipe_row['new_count'] or 0,
        'allocated': pipe_row['allocated_count'] or 0,
        'picking': pipe_row['picking_count'] or 0,
        'packed': pipe_row['packed_count'] or 0,
        'ready_to_ship': pipe_row['ready_count'] or 0,
        'shipped': pipe_row['shipped_count'] or 0,
        'delivered': pipe_row['delivered_count'] or 0,
        'delayed': pipe_row['delayed_count'] or 0
    }

    # 5. Recent Alerts
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 5")
    recent_alerts = [dict(a) for a in cursor.fetchall()]

    conn.close()

    return jsonify({
        'success': True,
        'health': health,
        'bottleneck': bottleneck,
        'charts': {
            'fulfillment_trend': fulfillment_trend,
            'inventory_distribution': inventory_distribution,
            'zone_performance': zone_performance
        },
        'pipeline': pipeline,
        'recent_alerts': recent_alerts,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# ---------------------------------------------------------
# PRODUCTS / INVENTORY APIs
# ---------------------------------------------------------

@app.route('/api/products', methods=['GET'])
def api_get_products():
    """Lists products with category, status, zone, search filtering, and pagination."""
    category = request.args.get('category')
    status = request.args.get('status')
    zone = request.args.get('zone')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))
    offset = (page - 1) * limit

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if category and category != 'All':
        query += " AND category = ?"
        params.append(category)

    if status and status != 'All':
        query += " AND status = ?"
        params.append(status.upper())

    if zone and zone != 'All':
        query += " AND warehouse_zone = ?"
        params.append(zone)

    if search:
        query += " AND (sku LIKE ? OR name LIKE ? OR category LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    # Count total matching
    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()[0]

    # Get records
    query += " ORDER BY CASE status WHEN 'CRITICAL' THEN 1 WHEN 'OUT OF STOCK' THEN 2 WHEN 'LOW STOCK' THEN 3 ELSE 4 END, id ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    products = [dict(p) for p in cursor.fetchall()]

    # Add available stock calculation
    for p in products:
        p['available_quantity'] = max(0, p['quantity'] - p['reserved_quantity'])

    conn.close()

    return jsonify({
        'success': True,
        'products': products,
        'total': total_records,
        'page': page,
        'limit': limit,
        'total_pages': (total_records + limit - 1) // limit if total_records > 0 else 1
    })

@app.route('/api/products/<id_or_sku>', methods=['GET'])
def api_get_product_detail(id_or_sku):
    """Fetches full product detail with AI-assisted replenishment recommendation and demand trend."""
    recommendation = engine.calculate_replenishment_recommendation(id_or_sku)
    if not recommendation:
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    if id_or_sku.isdigit():
        cursor.execute("SELECT * FROM products WHERE id = ?", (int(id_or_sku),))
    else:
        cursor.execute("SELECT * FROM products WHERE sku = ?", (id_or_sku,))

    product = dict(cursor.fetchone())
    product['available_quantity'] = max(0, product['quantity'] - product['reserved_quantity'])

    # Mock stock movement history for Chart
    movement_history = {
        'labels': ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'],
        'stock_levels': [
            product['quantity'] + 35,
            product['quantity'] + 28,
            product['quantity'] + 22,
            product['quantity'] + 15,
            product['quantity'] + 8,
            product['quantity'] + 3,
            product['quantity']
        ],
        'demand_trend': [10, 12, 9, 14, 11, 15, int(product['daily_demand'])]
    }

    # Find related orders containing this SKU
    cursor.execute("SELECT id, order_number, customer_name, status, priority, order_date FROM orders WHERE items LIKE ? LIMIT 5", (f"%{product['sku']}%",))
    related_orders = [dict(o) for o in cursor.fetchall()]

    conn.close()

    return jsonify({
        'success': True,
        'product': product,
        'recommendation': recommendation,
        'movement_history': movement_history,
        'related_orders': related_orders
    })

@app.route('/api/products/<int:id>/reorder', methods=['POST'])
def api_reorder_product(id):
    """Executes a smart replenishment order for a SKU."""
    data = request.get_json() or {}
    replenish_qty = data.get('quantity')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (id,))
    product = cursor.fetchone()

    if not product:
        conn.close()
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    prod = dict(product)
    if not replenish_qty:
        replenish_qty = max(prod['reorder_level'] * 2, 50)

    new_quantity = prod['quantity'] + replenish_qty
    new_status = 'IN STOCK' if new_quantity > prod['reorder_level'] else 'LOW STOCK'

    cursor.execute("""
        UPDATE products
        SET quantity = ?, status = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_quantity, new_status, id))

    # Add audit log and alert
    cursor.execute("""
        INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
        VALUES ('Success', 'Replenishment Order Confirmed', ?, 'success', 0, 'resolve', ?)
    """, (f"Stock for {prod['sku']} ({prod['name']}) replenished by +{replenish_qty} units. New balance: {new_quantity}.", prod['sku']))

    cursor.execute("INSERT INTO audit_logs (action, details) VALUES ('REPLENISH_ORDER', ?)", (f"Replenished SKU {prod['sku']} by +{replenish_qty} units.",))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Successfully replenished +{replenish_qty} units of {prod['sku']}.",
        'new_quantity': new_quantity,
        'new_status': new_status
    })

@app.route('/api/products', methods=['POST'])
def api_create_product():
    """Adds a new SKU product to the inventory database."""
    data = request.get_json()
    if not data or not data.get('sku') or not data.get('name'):
        return jsonify({'success': False, 'error': 'SKU and Name are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        qty = int(data.get('quantity', 0))
        reorder = int(data.get('reorder_level', 20))
        status = 'IN STOCK' if qty > reorder else ('LOW STOCK' if qty > 0 else 'OUT OF STOCK')

        cursor.execute("""
            INSERT INTO products (sku, name, category, quantity, reserved_quantity, reorder_level, warehouse_zone, shelf, bin, status, price, daily_demand, lead_time_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['sku'].strip().upper(),
            data['name'].strip(),
            data.get('category', 'General'),
            qty,
            0,
            reorder,
            data.get('warehouse_zone', 'ZONE A'),
            data.get('shelf', 'A-01'),
            data.get('bin', 'A01'),
            status,
            float(data.get('price', 19.99)),
            float(data.get('daily_demand', 5.0)),
            int(data.get('lead_time_days', 3))
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': new_id, 'message': 'Product added successfully'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'error': f"Product with SKU '{data.get('sku')}' already exists"}), 400

# ---------------------------------------------------------
# ORDERS & ALLOCATION APIs
# ---------------------------------------------------------

@app.route('/api/orders', methods=['GET'])
def api_get_orders():
    """Returns orders list with status, priority, search filtering, and pagination."""
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))
    offset = (page - 1) * limit

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM orders WHERE 1=1"
    params = []

    if status and status != 'All':
        query += " AND status = ?"
        params.append(status)

    if priority and priority != 'All':
        query += " AND priority = ?"
        params.append(priority)

    if search:
        query += " AND (order_number LIKE ? OR customer_name LIKE ? OR picker LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()[0]

    query += " ORDER BY priority_score DESC, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    orders = []
    for row in cursor.fetchall():
        ord_dict = dict(row)
        if isinstance(ord_dict['items'], str):
            try:
                ord_dict['items'] = json.loads(ord_dict['items'])
            except Exception:
                pass
        orders.append(ord_dict)

    conn.close()

    return jsonify({
        'success': True,
        'orders': orders,
        'total': total_records,
        'page': page,
        'limit': limit,
        'total_pages': (total_records + limit - 1) // limit if total_records > 0 else 1
    })

@app.route('/api/orders/<int:id>', methods=['GET'])
def api_get_order_detail(id):
    """Returns detailed order information including interactive 7-stage fulfillment timeline."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (id,))
    order_row = cursor.fetchone()

    if not order_row:
        conn.close()
        return jsonify({'success': False, 'error': 'Order not found'}), 404

    order = dict(order_row)
    if isinstance(order['items'], str):
        try:
            order['items'] = json.loads(order['items'])
        except Exception:
            pass

    # Fulfillment Timeline definition
    stages = [
        {'key': 'New', 'label': 'Order Created', 'description': 'Received and validated in system.'},
        {'key': 'Allocated', 'label': 'Stock Allocated', 'description': 'Assigned to optimal warehouse zone.'},
        {'key': 'Picking', 'label': 'Picking in Progress', 'description': 'Picker en route with RF scanner.'},
        {'key': 'Packed', 'label': 'Packing & QA', 'description': 'Item verified, boxed, and dimensioned.'},
        {'key': 'Ready to Ship', 'label': 'Ready to Ship', 'description': 'Shipping label affixed on dock.'},
        {'key': 'Shipped', 'label': 'Shipped', 'description': 'Handed over to carrier network.'},
        {'key': 'Delivered', 'label': 'Delivered', 'description': 'Confirmed delivered to recipient.'}
    ]

    current_status = order['status']
    current_index = 0
    for idx, s in enumerate(stages):
        if s['key'].lower() == current_status.lower():
            current_index = idx
            break
        elif current_status == 'Delayed' and s['key'] == 'Picking':
            current_index = 2

    for idx, s in enumerate(stages):
        if idx < current_index:
            s['state'] = 'completed'
        elif idx == current_index:
            s['state'] = 'current' if current_status != 'Delayed' else 'delayed'
        else:
            s['state'] = 'pending'

    # Smart allocation recommendation for this order
    allocation = engine.recommend_order_allocation(id)

    conn.close()

    return jsonify({
        'success': True,
        'order': order,
        'timeline': {
            'stages': stages,
            'current_stage': current_status,
            'current_index': current_index
        },
        'allocation': allocation
    })

@app.route('/api/allocation/recommend', methods=['POST'])
def api_recommend_allocation():
    """Calculates best warehouse zone and distance optimization for an order."""
    data = request.get_json() or {}
    order_id = data.get('order_id')
    if not order_id:
        return jsonify({'success': False, 'error': 'order_id is required'}), 400

    rec = engine.recommend_order_allocation(int(order_id))
    if not rec:
        return jsonify({'success': False, 'error': 'Order not found'}), 404

    return jsonify({'success': True, 'recommendation': rec})

@app.route('/api/orders/<int:id>/allocate', methods=['POST'])
def api_apply_allocation(id):
    """Applies smart allocation recommendation to an order and creates picking task."""
    data = request.get_json() or {}
    target_zone = data.get('zone', 'ZONE A')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (id,))
    order = cursor.fetchone()

    if not order:
        conn.close()
        return jsonify({'success': False, 'error': 'Order not found'}), 404

    ord_dict = dict(order)

    # Assign default picker based on zone
    picker_map = {
        'ZONE A': 'David Kim',
        'ZONE B': 'Sarah Chen',
        'ZONE C': 'Marcus Vance',
        'ZONE D': 'Elena Rostova',
        'ZONE E': 'Maya Patel'
    }
    assigned_picker = picker_map.get(target_zone, 'Alex Rivera')

    cursor.execute("""
        UPDATE orders
        SET status = 'Picking', warehouse_zone = ?, picker = ?, estimated_ship_time = 'Today 11:30 AM'
        WHERE id = ?
    """, (target_zone, assigned_picker, id))

    # Create picking task if not exists
    cursor.execute("SELECT id FROM picking_tasks WHERE order_id = ?", (id,))
    existing_task = cursor.fetchone()

    if not existing_task:
        cursor.execute("""
            INSERT INTO picking_tasks (order_id, order_number, picker, zone, items, priority, status, estimated_time)
            VALUES (?, ?, ?, ?, ?, ?, 'In Progress', '6 min')
        """, (id, ord_dict['order_number'], assigned_picker, target_zone, ord_dict['items'], ord_dict['priority']))

    cursor.execute("""
        INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
        VALUES ('Success', 'Order Allocated & Queued', ?, 'success', 0, 'view_order', ?)
    """, (f"Order {ord_dict['order_number']} successfully allocated to {target_zone} and assigned to {assigned_picker}.", ord_dict['order_number']))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Order {ord_dict['order_number']} allocated to {target_zone} with picker {assigned_picker}.",
        'zone': target_zone,
        'picker': assigned_picker,
        'status': 'Picking'
    })

@app.route('/api/orders/<int:id>', methods=['PUT'])
def api_update_order(id):
    """Updates order status, priority, or picker assignment."""
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    fields = []
    params = []
    if 'status' in data:
        fields.append("status = ?")
        params.append(data['status'])
    if 'priority' in data:
        fields.append("priority = ?")
        params.append(data['priority'])
    if 'picker' in data:
        fields.append("picker = ?")
        params.append(data['picker'])
    if 'warehouse_zone' in data:
        fields.append("warehouse_zone = ?")
        params.append(data['warehouse_zone'])

    if not fields:
        conn.close()
        return jsonify({'success': False, 'error': 'No fields provided'}), 400

    params.append(id)
    query = f"UPDATE orders SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Order updated successfully'})

# ---------------------------------------------------------
# FULFILLMENT & PICKING QUEUE APIs
# ---------------------------------------------------------

@app.route('/api/picking', methods=['GET'])
def api_get_picking_tasks():
    """Returns smart FIFO picking queue with priority sorting."""
    status = request.args.get('status')
    zone = request.args.get('zone')
    picker = request.args.get('picker')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM picking_tasks WHERE 1=1"
    params = []

    if status and status != 'All':
        query += " AND status = ?"
        params.append(status)

    if zone and zone != 'All':
        query += " AND zone = ?"
        params.append(zone)

    if picker and picker != 'All':
        query += " AND picker = ?"
        params.append(picker)

    # Sort priority: Urgent first, then In Progress, then Pending
    query += " ORDER BY CASE priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, CASE status WHEN 'In Progress' THEN 1 WHEN 'Pending' THEN 2 ELSE 3 END, id ASC"

    cursor.execute(query, params)
    tasks = []
    for t in cursor.fetchall():
        td = dict(t)
        if isinstance(td['items'], str):
            try:
                td['items'] = json.loads(td['items'])
            except Exception:
                pass
        tasks.append(td)

    # Top metrics
    cursor.execute("SELECT COUNT(DISTINCT picker) FROM picking_tasks WHERE status IN ('Pending', 'In Progress')")
    active_pickers = cursor.fetchone()[0] or 5

    cursor.execute("SELECT COUNT(*) FROM picking_tasks WHERE status IN ('Pending', 'In Progress')")
    pending_tasks = cursor.fetchone()[0] or 0

    conn.close()

    return jsonify({
        'success': True,
        'tasks': tasks,
        'metrics': {
            'active_pickers': active_pickers,
            'pending_tasks': pending_tasks,
            'avg_pick_time': '7.4 min',
            'picking_accuracy': '98.6%'
        }
    })

@app.route('/api/picking/<int:id>/action', methods=['POST'])
def api_picking_action(id):
    """Handles RF scanner actions: pick item, mark missing, report issue, complete task."""
    data = request.get_json() or {}
    action = data.get('action') # 'pick_item', 'mark_missing', 'report_issue', 'complete'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM picking_tasks WHERE id = ?", (id,))
    task = cursor.fetchone()

    if not task:
        conn.close()
        return jsonify({'success': False, 'error': 'Picking task not found'}), 404

    td = dict(task)

    if action == 'pick_item':
        new_picked = min(td['total_items'], td['items_picked'] + 1)
        new_status = 'Completed' if new_picked >= td['total_items'] else 'In Progress'
        cursor.execute("UPDATE picking_tasks SET items_picked = ?, status = ? WHERE id = ?", (new_picked, new_status, id))
        if new_status == 'Completed':
            cursor.execute("UPDATE orders SET status = 'Packed' WHERE id = ?", (td['order_id'],))
        msg = f"Item verified & scanned for {td['order_number']}. Progress: {new_picked}/{td['total_items']}."

    elif action == 'complete':
        cursor.execute("UPDATE picking_tasks SET items_picked = total_items, status = 'Completed' WHERE id = ?", (id,))
        cursor.execute("UPDATE orders SET status = 'Packed' WHERE id = ?", (td['order_id'],))
        msg = f"Task {id} for order {td['order_number']} marked Completed. Order moved to Packing bay."

    elif action == 'mark_missing':
        cursor.execute("UPDATE picking_tasks SET status = 'Issue Reported' WHERE id = ?", (id,))
        cursor.execute("""
            INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
            VALUES ('Critical', 'Picking Discrepancy — Item Missing', ?, 'critical', 0, 'view_order', ?)
        """, (f"Picker {td['picker']} reported missing item in {td['zone']} for order {td['order_number']}.", td['order_number']))
        msg = f"Missing item flagged for order {td['order_number']}. Supervisor alerted."

    elif action == 'report_issue':
        note = data.get('note', 'Aisle obstruction reported.')
        cursor.execute("UPDATE picking_tasks SET status = 'Issue Reported' WHERE id = ?", (id,))
        cursor.execute("""
            INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
            VALUES ('Warning', 'Fulfillment Issue Reported', ?, 'warning', 0, 'resolve', ?)
        """, (f"Issue reported in {td['zone']}: {note}", td['zone']))
        msg = "Issue reported to warehouse supervisor."

    else:
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid action'}), 400

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': msg})

# ---------------------------------------------------------
# WAREHOUSE ZONES & DIGITAL MAP APIs
# ---------------------------------------------------------

@app.route('/api/zones', methods=['GET'])
def api_get_zones():
    """Returns all warehouse zones and operational staging areas."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM warehouse_zones ORDER BY id ASC")
    zones = [dict(z) for z in cursor.fetchall()]
    conn.close()

    bottleneck = engine.detect_warehouse_bottlenecks()

    return jsonify({
        'success': True,
        'zones': zones,
        'bottleneck': bottleneck
    })

@app.route('/api/zones/rebalance', methods=['POST'])
def api_rebalance_pickers():
    """Rebalances pickers from donor zone to congested zone."""
    data = request.get_json() or {}
    source_zone = data.get('source_zone', 'ZONE B')
    target_zone = data.get('target_zone', 'ZONE C')
    count = int(data.get('count', 2))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE warehouse_zones SET picker_count = MAX(1, picker_count - ?), congestion_level = 30 WHERE zone_code = ?", (count, source_zone))
    cursor.execute("UPDATE warehouse_zones SET picker_count = picker_count + ?, congestion_level = 42, status = 'Optimal' WHERE zone_code = ?", (count, target_zone))

    cursor.execute("""
        INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
        VALUES ('Success', 'Picker Rebalancing Completed', ?, 'success', 0, 'resolve', ?)
    """, (f"Reassigned {count} pickers from {source_zone} to {target_zone}. Congestion reduced.", target_zone))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Successfully transferred {count} pickers from {source_zone} to {target_zone}."
    })

# ---------------------------------------------------------
# ALERTS & NOTIFICATIONS APIs
# ---------------------------------------------------------

@app.route('/api/alerts', methods=['GET'])
def api_get_alerts():
    """Returns all alerts with severity and read status filters."""
    severity = request.args.get('severity')
    is_read = request.args.get('is_read')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if severity and severity != 'All':
        query += " AND severity = ?"
        params.append(severity.lower())

    if is_read is not None and is_read != 'All':
        query += " AND is_read = ?"
        params.append(int(is_read))

    query += " ORDER BY is_read ASC, id DESC"
    cursor.execute(query, params)
    alerts = [dict(a) for a in cursor.fetchall()]

    cursor.execute("SELECT COUNT(*) FROM alerts WHERE is_read = 0")
    unread_count = cursor.fetchone()[0]

    conn.close()

    return jsonify({
        'success': True,
        'alerts': alerts,
        'unread_count': unread_count
    })

@app.route('/api/alerts/<int:id>/read', methods=['PUT'])
def api_mark_alert_read(id):
    """Marks an alert as read."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET is_read = 1 WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Alert marked as read'})

@app.route('/api/alerts/mark-all-read', methods=['POST'])
def api_mark_all_alerts_read():
    """Marks all alerts as read."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET is_read = 1")
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'All alerts marked as read'})

@app.route('/api/alerts/<int:id>', methods=['DELETE'])
def api_dismiss_alert(id):
    """Dismisses / deletes an alert."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Alert dismissed'})

# ---------------------------------------------------------
# ANALYTICS & AI COPILOT APIs
# ---------------------------------------------------------

@app.route('/api/analytics', methods=['GET'])
def api_get_analytics():
    """Returns comprehensive historical & predictive analytics data."""
    timeframe = request.args.get('timeframe', '7D') # Today, 7D, 30D, 90D

    metrics = {
        'inventory_turnover': '8.4x',
        'stockout_rate': '1.2%',
        'order_fulfillment_rate': '98.6%',
        'picking_accuracy': '99.1%',
        'avg_fulfillment_time': '7.2 min',
        'warehouse_utilization': '78%',
        'on_time_shipment_rate': '98.4%'
    }

    # Chart datasets based on timeframe
    if timeframe == 'Today':
        labels = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
        orders_data = [12, 28, 45, 38, 42, 35, 20]
        fulfilled_data = [12, 26, 42, 36, 40, 34, 18]
    elif timeframe == '30D':
        labels = [f'Wk {i}' for i in range(1, 5)]
        orders_data = [820, 940, 890, 1020]
        fulfilled_data = [805, 925, 875, 1005]
    elif timeframe == '90D':
        labels = ['May', 'Jun', 'Jul']
        orders_data = [3400, 3850, 4100]
        fulfilled_data = [3350, 3790, 4040]
    else: # 7D default
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        orders_data = [110, 135, 125, 142, 160, 95, 128]
        fulfilled_data = [108, 130, 122, 138, 154, 94, 124]

    return jsonify({
        'success': True,
        'timeframe': timeframe,
        'metrics': metrics,
        'charts': {
            'orders_trend': {
                'labels': labels,
                'orders': orders_data,
                'fulfilled': fulfilled_data
            },
            'zone_radar': {
                'labels': ['Velocity', 'Accuracy', 'Utilization', 'Safety', 'Staffing'],
                'zone_a': [95, 98, 72, 99, 88],
                'zone_b': [88, 99, 70, 98, 92],
                'zone_c': [65, 89, 92, 94, 55],
                'zone_d': [82, 99, 71, 100, 85]
            },
            'pick_time_distribution': {
                'labels': ['< 3 min', '3-5 min', '5-8 min', '8-12 min', '> 12 min'],
                'data': [25, 45, 20, 8, 2]
            }
        }
    })

@app.route('/api/ai/insights', methods=['GET'])
def api_get_ai_insights():
    """Returns dynamic AI operational insight cards with confidence and impact scores."""
    insights = [
        {
            'id': 1,
            'title': 'Demand Surge Prediction',
            'type': 'demand',
            'summary': "Wireless Headphones & Audio Gear demand is projected to surge by +24% over the next 5 days.",
            'confidence': 94,
            'impact': 'High Revenue Opportunity',
            'recommendation': 'Trigger advance putaway of 80 units from Zone E reserve pallets into Zone B active pick bins.',
            'action_label': 'Pre-stage Inventory',
            'action_type': 'restock',
            'badge': 'PREDICTIVE'
        },
        {
            'id': 2,
            'title': 'Impending Stockout Risk',
            'type': 'stockout',
            'summary': "SKU WH-1042 and SKU WH-3011 have depleted below their 3-day safety stock buffer.",
            'confidence': 96,
            'impact': 'High Risk of Backorders',
            'recommendation': 'Approve automated supplier purchase order for 120 combined units.',
            'action_label': 'Replenish SKUs',
            'action_type': 'restock',
            'badge': 'URGENT'
        },
        {
            'id': 3,
            'title': 'Fulfillment SLA Breach Risk',
            'type': 'sla',
            'summary': "4 heavy-goods orders in Zone C are at risk of missing their 2-hour shipping dispatch SLA window.",
            'confidence': 91,
            'impact': 'Customer Satisfaction Impact',
            'recommendation': 'Rebalance 2 pickers from Zone B to Zone C to clear pending heavy lift tasks.',
            'action_label': 'Reassign Pickers',
            'action_type': 'rebalance',
            'badge': 'BOTTLENECK'
        },
        {
            'id': 4,
            'title': 'Pick Route Optimization',
            'type': 'optimization',
            'summary': "Batching Zone A fast-moving small goods into dual-tote pick sequences will reduce walking distance by 32%.",
            'confidence': 93,
            'impact': 'Efficiency Gain (+18%)',
            'recommendation': 'Enable dynamic multi-order batching on next picking cycle.',
            'action_label': 'Apply Batching',
            'action_type': 'resolve',
            'badge': 'EFFICIENCY'
        }
    ]

    return jsonify({'success': True, 'insights': insights})

@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    """SmartStock AI Copilot natural language handler."""
    data = request.get_json() or {}
    query = data.get('query', '')
    result = engine.process_copilot_query(query)
    return jsonify({'success': True, 'response': result})

# ---------------------------------------------------------
# HERO FEATURE: 1-CLICK OPTIMIZE & DEMO MODE APIs
# ---------------------------------------------------------

@app.route('/api/optimize', methods=['POST'])
def api_optimize_warehouse():
    """⚡ HERO FEATURE: Runs global optimization simulation across zones, pickers, orders, and restock."""
    result = engine.optimize_warehouse_operations()
    return jsonify(result)

@app.route('/api/demo/tick', methods=['POST'])
def api_demo_tick():
    """🎮 Hackathon Demo Mode: simulates live operational tick."""
    result = engine.simulate_hackathon_tick()
    return jsonify(result)

@app.route('/api/demo/reset', methods=['POST'])
def api_demo_reset():
    """Resets database to baseline seed state for clean demo presentation."""
    seed_database()
    return jsonify({'success': True, 'message': 'Warehouse operations database reset to baseline state.'})

@app.route('/api/search', methods=['GET'])
def api_global_search():
    """Global search across SKUs, product names, order numbers, zones, and alerts."""
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify({'success': True, 'results': []})

    conn = get_db_connection()
    cursor = conn.cursor()
    term = f"%{q}%"

    results = []

    # Products
    cursor.execute("SELECT id, sku, name, warehouse_zone, status, quantity FROM products WHERE sku LIKE ? OR name LIKE ? LIMIT 4", (term, term))
    for p in cursor.fetchall():
        results.append({
            'type': 'Product',
            'title': f"{p['sku']} — {p['name']}",
            'subtitle': f"{p['warehouse_zone']} | Stock: {p['quantity']} | {p['status']}",
            'url': f"/inventory?search={p['sku']}",
            'icon': 'package'
        })

    # Orders
    cursor.execute("SELECT id, order_number, customer_name, status, total_amount FROM orders WHERE order_number LIKE ? OR customer_name LIKE ? LIMIT 4", (term, term))
    for o in cursor.fetchall():
        results.append({
            'type': 'Order',
            'title': f"{o['order_number']} — {o['customer_name']}",
            'subtitle': f"${o['total_amount']:.2f} | Status: {o['status']}",
            'url': f"/orders?search={o['order_number']}",
            'icon': 'shopping-cart'
        })

    # Zones
    cursor.execute("SELECT id, zone_code, zone_name, congestion_level FROM warehouse_zones WHERE zone_code LIKE ? OR zone_name LIKE ? LIMIT 2", (term, term))
    for z in cursor.fetchall():
        results.append({
            'type': 'Zone',
            'title': f"{z['zone_code']} — {z['zone_name']}",
            'subtitle': f"Congestion: {z['congestion_level']}%",
            'url': '/warehouse',
            'icon': 'map-pin'
        })

    conn.close()

    return jsonify({'success': True, 'results': results})

@app.route('/api/health', methods=['GET'])
def api_health():
    """Quick health check endpoint."""
    return jsonify({'status': 'online', 'service': 'SmartStock AI', 'version': '2.0.0'})

if __name__ == '__main__':
    print("Starting SmartStock AI Warehouse Operations Platform on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)
