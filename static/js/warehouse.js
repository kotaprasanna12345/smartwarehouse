/**
 * SMARTSTOCK AI — 3D Digital Warehouse Twin & Spatial Map Controller (warehouse.js)
 * Coordinates Three.js 3D viewport, 2D schematic fallback, route visualizer, and zone inspector.
 */

let warehouseZonesData = [];
let currentViewMode = '3D';

document.addEventListener('DOMContentLoaded', () => {
  loadWarehouseMap();
});

async function loadWarehouseMap() {
  try {
    const response = await fetch('/api/zones');
    const data = await response.json();

    if (data.success) {
      warehouseZonesData = data.zones;
      renderBottleneckCard(data.bottleneck);

      // Render 2D Plan first for instant fallback readiness
      renderDigitalMap(data.zones);

      // Attempt 3D Initialization
      if (currentViewMode === '3D') {
        const initialized = window.initWarehouse3DScene ? window.initWarehouse3DScene(data.zones) : false;
        if (!initialized) {
          switchWarehouseViewMode('2D');
        }
      }
    }
  } catch (error) {
    console.error('Error loading warehouse zones:', error);
    showToast('Failed to load warehouse digital map telemetry', 'danger');
    switchWarehouseViewMode('2D');
  }
}

window.refreshWarehouseView = function() {
  loadWarehouseMap();
  showToast('Warehouse telemetry refreshed', 'info');
};

/* ==========================================================================
   2D / 3D Mode Switching
   ========================================================================== */
window.switchWarehouseViewMode = function(mode) {
  currentViewMode = mode;
  const viewport3D = document.getElementById('warehouse3DViewport');
  const viewport2D = document.getElementById('warehouse2DViewport');
  const btn3D = document.getElementById('viewMode3DBtn');
  const btn2D = document.getElementById('viewMode2DBtn');

  if (mode === '3D') {
    if (viewport3D) viewport3D.style.display = 'block';
    if (viewport2D) viewport2D.style.display = 'none';
    if (btn3D) btn3D.classList.add('active');
    if (btn2D) btn2D.classList.remove('active');

    // Trigger resize to fix aspect ratio
    if (window.warehouse3D) {
      window.warehouse3D.handleResize();
    } else if (window.initWarehouse3DScene) {
      window.initWarehouse3DScene(warehouseZonesData);
    }
  } else {
    if (viewport3D) viewport3D.style.display = 'none';
    if (viewport2D) viewport2D.style.display = 'block';
    if (btn3D) btn3D.classList.remove('active');
    if (btn2D) btn2D.classList.add('active');
  }
};

/* ==========================================================================
   Camera Preset Controls
   ========================================================================== */
