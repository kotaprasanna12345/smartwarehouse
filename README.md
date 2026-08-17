# 🚀 SMARTSTOCK AI — Intelligent Warehouse Operations & Order Fulfillment Platform

> **Hackathon Edition** — Real-time operational intelligence, spatial digital warehouse mapping, predictive bottleneck detection, AI-assisted stock replenishment, and 1-Click Warehouse Optimization.

---

## 🌟 Executive Summary & Problem Understanding

Traditional warehouse management systems (WMS) function as passive inventory ledgers. They suffer from:
1. **Zero Spatial Visibility**: Floor managers cannot detect aisle traffic saturation or forklift delays before SLAs fail.
2. **Reactive Stockouts**: Inventory is replenished only after stock runs dry or backorders mount.
3. **Imbalanced Picker Workloads**: Pickers bunch up in high-density aisles (like bulky goods) while other zones sit underutilized.
4. **Manual Allocation**: Order routing does not consider picker walking distances or real-time zone congestion.

**SMARTSTOCK AI** transforms warehouse operations into an active, self-balancing command center that dynamically balances picker staff, forecasts depletion horizons with confidence scores, visualizes 2D storage racks, and optimizes warehouse throughput with a single click.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 Semantic Markup | Clean, accessible DOM structure |
| **Styling** | Vanilla CSS3 (Custom Design System) | Sleek modern aesthetics, Light/Dark mode, Glassmorphism, 0 external CSS framework bloat |
| **Interactivity** | Vanilla ES6+ JavaScript | Fast, modular, zero build step overhead |
| **Visualizations** | Chart.js 4.4 CDN | Responsive line, doughnut, bar, and radar charts |
| **Icons & Fonts** | FontAwesome 6 CDN, Inter & Outfit Fonts | Crisp enterprise typography and glyphs |
| **Backend API** | Python 3.10+, Flask 3.1, Flask-CORS | Modular REST endpoints, algorithmic business logic |
| **Database** | SQLite 3 | Embedded zero-configuration persistent relational database |

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────────────────────┐
                                  │             Web Browser (Client UI)           │
                                  │   HTML5 + Vanilla CSS3 + Vanilla JavaScript    │
                                  │     Chart.js + FontAwesome + Inter Fonts       │
                                  └───────────────────────┬────────────────────────┘
                                                          │ HTTP / JSON REST
                                                          ▼
                                  ┌────────────────────────────────────────────────┐
                                  │          Flask Web Server (app.py)             │
                                  │        Page Rendering + REST Endpoints         │
                                  └───────────────────────┬────────────────────────┘
                                                          │
                                ┌─────────────────────────┴────────────────────────┐
                                │                                                  │
                                ▼                                                  ▼
      ┌────────────────────────────────────────────────┐        ┌──────────────────────────────────────┐
      │         Intelligence Engine (engine.py)        │        │        SQLite Database (database.db) │
      │  • Warehouse Health & Risk Scoring             │        │  • products (36 SKUs)                │
      │  • Bottleneck Detection (Order density/staff)  │◄──────►│  • orders (30 Orders)                │
      │  • AI Replenishment (EOQ + Depletion horizon)  │        │  • picking_tasks (18 Tasks)          │
      │  • Smart Order Allocation (Distance/Zone load) │        │  • alerts (15 Alerts)                │
      │  • ⚡ 1-Click Warehouse Optimizer              │        │  • warehouse_zones (6 Zones)         │
      │  • SmartStock AI Copilot NLP Responder         │        │  • audit_logs & system_state         │
      │  • 🎮 Hackathon Demo Mode Simulator            │        └──────────────────────────────────────┘
      └────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🎛️ Warehouse Command Center
