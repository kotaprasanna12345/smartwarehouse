import json
import sqlite3
from database import get_db_connection, init_db

def seed_database():
    """Populates SQLite database with rich, realistic warehouse operations data."""
    init_db(force_recreate=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Warehouse Zones
    zones = [
        ('ZONE A', 'Zone A — High Velocity Fulfillment', 'Fast-Moving Consumer & Apparel', 6000, 4320, 4, 32, 'Optimal', 'Ambient (21°C)', 4.9, 'Dedicated to rapid-pick consumer electronics and apparel with automated bin conveyors.'),
        ('ZONE B', 'Zone B — High-Value Secure Storage', 'High-End Electronics & Tech', 4500, 3180, 3, 28, 'Optimal', 'Climate Controlled (19°C)', 4.7, 'High-security zone equipped with RFID readers and biometric access controls.'),
        ('ZONE C', 'Zone C — Bulky Freight & Industrial', 'Heavy Goods & Machinery', 7500, 6890, 2, 84, 'Bottleneck', 'Ambient (22°C)', 3.2, 'Heavy item storage with high forklift traffic. Currently suffering from picker shortage and aisle congestion.'),
        ('ZONE D', 'Zone D — Cold Chain & Bio-Pharma', 'Pharmaceuticals & Perishables', 3000, 2150, 2, 44, 'Optimal', 'Cold Storage (4°C)', 4.6, 'Strict temperature-monitored refrigerated facility with specialized thermal suits.'),
        ('ZONE E', 'Zone E — High-Bay Reserve Pallets', 'Bulk Overstock & Raw Materials', 10000, 7420, 1, 19, 'Optimal', 'Ambient (20°C)', 4.4, 'Automated high-bay vertical racking system for long-term replenishment storage.'),
        ('RECEIVING', 'Inbound Receiving Docks 1-4', 'Docking & Verification', 2000, 850, 2, 22, 'Optimal', 'Ambient (21°C)', 4.8, 'Cross-dock staging and barcode verification station.'),
        ('PACKING', 'Packing & Quality Verification', 'Boxing & Labeling', 1500, 620, 4, 38, 'Optimal', 'Ambient (21°C)', 4.9, 'Multi-station packing benches with automated dimensioning and custom boxing.'),
        ('SHIPPING', 'Outbound Shipping Bays 5-8', 'Palletizing & Dispatch', 2500, 1100, 3, 30, 'Optimal', 'Ambient (21°C)', 5.0, 'Staging area for courier pickups (FedEx, UPS, Freightline).')
    ]

    cursor.executemany('''
        INSERT INTO warehouse_zones (zone_code, zone_name, category_focus, capacity, occupied, picker_count, congestion_level, status, temperature, speed_rating, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', zones)

    # 2. Seed Products (36 realistic SKUs across diverse warehouse categories)
    products = [
        # Electronics & Gadgets (Zone B & Zone A)
        ('WH-1042', 'Wireless Active Noise-Cancelling Headphones Pro', 'Electronics', 18, 12, 40, 'ZONE B', 'B-04', 'B12', 'CRITICAL', 149.99, 11.2, 3),
        ('WH-1043', 'Ultra-Slim Bluetooth Ergonomic Mouse', 'Electronics', 240, 15, 50, 'ZONE A', 'A-02', 'A05', 'IN STOCK', 39.99, 8.4, 2),
        ('WH-1044', '4K Ultra-HD Webcam with Dual Stereo Mic', 'Electronics', 34, 10, 45, 'ZONE B', 'B-02', 'B08', 'LOW STOCK', 89.99, 6.5, 4),
        ('WH-2089', 'Ergonomic Mechanical Gaming Keyboard RGB', 'Electronics', 185, 20, 35, 'ZONE B', 'B-05', 'B19', 'IN STOCK', 129.50, 5.8, 3),
        ('WH-3011', 'Smart 4K Laser Cinema Projector', 'Electronics', 12, 8, 25, 'ZONE B', 'B-08', 'B03', 'CRITICAL', 899.00, 3.4, 5),
        ('WH-3012', 'Dual-Port 100W GaN Fast Charger', 'Electronics', 420, 40, 60, 'ZONE A', 'A-01', 'A11', 'IN STOCK', 49.99, 14.2, 2),
        ('WH-3015', 'Thunderbolt 4 Multi-Display Docking Hub', 'Electronics', 52, 14, 30, 'ZONE B', 'B-03', 'B14', 'IN STOCK', 199.99, 4.1, 4),
        ('WH-3020', 'Noise-Isolating Studio Monitor Speakers', 'Electronics', 28, 6, 25, 'ZONE B', 'B-06', 'B07', 'IN STOCK', 249.00, 2.5, 5),
        ('WH-6110', 'High-Density 20000mAh Power Bank', 'Electronics', 0, 0, 50, 'ZONE B', 'B-01', 'B04', 'OUT OF STOCK', 59.99, 9.8, 3),

        # Industrial & Heavy Equipment (Zone C - Bottleneck Zone)
        ('WH-4099', 'Heavy Duty 5500lb Hydraulic Pallet Jack', 'Industrial', 8, 4, 15, 'ZONE C', 'C-01', 'C02', 'CRITICAL', 489.00, 2.1, 7),
        ('WH-4100', 'Industrial Drum Spill Containment Basin', 'Industrial', 14, 2, 20, 'ZONE C', 'C-03', 'C11', 'LOW STOCK', 275.00, 1.8, 6),
        ('WH-4102', 'High-Tension Steel Strapping Banding Kit', 'Industrial', 65, 8, 25, 'ZONE C', 'C-05', 'C04', 'IN STOCK', 115.00, 3.2, 4),
        ('WH-4105', 'Telescopic Aluminum Warehouse Ladder 16ft', 'Industrial', 19, 5, 20, 'ZONE C', 'C-02', 'C09', 'LOW STOCK', 210.00, 2.4, 5),
        ('WH-4108', 'Heavy Duty Rubber Wheel Chocks (Pair)', 'Industrial', 140, 12, 30, 'ZONE C', 'C-04', 'C15', 'IN STOCK', 45.00, 4.0, 3),
        ('WH-4112', 'Automatic Stretch Film Pallet Wrapper Machine', 'Industrial', 3, 1, 5, 'ZONE C', 'C-06', 'C01', 'LOW STOCK', 2850.00, 0.4, 14),
        ('WH-4115', 'Forklift Safety Strobe & Spot Warning Light', 'Industrial', 88, 10, 25, 'ZONE C', 'C-02', 'C14', 'IN STOCK', 79.50, 3.6, 4),

        # Cold Storage & Pharmaceuticals (Zone D)
        ('WH-5501', 'Insulated Vaccine Transport Cooler 25L', 'Medical', 15, 6, 25, 'ZONE D', 'D-01', 'D03', 'CRITICAL', 320.00, 2.8, 4),
        ('WH-5502', 'Clinical Cryogenic Storage Vials (Pack 500)', 'Medical', 95, 12, 30, 'ZONE D', 'D-02', 'D08', 'IN STOCK', 185.00, 4.5, 3),
        ('WH-5504', 'Nitrile Medical Examination Gloves (Box 1000)', 'Medical', 520, 80, 100, 'ZONE D', 'D-04', 'D12', 'IN STOCK', 65.00, 22.0, 2),
        ('WH-5508', 'Automated Digital Temperature Data Logger', 'Medical', 42, 8, 35, 'ZONE D', 'D-03', 'D05', 'IN STOCK', 110.00, 3.1, 3),
        ('WH-5510', 'Antiviral Biohazard Decontamination Spray', 'Medical', 110, 20, 40, 'ZONE D', 'D-05', 'D01', 'IN STOCK', 38.50, 6.2, 3),
        ('WH-5515', 'Hospital Grade HEPA Air Filtration Cartridge', 'Medical', 8, 4, 20, 'ZONE D', 'D-02', 'D10', 'CRITICAL', 145.00, 3.5, 5),

        # Fast-Moving Consumer Goods & Apparel (Zone A)
        ('WH-7001', 'Thermal Insulated Stainless Water Bottle 32oz', 'Consumer', 310, 25, 50, 'ZONE A', 'A-03', 'A08', 'IN STOCK', 28.00, 12.5, 2),
        ('WH-7004', 'Breathable High-Visibility Safety Vest XL', 'Apparel', 480, 50, 60, 'ZONE A', 'A-04', 'A14', 'IN STOCK', 16.50, 15.0, 2),
        ('WH-7009', 'Reinforced Steel-Toe Work Boots (Size 10)', 'Apparel', 62, 14, 40, 'ZONE A', 'A-05', 'A02', 'IN STOCK', 119.00, 4.8, 3),
        ('WH-7012', 'Anti-Fatigue Industrial Floor Mat 3x5ft', 'Industrial', 45, 10, 30, 'ZONE A', 'A-06', 'A18', 'IN STOCK', 58.00, 3.3, 3),
        ('WH-7018', 'Tactical LED Rechargeable Flashlight 2000lm', 'Consumer', 190, 22, 40, 'ZONE A', 'A-02', 'A20', 'IN STOCK', 34.99, 7.1, 2),
        ('WH-7025', 'Cut-Resistant Level 5 Work Gloves (Pair)', 'Apparel', 650, 85, 120, 'ZONE A', 'A-04', 'A06', 'IN STOCK', 12.99, 28.0, 2),
        ('WH-7030', 'Polarized UV400 Industrial Safety Glasses', 'Apparel', 380, 45, 80, 'ZONE A', 'A-03', 'A12', 'IN STOCK', 18.50, 14.0, 2),

        # Overstock & Raw Materials (Zone E)
        ('WH-8001', 'Corrugated Shipping Boxes 16x12x8 (Bundle 50)', 'Packaging', 850, 120, 200, 'ZONE E', 'E-01', 'E01', 'IN STOCK', 42.00, 35.0, 2),
        ('WH-8005', 'Heavy Duty Bubble Cushioning Wrap 250ft', 'Packaging', 320, 40, 80, 'ZONE E', 'E-02', 'E04', 'IN STOCK', 36.50, 18.0, 2),
        ('WH-8010', 'Industrial Strength Packing Tape 6-Pack', 'Packaging', 1200, 180, 250, 'ZONE E', 'E-03', 'E09', 'IN STOCK', 24.99, 45.0, 1),
        ('WH-8015', 'Wooden Euro Pallet Heat Treated Grade A', 'Packaging', 210, 30, 100, 'ZONE E', 'E-05', 'E02', 'IN STOCK', 22.00, 12.0, 3),
        ('WH-8022', 'Commercial Grade Shrink Film Rolls 18in', 'Packaging', 410, 60, 90, 'ZONE E', 'E-04', 'E07', 'IN STOCK', 31.00, 16.5, 2),
        ('WH-8030', 'Reusable Collapsible Bulk Storage Tote 60L', 'Storage', 180, 24, 50, 'ZONE E', 'E-06', 'E15', 'IN STOCK', 29.50, 6.0, 3),
        ('WH-8035', 'Self-Adhesive Direct Thermal Shipping Labels', 'Packaging', 750, 90, 150, 'ZONE E', 'E-02', 'E11', 'IN STOCK', 19.99, 30.0, 2)
    ]

    cursor.executemany('''
        INSERT INTO products (sku, name, category, quantity, reserved_quantity, reorder_level, warehouse_zone, shelf, bin, status, price, daily_demand, lead_time_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products)

    # 3. Seed Orders (30 realistic orders with diverse statuses and priorities)
    orders = [
        ('ORD-9101', 'Nexus Global Supply Corp', json.dumps([
            {'sku': 'WH-1042', 'name': 'Wireless ANC Headphones Pro', 'quantity': 4, 'price': 149.99},
            {'sku': 'WH-2089', 'name': 'Ergonomic Mech Keyboard RGB', 'quantity': 2, 'price': 129.50}
        ]), 858.96, 'Urgent', 'Picking', 'ZONE B', 'Sarah Chen', 'Today 09:30 AM', '11:00 AM', 92, 'TRK-9842101'),

        ('ORD-8942', 'Apex Heavy Logistics Ltd', json.dumps([
            {'sku': 'WH-4099', 'name': 'Heavy Duty 5500lb Pallet Jack', 'quantity': 2, 'price': 489.00},
            {'sku': 'WH-4105', 'name': 'Telescopic Aluminum Ladder 16ft', 'quantity': 3, 'price': 210.00}
        ]), 1608.00, 'Urgent', 'Delayed', 'ZONE C', 'Marcus Vance', 'Today 08:15 AM', '10:30 AM', 98, 'TRK-8894200'),

        ('ORD-9103', 'BioCare Healthcare Systems', json.dumps([
            {'sku': 'WH-5501', 'name': 'Insulated Vaccine Cooler 25L', 'quantity': 3, 'price': 320.00},
            {'sku': 'WH-5504', 'name': 'Nitrile Gloves (Box 1000)', 'quantity': 10, 'price': 65.00}
        ]), 1610.00, 'Urgent', 'Allocated', 'ZONE D', 'Elena Rostova', 'Today 09:45 AM', '11:30 AM', 88, 'TRK-9842103'),

        ('ORD-9104', 'CyberNet Hardware Labs', json.dumps([
            {'sku': 'WH-3015', 'name': 'Thunderbolt 4 Docking Hub', 'quantity': 5, 'price': 199.99},
            {'sku': 'WH-1043', 'name': 'Ultra-Slim Bluetooth Mouse', 'quantity': 5, 'price': 39.99}
        ]), 1199.90, 'High', 'Packed', 'ZONE B', 'Alex Rivera', 'Today 08:40 AM', '12:00 PM', 76, 'TRK-9842104'),

        ('ORD-9105', 'Titan Industrial Manufacturing', json.dumps([
            {'sku': 'WH-4100', 'name': 'Drum Spill Containment Basin', 'quantity': 2, 'price': 275.00},
            {'sku': 'WH-4108', 'name': 'Rubber Wheel Chocks (Pair)', 'quantity': 6, 'price': 45.00}
        ]), 820.00, 'High', 'Delayed', 'ZONE C', 'Marcus Vance', 'Today 07:50 AM', '10:00 AM', 95, 'TRK-9842105'),

        ('ORD-9106', 'Vanguard Express Retail', json.dumps([
            {'sku': 'WH-7004', 'name': 'High-Visibility Safety Vest XL', 'quantity': 20, 'price': 16.50},
            {'sku': 'WH-7025', 'name': 'Cut-Resistant Work Gloves', 'quantity': 30, 'price': 12.99}
        ]), 719.70, 'Normal', 'Ready to Ship', 'ZONE A', 'David Kim', 'Today 08:20 AM', '01:00 PM', 58, 'TRK-9842106'),

        ('ORD-9107', 'Horizon Media Studios', json.dumps([
            {'sku': 'WH-3011', 'name': 'Smart 4K Laser Cinema Projector', 'quantity': 2, 'price': 899.00},
            {'sku': 'WH-3020', 'name': 'Studio Monitor Speakers', 'quantity': 2, 'price': 249.00}
        ]), 2296.00, 'Urgent', 'Picking', 'ZONE B', 'Sarah Chen', 'Today 09:50 AM', '11:45 AM', 91, 'TRK-9842107'),

        ('ORD-9108', 'Echo Logistics Distribution', json.dumps([
            {'sku': 'WH-8001', 'name': 'Corrugated Shipping Boxes', 'quantity': 10, 'price': 42.00},
            {'sku': 'WH-8010', 'name': 'Packing Tape 6-Pack', 'quantity': 15, 'price': 24.99}
        ]), 794.85, 'Normal', 'Shipped', 'ZONE E', 'Maya Patel', 'Today 07:30 AM', '09:30 AM', 45, 'TRK-9842108'),

        ('ORD-9109', 'Prime Pharma Deliveries', json.dumps([
            {'sku': 'WH-5502', 'name': 'Clinical Cryogenic Vials', 'quantity': 4, 'price': 185.00},
            {'sku': 'WH-5510', 'name': 'Antiviral Decon Spray', 'quantity': 8, 'price': 38.50}
        ]), 1048.00, 'High', 'Packed', 'ZONE D', 'Elena Rostova', 'Today 08:55 AM', '12:30 PM', 74, 'TRK-9842109'),

        ('ORD-9110', 'Summit Tech Solutions', json.dumps([
            {'sku': 'WH-3012', 'name': 'Dual-Port 100W GaN Charger', 'quantity': 12, 'price': 49.99},
            {'sku': 'WH-1044', 'name': '4K Ultra-HD Webcam', 'quantity': 4, 'price': 89.99}
        ]), 959.84, 'Normal', 'New', 'ZONE A', None, 'Today 10:10 AM', '02:00 PM', 52, 'TRK-9842110'),

        ('ORD-9111', 'SteelCore Constructions', json.dumps([
            {'sku': 'WH-4102', 'name': 'Steel Strapping Banding Kit', 'quantity': 3, 'price': 115.00},
            {'sku': 'WH-7009', 'name': 'Steel-Toe Work Boots Size 10', 'quantity': 4, 'price': 119.00}
        ]), 821.00, 'Urgent', 'Delayed', 'ZONE C', 'Marcus Vance', 'Today 08:05 AM', '10:15 AM', 96, 'TRK-9842111'),

        ('ORD-9112', 'Velocity Commerce Inc', json.dumps([
            {'sku': 'WH-7001', 'name': 'Thermal Water Bottle 32oz', 'quantity': 15, 'price': 28.00},
            {'sku': 'WH-7018', 'name': 'Tactical LED Flashlight', 'quantity': 10, 'price': 34.99}
        ]), 769.90, 'Normal', 'Allocated', 'ZONE A', 'David Kim', 'Today 09:15 AM', '01:30 PM', 55, 'TRK-9842112'),

        ('ORD-9113', 'AeroDynamics Lab', json.dumps([
            {'sku': 'WH-1042', 'name': 'Wireless ANC Headphones Pro', 'quantity': 2, 'price': 149.99},
            {'sku': 'WH-3015', 'name': 'Thunderbolt 4 Docking Hub', 'quantity': 2, 'price': 199.99}
        ]), 699.96, 'High', 'Picking', 'ZONE B', 'Sarah Chen', 'Today 10:00 AM', '12:15 PM', 79, 'TRK-9842113'),

        ('ORD-9114', 'Metropolis Medical Center', json.dumps([
            {'sku': 'WH-5515', 'name': 'Hospital HEPA Air Filter', 'quantity': 2, 'price': 145.00},
            {'sku': 'WH-5508', 'name': 'Temperature Data Logger', 'quantity': 3, 'price': 110.00}
        ]), 620.00, 'Urgent', 'Picking', 'ZONE D', 'Elena Rostova', 'Today 10:05 AM', '11:45 AM', 89, 'TRK-9842114'),

        ('ORD-9115', 'PackRight Fulfillment Group', json.dumps([
            {'sku': 'WH-8005', 'name': 'Bubble Cushioning Wrap 250ft', 'quantity': 8, 'price': 36.50},
            {'sku': 'WH-8022', 'name': 'Shrink Film Rolls 18in', 'quantity': 10, 'price': 31.00}
        ]), 602.00, 'Normal', 'Delivered', 'ZONE E', 'Maya Patel', 'Yesterday 04:00 PM', 'Yesterday', 40, 'TRK-9842115'),

        ('ORD-9116', 'Pioneer Engineering Corp', json.dumps([
            {'sku': 'WH-4115', 'name': 'Forklift Safety Warning Light', 'quantity': 4, 'price': 79.50},
            {'sku': 'WH-7012', 'name': 'Anti-Fatigue Floor Mat 3x5ft', 'quantity': 2, 'price': 58.00}
        ]), 434.00, 'Normal', 'New', 'ZONE C', None, 'Today 10:20 AM', '02:30 PM', 60, 'TRK-9842116'),

        ('ORD-9117', 'Quantum Audio Visual', json.dumps([
            {'sku': 'WH-3020', 'name': 'Studio Monitor Speakers', 'quantity': 4, 'price': 249.00}
        ]), 996.00, 'High', 'Ready to Ship', 'ZONE B', 'Alex Rivera', 'Today 08:30 AM', '12:00 PM', 72, 'TRK-9842117'),

        ('ORD-9118', 'Global SafeWorks Inc', json.dumps([
            {'sku': 'WH-7030', 'name': 'Polarized UV Safety Glasses', 'quantity': 25, 'price': 18.50},
            {'sku': 'WH-7025', 'name': 'Cut-Resistant Work Gloves', 'quantity': 25, 'price': 12.99}
        ]), 787.25, 'Normal', 'Shipped', 'ZONE A', 'David Kim', 'Today 07:15 AM', '09:00 AM', 42, 'TRK-9842118'),

        ('ORD-9119', 'OmniWarehouse Supply', json.dumps([
            {'sku': 'WH-8030', 'name': 'Collapsible Bulk Storage Tote', 'quantity': 6, 'price': 29.50},
            {'sku': 'WH-8035', 'name': 'Thermal Shipping Labels', 'quantity': 12, 'price': 19.99}
        ]), 416.88, 'Normal', 'Delivered', 'ZONE E', 'Maya Patel', 'Yesterday 02:30 PM', 'Yesterday', 38, 'TRK-9842119'),

        ('ORD-9120', 'Zenith Smart Retail', json.dumps([
            {'sku': 'WH-2089', 'name': 'Ergonomic Mech Keyboard RGB', 'quantity': 6, 'price': 129.50},
            {'sku': 'WH-1043', 'name': 'Ultra-Slim Bluetooth Mouse', 'quantity': 8, 'price': 39.99}
        ]), 1096.92, 'High', 'Packed', 'ZONE B', 'Alex Rivera', 'Today 08:45 AM', '12:30 PM', 75, 'TRK-9842120'),

        ('ORD-9121', 'Aegis Medical Supplies', json.dumps([
            {'sku': 'WH-5504', 'name': 'Nitrile Gloves (Box 1000)', 'quantity': 15, 'price': 65.00},
            {'sku': 'WH-5510', 'name': 'Antiviral Decon Spray', 'quantity': 6, 'price': 38.50}
        ]), 1206.00, 'Urgent', 'Picking', 'ZONE D', 'Elena Rostova', 'Today 10:15 AM', '11:50 AM', 87, 'TRK-9842121'),

        ('ORD-9122', 'Cascade Industrial Fleet', json.dumps([
            {'sku': 'WH-4099', 'name': 'Heavy Duty 5500lb Pallet Jack', 'quantity': 1, 'price': 489.00},
            {'sku': 'WH-4112', 'name': 'Stretch Film Pallet Wrapper', 'quantity': 1, 'price': 2850.00}
        ]), 3339.00, 'Urgent', 'New', 'ZONE C', None, 'Today 10:25 AM', '01:00 PM', 90, 'TRK-9842122'),

        ('ORD-9123', 'NextGen Computing', json.dumps([
            {'sku': 'WH-3012', 'name': 'Dual-Port 100W GaN Charger', 'quantity': 20, 'price': 49.99}
        ]), 999.80, 'Normal', 'Allocated', 'ZONE A', 'David Kim', 'Today 09:35 AM', '02:00 PM', 50, 'TRK-9842123'),

        ('ORD-9124', 'TerraFirma Heavy Works', json.dumps([
            {'sku': 'WH-4108', 'name': 'Rubber Wheel Chocks (Pair)', 'quantity': 8, 'price': 45.00},
            {'sku': 'WH-4102', 'name': 'Steel Strapping Banding Kit', 'quantity': 2, 'price': 115.00}
        ]), 590.00, 'High', 'Delayed', 'ZONE C', 'Marcus Vance', 'Today 08:10 AM', '10:45 AM', 94, 'TRK-9842124'),

        ('ORD-9125', 'Starlight Media Collective', json.dumps([
            {'sku': 'WH-1044', 'name': '4K Ultra-HD Webcam', 'quantity': 6, 'price': 89.99},
            {'sku': 'WH-1042', 'name': 'Wireless ANC Headphones Pro', 'quantity': 3, 'price': 149.99}
        ]), 989.91, 'Urgent', 'New', 'ZONE B', None, 'Today 10:30 AM', '12:00 PM', 86, 'TRK-9842125'),

        ('ORD-9126', 'AeroSafe Equipment', json.dumps([
            {'sku': 'WH-7004', 'name': 'High-Visibility Safety Vest XL', 'quantity': 30, 'price': 16.50}
        ]), 495.00, 'Normal', 'Shipped', 'ZONE A', 'David Kim', 'Today 07:00 AM', '08:45 AM', 40, 'TRK-9842126'),

        ('ORD-9127', 'BioShield Diagnostics', json.dumps([
            {'sku': 'WH-5501', 'name': 'Insulated Vaccine Cooler 25L', 'quantity': 2, 'price': 320.00}
        ]), 640.00, 'High', 'Ready to Ship', 'ZONE D', 'Elena Rostova', 'Today 09:00 AM', '12:15 PM', 71, 'TRK-9842127'),

        ('ORD-9128', 'NorthStar Logistics Hub', json.dumps([
            {'sku': 'WH-8015', 'name': 'Wooden Euro Pallets Grade A', 'quantity': 20, 'price': 22.00}
        ]), 440.00, 'Normal', 'Delivered', 'ZONE E', 'Maya Patel', 'Yesterday 01:00 PM', 'Yesterday', 35, 'TRK-9842128'),

        ('ORD-9129', 'Optima Industrial Tools', json.dumps([
            {'sku': 'WH-4115', 'name': 'Forklift Safety Warning Light', 'quantity': 6, 'price': 79.50}
        ]), 477.00, 'Normal', 'Allocated', 'ZONE C', 'Marcus Vance', 'Today 09:40 AM', '01:45 PM', 57, 'TRK-9842129'),

        ('ORD-9130', 'Aura Sound Labs', json.dumps([
            {'sku': 'WH-3015', 'name': 'Thunderbolt 4 Docking Hub', 'quantity': 4, 'price': 199.99}
        ]), 799.96, 'High', 'Picking', 'ZONE B', 'Sarah Chen', 'Today 10:10 AM', '12:30 PM', 78, 'TRK-9842130')
    ]

    cursor.executemany('''
        INSERT INTO orders (order_number, customer_name, items, total_amount, priority, status, warehouse_zone, picker, order_date, estimated_ship_time, priority_score, tracking_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', orders)

    # 4. Seed Picking Tasks (18 tasks linked to active orders)
    picking_tasks = [
        (2, 'ORD-8942', 'Marcus Vance', 'ZONE C', 'C-01', 'C02', json.dumps([{'sku': 'WH-4099', 'name': 'Heavy Duty 5500lb Pallet Jack', 'quantity': 2, 'picked': False}]), 'Urgent', 'In Progress', '14 min', 0, 2),
        (5, 'ORD-9105', 'Marcus Vance', 'ZONE C', 'C-03', 'C11', json.dumps([{'sku': 'WH-4100', 'name': 'Drum Spill Containment Basin', 'quantity': 2, 'picked': False}]), 'High', 'Pending', '12 min', 0, 2),
        (11, 'ORD-9111', 'Marcus Vance', 'ZONE C', 'C-05', 'C04', json.dumps([{'sku': 'WH-4102', 'name': 'Steel Strapping Banding Kit', 'quantity': 3, 'picked': False}]), 'Urgent', 'Pending', '10 min', 0, 2),
        (24, 'ORD-9124', 'Marcus Vance', 'ZONE C', 'C-04', 'C15', json.dumps([{'sku': 'WH-4108', 'name': 'Rubber Wheel Chocks', 'quantity': 8, 'picked': False}]), 'High', 'Pending', '11 min', 0, 2),

        (1, 'ORD-9101', 'Sarah Chen', 'ZONE B', 'B-04', 'B12', json.dumps([{'sku': 'WH-1042', 'name': 'Wireless ANC Headphones Pro', 'quantity': 4, 'picked': True}, {'sku': 'WH-2089', 'name': 'Ergonomic Mech Keyboard', 'quantity': 2, 'picked': False}]), 'Urgent', 'In Progress', '5 min', 1, 2),
        (7, 'ORD-9107', 'Sarah Chen', 'ZONE B', 'B-08', 'B03', json.dumps([{'sku': 'WH-3011', 'name': 'Smart 4K Laser Projector', 'quantity': 2, 'picked': False}]), 'Urgent', 'Pending', '6 min', 0, 2),
        (13, 'ORD-9113', 'Sarah Chen', 'ZONE B', 'B-04', 'B12', json.dumps([{'sku': 'WH-1042', 'name': 'Wireless ANC Headphones Pro', 'quantity': 2, 'picked': False}]), 'High', 'Pending', '7 min', 0, 2),
        (30, 'ORD-9130', 'Sarah Chen', 'ZONE B', 'B-03', 'B14', json.dumps([{'sku': 'WH-3015', 'name': 'Thunderbolt 4 Docking Hub', 'quantity': 4, 'picked': False}]), 'High', 'Pending', '6 min', 0, 1),

        (3, 'ORD-9103', 'Elena Rostova', 'ZONE D', 'D-01', 'D03', json.dumps([{'sku': 'WH-5501', 'name': 'Insulated Vaccine Cooler 25L', 'quantity': 3, 'picked': False}]), 'Urgent', 'Pending', '7 min', 0, 2),
        (14, 'ORD-9114', 'Elena Rostova', 'ZONE D', 'D-02', 'D10', json.dumps([{'sku': 'WH-5515', 'name': 'Hospital HEPA Air Filter', 'quantity': 2, 'picked': False}]), 'Urgent', 'In Progress', '4 min', 1, 2),
        (21, 'ORD-9121', 'Elena Rostova', 'ZONE D', 'D-04', 'D12', json.dumps([{'sku': 'WH-5504', 'name': 'Nitrile Gloves Box 1000', 'quantity': 15, 'picked': False}]), 'Urgent', 'Pending', '8 min', 0, 2),

        (4, 'ORD-9104', 'Alex Rivera', 'ZONE B', 'B-03', 'B14', json.dumps([{'sku': 'WH-3015', 'name': 'Thunderbolt 4 Docking Hub', 'quantity': 5, 'picked': True}]), 'High', 'Completed', '4 min', 2, 2),
        (20, 'ORD-9120', 'Alex Rivera', 'ZONE B', 'B-05', 'B19', json.dumps([{'sku': 'WH-2089', 'name': 'Ergonomic Mech Keyboard', 'quantity': 6, 'picked': True}]), 'High', 'Completed', '5 min', 2, 2),

        (6, 'ORD-9106', 'David Kim', 'ZONE A', 'A-04', 'A14', json.dumps([{'sku': 'WH-7004', 'name': 'High-Visibility Safety Vest', 'quantity': 20, 'picked': True}]), 'Normal', 'Completed', '6 min', 2, 2),
        (12, 'ORD-9112', 'David Kim', 'ZONE A', 'A-03', 'A08', json.dumps([{'sku': 'WH-7001', 'name': 'Thermal Water Bottle 32oz', 'quantity': 15, 'picked': False}]), 'Normal', 'Pending', '6 min', 0, 2),

        (8, 'ORD-9108', 'Maya Patel', 'ZONE E', 'E-01', 'E01', json.dumps([{'sku': 'WH-8001', 'name': 'Corrugated Shipping Boxes', 'quantity': 10, 'picked': True}]), 'Normal', 'Completed', '8 min', 2, 2),
        (15, 'ORD-9115', 'Maya Patel', 'ZONE E', 'E-02', 'E04', json.dumps([{'sku': 'WH-8005', 'name': 'Bubble Cushioning Wrap', 'quantity': 8, 'picked': True}]), 'Normal', 'Completed', '7 min', 2, 2),
        (19, 'ORD-9119', 'Maya Patel', 'ZONE E', 'E-06', 'E15', json.dumps([{'sku': 'WH-8030', 'name': 'Collapsible Bulk Tote', 'quantity': 6, 'picked': True}]), 'Normal', 'Completed', '5 min', 2, 2)
    ]

    cursor.executemany('''
        INSERT INTO picking_tasks (order_id, order_number, picker, zone, shelf, bin, items, priority, status, estimated_time, items_picked, total_items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', picking_tasks)

    # 5. Seed Smart Alerts (15 rich alerts)
    alerts = [
        ('Critical', 'Stock Depletion Risk — SKU WH-1042', 'SKU WH-1042 (Wireless ANC Headphones Pro) stock is down to 18 units with 12 units reserved. High probability of stockout within 1.6 days based on current daily demand.', 'critical', 0, 'restock', 'WH-1042'),
        ('Critical', 'Severe Picking Bottleneck Detected in Zone C', 'Zone C picking congestion is at 84% (38% above operational baseline). 4 urgent orders are delayed due to high heavy-freight density and insufficient picker staff.', 'critical', 0, 'rebalance', 'ZONE C'),
        ('Critical', 'Delayed Order SLA Breach — ORD-8942', 'Order ORD-8942 (Apex Heavy Logistics) is currently 45 minutes past estimated fulfillment window due to Zone C congestion.', 'critical', 0, 'view_order', 'ORD-8942'),
        ('Warning', 'Cold Storage Temperature Deviation — Zone D', 'Zone D sensor recorded minor variance (5.1°C vs target 4.0°C). Chiller unit 2 has engaged compensatory cooling.', 'warning', 0, 'resolve', 'ZONE D'),
        ('Warning', 'Critical Stock Warning — SKU WH-3011', 'Smart 4K Laser Cinema Projector stock is at 12 units (Reorder threshold: 25). Replenishment order advised.', 'warning', 0, 'restock', 'WH-3011'),
        ('Warning', 'High Pallet Jack Utilization — SKU WH-4099', 'Only 8 units of 5500lb Pallet Jack remaining in Zone C with 4 units locked in pending orders.', 'warning', 0, 'restock', 'WH-4099'),
        ('Warning', 'Picker Workload Imbalance', 'Marcus Vance (Zone C) has 4 active/pending heavy picking tasks while Sarah Chen & Alex Rivera are nearing completion in Zone B.', 'warning', 0, 'rebalance', 'PICKERS'),
        ('Information', '12 Inbound Replenishment Tasks Staged', 'Receiving Dock 2 has verified 12 pallets from TechCore Supplies ready for Zone B putaway.', 'info', 0, 'resolve', 'RECEIVING'),
        ('Information', 'Smart Order Batching Completed', 'Smart Allocation Engine optimized 6 new inbound orders for minimal walking distance across Zone A and Zone B.', 'info', 1, 'resolve', 'SYSTEM'),
        ('Information', 'Automated Daily Cycle Count Ready', 'Zone E high-bay cycle count scheduled for 22:00 tonight. Estimated duration: 45 minutes.', 'info', 1, 'resolve', 'SYSTEM'),
        ('Success', 'Tier-1 Fulfillment Target Achieved', "Today's Tier-1 on-time dispatch rate reached 98.4% with zero damaged item reports.", 'success', 0, 'resolve', 'METRICS'),
        ('Success', 'Zone A Throughput Peak', 'Zone A successfully fulfilled 142 pick units/hour between 08:00 and 10:00 AM.', 'success', 1, 'resolve', 'ZONE A'),
        ('Success', 'AI Demand Forecast Synchronized', 'Weekly demand projections recalculated across all 36 active SKUs with 94.2% historical accuracy.', 'success', 1, 'resolve', 'AI_ENGINE'),
        ('Critical', 'Out of Stock Alert — SKU WH-6110', 'High-Density 20000mAh Power Bank reached 0 inventory. 14 backorders queued for next shipment arrival.', 'critical', 0, 'restock', 'WH-6110'),
        ('Warning', 'Hospital Filter Stock Buffer Low — SKU WH-5515', 'Zone D inventory has only 8 HEPA air filters remaining with hospital supply orders queued.', 'warning', 0, 'restock', 'WH-5515')
    ]

    cursor.executemany('''
        INSERT INTO alerts (type, title, message, severity, is_read, action_type, action_payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', alerts)

    # 6. Seed System State / Health
    system_states = [
        ('operational_health', '92'),
        ('inventory_health', '87'),
        ('fulfillment_health', '95'),
        ('warehouse_utilization', '78'),
        ('risk_level', 'LOW'),
        ('last_optimization', '2026-08-16 08:00:00'),
        ('demo_mode', 'false'),
        ('simulation_tick', '0')
    ]

    cursor.executemany('''
        INSERT OR REPLACE INTO system_state (key, value)
        VALUES (?, ?)
    ''', system_states)

    # 7. Seed Initial Audit Log
    cursor.execute('''
        INSERT INTO audit_logs (action, details)
        VALUES ('SYSTEM_INIT', 'SmartStock AI Warehouse operations database initialized and seeded with baseline operational datasets.')
    ''')

    conn.commit()
    conn.close()
    print("Realistic warehouse seed data inserted successfully!")

if __name__ == '__main__':
    seed_database()
