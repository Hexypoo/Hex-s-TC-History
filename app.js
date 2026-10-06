// Editor-only state
const state = {
  players: [],
  awards: [],
  gfxs: [],
  jerseys: [],
  leagues: [],
  seasons: [],
  isEditor: true,
  editingSection: null,
  editingId: null,
};

const SECTION_FIELDS = {
  players: [
    { name: "id", label: "ID", type: "number", required: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "team", label: "Team", type: "text" },
    { name: "position", label: "Position", type: "text" },
    { name: "number", label: "Number", type: "number" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
  awards: [
    { name: "id", label: "ID", type: "number", required: true },
    { name: "name", label: "Award Name", type: "text", required: true },
    { name: "year", label: "Year", type: "number" },
    { name: "awardee", label: "Awardee", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ],
  gfxs: [
    { name: "id", label: "ID", type: "number", required: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text" },
    { name: "path", label: "File Path", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ],
  jerseys: [
    { name: "id", label: "ID", type: "number", required: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "team", label: "Team", type: "text" },
    { name: "number", label: "Number", type: "number" },
    { name: "color", label: "Color", type: "text" },
    { name: "season", label: "Season", type: "text" },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadState();
  render();
});

function bindEvents() {
  const fileInput = document.getElementById("fileInput");
  const exportBtn = document.getElementById("exportBtn");
  const loadSampleBtn = document.getElementById("loadSampleBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleFileUpload);
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportData);
  }

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", loadSampleData);
  }

  document.querySelectorAll(".add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.isEditor) {
        showStatus("Only the editor can make changes.", "error");
        return;
      }
      const section = button.dataset.section;
      state.editingSection = section;
      state.editingId = null;
      renderEditForm(section, {});
    });
  });
}

function loadState() {
  const saved = localStorage.getItem("hex_tc_history_editor_data");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.players = Array.isArray(parsed.players) ? parsed.players : [];
    state.awards = Array.isArray(parsed.awards) ? parsed.awards : [];
    state.gfxs = Array.isArray(parsed.gfxs) ? parsed.gfxs : [];
    state.jerseys = Array.isArray(parsed.jerseys) ? parsed.jerseys : [];
    state.leagues = Array.isArray(parsed.leagues) ? parsed.leagues : [];
    state.seasons = Array.isArray(parsed.seasons) ? parsed.seasons : [];
  } catch (err) {
    console.error("Failed to load saved data:", err);
  }
}

function saveState() {
  const data = {
    players: state.players,
    awards: state.awards,
    gfxs: state.gfxs,
    jerseys: state.jerseys,
    leagues: state.leagues,
    seasons: state.seasons,
  };
  localStorage.setItem("hex_tc_history_editor_data", JSON.stringify(data));
}

function showStatus(message, type = "info") {
  const status = document.getElementById("status");
  if (!status) return;

  status.textContent = message;
  status.className = `status ${type}`;

  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    status.textContent = "Ready.";
    status.className = "status";
  }, 3500);
}

function render() {
  renderTables();
  renderStats();
}

function renderTables() {
  renderTable("players");
  renderTable("awards");
  renderTable("gfxs");
  renderTable("jerseys");
}

function renderTable(section) {
  const container = document.getElementById(`${section}Table`);
  if (!container) return;

  const items = state[section] || [];

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><p>No ${section} available yet.</p></div>`;
    return;
  }

  const keys = Object.keys(items[0]);
  const header = keys.map((key) => `<th>${key}</th>`).join("");

  const rows = items
    .map((item) => {
      const cells = keys
        .map((key) => {
          const value = item[key];
          return `<td>${value ?? "-"}</td>`;
        })
        .join("");

      return `
        <tr>
          ${cells}
          <td>
            <div class="row-actions">
              <button class="edit-btn" type="button" onclick="editItem('${section}', ${item.id})">Edit</button>
              <button class="delete-btn" type="button" onclick="deleteItem('${section}', ${item.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>${header}<th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderEditForm(section, item) {
  const formContainer = document.getElementById(`${section}FormContainer`);
  if (!formContainer) return;

  const fields = SECTION_FIELDS[section] || [];

  const inputs = fields
    .map((field) => {
      const value = item[field.name] ?? "";
      const required = field.required ? "required" : "";

      if (field.type === "textarea") {
        return `
          <div class="form-group">
            <label>${field.label}</label>
            <textarea name="${field.name}" ${required}>${value}</textarea>
          </div>
        `;
      }

      return `
        <div class="form-group">
          <label>${field.label}</label>
          <input type="${field.type}" name="${field.name}" value="${value}" ${required} />
        </div>
      `;
    })
    .join("");

  formContainer.innerHTML = `
    <form id="editForm">
      ${inputs}
      <div class="form-actions">
        <button type="button" class="save-btn" onclick="saveItem('${section}')">Save</button>
        <button type="button" class="cancel-btn" onclick="cancelEdit()">Cancel</button>
      </div>
    </form>
  `;
}

