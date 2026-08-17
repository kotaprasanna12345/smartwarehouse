/**
 * SMARTSTOCK AI — Fulfillment & Picking Control Center Controller (fulfillment.js)
 * FIFO Picking Queue, RF Scanner Modal, pick execution, and missing item reporting.
 */

let activePickingTasks = [];
let currentPickingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  initFulfillmentFilters();
  loadPickingQueue();
});

function initFulfillmentFilters() {
  const statusFilter = document.getElementById('pickStatusFilter');
  const zoneFilter = document.getElementById('pickZoneFilter');

  if (statusFilter) {
    statusFilter.addEventListener('change', loadPickingQueue);
  }

  if (zoneFilter) {
    zoneFilter.addEventListener('change', loadPickingQueue);
  }
}

async function loadPickingQueue() {
  const status = document.getElementById('pickStatusFilter')?.value || 'All';
  const zone = document.getElementById('pickZoneFilter')?.value || 'All';

  const params = new URLSearchParams({ status, zone });

  try {
    const response = await fetch(`/api/picking?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      activePickingTasks = data.tasks;
      renderPickingMetrics(data.metrics);
      renderPickingTable(data.tasks);
    }
  } catch (error) {
    console.error('Error loading picking tasks:', error);
    showToast('Failed to load fulfillment tasks', 'danger');
  }
}

function renderPickingMetrics(metrics) {
  if (!metrics) return;
  const pickersEl = document.getElementById('metricsActivePickers');
  const pendingEl = document.getElementById('metricsPendingTasks');
  const avgTimeEl = document.getElementById('metricsAvgPickTime');
  const accuracyEl = document.getElementById('metricsPickAccuracy');

  if (pickersEl) pickersEl.textContent = metrics.active_pickers;
  if (pendingEl) pendingEl.textContent = metrics.pending_tasks;
  if (avgTimeEl) avgTimeEl.textContent = metrics.avg_pick_time;
  if (accuracyEl) accuracyEl.textContent = metrics.picking_accuracy;
}

function renderPickingTable(tasks) {
  const tbody = document.getElementById('pickingTableBody');
  if (!tbody) return;

  if (!tasks || tasks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="fas fa-dolly" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          No picking tasks found in current queue.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tasks.map(t => {
    const priorityClass = t.priority.toLowerCase();
    const isCompleted = t.status === 'Completed';
    const isIssue = t.status === 'Issue Reported';

    return `
      <tr style="cursor:pointer;" onclick="openPickingScannerModal(${t.id})">
        <td>
          <span style="font-family:monospace; font-weight:700; color:var(--primary);">TASK-${t.id.toString().padStart(4, '0')}</span>
        </td>
        <td>
          <strong>${t.order_number}</strong>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="user-avatar" style="width:26px; height:26px; font-size:0.7rem;">${t.picker ? t.picker[0] : 'P'}</div>
            <span>${t.picker}</span>
          </div>
        </td>
        <td>
          <span class="nav-badge primary">${t.zone}</span>
        </td>
        <td>
          <span class="priority-pill ${priorityClass}">${t.priority}</span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:600; font-size:0.8rem;">${t.items_picked || 0}/${t.total_items || 1} Picked</span>
          </div>
          <div class="gauge-bar-bg" style="height:4px; margin-top:3px;">
            <div class="gauge-bar-fill ${isCompleted ? 'success' : 'primary'}" style="width:${Math.round(((t.items_picked || 0) / (t.total_items || 1)) * 100)}%;"></div>
          </div>
        </td>
        <td>
          <span class="status-pill ${isCompleted ? 'shipped' : (isIssue ? 'delayed' : 'picking')}">${t.status}</span>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem;" onclick="openPickingScannerModal(${t.id})">
            <i class="fas fa-barcode"></i> ${isCompleted ? 'Review' : 'Start Pick'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   RF Scanner / Interactive Picking Modal
   ========================================================================== */
function openPickingScannerModal(taskId) {
  const task = activePickingTasks.find(t => t.id === taskId);
  if (!task) return;

  currentPickingTaskId = taskId;

  document.getElementById('scannerTaskId').textContent = `TASK-${task.id.toString().padStart(4, '0')}`;
  document.getElementById('scannerOrderNum').textContent = task.order_number;
  document.getElementById('scannerPicker').textContent = task.picker;
  document.getElementById('scannerZone').textContent = task.zone;
  document.getElementById('scannerShelfBin').textContent = `Shelf ${task.shelf || 'C-01'} • Bin ${task.bin || 'C02'}`;
  document.getElementById('scannerPriority').innerHTML = `<span class="priority-pill ${task.priority.toLowerCase()}">${task.priority}</span>`;
  document.getElementById('scannerEstTime').textContent = task.estimated_time || '8 min';

  // Items to pick
  const itemsContainer = document.getElementById('scannerItemsList');
  if (itemsContainer) {
    const items = Array.isArray(task.items) ? task.items : [];
    itemsContainer.innerHTML = items.map(it => `
      <div style="background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <span style="font-family:monospace; font-weight:700; color:var(--primary); font-size:0.8rem;">${it.sku || 'WH-4099'}</span>
          <div style="font-weight:600; font-size:0.88rem;">${it.name || 'Heavy Duty Pallet Jack'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Pick Qty: <strong>${it.quantity || 1} units</strong></div>
        </div>
        <span class="status-pill ${task.items_picked > 0 ? 'in-stock' : 'low-stock'}">
          ${task.items_picked > 0 ? 'Verified' : 'Pending Scan'}
        </span>
      </div>
    `).join('');
  }

  // Scan progress
  const progressText = document.getElementById('scannerProgressText');
  const progressBar = document.getElementById('scannerProgressBar');
  if (progressText) progressText.textContent = `${task.items_picked || 0} of ${task.total_items || 1} Items Verified`;
  if (progressBar) progressBar.style.width = `${Math.round(((task.items_picked || 0) / (task.total_items || 1)) * 100)}%`;

  openModal('rfScannerModal');
}

async function handlePickingAction(action) {
  if (!currentPickingTaskId) return;

  try {
    const res = await fetch(`/api/picking/${currentPickingTaskId}/action`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: action })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, action === 'mark_missing' ? 'warning' : 'success');
      closeModal('rfScannerModal');
      loadPickingQueue();
    } else {
      showToast(data.error || 'Action failed', 'danger');
    }
  } catch (err) {
    showToast('Error communicating with picking API', 'danger');
  }
}