window.setCameraPreset = function(preset) {
  // Update button active state
  ['camIsometric', 'camTopDown', 'camZoneA', 'camZoneC', 'camCinematic'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeBtn = document.getElementById(`cam${preset.charAt(0).toUpperCase() + preset.slice(1)}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (window.warehouse3D) {
    window.warehouse3D.setCameraPreset(preset);
  }
};

window.reset3DCamera = function() {
  window.setCameraPreset('isometric');
};

/* ==========================================================================
   Picking Route Visualization
   ========================================================================== */
window.visualizeOrderRoute = function(orderNumber) {
  if (!orderNumber) {
    if (window.warehouse3D) window.warehouse3D.clearPickingRoute();
    return;
  }

  if (currentViewMode !== '3D') {
    switchWarehouseViewMode('3D');
  }

  if (window.warehouse3D) {
    window.warehouse3D.showOrderPickingRoute(orderNumber);
    showToast(`Visualizing optimal picking route for ${orderNumber}`, 'info');
  }
};

window.clearPickingRoute = function() {
  if (window.warehouse3D) {
    window.warehouse3D.clearPickingRoute();
  }
};

/* ==========================================================================
   2D Schematic Grid Render
   ========================================================================== */
function renderDigitalMap(zones) {
  const container = document.getElementById('digitalMapContainer');
  if (!container) return;

  container.innerHTML = zones.map(zone => {
    const occPercent = Math.round((zone.occupied / zone.capacity) * 100);
    let statusTheme = 'optimal';
    if (zone.status === 'Bottleneck' || zone.congestion_level >= 75) {
      statusTheme = 'bottleneck';
    } else if (zone.congestion_level >= 50 || occPercent >= 75) {
      statusTheme = 'busy';
    }

    // Generate shelf cells mock heatmap
    const shelfCells = Array.from({ length: 8 }).map((_, i) => {
      let heatClass = 'occupied-low';
      if (statusTheme === 'bottleneck' || (occPercent > 80 && i % 2 === 0)) {
        heatClass = 'occupied-high';
      } else if (occPercent > 60) {
        heatClass = 'occupied-med';
      }
      return `<div class="shelf-cell ${heatClass}">R-${i + 1}</div>`;
    }).join('');

    return `
      <div class="zone-block status-${statusTheme}" onclick="openZoneInspectionDrawer('${zone.zone_code}')">
        <div class="zone-header">
          <div>
            <span class="zone-code-tag">${zone.zone_code}</span>
            <div style="font-size:0.75rem; color:var(--text-muted);">${zone.category_focus}</div>
          </div>
          <span class="status-pill ${statusTheme === 'bottleneck' ? 'delayed' : (statusTheme === 'busy' ? 'picking' : 'in-stock')}">
            ${zone.status}
          </span>
        </div>

        <div style="font-size:0.78rem; font-weight:600;">Rack Units & Storage Bays:</div>
        <div class="shelf-grid">
          ${shelfCells}
        </div>

        <div class="zone-footer-metrics">
          <div>Occupancy: <strong>${occPercent}%</strong> (${zone.occupied.toLocaleString()} units)</div>
          <div>Pickers: <strong>${zone.picker_count} active</strong></div>
        </div>

        <div class="gauge-bar-bg" style="height:4px; margin-top:4px;">
          <div class="gauge-bar-fill ${statusTheme === 'bottleneck' ? 'danger' : (statusTheme === 'busy' ? 'warning' : 'primary')}" style="width:${zone.congestion_level}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBottleneckCard(bottleneck) {
  const container = document.getElementById('mapBottleneckDiagnostic');
  if (!container || !bottleneck) return;

  if (bottleneck.has_bottleneck) {
    container.innerHTML = `
      <div class="bottleneck-banner">
        <div class="bottleneck-info">
          <div class="bottleneck-icon-pulse">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <div class="bottleneck-title">🚨 Primary Fulfillment Bottleneck: ${bottleneck.zone_name}</div>
            <div class="bottleneck-desc">
              Current Congestion: <strong>${bottleneck.congestion_level}%</strong> | Active Pickers: <strong>${bottleneck.picker_count}</strong> | ${bottleneck.reason}
            </div>
          </div>
        </div>
        <button class="bottleneck-action-btn" onclick="executeMapRebalance('${bottleneck.donor_zone}', '${bottleneck.bottleneck_zone}')">
          <i class="fas fa-bolt"></i> Rebalance 2 Pickers to ${bottleneck.bottleneck_zone} (+${bottleneck.estimated_improvement}% Throughput)
        </button>
      </div>
    `;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

/* ==========================================================================
   Zone Inspection Drawer
   ========================================================================== */
window.openZoneInspectionDrawer = function(zoneCode) {
  const zone = warehouseZonesData.find(z => z.zone_code === zoneCode) || {
    zone_code: zoneCode,
    zone_name: `${zoneCode} Storage Area`,
    category_focus: 'General Inventory',
    capacity: 2500,
    occupied: 1800,
    picker_count: 3,
    congestion_level: 42,
    status: 'Optimal'
  };

  const occPercent = Math.round((zone.occupied / zone.capacity) * 100);
  const isBottleneck = zone.congestion_level >= 75 || zone.status === 'Bottleneck';

  // Value calculation
  const zoneValues = { 'ZONE A': '$245,000', 'ZONE B': '$312,000', 'ZONE C': '$480,000', 'ZONE D': '$195,000', 'ZONE E': '$118,000' };
  const zoneOrders = { 'ZONE A': '8 active', 'ZONE B': '6 active', 'ZONE C': '14 active (Backlog)', 'ZONE D': '3 active', 'ZONE E': '2 active' };

  document.getElementById('drawerZoneCode').textContent = zone.zone_code;
  document.getElementById('drawerZoneName').textContent = zone.zone_name;
  document.getElementById('drawerZoneFocus').textContent = zone.category_focus;
  document.getElementById('drawerZoneCapacity').textContent = `${zone.capacity.toLocaleString()} units`;
  document.getElementById('drawerZoneOccupied').textContent = `${zone.occupied.toLocaleString()} units (${occPercent}%)`;
  document.getElementById('drawerZonePickers').textContent = `${zone.picker_count} active pickers`;
  document.getElementById('drawerZoneOrders').textContent = zoneOrders[zone.zone_code] || '4 active';
  document.getElementById('drawerZoneValue').textContent = zoneValues[zone.zone_code] || '$150,000';
  document.getElementById('drawerZoneTemp').textContent = zone.temperature || 'Ambient (21°C)';
  document.getElementById('drawerZoneSpeed').textContent = `${zone.speed_rating || 4.8} / 5.0`;

  // Congestion Card
  const congNum = document.getElementById('drawerZoneCongestionNum');
  const congBar = document.getElementById('drawerZoneCongestionBar');
  const statusPill = document.getElementById('drawerZoneStatusPill');

  if (congNum) congNum.textContent = `${zone.congestion_level}%`;
  if (congBar) {
    congBar.style.width = `${zone.congestion_level}%`;
    congBar.className = `gauge-bar-fill ${isBottleneck ? 'danger' : (zone.congestion_level > 50 ? 'warning' : 'primary')}`;
  }
  if (statusPill) {
    statusPill.textContent = isBottleneck ? 'BOTTLENECK' : (zone.congestion_level > 50 ? 'BUSY' : 'OPTIMAL');
    statusPill.className = `status-pill ${isBottleneck ? 'delayed' : (zone.congestion_level > 50 ? 'picking' : 'in-stock')}`;
  }

  // AI Recommendation
  const recEl = document.getElementById('drawerZoneRecommendation');
  if (recEl) {
    if (isBottleneck) {
      recEl.innerHTML = `⚠️ <strong>Bottleneck Alert:</strong> High density of heavy freight orders has saturated pickers. Reallocating 2 pickers will reduce congestion by ~42% and recover +18% throughput.`;
    } else {
      recEl.textContent = `Zone operations are currently running within optimal velocity tolerances (${zone.congestion_level}% congestion). Workload is balanced.`;
    }
  }

  const rebalanceBtn = document.getElementById('drawerZoneRebalanceBtn');
  if (rebalanceBtn) {
    if (zone.congestion_level >= 50 || isBottleneck) {
      rebalanceBtn.style.display = 'flex';
      rebalanceBtn.onclick = () => executeMapRebalance('ZONE B', zone.zone_code);
    } else {
      rebalanceBtn.style.display = 'none';
    }
  }

  openDrawer('zoneDetailDrawer');
};

async function executeMapRebalance(donorZone, targetZone) {
  try {
    const res = await fetch('/api/zones/rebalance', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ source_zone: donorZone, target_zone: targetZone, count: 2 })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeDrawer('zoneDetailDrawer');
      loadWarehouseMap();
    }
  } catch (err) {
    showToast('Failed to rebalance pickers', 'danger');
  }
}