function cancelEdit() {
  state.editingSection = null;
  state.editingId = null;

  ["players", "awards", "gfxs", "jerseys"].forEach((section) => {
    const node = document.getElementById(`${section}FormContainer`);
    if (node) node.innerHTML = "";
  });
}

function editItem(section, id) {
  if (!state.isEditor) {
    showStatus("Only the editor can modify records.", "error");
    return;
  }

  const item = (state[section] || []).find((entry) => entry.id === id);
  state.editingSection = section;
  state.editingId = id;
  renderEditForm(section, item || {});
}

function deleteItem(section, id) {
  if (!state.isEditor) {
    showStatus("Only the editor can delete records.", "error");
    return;
  }

  const isConfirmed = window.confirm(`Delete this ${section.slice(0, -1)}?`);
  if (!isConfirmed) return;

  state[section] = (state[section] || []).filter((item) => item.id !== id);
  saveState();
  render();
  showStatus(`${section.slice(0, -1)} deleted successfully.`, "success");
}

function saveItem(section) {
  const form = document.getElementById("editForm");
  if (!form) return;

  const formData = new FormData(form);
  const item = Object.fromEntries(formData.entries());

  if (item.id !== undefined && item.id !== "") {
    item.id = Number(item.id);
  }

  if (state.editingId !== null) {
    state[section] = (state[section] || []).map((entry) =>
      entry.id === state.editingId ? item : entry
    );
  } else {
    state[section].push(item);
  }

  saveState();
  cancelEdit();
  render();
  showStatus(`${section.slice(0, -1)} saved successfully.`, "success");
}

