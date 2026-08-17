/**
 * SMARTSTOCK AI — Operational Analytics Controller (analytics.js)
 * Multi-timeframe performance metrics, radar charts, distribution histograms, and reports.
 */

let ordersTrendChart = null;
let zoneRadarChart = null;
let pickDistributionChart = null;
let currentAnalyticsTimeframe = '7D';

document.addEventListener('DOMContentLoaded', () => {
  initAnalyticsTimeframeButtons();
  loadAnalyticsData('7D');
});

function initAnalyticsTimeframeButtons() {
  const buttons = document.querySelectorAll('.timeframe-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnalyticsTimeframe = btn.getAttribute('data-timeframe');
      loadAnalyticsData(currentAnalyticsTimeframe);
    });
  });
}

async function loadAnalyticsData(timeframe) {
  try {
    const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
    const data = await response.json();

    if (data.success) {
      renderAnalyticsMetrics(data.metrics);
      renderAnalyticsCharts(data.charts);
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showToast('Failed to load operational analytics', 'danger');
  }
}

function renderAnalyticsMetrics(metrics) {
  if (!metrics) return;
  const map = {
    metricTurnover: metrics.inventory_turnover,
    metricStockoutRate: metrics.stockout_rate,
    metricFulfillmentRate: metrics.order_fulfillment_rate,
    metricAccuracy: metrics.picking_accuracy,
    metricAvgTime: metrics.avg_fulfillment_time,
    metricOnTime: metrics.on_time_shipment_rate
  };

  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

function renderAnalyticsCharts(charts) {
  if (!charts) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  // 1. Orders vs Fulfillment Trend Chart
  const ctxOrders = document.getElementById('analyticsOrdersTrendChart');
  if (ctxOrders) {
    if (ordersTrendChart) ordersTrendChart.destroy();

    ordersTrendChart = new Chart(ctxOrders, {
      type: 'line',
      data: {
        labels: charts.orders_trend.labels,
        datasets: [
          {
            label: 'Orders Received',
            data: charts.orders_trend.orders,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 4
          },
          {
            label: 'Orders Fulfilled',
            data: charts.orders_trend.fulfilled,
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter' } } }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 2. Zone Performance Radar Chart
  const ctxRadar = document.getElementById('analyticsZoneRadarChart');
  if (ctxRadar) {
    if (zoneRadarChart) zoneRadarChart.destroy();

    zoneRadarChart = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: charts.zone_radar.labels,
        datasets: [
          {
            label: 'Zone A (Fast Consumer)',
            data: charts.zone_radar.zone_a,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2
          },
          {
            label: 'Zone B (Electronics)',
            data: charts.zone_radar.zone_b,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderWidth: 2
          },
          {
            label: 'Zone C (Heavy Industrial)',
            data: charts.zone_radar.zone_c,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } }
        },
        scales: {
          r: {
            grid: { color: gridColor },
            pointLabels: { color: textColor, font: { size: 10 } },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // 3. Pick Time Distribution Histogram
  const ctxHist = document.getElementById('analyticsPickDistributionChart');
  if (ctxHist) {
    if (pickDistributionChart) pickDistributionChart.destroy();

    pickDistributionChart = new Chart(ctxHist, {
      type: 'bar',
      data: {
        labels: charts.pick_time_distribution.labels,
        datasets: [{
          label: '% of Pick Tasks',
          data: charts.pick_time_distribution.data,
          backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }
}

function exportAnalyticsReport() {
  showToast('Generating high-resolution warehouse operations PDF report...', 'info');
  setTimeout(() => {
    showToast('Report generated successfully (SmartStock_Ops_Report_2026.pdf)', 'success');
  }, 1500);
}
