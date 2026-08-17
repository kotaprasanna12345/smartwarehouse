/**
 * SMARTSTOCK AI — Hackathon Live Demo Mode & Guided 9-Scene Presentation (demo-mode.js)
 * Implements the 9-scene presentation demo player, auto-play progression,
 * safe simulation events, and live telemetry badges.
 */

let currentDemoSceneIndex = 0;
let demoAutoPlayInterval = null;
let isDemoAutoPlaying = false;

const DEMO_SCENES = [
  {
    id: 1,
    title: "1. Baseline Warehouse Telemetry",
    badge: "SCENE 1 / 9 — BASELINE",
    description: "The warehouse begins operations in a standard baseline state. Order queues are active, inventory buffers are monitored, and 5 active pickers are distributed across 5 operational zones.",
    visualType: "health",
    statBadge: "Health: 82% | Status: Nominal",
    bullets: [
      "36 Active SKUs across Zones A through E",
      "22 Customer orders queued in pipeline",
      "Baseline cycle time: 7.4 min / tote"
    ]
  },
  {
    id: 2,
    title: "2. Critical Stock Depletion Detected",
    badge: "SCENE 2 / 9 — STOCK RISK",
    description: "High-velocity tech accessories (SKU WH-1042 & WH-3011) experience rapid order depletion and drop below the 3-day safety threshold buffer.",
    visualType: "inventory_risk",
    statBadge: "4 SKUs Critical | Depletion: 1.8 Days",
    bullets: [
      "SKU WH-1042 stock depleted to 14 units",
      "AI predicts stockout in < 48 hours",
      "Immediate dock putaway requisition queued"
    ]
  },
  {
    id: 3,
    title: "3. Mid-Day Order Surge Intake",
    badge: "SCENE 3 / 9 — SURGE INFLUX",
    description: "A sudden influx of heavy equipment and industrial orders floods the fulfillment pipeline, putting pressure on material handling aisles.",
    visualType: "order_surge",
    statBadge: "+38% Order Influx | 30 Active Orders",
    bullets: [
      "4 Orders flagged with 2-hour SLA deadlines",
      "Workload spikes in Zone C (Heavy Freight)",
      "Picker queue backlog reaches 18 tasks"
    ]
  },
  {
    id: 4,
    title: "4. Zone C Fulfillment Bottleneck Escalates",
    badge: "SCENE 4 / 9 — BOTTLENECK",
    description: "Zone C congestion spikes to 84% due to heavy freight picking density and limited active pickers, creating a critical bottleneck in outbound flow.",
    visualType: "bottleneck_alert",
    statBadge: "Zone C Congestion: 84% (Critical)",
    bullets: [
      "4 customer orders delayed past SLA threshold",
      "Zone C average cycle latency rises to 14.2 min",
      "Underutilized Zone B operating with spare capacity (28%)"
    ]
  },
  {
    id: 5,
    title: "5. AI Copilot Root Cause Diagnostics",
    badge: "SCENE 5 / 9 — AI DIAGNOSTICS",
    description: "SmartStock AI Copilot automatically performs real-time telemetry analysis, isolating the root cause to picker-to-workload imbalance in Zone C.",
    visualType: "ai_insight",
    statBadge: "AI Confidence: 94% | Impact: High",
    bullets: [
      "Identifies 2 underutilized pickers in Zone B",
      "Predicts 3.5 hours of cumulative customer delay",
      "Recommends dynamic picker reallocation"
    ]
  },
  {
    id: 6,
    title: "6. Proactive AI Reallocation Recommendation",
    badge: "SCENE 6 / 9 — RECOMMENDATION",
    description: "The AI system generates a prescriptive optimization plan: rebalance 2 pickers from Zone B to Zone C, expedite delayed orders, and restock critical SKUs.",
    visualType: "recommendation",
    statBadge: "Projected Gain: +18% Throughput",
    bullets: [
      "Move 2 pickers: Zone B (28% cong) → Zone C (84% cong)",
      "Elevate 4 delayed orders to top FIFO slots",
      "Target Zone C congestion reduction: 84% → 42%"
    ]
  },
  {
    id: 7,
    title: "7. 1-Click Optimization Engine Runs",
    badge: "SCENE 7 / 9 — HERO OPTIMIZATION",
    description: "With 1-Click, the global optimization engine executes live algorithmic rebalancing across zones, staff, and inventory tables.",
    visualType: "optimizer_run",
    statBadge: "5-Step Global Algorithm Executing",
    bullets: [
      "✓ Step 1: Inventory horizons restocked",
      "✓ Step 2: Delayed orders expedited",
      "✓ Step 3: Pickers reallocated to Zone C",
      "✓ Step 4: Spatial bottleneck resolved"
    ]
  },
  {
    id: 8,
    title: "8. Operational Health & Flow Recovered",
    badge: "SCENE 8 / 9 — RECOVERY",
    description: "Warehouse health immediately rebounds to 96%. Zone C congestion drops to 42%, delayed orders are cleared, and picker queues flow smoothly.",
    visualType: "health_recovery",
    statBadge: "Health: 96% (+14%) | Risk: LOW",
    bullets: [
      "Zone C congestion cleared from 84% to 42%",
      "0 Delayed orders remaining in pipeline",
      "All depleted SKUs replenished to safety levels"
    ]
  },
  {
    id: 9,
    title: "9. Final Measurable Business Impact",
    badge: "SCENE 9 / 9 — ROI & IMPACT",
    description: "The platform delivers proven, measurable business ROI across picking speed, stockout prevention, on-time delivery, and operating efficiency.",
    visualType: "final_roi",
    statBadge: "+22% Throughput | -35% Cycle Time | 100% SLA",
    bullets: [
      "⚡ +18% Overall Operational Throughput Gain",
      "⏱️ -35% Picking Cycle Time (7.4 min → 4.8 min)",
      "🛡️ 100% On-Time Shipment SLA Protection",
      "📦 0 Stockout Incidents & Reduced Walking Distance"
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initDemoModeToggle();
});

function initDemoModeToggle() {
  const toggle = document.getElementById('demoModeSwitch');
  if (!toggle) return;

  toggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      startDemoSimulation();
    } else {
      stopDemoSimulation();
    }
  });
}