- **8 Live KPI Cards**: Total SKUs, Inventory Units, Pending Orders, Fulfilled Today, Critical Stock, Picking Efficiency (98.6%), Average Fulfillment Time (7.4 min), On-Time Shipment Rate (98.4%).
- **Real-Time Operational Health**: Circular health gauge (92%), Risk Level badge (LOW), and 4 progress gauges for Operational, Inventory, Fulfillment, and Warehouse Utilization.
- **7-Day Fulfillment Velocity Chart**: Comparing incoming orders, fulfilled shipments, and SLA baselines.
- **Inventory Health Doughnut**: Live distribution of Healthy, Low Stock, Critical, and Out of Stock products.
- **Order Pipeline Stages**: Visual 6-stage funnel (New → Allocated → Picking → Packed → Ready to Ship → Shipped → Delivered).

### 2. 🗺️ 2D Digital Warehouse Map & Spatial Heatmap
- Pure CSS Grid / Flexbox 2D floor layout (Zone A, Zone B, Zone C, Zone D, Zone E, Receiving Dock, Packing Station, Outbound Shipping Bays).
- Individual storage bay rack heatmap cells (Green = Optimal, Yellow = Busy, Red = Bottleneck).
- Clickable Zone inspection drawer with real-time capacity, active pickers, temperature, speed rating, and a 1-Click **"Rebalance Pickers"** button.

### 3. 🚨 Predictive Bottleneck Detection Engine
- Automatically identifies fulfillment bottlenecks by comparing order density against active picker counts.
- Highlights **Zone C (Heavy Freight)** when congestion reaches 84% and recommends moving 2 pickers from underutilized Zone B, forecasting an **+18% throughput recovery**.

### 4. 🧠 AI-Assisted Smart Stock Replenishment
- Rule-based predictive math: $\text{Days Remaining} = \frac{\text{Available Quantity}}{\text{Daily Demand}}$.
- Calculates Safety Stock shortfall, Economic Order Quantity (EOQ), depletion horizons, and confidence scores (94-96%).
- 1-Click **"Replenish Stock"** button that instantly updates SQLite inventory and queues putting-away tasks.

### 5. 📦 Orders & Smart Allocation Engine
- Filterable orders management table with 7-stage fulfillment tracking.
- Smart Allocation modal: calculates optimal zone, walking distance (48m), zone congestion penalty, and picker availability.
- 1-Click **"Accept Recommendation"** to auto-assign pickers and queue FIFO tasks.

### 6. 🛒 Fulfillment Control Center & Mobile RF Scanner
- FIFO-ordered smart picking queue with priority scoring.
- Interactive Mobile RF Scanner simulation modal:
  - `[Pick & Scan Item]`: Verifies barcodes and updates live progress.
  - `[Mark Missing]`: Triggers supervisor alert and flags discrepancy.
  - `[Report Issue]`: Reports aisle obstructions or damaged goods.
  - `[Complete Task]`: Advances order to Packing bay.

### 7. 🤖 SmartStock AI Copilot
- Conversational warehouse assistant with natural language understanding.
- Quick suggestion prompts:
  - *"Which products need restocking?"*
  - *"Why are orders delayed?"*
  - *"Which warehouse zone is congested?"*
  - *"How can I improve today's fulfillment?"*
  - *"Predict tomorrow's demand"*
- Direct action buttons embedded inside assistant responses.

### 8. ⚡ HERO FEATURE — 1-Click Warehouse Optimizer
- Executes a global optimization sequence:
  1. Rebalances pickers to congested zones (reducing Zone C congestion from 84% to 42%).
  2. Escalates delayed orders in the FIFO picking queue.
  3. Triggers automated replenishment requisitions for critical SKUs.
  4. Lifts Overall Operational Health from **82% to 96% (+14% improvement)**.

### 9. 🎮 Hackathon Demo Mode
- Live toggle switch in top navigation that runs an automated operations ticker every 5 seconds.
- Simulates real-time picking completions, order stage transitions, and telemetry updates for presentation wow-factor.

---

## 📂 Project Directory Structure

