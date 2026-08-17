/**
 * SMARTSTOCK AI — Dashboard Controller (dashboard.js)
 * Real-time operational intelligence, Chart.js graphs with gradients,
 * animated KPI counters, dynamic health gauges, and interactive pipeline.
 */

let fulfillmentChartInstance = null;
let inventoryChartInstance = null;
let zoneChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();

    if (data.success) {
      renderKPIs(data.health.metrics);
      renderHealthCommandCenter(data.health);
      renderBottleneckBanner(data.bottleneck);
      renderCharts(data.charts);
      renderPipeline(data.pipeline);
      renderRecentAlerts(data.recent_alerts);
      if (window.markUpdated) window.markUpdated();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Failed to load real-time dashboard data', 'danger');
  }
}

/* ==========================================================================
   KPI Cards & Smooth Number Counters
   ========================================================================== */
function renderKPIs(metrics) {
  if (!metrics) return;

  animateCounter('kpiTotalProducts', metrics.total_products);
  animateCounter('kpiInventoryUnits', metrics.total_units);
  animateCounter('kpiPendingOrders', metrics.pending_orders);
  animateCounter('kpiFulfilledOrders', metrics.orders_fulfilled_today);
  animateCounter('kpiLowStock', metrics.low_stock_items);
  
  // Percentages & Cycle Times
  animateFormattedCounter('kpiPickEfficiency', metrics.picking_efficiency, '%');
  animateFormattedCounter('kpiAvgFulfillment', metrics.avg_fulfillment_time, ' min');
  animateFormattedCounter('kpiOnTimeRate', metrics.on_time_shipment_rate, '%');
}

function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const target = parseInt(targetValue, 10) || 0;
  let start = 0;
  const duration = 650;
  const stepTime = 16;
  const steps = duration / stepTime;
  const increment = target / steps;

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start).toLocaleString();
    }
  }, stepTime);
}

function animateFormattedCounter(elementId, formattedString, suffix) {
  const el = document.getElementById(elementId);
  if (!el || !formattedString) return;

  const numVal = parseFloat(String(formattedString).replace(/[^0-9.]/g, '')) || 0;
  let current = 0;
  const duration = 650;
  const stepTime = 16;
  const steps = duration / stepTime;
  const inc = numVal / steps;

  const timer = setInterval(() => {
    current += inc;
    if (current >= numVal) {
      el.textContent = `${numVal.toFixed(1)}${suffix}`;
      clearInterval(timer);
    } else {
      el.textContent = `${current.toFixed(1)}${suffix}`;
    }
  }, stepTime);
}

/* ==========================================================================
   Command Center Health & Gauges
   ========================================================================== */
function renderHealthCommandCenter(health) {
  if (!health) return;

  // Health Score Circle
  const scoreNum = document.getElementById('overallHealthScore');
  const scoreCircle = document.getElementById('overallHealthCircle');
  if (scoreNum) scoreNum.textContent = `${health.operational_health}%`;
  if (scoreCircle) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const trackColor = isDark ? '#1E293B' : '#E2E8F0';
    const strokeCol = health.operational_health > 85 ? '#10B981' : (health.operational_health > 60 ? '#2563EB' : '#EF4444');
    scoreCircle.style.background = `conic-gradient(${strokeCol} 0% ${health.operational_health}%, ${trackColor} ${health.operational_health}% 100%)`;
  }

  // Risk Badge
  const riskBadge = document.getElementById('riskLevelBadge');
  if (riskBadge) {
    riskBadge.textContent = `${health.risk_level} RISK (${health.risk_score} pts)`;
    riskBadge.className = `risk-level-badge ${health.risk_level.toLowerCase()}`;
  }

  // Gauges
  setGauge('gaugeOperational', health.operational_health, health.operational_health > 80 ? 'primary' : 'warning');
  setGauge('gaugeInventory', health.inventory_health, health.inventory_health > 80 ? 'secondary' : 'danger');
  setGauge('gaugeFulfillment', health.fulfillment_health, health.fulfillment_health > 85 ? 'success' : 'warning');
  setGauge('gaugeUtilization', health.warehouse_utilization, 'warning');
}

function setGauge(id, value, colorClass) {
  const valEl = document.getElementById(`${id}Val`);
  const fillEl = document.getElementById(`${id}Fill`);
  if (valEl) valEl.textContent = `${value}%`;
  if (fillEl) {
    fillEl.style.width = `${value}%`;
    fillEl.className = `gauge-bar-fill ${colorClass}`;
  }
}

/* ==========================================================================
   Bottleneck Alert Banner
   ========================================================================== */
function renderBottleneckBanner(bottleneck) {
  const container = document.getElementById('bottleneckBannerContainer');
  if (!container) return;

  if (bottleneck && bottleneck.has_bottleneck) {
    container.innerHTML = `
      <div class="bottleneck-banner">
        <div class="bottleneck-info">
          <div class="bottleneck-icon-pulse">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <div class="bottleneck-title">🔴 Operational Bottleneck Detected: ${bottleneck.zone_name}</div>
            <div class="bottleneck-desc">
              Congestion: <strong>${bottleneck.congestion_level}%</strong> | Active Pickers: <strong>${bottleneck.picker_count}</strong> | ${bottleneck.reason}
            </div>
          </div>
        </div>
        <button class="bottleneck-action-btn" onclick="triggerZoneRebalance('${bottleneck.donor_zone}', '${bottleneck.bottleneck_zone}')">
          <i class="fas fa-bolt"></i> ${bottleneck.action_label} (+${bottleneck.estimated_improvement}% Boost)
        </button>
      </div>
    `;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

async function triggerZoneRebalance(donorZone, targetZone) {
  try {
    const res = await fetch('/api/zones/rebalance', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ source_zone: donorZone, target_zone: targetZone, count: 2 })
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      loadDashboardData();
    }
  } catch (err) {
    showToast('Failed to rebalance pickers', 'danger');
  }
}

