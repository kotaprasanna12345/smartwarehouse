/**
 * SMARTSTOCK AI — Global App Controller (main.js)
 * Handles futuristic cyberpunk theme, 3D ambient particle canvas,
 * layout interactions, search, notifications, toasts, and live updates.
 */

// Global State
window.SmartStock = {
  theme: localStorage.getItem('smartstock_theme') || 'dark',
  demoModeActive: false,
  demoInterval: null,
  lastUpdated: new Date()
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAmbientCyberCanvas();
  initSidebar();
  initGlobalSearch();
  initNotifications();
  initLiveTicker();
  initGlobalEvents();
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
  const currentTheme = window.SmartStock.theme || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const newTheme = window.SmartStock.theme === 'dark' ? 'light' : 'dark';
  window.SmartStock.theme = newTheme;
  localStorage.setItem('smartstock_theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme.toUpperCase()} mode`, 'info');
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

/* ==========================================================================
   Ambient 3D Cyber Particle Background
   ========================================================================== */
function initAmbientCyberCanvas() {
  const canvas = document.getElementById('ambientCyberCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 300;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  // Create ambient particles
  const particleCount = 85;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 600;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

    velocities.push({
      x: (Math.random() - 0.5) * 0.35,
      y: (Math.random() - 0.5) * 0.35,
      z: (Math.random() - 0.5) * 0.2
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 2.8,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 25;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 25;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    const pos = geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      if (pos[i * 3] < -300 || pos[i * 3] > 300) velocities[i].x *= -1;
      if (pos[i * 3 + 1] < -200 || pos[i * 3 + 1] > 200) velocities[i].y *= -1;
      if (pos[i * 3 + 2] < -150 || pos[i * 3 + 2] > 150) velocities[i].z *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    camera.position.x += (mouseX - camera.position.x) * 0.03;
    camera.position.y += (-mouseY - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();
}

/* ==========================================================================
   Sidebar Management
   ========================================================================== */
function initSidebar() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

/* ==========================================================================
   Global Search (Products, Orders, Zones, SKUs)
   ========================================================================== */
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const searchDropdown = document.getElementById('globalSearchDropdown');

  if (!searchInput || !searchDropdown) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchDropdown.classList.remove('active');
      searchDropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          searchDropdown.innerHTML = data.results.map(item => `
            <div class="search-result-item" onclick="window.location.href='${item.url}'">
              <div class="search-result-icon">
                <i class="fas fa-${item.icon}"></i>
              </div>
              <div>
                <div style="font-weight:600; font-size:0.85rem;">${item.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${item.subtitle}</div>
              </div>
            </div>
          `).join('');
          searchDropdown.classList.add('active');
        } else {
          searchDropdown.innerHTML = `
            <div style="padding:14px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
              No results found for "${query}"
            </div>
          `;
          searchDropdown.classList.add('active');
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('active');
    }
  });
}

/* ==========================================================================
   Notifications Drawer
   ========================================================================== */
function initNotifications() {
  const notifBtn = document.getElementById('notificationsBtn');
  const notifDropdown = document.getElementById('notificationsDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
      if (notifDropdown.classList.contains('active')) {
        await loadTopNotifications();
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
    });
  }

  // Initial unread count fetch
  fetchUnreadAlertsCount();
}

async function fetchUnreadAlertsCount() {
  try {
    const res = await fetch('/api/alerts?is_read=0');
    const data = await res.json();
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.display = data.unread_count > 0 ? 'block' : 'none';
    }
  } catch (err) {
    console.error('Error fetching unread alerts:', err);
  }
}

async function loadTopNotifications() {
  const listContainer = document.getElementById('notificationsList');
  if (!listContainer) return;

  try {
    const res = await fetch('/api/alerts?is_read=0');
    const data = await res.json();

    if (data.alerts && data.alerts.length > 0) {
      listContainer.innerHTML = data.alerts.slice(0, 6).map(alert => `
        <div class="notification-item unread" onclick="window.location.href='/alerts'">
          <div class="notification-icon ${alert.severity}">
            <i class="fas fa-${getAlertIcon(alert.type)}"></i>
          </div>
          <div class="notification-body">
            <div class="notification-title">${alert.title}</div>
            <div class="notification-text">${alert.message}</div>
            <div class="notification-time">${alert.created_at || 'Just now'}</div>
          </div>
        </div>
      `).join('');
    } else {
      listContainer.innerHTML = `
        <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.82rem;">
          <i class="fas fa-check-circle" style="font-size:1.5rem; color:var(--success); margin-bottom:8px; display:block;"></i>
          All warehouse notifications caught up!
        </div>
      `;
    }
  } catch (err) {
    listContainer.innerHTML = `<div style="padding:14px; color:var(--danger);">Error loading alerts</div>`;
  }
}

function getAlertIcon(type) {
  switch (type.toLowerCase()) {
    case 'critical': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    case 'info': return 'info-circle';
    case 'success': return 'check-circle';
    default: return 'bell';
  }
}

/* ==========================================================================
   Live Pulse & Timestamp Updates
   ========================================================================== */
function initLiveTicker() {
  const liveLabel = document.getElementById('liveTimestamp');
  if (!liveLabel) return;

  setInterval(() => {
    const diffSeconds = Math.floor((new Date() - window.SmartStock.lastUpdated) / 1000);
    if (diffSeconds < 5) {
      liveLabel.textContent = 'Updated just now';
    } else {
      liveLabel.textContent = `Updated ${diffSeconds}s ago`;
    }
  }, 3000);
}

function markUpdated() {
  window.SmartStock.lastUpdated = new Date();
  const liveLabel = document.getElementById('liveTimestamp');
  if (liveLabel) {
    liveLabel.textContent = 'Updated just now';
  }
}

/* ==========================================================================
   Toast Notification Manager
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'check-circle',
    danger: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };

  toast.innerHTML = `
    <i class="fas fa-${iconMap[type] || 'info-circle'}" style="font-size:1.1rem;"></i>
    <div style="flex:1; font-size:0.82rem; font-weight:500;">${message}</div>
    <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem;" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   Global Modal & Drawer Utility
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  const overlay = document.getElementById(`${drawerId}Overlay`);
  if (drawer && overlay) {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  const overlay = document.getElementById(`${drawerId}Overlay`);
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Global Button Handlers
   ========================================================================== */
function initGlobalEvents() {
  const heroOptimizeBtn = document.getElementById('heroOptimizeBtn');
  if (heroOptimizeBtn) {
    heroOptimizeBtn.addEventListener('click', () => {
      if (window.triggerOptimizerModal) {
        window.triggerOptimizerModal();
      } else {
        window.location.href = '/ai-insights';
      }
    });
  }
}