```
smartstock-ai/
│
├── app.py                     # Flask REST API endpoints and web routes
├── database.py                # SQLite schema and connection helpers
├── engine.py                  # Intelligence engine (risk, allocation, bottleneck, copilot, optimizer)
├── seed_data.py               # Realistic dataset (36 products, 30 orders, 18 picking tasks, 15 alerts, 6 zones)
├── requirements.txt           # Python dependencies (Flask, Flask-CORS)
├── README.md                  # Complete documentation
│
├── templates/
│   ├── layout.html            # Master layout with sidebar, topbar, theme toggle, and optimizer modal
│   ├── login.html             # Login screen with hackathon demo auto-fill
│   ├── index.html             # Dashboard (Warehouse Command Center)
│   ├── inventory.html         # Inventory table, product detail drawer, and replenishment card
│   ├── orders.html            # Orders center, timeline viewer, and smart allocation modal
│   ├── fulfillment.html       # Fulfillment center with FIFO queue and interactive RF scanner
│   ├── warehouse.html         # 2D Digital Warehouse Map with heatmaps and zone drawer
│   ├── analytics.html         # Multi-timeframe SLA analytics, radar charts, and histograms
│   ├── alerts.html            # Alerts command center with severity filters and actions
│   ├── ai-insights.html       # SmartStock AI Copilot chat and dynamic predictive cards
│   └── settings.html          # Operational thresholds and demo reset controls
│
└── static/
    ├── css/
    │   └── style.css          # Design system (CSS variables, light/dark mode, glassmorphism, responsive)
    └── js/
        ├── main.js            # Global navbar, theme switch, global search, notifications, live pulse, toasts
        ├── dashboard.js       # KPI counters, health gauges, Chart.js graphs, pipeline
        ├── inventory.js       # Inventory table filtering, pagination, drawer, stock history chart
        ├── orders.js          # Orders table, 7-stage fulfillment timeline, smart allocation modal
        ├── fulfillment.js    # FIFO picking queue, interactive RF scanner modal actions
        ├── warehouse.js       # 2D digital map, heatmaps, zone inspection drawer, rebalancing
        ├── analytics.js       # Multi-timeframe analytics charts (line, radar, histogram)
        ├── alerts.js          # Alert filters, read status toggles, dismissal, action routing
        ├── ai-insights.js     # AI Copilot chat handler, typing animation, predictive cards
        ├── optimizer.js       # ⚡ 1-Click Warehouse Optimizer modal & simulation
        └── demo-mode.js       # 🎮 Hackathon Demo Mode background simulation ticker
```

---

## 🚀 Quickstart & Installation

### 1. Prerequisites
- Python 3.10 or newer installed.

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize & Seed Database
```bash
python seed_data.py
```

### 4. Start the Application
```bash
python app.py
```

### 5. Access the Web Application
Open your browser and navigate to:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Warehouse Operations Lead** | `admin@smartstock.ai` | `admin123` |

*(You can also click the **"Auto Fill"** button on the login screen for instant demo access.)*

---

## 🎯 3-Minute Hackathon Demo Script for Judges

1. **Login Screen**: Open `http://127.0.0.1:5000/login`, click **"Auto Fill"** and sign in.
2. **Warehouse Command Center**:
   - Point out the **92% Operational Health** score and **8 Top KPI Cards**.
   - Show the **7-Day Fulfillment Trend** and **Inventory Health Doughnut**.
   - Notice the pulsing **🔴 Bottleneck Banner: Zone C (84% congestion)**.
3. **Inventory & AI Replenishment**:
   - Go to `/inventory`, filter by **"Critical Depletion"**.
   - Click **`WH-1042` (Wireless ANC Headphones Pro)** to open the drawer.
   - Show the **AI-Assisted Replenishment Card** (Predicted 1.6 days remaining, 96% confidence).
   - Click **"Replenish 80 Units"** and show instant live stock update!