/* ==========================================================================
   Chart.js Visualizations with Gradients
   ========================================================================== */
function renderCharts(charts) {
  if (!charts) return;

  const textColor = '#94A3B8';
  const gridColor = 'rgba(0, 240, 255, 0.08)';

  // 1. Fulfillment 7-Day Velocity Trend Chart with Neon Gradients
  const ctxFulfill = document.getElementById('fulfillmentTrendChart');
  if (ctxFulfill) {
    if (fulfillmentChartInstance) fulfillmentChartInstance.destroy();

    const ctx = ctxFulfill.getContext('2d');
    const cyanGradient = ctx.createLinearGradient(0, 0, 0, 240);
    cyanGradient.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    cyanGradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    fulfillmentChartInstance = new Chart(ctxFulfill, {
      type: 'line',
      data: {
        labels: charts.fulfillment_trend.labels,
        datasets: [
          {
            label: 'Orders Received',
            data: charts.fulfillment_trend.orders_received,
            borderColor: '#00F0FF',
            backgroundColor: cyanGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.8,
            pointRadius: 5,
            pointBackgroundColor: '#00F0FF',
            pointBorderColor: '#090D1A',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          },
          {
            label: 'Orders Fulfilled',
            data: charts.fulfillment_trend.orders_fulfilled,
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2.8,
            pointRadius: 5,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#090D1A',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          },
          {
            label: 'SLA Target Baseline',
            data: charts.fulfillment_trend.sla_target,
            borderColor: '#F59E0B',
            borderDash: [6, 6],
            fill: false,
            tension: 0.2,
            borderWidth: 1.8,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { size: 11, family: 'Inter', weight: '600' }, boxWidth: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(9, 13, 26, 0.95)',
            titleColor: '#00F0FF',
            bodyColor: '#F0F6FC',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
        }
      }
    });
  }

  // 2. Inventory Distribution Doughnut Chart with Cyber Accents
  const ctxInv = document.getElementById('inventoryDistributionChart');
  if (ctxInv) {
    if (inventoryChartInstance) inventoryChartInstance.destroy();

    inventoryChartInstance = new Chart(ctxInv, {
      type: 'doughnut',
      data: {
        labels: charts.inventory_distribution.labels,
        datasets: [{
          data: charts.inventory_distribution.data,
          backgroundColor: ['#10B981', '#F59E0B', '#FF3366', '#00F0FF'],
          borderColor: '#090D1A',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { size: 11, family: 'Inter', weight: '600' }, padding: 16, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: 'rgba(9, 13, 26, 0.95)',
            titleColor: '#00F0FF',
            bodyColor: '#F0F6FC',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });
  }

  // 3. Warehouse Zone Performance Bar Chart with Cyber Glow Bars
  const ctxZone = document.getElementById('zonePerformanceChart');
  if (ctxZone) {
    if (zoneChartInstance) zoneChartInstance.destroy();

    zoneChartInstance = new Chart(ctxZone, {
      type: 'bar',
      data: {
        labels: charts.zone_performance.labels,
        datasets: [
          {
            label: 'Occupancy %',
            data: charts.zone_performance.occupancy,
            backgroundColor: '#00F0FF',
            borderRadius: 6,
            barPercentage: 0.65
          },
          {
            label: 'Congestion %',
            data: charts.zone_performance.congestion,
            backgroundColor: '#FF3366',
            borderRadius: 6,
            barPercentage: 0.65
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { size: 11, family: 'Inter', weight: '600' }, boxWidth: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(9, 13, 26, 0.95)',
            titleColor: '#00F0FF',
            bodyColor: '#F0F6FC',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, max: 100 }
        }
      }
    });
  }
}

/* ==========================================================================
   Order Pipeline Funnel
   ========================================================================== */
function renderPipeline(pipeline) {
  if (!pipeline) return;

  const map = {
    pipeNew: pipeline.new,
    pipeAllocated: pipeline.allocated,
    pipePicking: pipeline.picking,
    pipePacked: pipeline.packed,
    pipeReady: pipeline.ready_to_ship,
    pipeShipped: pipeline.shipped,
    pipeDelivered: pipeline.delivered,
    pipeDelayed: pipeline.delayed
  };

  for (const [id, count] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      // Pulse active stage
      if (count > 0 && id !== 'pipeDelivered') {
        el.parentElement.classList.add('active-flow');
      }
    }
  }
}

/* ==========================================================================
   Recent Alerts Preview
   ========================================================================== */
function renderRecentAlerts(alerts) {
  const container = document.getElementById('dashboardAlertsList');
  if (!container) return;

  if (alerts && alerts.length > 0) {
    container.innerHTML = alerts.map(alert => `
      <div style="display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-subtle);">
        <div class="notification-icon ${alert.severity}" style="width:32px; height:32px; font-size:0.85rem; flex-shrink:0;">
          <i class="fas fa-${getAlertIcon(alert.type)}"></i>
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="font-weight:600; font-size:0.82rem;">${alert.title}</div>
            <span class="priority-pill ${alert.severity}">${alert.type}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${alert.message}</div>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted);">No active alerts</div>`;
  }
}

// Global Refresh Helper
window.refreshDashboard = function() {
  loadDashboardData();
  showToast('Warehouse telemetry refreshed', 'info');
};

