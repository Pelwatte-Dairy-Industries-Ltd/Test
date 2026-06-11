/**
 * IT Asset Management App Logic
 */

// Global mock datasets
const sampleAssets = [
  { id: "AST-1001", name: "Dell Latitude 5430", category: "Laptop", serial: "SN-8F4G1X3", assignee: "Nadeera", location: "Head Office", status: "Deployed" },
  { id: "AST-1002", name: "Lenovo ThinkCentre M90a", category: "Desktop", serial: "SN-2X9Z8Y", assignee: "-", location: "Branch - Colombo", status: "Available" },
  { id: "AST-1003", name: "Cisco Catalyst 9300", category: "Network Equipment", serial: "SN-CS9K44", assignee: "-", location: "Head Office", status: "Maintenance" },
  { id: "AST-1004", name: "HP LaserJet Pro", category: "Peripheral", serial: "SN-HP554X", assignee: "Kanishka", location: "Branch - Kandy", status: "Deployed" }
];

class AssetApp {
  constructor() {
    this.assets = [...sampleAssets];
    this.currentTheme = "light";
    this.init();
  }

  init() {
    this.bindSidebarNavigation();
    this.setupThemeToggle();
    this.setupDashboardCharts();
    this.populateTables();
    this.setupEventListeners();
    this.updateQuickStats();
  }

