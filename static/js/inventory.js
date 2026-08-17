/**
 * SMARTSTOCK AI — Inventory Management Controller (inventory.js)
 * Filtering, pagination, product drawers, stock history charts, and AI-assisted replenishment.
 */

let currentInventoryPage = 1;
let currentStockHistoryChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initInventoryFilters();
  loadInventoryProducts();
  initAddProductForm();

  // Check URL params for initial filters/search
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const filterParam = urlParams.get('filter');

  if (searchParam) {
    const searchInput = document.getElementById('invSearchInput');
    if (searchInput) {
      searchInput.value = searchParam;
    }
  }

  if (filterParam === 'critical') {
    const statusSelect = document.getElementById('invStatusFilter');
    if (statusSelect) {
      statusSelect.value = 'CRITICAL';
    }
  }

  loadInventoryProducts();
});

function initInventoryFilters() {
  const searchInput = document.getElementById('invSearchInput');
  const categoryFilter = document.getElementById('invCategoryFilter');
  const statusFilter = document.getElementById('invStatusFilter');
  const zoneFilter = document.getElementById('invZoneFilter');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentInventoryPage = 1;
        loadInventoryProducts();
      }, 300);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      currentInventoryPage = 1;
      loadInventoryProducts();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentInventoryPage = 1;
      loadInventoryProducts();
    });
  }

  if (zoneFilter) {
    zoneFilter.addEventListener('change', () => {
      currentInventoryPage = 1;
      loadInventoryProducts();
    });
  }
}

async function loadInventoryProducts() {
  const search = document.getElementById('invSearchInput')?.value || '';
  const category = document.getElementById('invCategoryFilter')?.value || 'All';
  const status = document.getElementById('invStatusFilter')?.value || 'All';
  const zone = document.getElementById('invZoneFilter')?.value || 'All';

  const params = new URLSearchParams({
    page: currentInventoryPage,
    limit: 10,
    search: search,
    category: category,
    status: status,
    zone: zone
  });

  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      renderInventoryTable(data.products);
      renderInventoryPagination(data.total, data.page, data.total_pages);
      updateInventoryStats(data.products);
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    showToast('Failed to load inventory products', 'danger');
  }
}

function renderInventoryTable(products) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          No inventory products match the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const statusClass = p.status.toLowerCase().replace(/\s+/g, '-');
    const available = p.available_quantity;
    const stockPercent = Math.min(100, Math.round((available / Math.max(p.reorder_level * 2, 50)) * 100));

    return `
      <tr style="cursor:pointer;" onclick="openProductDrawer('${p.id}')">
        <td>
          <span style="font-family:monospace; font-weight:700; color:var(--primary);">${p.sku}</span>
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-primary);">${p.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">$${p.price.toFixed(2)} / unit</div>
        </td>
        <td>
          <span class="nav-badge primary" style="font-size:0.75rem;">${p.category}</span>
        </td>
        <td>
          <div style="font-weight:600; font-size:0.8rem;">${p.warehouse_zone}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Shelf ${p.shelf} • Bin ${p.bin}</div>
        </td>
        <td>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <strong style="font-size:0.88rem;">${available}</strong>
            <span style="font-size:0.7rem; color:var(--text-muted);">${p.quantity} Total</span>
          </div>
          <div class="gauge-bar-bg" style="height:5px;">
            <div class="gauge-bar-fill ${available <= p.reorder_level ? 'warning' : 'success'}" style="width:${stockPercent}%;"></div>
          </div>
        </td>
        <td>
          <span style="color:var(--text-secondary); font-size:0.82rem;">${p.reserved_quantity} units</span>
        </td>
        <td>
          <span style="color:var(--text-muted); font-size:0.82rem;">${p.reorder_level} units</span>
        </td>
        <td>
          <span class="status-pill ${statusClass}">${p.status}</span>
        </td>
        <td onclick="event.stopPropagation()">
          <button class="btn-action" onclick="quickReorderProduct(${p.id}, '${p.sku}')" title="Quick AI Replenish">
            <i class="fas fa-bolt" style="color:var(--secondary);"></i> Restock
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInventoryPagination(total, currentPage, totalPages) {
  const container = document.getElementById('inventoryPagination');
  if (!container) return;

  container.innerHTML = `
    <div>Showing <strong>${total > 0 ? (currentPage - 1) * 10 + 1 : 0}</strong> - <strong>${Math.min(currentPage * 10, total)}</strong> of <strong>${total}</strong> products</div>
    <div class="pagination-controls">
      <button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="changeInventoryPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span style="padding:0 8px; font-weight:600;">Page ${currentPage} of ${totalPages}</span>
      <button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="changeInventoryPage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}

function changeInventoryPage(newPage) {
  currentInventoryPage = newPage;
  loadInventoryProducts();
}

function updateInventoryStats(products) {
  // Update header summary numbers if available
}

