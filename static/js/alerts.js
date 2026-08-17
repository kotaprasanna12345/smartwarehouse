/**
 * SMARTSTOCK AI — Alerts Management Controller (alerts.js)
 * Filtering, searching, resolving, and direct action triggers for warehouse alerts.
 */

let alertsData = [];

document.addEventListener('DOMContentLoaded', () => {
  initAlertFilters();
  loadAlerts();
});

function initAlertFilters() {
  const severityFilter = document.getElementById('alertSeverityFilter');
  const readFilter = document.getElementById('alertReadFilter');
  const searchInput = document.getElementById('alertSearchInput');

  if (severityFilter) severityFilter.addEventListener('change', loadAlerts);
  if (readFilter) readFilter.addEventListener('change', loadAlerts);

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadAlerts, 250);
    });
  }
}

async function loadAlerts() {
  const severity = document.getElementById('alertSeverityFilter')?.value || 'All';
  const isRead = document.getElementById('alertReadFilter')?.value || 'All';
  const search = document.getElementById('alertSearchInput')?.value.toLowerCase() || '';

  const params = new URLSearchParams();
  if (severity !== 'All') params.append('severity', severity);
  if (isRead !== 'All') params.append('is_read', isRead);

  try {
    const response = await fetch(`/api/alerts?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      alertsData = data.alerts;

      let filtered = data.alerts;
      if (search) {
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(search) ||
          a.message.toLowerCase().includes(search) ||
          a.type.toLowerCase().includes(search)
        );
      }

      renderAlertsList(filtered);
      updateAlertStats(data.alerts);
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    showToast('Failed to load alerts', 'danger');
  }
}

function renderAlertsList(alerts) {
  const container = document.getElementById('alertsListContainer');
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:40px; text-align:center; color:var(--text-muted);">
        <i class="fas fa-bell-slash" style="font-size:2.5rem; margin-bottom:12px; display:block; color:var(--success);"></i>
        <h3>No alerts match your filter criteria</h3>
        <p style="font-size:0.8rem; margin-top:4px;">Warehouse operations are running smoothly without active warnings.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const isUnread = a.is_read === 0;

    return `
      <div class="kpi-card" style="border-left: 4px solid var(--${a.severity === 'critical' ? 'danger' : (a.severity === 'warning' ? 'warning' : (a.severity === 'success' ? 'success' : 'primary'))}); background-color:${isUnread ? 'var(--bg-card)' : 'var(--bg-card-hover)'};">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px;">
          <div style="display:flex; align-items:flex-start; gap:14px; flex:1;">
            <div class="notification-icon ${a.severity}" style="width:38px; height:38px; font-size:1.1rem; flex-shrink:0;">
              <i class="fas fa-${getAlertIcon(a.type)}"></i>
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <h4 style="font-weight:700; font-size:0.92rem; color:var(--text-primary);">${a.title}</h4>
                <span class="priority-pill ${a.severity}">${a.type}</span>
                ${isUnread ? '<span class="badge-dot" style="position:static; display:inline-block;"></span>' : ''}
              </div>
              <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.45;">${a.message}</p>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:6px;">
                <i class="far fa-clock"></i> ${a.created_at || 'Recently recorded'}
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            ${renderAlertActionBtn(a)}
            ${isUnread ? `
              <button class="btn-action" onclick="markAlertAsRead(${a.id})" title="Mark as read">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            <button class="btn-action" onclick="dismissAlert(${a.id})" title="Dismiss alert" style="color:var(--text-muted);">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAlertActionBtn(alert) {
  if (alert.action_type === 'restock') {
    return `
      <button class="btn-primary" style="padding:6px 12px; font-size:0.75rem;" onclick="window.location.href='/inventory?search=${alert.action_payload || ''}'">
        <i class="fas fa-box-open"></i> Restock SKU
      </button>
    `;
  } else if (alert.action_type === 'rebalance') {
    return `
      <button class="btn-primary" style="padding:6px 12px; font-size:0.75rem; background:var(--secondary);" onclick="window.location.href='/warehouse'">
        <i class="fas fa-users-cog"></i> Rebalance Pickers
      </button>
    `;
  } else if (alert.action_type === 'view_order') {
    return `
      <button class="btn-action" style="color:var(--primary);" onclick="window.location.href='/orders?search=${alert.action_payload || ''}'">
        <i class="fas fa-eye"></i> View Order
      </button>
    `;
  }
  return '';
}

function updateAlertStats(alerts) {
  const unread = alerts.filter(a => a.is_read === 0).length;
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const warnings = alerts.filter(a => a.severity === 'warning').length;

  const countUnread = document.getElementById('statUnreadAlerts');
  const countCritical = document.getElementById('statCriticalAlerts');
  const countWarnings = document.getElementById('statWarningAlerts');

  if (countUnread) countUnread.textContent = unread;
  if (countCritical) countCritical.textContent = critical;
  if (countWarnings) countWarnings.textContent = warnings;
}

async function markAlertAsRead(id) {
  try {
    const res = await fetch(`/api/alerts/${id}/read`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      loadAlerts();
      if (window.fetchUnreadAlertsCount) window.fetchUnreadAlertsCount();
    }
  } catch (err) {
    showToast('Failed to mark alert as read', 'danger');
  }
}

async function markAllAlertsRead() {
  try {
    const res = await fetch('/api/alerts/mark-all-read', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('All alerts marked as read', 'success');
      loadAlerts();
      if (window.fetchUnreadAlertsCount) window.fetchUnreadAlertsCount();
    }
  } catch (err) {
    showToast('Failed to mark alerts as read', 'danger');
  }
}

async function dismissAlert(id) {
  try {
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Alert dismissed', 'info');
      loadAlerts();
    }
  } catch (err) {
    showToast('Failed to dismiss alert', 'danger');
  }
}