  bindSidebarNavigation() {
    document.querySelectorAll(".sidebar-menu-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".sidebar-menu-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        
        const view = item.getAttribute("data-view");
        this.switchView(view);
      });
    });
  }

  switchView(viewId) {
    document.querySelectorAll(".view-container").forEach(view => view.classList.remove("active"));
    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) activeView.classList.add("active");

    const titles = {
      "dashboard": { title: "Dashboard", desc: "Enterprise Asset Overview" },
      "inventory": { title: "Asset Inventory", desc: "Full catalog of tracked computing equipment" },
      "add-asset": { title: "Register New Asset", desc: "Add newly purchased IT items to records" },
      "assignments": { title: "Item Assignments", desc: "Assign devices directly to employees" },
      "settings": { title: "Settings", desc: "System Config Variables" }
    };

    if (titles[viewId]) {
      document.getElementById("navbar-view-title").innerText = titles[viewId].title;
      document.getElementById("navbar-view-desc").innerText = titles[viewId].desc;
    }
    
    if (viewId === "assignments") {
      this.populateUnassignedDropdown();
    }
  }

  setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    toggleBtn.addEventListener("click", () => {
      this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", this.currentTheme);
      toggleBtn.innerHTML = this.currentTheme === "light" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      this.refreshChartsTheme();
    });
  }

  setupDashboardCharts() {
    // Assets Status Doughnut
    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    this.chartStatusObj = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Deployed', 'Maintenance'],
        datasets: [{
          data: [
            this.assets.filter(a => a.status === 'Available').length,
            this.assets.filter(a => a.status === 'Deployed').length,
            this.assets.filter(a => a.status === 'Maintenance').length
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Assets Category Bar Chart
    const ctxCat = document.getElementById('chartCategory').getContext('2d');
    this.chartCategoryObj = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: ['Laptop', 'Desktop', 'Server', 'Network Equipment', 'Peripheral'],
        datasets: [{
          label: 'Count',
          data: [
            this.assets.filter(a => a.category === 'Laptop').length,
            this.assets.filter(a => a.category === 'Desktop').length,
            this.assets.filter(a => a.category === 'Server').length,
            this.assets.filter(a => a.category === 'Network Equipment').length,
            this.assets.filter(a => a.category === 'Peripheral').length
          ],
          backgroundColor: '#8b5cf6'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  refreshChartsTheme() {
    const isDark = this.currentTheme === "dark";
    const color = isDark ? "#f3f4f6" : "#0f172a";
    
    if (this.chartStatusObj && this.chartCategoryObj) {
      this.chartStatusObj.options.plugins.legend.labels.color = color;
      this.chartCategoryObj.options.scales.x.ticks.color = color;
      this.chartCategoryObj.options.scales.y.ticks.color = color;
      this.chartStatusObj.update();
      this.chartCategoryObj.update();
    }
  }

  populateTables() {
    const tbody = document.querySelector("#inventory-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    this.assets.forEach(asset => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${asset.id}</strong></td>
        <td>${asset.name}</td>
        <td>${asset.category}</td>
        <td>${asset.serial}</td>
        <td>${asset.assignee}</td>
        <td>${asset.location}</td>
        <td><span class="badge-status badge-${asset.status}">${asset.status}</span></td>
        <td>
          <button class="filter-select" onclick="app.retireAsset('${asset.id}')" title="Retire Asset"><i class="fa-solid fa-ban"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateDashboardMetrics() {
    document.getElementById("stat-total-assets").innerText = this.assets.length;
    document.getElementById("stat-deployed").innerText = this.assets.filter(a => a.status === 'Deployed').length;
    document.getElementById("stat-store").innerText = this.assets.filter(a => a.status === 'Available').length;
    document.getElementById("stat-maint").innerText = this.assets.filter(a => a.status === 'Maintenance').length;
    
    if(this.chartStatusObj && this.chartCategoryObj) {
      this.chartStatusObj.data.datasets[0].data = [
        this.assets.filter(a => a.status === 'Available').length,
        this.assets.filter(a => a.status === 'Deployed').length,
        this.assets.filter(a => a.status === 'Maintenance').length
      ];
      this.chartStatusObj.update();
      
      this.chartCategoryObj.data.datasets[0].data = [
        this.assets.filter(a => a.category === 'Laptop').length,
        this.assets.filter(a => a.category === 'Desktop').length,
        this.assets.filter(a => a.category === 'Server').length,
        this.assets.filter(a => a.category === 'Network Equipment').length,
        this.assets.filter(a => a.category === 'Peripheral').length
      ];
      this.chartCategoryObj.update();
    }
  }

  updateQuickStats() {
    document.getElementById("quick-active").innerText = this.assets.filter(a => a.status !== 'Retired').length;
    document.getElementById("quick-deployed").innerText = this.assets.filter(a => a.status === 'Deployed').length;
    document.getElementById("quick-maintenance").innerText = this.assets.filter(a => a.status === 'Maintenance').length;
  }

  setupEventListeners() {
    // Registration Form
    const addForm = document.getElementById("add-asset-form");
    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newAsset = {
          id: "AST-" + (1005 + Math.floor(Math.random() * 500)),
          name: document.getElementById("asset-name").value,
          serial: document.getElementById("asset-serial").value,
          category: document.getElementById("asset-category").value,
          status: document.getElementById("asset-status").value,
          location: document.getElementById("asset-location").value,
          assignee: "-"
        };
        
        if (newAsset.status === "Deployed") {
          newAsset.assignee = "System Generated User";
        }
        
        this.assets.push(newAsset);
        this.populateTables();
        this.updateDashboardMetrics();
        this.updateQuickStats();
        addForm.reset();
        this.switchView("inventory");
      });
    }

    // Assign Form
    const assignForm = document.getElementById("assign-form");
    if (assignForm) {
      assignForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const assetId = document.getElementById("assign-asset").value;
        const user = document.getElementById("assign-user").value;

        const target = this.assets.find(a => a.id === assetId);
        if (target) {
          target.assignee = user;
          target.status = "Deployed";
        }
        this.populateTables();
        this.updateDashboardMetrics();
        this.updateQuickStats();
        assignForm.reset();
        this.switchView("inventory");
      });
    }

    // Global filtering on inventory
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.filterInventory());
    }
    const statusFilter = document.getElementById("filter-status");
    if (statusFilter) {
      statusFilter.addEventListener("change", () => this.filterInventory());
    }
  }

  populateUnassignedDropdown() {
    const select = document.getElementById("assign-asset");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Choose Available Asset</option>';
    
    // Only fetch items that are "Available"
    this.assets.filter(a => a.status === "Available").forEach(asset => {
      const opt = document.createElement("option");
      opt.value = asset.id;
      opt.innerText = `${asset.id} - ${asset.name} (${asset.category})`;
      select.appendChild(opt);
    });
  }

  retireAsset(id) {
    if (confirm(`Are you sure you want to retire asset ${id}?`)) {
      const item = this.assets.find(a => a.id === id);
      if (item) {
        item.status = "Retired";
        item.assignee = "-";
      }
      this.populateTables();
      this.updateDashboardMetrics();
      this.updateQuickStats();
    }
  }

  filterInventory() {
    const query = document.getElementById("global-search").value.toLowerCase();
    const status = document.getElementById("filter-status").value;
    
    const rows = document.querySelectorAll("#inventory-table tbody tr");
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const statusCell = row.querySelector("span").innerText;
      
      const matchesQuery = text.includes(query);
      const matchesStatus = status === "all" || statusCell === status;
      
      if (matchesQuery && matchesStatus) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }
}

// Initialize Application
const app = new AssetApp();