/* ==========================================================================
   Product Detail & AI Replenishment Drawer
   ========================================================================== */
async function openProductDrawer(productId) {
  try {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();

    if (!data.success) {
      showToast('Product details unavailable', 'danger');
      return;
    }

    const p = data.product;
    const rec = data.recommendation;

    // Fill Product Info
    document.getElementById('drawerSku').textContent = p.sku;
    document.getElementById('drawerName').textContent = p.name;
    document.getElementById('drawerCategory').textContent = p.category;
    document.getElementById('drawerLocation').textContent = `${p.warehouse_zone} (Shelf ${p.shelf}, Bin ${p.bin})`;
    document.getElementById('drawerStock').textContent = `${p.quantity} (${p.available_quantity} available)`;
    document.getElementById('drawerReserved').textContent = `${p.reserved_quantity} units`;
    document.getElementById('drawerReorder').textContent = `${p.reorder_level} units`;
    document.getElementById('drawerPrice').textContent = `$${p.price.toFixed(2)}`;

    // Fill AI Replenishment Box
    const recContainer = document.getElementById('drawerReplenishmentBox');
    if (recContainer && rec) {
      recContainer.innerHTML = `
        <div style="background:linear-gradient(135deg, var(--bg-card), var(--primary-light)); border:1px solid var(--primary); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:700; color:var(--primary); font-size:0.88rem;">
              <i class="fas fa-brain"></i> AI-Assisted Replenishment
            </div>
            <span class="confidence-tag">${rec.confidence}% Confidence</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; font-size:0.78rem;">
            <div>Daily Demand: <strong>${rec.daily_demand} units/day</strong></div>
            <div>Safety Stock: <strong>${rec.safety_stock} units</strong></div>
            <div>Depletion Horizon: <strong style="color:var(--danger);">${rec.predicted_days_remaining} days</strong></div>
            <div>Recommended Batch: <strong style="color:var(--success);">+${rec.recommended_replenish_qty} units</strong></div>
          </div>
          <div style="font-size:0.76rem; color:var(--text-secondary); line-height:1.4;">
            ${rec.reason}
          </div>
          <button class="btn-primary" style="width:100%; justify-content:center;" onclick="executeReplenishment(${p.id}, ${rec.recommended_replenish_qty})">
            <i class="fas fa-truck-loading"></i> Replenish ${rec.recommended_replenish_qty} Units ($${rec.estimated_cost})
          </button>
        </div>
      `;
    }

    // Render Demand History Chart
    renderStockMovementChart(data.movement_history);

    // Related Orders
    const ordersContainer = document.getElementById('drawerRelatedOrders');
    if (ordersContainer && data.related_orders) {
      if (data.related_orders.length > 0) {
        ordersContainer.innerHTML = data.related_orders.map(o => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle); font-size:0.78rem;">
            <div>
              <strong>${o.order_number}</strong> — ${o.customer_name}
            </div>
            <span class="status-pill ${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span>
          </div>
        `).join('');
      } else {
        ordersContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">No active orders for this SKU</div>`;
      }
    }

    openDrawer('productDetailDrawer');
  } catch (err) {
    console.error('Error opening product drawer:', err);
    showToast('Failed to load product drawer', 'danger');
  }
}

function renderStockMovementChart(history) {
  const ctx = document.getElementById('stockMovementChart');
  if (!ctx || !history) return;

  if (currentStockHistoryChart) currentStockHistoryChart.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  currentStockHistoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.labels,
      datasets: [
        {
          label: 'Inventory Stock',
          data: history.stock_levels,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'Daily Outflow Demand',
          data: history.demand_trend,
          borderColor: '#F59E0B',
          borderDash: [4, 4],
          fill: false,
          tension: 0.2,
          borderWidth: 1.5,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { size: 10 } }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
      }
    }
  });
}

/* ==========================================================================
   Replenishment Actions
   ========================================================================== */
async function executeReplenishment(productId, quantity) {
  try {
    const res = await fetch(`/api/products/${productId}/reorder`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ quantity: quantity })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeDrawer('productDetailDrawer');
      loadInventoryProducts();
    }
  } catch (err) {
    showToast('Failed to trigger replenishment', 'danger');
  }
}

async function quickReorderProduct(productId, sku) {
  try {
    const res = await fetch(`/api/products/${productId}/reorder`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadInventoryProducts();
    }
  } catch (err) {
    showToast('Error replenishing product', 'danger');
  }
}

/* ==========================================================================
   Add Product Modal Form
   ========================================================================== */
function initAddProductForm() {
  const form = document.getElementById('addProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        closeModal('addProductModal');
        form.reset();
        loadInventoryProducts();
      } else {
        showToast(data.error || 'Failed to add product', 'danger');
      }
    } catch (err) {
      showToast('Error adding product', 'danger');
    }
  });
}