4. **Orders & 7-Stage Timeline**:
   - Go to `/orders`, click delayed order **`ORD-8942`**.
   - Show the interactive **7-Stage Fulfillment Progress Timeline** highlighting the bottleneck delay.
   - Click **"Allocate"** to trigger the **Smart Order Allocation Engine** and accept recommendation.
5. **Fulfillment & RF Scanner**:
   - Go to `/fulfillment`, click **"Start Pick"** on `TASK-0001`.
   - Click **"[Pick & Scan Item]"** and **"[Complete Task]"** to see live order progression.
6. **2D Digital Warehouse Map**:
   - Go to `/warehouse`, show the visual **2D Zone Map** with red bottleneck highlighting on Zone C.
   - Click **Zone C** to inspect bay capacity and picker distribution.
7. **SmartStock AI Copilot**:
   - Go to `/ai-insights`, click the quick chip: *"Why are orders delayed?"*.
   - Watch the assistant analyze live SQLite telemetry and identify Zone C picker deficit.
8. **⚡ Hero Feature — 1-Click Warehouse Optimizer**:
   - Click **"⚡ OPTIMIZE WAREHOUSE"** in the top navigation header.
   - Watch the 4-step AI optimization sequence rebalance pickers, escalate delayed orders, and lift warehouse health from **82% to 96% (+14% throughput gain)**!

---

## 🌐 Complete REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated KPIs, health scores, charts, and pipeline stage counts |
| `GET` | `/api/products` | Paginated product catalog with category, status, and zone filters |
| `GET` | `/api/products/<id>` | Product detail with replenishment math and stock movement history |
| `POST` | `/api/products` | Add new product SKU to inventory |
| `POST` | `/api/products/<id>/reorder` | Trigger smart replenishment batch for SKU |
| `GET` | `/api/orders` | Paginated orders list with status and priority filters |
| `GET` | `/api/orders/<id>` | Order details with 7-stage fulfillment timeline tracking |
| `POST` | `/api/allocation/recommend` | Calculate shortest-distance optimal zone allocation |
| `POST` | `/api/orders/<id>/allocate` | Apply recommended zone and assign picker |
| `GET` | `/api/picking` | FIFO smart picking task queue |
| `POST` | `/api/picking/<id>/action` | Handle RF scanner actions (`pick_item`, `complete`, `mark_missing`) |
| `GET` | `/api/zones` | All warehouse zones with occupancies and congestion levels |
| `POST` | `/api/zones/rebalance` | Transfer pickers between donor and congested zones |
| `GET` | `/api/alerts` | Exceptions and alerts with severity and read status filters |
| `PUT` | `/api/alerts/<id>/read` | Mark alert as read |
| `POST` | `/api/alerts/mark-all-read`| Mark all alerts as read |
| `GET` | `/api/analytics` | Multi-timeframe SLA metrics, radar benchmarks, and histograms |
| `GET` | `/api/ai/insights` | Predictive operational insight cards with confidence ratings |
| `POST` | `/api/ai/chat` | AI Copilot natural language processing query handler |
| `POST` | `/api/optimize` | ⚡ Execute 1-Click global warehouse optimization |
| `POST` | `/api/demo/tick` | 🎮 Hackathon demo mode live simulation step |
| `POST` | `/api/demo/reset` | Reset database to pristine baseline seed data |
| `GET` | `/api/search` | Global quick search across SKUs, orders, zones, and alerts |
| `GET` | `/api/health` | Health check endpoint |

---

## 🏆 Hackathon Impact & Future Scope

- **Enterprise Scalability**: Designed with clean separation of concerns ready for ERP integrations (SAP, Oracle NetSuite, Manhattan Associates).
- **Computer Vision & IoT Sensor Ingestion**: API architecture supports direct MQTT/Websocket hooks from conveyor scales, RFID gates, and AGV robots.
- **Sustainability Optimization**: Future versions can incorporate green routing to reduce electric forklift battery draw.

---

**Crafted with excellence for Hackathons — SmartStock AI 2026**
#   s m a r t w a r e h o u s e  
 