function startDemoSimulation() {
  window.SmartStock.demoModeActive = true;
  
  // Update UI telemetry badge to Simulation
  const modeLabel = document.getElementById('liveDataModeLabel');
  if (modeLabel) {
    modeLabel.textContent = 'SIMULATION';
    modeLabel.className = 'telemetry-badge-label simulation';
  }

  showToast('🎮 Hackathon Live Demo Mode Activated! Real-time simulation events ticking.', 'info');
  runDemoTick();
  window.SmartStock.demoInterval = setInterval(runDemoTick, 5000);
}

function stopDemoSimulation() {
  window.SmartStock.demoModeActive = false;
  
  // Restore UI telemetry badge to Live Data
  const modeLabel = document.getElementById('liveDataModeLabel');
  if (modeLabel) {
    modeLabel.textContent = 'LIVE DATA';
    modeLabel.className = 'telemetry-badge-label';
  }

  if (window.SmartStock.demoInterval) {
    clearInterval(window.SmartStock.demoInterval);
  }
  showToast('Demo Simulation Paused', 'info');
}

async function runDemoTick() {
  if (!window.SmartStock.demoModeActive) return;

  try {
    const res = await fetch('/api/demo/tick', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      if (data.event && data.event !== 'Warehouse operations ticking normally.') {
        showToast(`⚡ Simulation Event: ${data.event}`, 'info');
      }

      if (window.markUpdated) window.markUpdated();
      if (window.refreshDashboard) window.refreshDashboard();
      if (window.loadPickingQueue) window.loadPickingQueue();
    }
  } catch (err) {
    console.error('Demo tick error:', err);
  }
}

/* ==========================================================================
   Guided 9-Scene Hackathon Demo Player
   ========================================================================== */
window.openHackathonDemoPlayer = function() {
  currentDemoSceneIndex = 0;
  openModal('hackathonDemoModal');
  renderDemoPills();
  renderCurrentDemoScene();
};

window.closeHackathonDemoPlayer = function() {
  if (demoAutoPlayInterval) {
    clearInterval(demoAutoPlayInterval);
    isDemoAutoPlaying = false;
  }
  closeModal('hackathonDemoModal');
};

function renderDemoPills() {
  const container = document.getElementById('demoScenePills');
  if (!container) return;

  container.innerHTML = DEMO_SCENES.map((scene, idx) => `
    <button class="demo-pill-btn ${idx === currentDemoSceneIndex ? 'active' : (idx < currentDemoSceneIndex ? 'completed' : '')}" 
            onclick="jumpToDemoScene(${idx})" 
            title="Scene ${idx + 1}: ${scene.title}">
      ${idx + 1}
    </button>
  `).join('');
}