function handleFileUpload(event) {
  if (!state.isEditor) {
    showStatus("Only the editor may upload files.", "error");
    return;
  }

  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      validateImportedData(parsed);
      state.players = Array.isArray(parsed.players) ? parsed.players : [];
      state.awards = Array.isArray(parsed.awards) ? parsed.awards : [];
      state.gfxs = Array.isArray(parsed.gfxs) ? parsed.gfxs : [];
      state.jerseys = Array.isArray(parsed.jerseys) ? parsed.jerseys : [];
      state.leagues = Array.isArray(parsed.leagues) ? parsed.leagues : [];
      state.seasons = Array.isArray(parsed.seasons) ? parsed.seasons : [];
      saveState();
      render();
      showStatus("File imported successfully.", "success");
    } catch (err) {
      showStatus(`Import failed: ${err.message}`, "error");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function validateImportedData(data) {
  if (!data || typeof data !== "object") throw new Error("File contents are not a valid object.");
  const requiredSections = ["players", "awards", "gfxs", "jerseys"];

  requiredSections.forEach((section) => {
    if (!Array.isArray(data[section])) {
      throw new Error(`Missing or invalid array for: ${section}`);
    }
  });

  ["players", "awards", "gfxs", "jerseys"].forEach((section) => {
    data[section].forEach((item, index) => {
      if (!item || typeof item !== "object") {
        throw new Error(`${section}[${index}] is not an object.`);
      }
      if (item.id === undefined || item.id === null) {
        throw new Error(`${section}[${index}] is missing an id.`);
      }
      if (section !== "gfxs" && item.name === undefined) {
        throw new Error(`${section}[${index}] is missing a name.`);
      }
    });
  });
}

function exportData() {
  const payload = {
    players: state.players,
    awards: state.awards,
    gfxs: state.gfxs,
    jerseys: state.jerseys,
    leagues: state.leagues,
    seasons: state.seasons,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hex-tc-history.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showStatus("Data exported successfully.", "success");
}

function loadSampleData() {
  if (!state.isEditor) {
    showStatus("Only the editor can load sample data.", "error");
    return;
  }

  state.players = [
    { id: 1, name: "Alex River", team: "North City FC", position: "Forward", number: 9 },
    { id: 2, name: "Sam Drake", team: "West Harbor", position: "Goalkeeper", number: 1 },
  ];
  state.awards = [
    { id: 1, name: "MVP", year: 2024, awardee: "Alex River" },
    { id: 2, name: "Golden Glove", year: 2024, awardee: "Sam Drake" },
  ];
  state.gfxs = [
    { id: 1, name: "North City Crest", type: "team_logo", path: "/gfx/north-city.png" },
    { id: 2, name: "League Banner", type: "league_banner", path: "/gfx/league-banner.png" },
  ];
  state.jerseys = [
    { id: 1, name: "North City Home", team: "North City FC", number: 9, color: "Blue" },
    { id: 2, name: "West Harbor Away", team: "West Harbor", number: 1, color: "White" },
  ];
  state.leagues = [
    { id: 1, name: "Premier League", foundedYear: 2019 },
    { id: 2, name: "Regional Cup", foundedYear: 2021 },
  ];
  state.seasons = [
    { id: 1, leagueId: 1, year: 2023, champion: "North City FC" },
    { id: 2, leagueId: 1, year: 2024, champion: "North City FC" },
    { id: 3, leagueId: 2, year: 2024, champion: "West Harbor" },
  ];

  saveState();
  render();
  showStatus("Sample data loaded.", "success");
}

function renderStats() {
  const main = document.querySelector("main");
  if (!main) return;

  const existing = document.querySelector(".stats-wrapper");
  if (existing) existing.remove();

  const statsWrapper = document.createElement("div");
  statsWrapper.className = "stats-wrapper";

  const totalPlayers = state.players.length;
  const totalAwards = state.awards.length;
  const totalGfxs = state.gfxs.length;
  const totalJerseys = state.jerseys.length;
  const totalLeagues = state.leagues.length;
  const totalSeasons = state.seasons.length;

  statsWrapper.innerHTML = `
    <div class="stats-section">
      <h2>All-Time Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Players</div>
          <div class="value">${totalPlayers}</div>
        </div>
        <div class="stat-card">
          <div class="label">Awards</div>
          <div class="value">${totalAwards}</div>
        </div>
        <div class="stat-card">
          <div class="label">GFXs</div>
          <div class="value">${totalGfxs}</div>
        </div>
        <div class="stat-card">
          <div class="label">Jerseys</div>
          <div class="value">${totalJerseys}</div>
        </div>
        <div class="stat-card">
          <div class="label">Leagues</div>
          <div class="value">${totalLeagues}</div>
        </div>
        <div class="stat-card">
          <div class="label">Seasons</div>
          <div class="value">${totalSeasons}</div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h2>League Statistics</h2>
      <div class="stats-grid">
        ${state.leagues.length
          ? state.leagues
              .map((league) => {
                const seasonsForLeague = state.seasons.filter((season) => season.leagueId === league.id);
                const champion = seasonsForLeague[seasonsForLeague.length - 1]?.champion || "N/A";
                return `
                  <div class="stat-card stat-card-small">
                    <div class="label">${league.name}</div>
                    <div class="value">${seasonsForLeague.length}</div>
                    <div class="mini">seasons</div>
                    <div class="mini">Last champion: ${champion}</div>
                  </div>
                `;
              })
              .join("")
          : '<div class="empty-state full-width"><p>No leagues available.</p></div>'}
      </div>
    </div>

    <div class="stats-section">
      <h2>Season Statistics</h2>
      <div class="stats-grid">
        ${state.seasons.length
          ? state.seasons
              .slice()
              .reverse()
              .map((season) => {
                const leagueName = state.leagues.find((league) => league.id === season.leagueId)?.name || "Unknown";
                return `
                  <div class="stat-card stat-card-small">
                    <div class="label">${leagueName}</div>
                    <div class="value">${season.year}</div>
                    <div class="mini">Champion: ${season.champion || "N/A"}</div>
                  </div>
                `;
              })
              .join("")
          : '<div class="empty-state full-width"><p>No seasons available.</p></div>'}
      </div>
    </div>
  `;

  main.prepend(statsWrapper);
}
