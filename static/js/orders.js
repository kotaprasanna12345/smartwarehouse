/**
 * SMARTSTOCK AI — Orders Management Controller (orders.js)
 * Orders filtering, 7-stage fulfillment timeline, smart allocation engine integration.
 */

let currentOrdersPage = 1;
let currentSelectedOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
  initOrderFilters();
  loadOrders();

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const filterParam = urlParams.get('filter');

  if (searchParam) {
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) searchInput.value = searchParam;
  }

  if (filterParam === 'delayed') {
    const statusSelect = document.getElementById('orderStatusFilter');
    if (statusSelect) statusSelect.value = 'Delayed';
  }

  loadOrders();
});

function initOrderFilters() {
  const searchInput = document.getElementById('orderSearchInput');
  const statusFilter = document.getElementById('orderStatusFilter');
  const priorityFilter = document.getElementById('orderPriorityFilter');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentOrdersPage = 1;
        loadOrders();
      }, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentOrdersPage = 1;
      loadOrders();
    });
  }

  if (priorityFilter) {
    priorityFilter.addEventListener('change', () => {
      currentOrdersPage = 1;
      loadOrders();
    });
  }
}

async function loadOrders() {
  const search = document.getElementById('orderSearchInput')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || 'All';
  const priority = document.getElementById('orderPriorityFilter')?.value || 'All';

  const params = new URLSearchParams({
    page: currentOrdersPage,
    limit: 10,
    search: search,
    status: status,
    priority: priority
  });

  try {
    const response = await fetch(`/api/orders?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      renderOrdersTable(data.orders);
      renderOrdersPagination(data.total, data.page, data.total_pages);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    showToast('Failed to load orders', 'danger');
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="fas fa-clipboard-list" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          No orders match the selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusClass = o.status.toLowerCase().replace(/\s+/g, '-');
    const priorityClass = o.priority.toLowerCase();
    const itemsCount = Array.isArray(o.items) ? o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 1;

    return `
      <tr style="cursor:pointer;" onclick="openOrderDetailDrawer(${o.id})">
        <td>
          <div style="font-family:monospace; font-weight:700; color:var(--primary);">${o.order_number}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${o.order_date || 'Today'}</div>
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-primary);">${o.customer_name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${itemsCount} items • $${o.total_amount.toFixed(2)}</div>
        </td>
        <td>
          <span class="priority-pill ${priorityClass}">${o.priority}</span>
        </td>
        <td>
          <span class="status-pill ${statusClass}">${o.status}</span>
        </td>
        <td>
          <div style="font-weight:600; font-size:0.8rem;">${o.warehouse_zone}</div>
        </td>
        <td>
          <span style="color:var(--text-secondary); font-size:0.82rem;">${o.picker || 'Unassigned'}</span>
        </td>
        <td>
          <div style="font-size:0.78rem; font-weight:600; color:${o.status === 'Delayed' ? 'var(--danger)' : 'var(--text-secondary)'};">
            ${o.estimated_ship_time || '12:00 PM'}
          </div>
        </td>
        <td>
          <span style="font-weight:700; font-size:0.82rem; color:var(--secondary);">${o.priority_score || 50}</span>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="btn-action" onclick="openSmartAllocationModal(${o.id})" title="Smart Zone Allocation">
            <i class="fas fa-microchip" style="color:var(--primary);"></i> Allocate
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOrdersPagination(total, currentPage, totalPages) {
  const container = document.getElementById('ordersPagination');
  if (!container) return;

  container.innerHTML = `
    <div>Showing <strong>${total > 0 ? (currentPage - 1) * 10 + 1 : 0}</strong> - <strong>${Math.min(currentPage * 10, total)}</strong> of <strong>${total}</strong> orders</div>
    <div class="pagination-controls">
      <button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="changeOrdersPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span style="padding:0 8px; font-weight:600;">Page ${currentPage} of ${totalPages}</span>
      <button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="changeOrdersPage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}

function changeOrdersPage(newPage) {
  currentOrdersPage = newPage;
  loadOrders();
}

/* ==========================================================================
   Order Details & Fulfillment Timeline Drawer
   ========================================================================== */
async function openOrderDetailDrawer(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();

    if (!data.success) {
      showToast('Order details unavailable', 'danger');
      return;
    }

    const o = data.order;
    const timeline = data.timeline;

    document.getElementById('drawerOrderNumber').textContent = o.order_number;
    document.getElementById('drawerOrderCustomer').textContent = o.customer_name;
    document.getElementById('drawerOrderTotal').textContent = `$${o.total_amount.toFixed(2)}`;
    document.getElementById('drawerOrderPriority').innerHTML = `<span class="priority-pill ${o.priority.toLowerCase()}">${o.priority}</span>`;
    document.getElementById('drawerOrderZone').textContent = o.warehouse_zone;
    document.getElementById('drawerOrderPicker').textContent = o.picker || 'Unassigned';
    document.getElementById('drawerOrderShipTime').textContent = o.estimated_ship_time || '12:00 PM';

    // Render Timeline Stepper
    const timelineContainer = document.getElementById('drawerOrderTimeline');
    if (timelineContainer && timeline) {
      timelineContainer.innerHTML = timeline.stages.map((stage, idx) => {
        const isCompleted = stage.state === 'completed';
        const isCurrent = stage.state === 'current';
        const isDelayed = stage.state === 'delayed';

        return `
          <div class="timeline-step ${stage.state}">
            <div class="timeline-node">
              ${isCompleted ? '<i class="fas fa-check"></i>' : (idx + 1)}
            </div>
            <div>
              <div style="font-weight:700; font-size:0.85rem; color:${isDelayed ? 'var(--danger)' : (isCurrent ? 'var(--primary)' : 'var(--text-primary)')};">
                ${stage.label} ${isDelayed ? '(SLA Risk / Delayed)' : ''}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${stage.description}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Items
    const itemsContainer = document.getElementById('drawerOrderItemsList');
    if (itemsContainer && Array.isArray(o.items)) {
      itemsContainer.innerHTML = o.items.map(it => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle); font-size:0.8rem;">
          <div>
            <strong>${it.sku}</strong> — ${it.name}
            <div style="font-size:0.72rem; color:var(--text-muted);">Qty: ${it.quantity} @ $${it.price.toFixed(2)}</div>
          </div>
          <div style="font-weight:700;">$${(it.quantity * it.price).toFixed(2)}</div>
        </div>
      `).join('');
    }

    openDrawer('orderDetailDrawer');
  } catch (err) {
    console.error('Error loading order drawer:', err);
    showToast('Failed to load order drawer', 'danger');
  }
}

/* ==========================================================================
   Smart Order Allocation Modal
   ========================================================================== */
async function openSmartAllocationModal(orderId) {
  currentSelectedOrderId = orderId;
  try {
    const res = await fetch('/api/allocation/recommend', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ order_id: orderId })
    });
    const data = await res.json();

    if (!data.success) {
      showToast('Smart allocation failed', 'danger');
      return;
    }

    const rec = data.recommendation;
    document.getElementById('allocOrderNum').textContent = rec.order_number;
    document.getElementById('allocCurrentZone').textContent = rec.current_zone;
    document.getElementById('allocRecommendedZone').textContent = rec.recommended_zone;
    document.getElementById('allocDistance').textContent = `${rec.walking_distance_meters} meters`;
    document.getElementById('allocEstTime').textContent = rec.estimated_time;
    document.getElementById('allocCongestion').textContent = rec.zone_congestion;
    document.getElementById('allocPickers').textContent = rec.picker_availability;
    document.getElementById('allocReason').textContent = rec.reason;

    openModal('smartAllocationModal');
  } catch (err) {
    showToast('Error calculating allocation', 'danger');
  }
}

async function acceptAllocationRecommendation() {
  if (!currentSelectedOrderId) return;
  const targetZone = document.getElementById('allocRecommendedZone').textContent;

  try {
    const res = await fetch(`/api/orders/${currentSelectedOrderId}/allocate`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ zone: targetZone })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal('smartAllocationModal');
      loadOrders();
    }
  } catch (err) {
    showToast('Failed to apply allocation', 'danger');
  }
}