function renderCurrentDemoScene() {
  const scene = DEMO_SCENES[currentDemoSceneIndex];
  if (!scene) return;

  // Update Timeline Progress Bar
  const progressBar = document.getElementById('demoTimelineProgress');
  if (progressBar) {
    const pct = ((currentDemoSceneIndex + 1) / DEMO_SCENES.length) * 100;
    progressBar.style.width = `${pct}%`;
  }

  // Update Scene Pills
  renderDemoPills();

  // Update Texts
  const badgeEl = document.getElementById('demoSceneBadge');
  const titleEl = document.getElementById('demoSceneTitle');
  const contentEl = document.getElementById('demoSceneContent');
  const visualEl = document.getElementById('demoSceneVisual');

  if (badgeEl) badgeEl.textContent = scene.badge;
  if (titleEl) titleEl.textContent = scene.title;

  if (contentEl) {
    contentEl.innerHTML = `
      <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.5; margin-bottom:12px;">
        ${scene.description}
      </p>
      <div style="background:var(--bg-input); border-radius:var(--radius-sm); padding:12px 16px; margin-bottom:12px;">
        <strong style="font-size:0.8rem; color:var(--text-primary); display:block; margin-bottom:6px;">Key Operational Observations:</strong>
        <ul style="padding-left:18px; font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">
          ${scene.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Dynamic Scene Visual Preview
  if (visualEl) {
    visualEl.innerHTML = `
      <div class="demo-visual-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--primary);">${scene.visualType.replace('_', ' ')}</span>
          <span class="status-pill ${currentDemoSceneIndex >= 7 ? 'in-stock' : (currentDemoSceneIndex >= 3 ? 'delayed' : 'picking')}">${scene.statBadge}</span>
        </div>
        <div class="gauge-bar-bg" style="height:6px;">
          <div class="gauge-bar-fill ${currentDemoSceneIndex >= 7 ? 'success' : (currentDemoSceneIndex >= 3 ? 'danger' : 'primary')}" style="width:${((currentDemoSceneIndex + 1) * 11)}%;"></div>
        </div>
      </div>
    `;
  }

  // Update Button States
  const prevBtn = document.getElementById('demoPrevBtn');
  const nextBtn = document.getElementById('demoNextBtn');

  if (prevBtn) prevBtn.disabled = currentDemoSceneIndex === 0;
  if (nextBtn) {
    if (currentDemoSceneIndex === DEMO_SCENES.length - 1) {
      nextBtn.innerHTML = `<span>⚡ Run 1-Click Optimizer</span> <i class="fas fa-bolt"></i>`;
      nextBtn.onclick = () => {
        closeHackathonDemoPlayer();
        window.triggerOptimizerModal();
      };
    } else {
      nextBtn.innerHTML = `<span>Next Scene</span> <i class="fas fa-chevron-right"></i>`;
      nextBtn.onclick = () => navigateDemoScene(1);
    }
  }
}

window.navigateDemoScene = function(direction) {
  currentDemoSceneIndex = Math.max(0, Math.min(DEMO_SCENES.length - 1, currentDemoSceneIndex + direction));
  renderCurrentDemoScene();
};

window.jumpToDemoScene = function(idx) {
  currentDemoSceneIndex = idx;
  renderCurrentDemoScene();
};

window.toggleDemoAutoPlay = function() {
  const icon = document.getElementById('demoPlayIcon');
  const label = document.getElementById('demoPlayLabel');

  if (isDemoAutoPlaying) {
    clearInterval(demoAutoPlayInterval);
    isDemoAutoPlaying = false;
    if (icon) icon.className = 'fas fa-play';
    if (label) label.textContent = 'Auto-Play (5s)';
    showToast('Auto-Play Paused', 'info');
  } else {
    isDemoAutoPlaying = true;
    if (icon) icon.className = 'fas fa-pause';
    if (label) label.textContent = 'Pause Auto-Play';
    showToast('Auto-Play Started (5s per scene)', 'info');

    demoAutoPlayInterval = setInterval(() => {
      if (currentDemoSceneIndex < DEMO_SCENES.length - 1) {
        currentDemoSceneIndex++;
        renderCurrentDemoScene();
      } else {
        clearInterval(demoAutoPlayInterval);
        isDemoAutoPlaying = false;
        if (icon) icon.className = 'fas fa-play';
        if (label) label.textContent = 'Auto-Play (5s)';
      }
    }, 5000);
  }
};

window.resetWarehouseDemo = async function() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Warehouse database reset to initial baseline demo state.', 'success');
      setTimeout(() => window.location.reload(), 800);
    }
  } catch (err) {
    showToast('Failed to reset demo data', 'danger');
  }
};

