/**
 * FaceAI History Module
 * Version: 0.1 – Milestone 12 Stage 12.3
 *
 * Menampilkan riwayat analisis di panel frontend.
 */
"use strict";

FaceAI.history = (function () {
  const API_BASE = "http://localhost:8000/api";

  // Referensi DOM
  const panel = document.getElementById("history-panel");
  const listContainer = document.getElementById("history-list");
  const detailContainer = document.getElementById("history-detail");
  const closeBtn = document.getElementById("close-history-btn");

  // Event listener untuk tombol close
  if (closeBtn) {
    closeBtn.addEventListener("click", hidePanel);
  }

  // ==========================================
  // API Calls
  // ==========================================
  async function fetchHistory() {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    const data = await res.json();
    return data.items || [];
  }

  async function fetchDetail(id) {
    const res = await fetch(`${API_BASE}/history/${id}`);
    if (!res.ok) throw new Error("Failed to fetch detail");
    return await res.json();
  }

  async function deleteItem(id) {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    return true;
  }

  // ==========================================
  // Helpers
  // ==========================================
  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString();
  }

  // ==========================================
  // Render List
  // ==========================================
  function renderList(items) {
    if (!items.length) {
      listContainer.innerHTML =
        '<div class="empty-state">No analysis history yet.</div>';
      return;
    }
    let html = "";
    items.forEach((item) => {
      const date = formatDate(item.timestamp);
      const score = item.overall_score ? item.overall_score.toFixed(1) : "N/A";
      const strengths =
        item.strengths && item.strengths.length
          ? item.strengths.join(", ")
          : "None";
      html += `
        <div class="history-list-item" data-id="${item.id}">
          <div>
            <div><small>${date}</small></div>
            <div>Score: <span class="score">${score}</span></div>
            <div><small>${strengths}</small></div>
          </div>
          <div class="history-actions">
            <button class="btn btn--small delete-btn" data-id="${item.id}">🗑️</button>
          </div>
        </div>`;
    });
    listContainer.innerHTML = html;

    // Event delegation untuk klik item (menuju detail)
    listContainer.querySelectorAll(".history-list-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) return;
        const id = el.dataset.id;
        showDetail(id);
      });
    });

    // Event untuk tombol delete
    listContainer.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm("Delete this analysis?")) {
          await deleteItem(id);
          showPanel(); // refresh list
        }
      });
    });
  }

  // ==========================================
  // Detail View
  // ==========================================
  async function showDetail(id) {
    try {
      const detail = await fetchDetail(id);
      const report = detail.report || {};
      const strengths = detail.strengths || [];
      const suggestions = report.suggestions || [];

      const isDev = document.body.classList.contains("dev-mode");
      let html = `<h4>Analysis Detail</h4>
      <p><small>${formatDate(detail.timestamp)}</small></p>
      <p><strong>Overall Score:</strong> ${detail.overall_score?.toFixed(1)} (confidence: ${(detail.confidence * 100)?.toFixed(0)}%)</p>`;

      if (isDev) {
        // Tampilkan semua kategori detail
        const categories = [
          { key: "face_structure", label: "Face Structure" },
          { key: "eyes", label: "Eyes" },
          { key: "eyebrows", label: "Eyebrows" },
          { key: "nose", label: "Nose" },
          { key: "mouth", label: "Mouth" },
          { key: "jaw", label: "Jaw" },
          { key: "cheek", label: "Cheeks" },
          { key: "skin", label: "Skin" },
        ];
        for (const cat of categories) {
          const catData = report[cat.key];
          if (!catData) continue;
          html += `<div><strong>${cat.label}</strong><div>`;
          for (const [prop, val] of Object.entries(catData)) {
            if (typeof val === "object" && val !== null && "value" in val) {
              html += `<div class="report-score"><span>${prop}</span><span>${val.value.toFixed(1)}</span></div>`;
            }
          }
          html += `</div></div>`;
        }
      }

      if (strengths.length) {
        html += `<div><strong>Strengths:</strong><ul>${strengths.map((s) => `<li>${s}</li>`).join("")}</ul></div>`;
      }
      if (suggestions.length) {
        html += `<div><strong>Suggestions:</strong><ul>${suggestions.map((s) => `<li>${s}</li>`).join("")}</ul></div>`;
      }
      html += `<div class="history-actions" style="margin-top:1rem;">
        <button id="back-to-list-btn" class="btn btn--secondary">Back to List</button>
        <button id="export-btn" class="btn btn--secondary">Export JSON</button>
      </div>`;

      detailContainer.innerHTML = html;
      listContainer.style.display = "none";
      detailContainer.style.display = "block";

      document
        .getElementById("back-to-list-btn")
        .addEventListener("click", () => {
          detailContainer.style.display = "none";
          listContainer.style.display = "block";
        });
      document.getElementById("export-btn").addEventListener("click", () => {
        window.open(`${API_BASE}/history/${id}/export`, "_blank");
      });
    } catch (err) {
      console.error(err);
      detailContainer.innerHTML =
        '<p class="loading-text">Failed to load detail. The analysis may have been deleted or the server is unreachable.</p>';
      detailContainer.style.display = "block";
      listContainer.style.display = "none";
    }
  }

  // ==========================================
  // Panel Toggle
  // ==========================================
  async function showPanel() {
    panel.style.display = "block";
    panel.classList.add("visible");
    listContainer.style.display = "block";
    detailContainer.style.display = "none";
    try {
      const items = await fetchHistory();
      renderList(items);
    } catch (err) {
      listContainer.innerHTML =
        '<p class="loading-text">Error loading history.</p>';
    }
  }

  function hidePanel() {
    panel.classList.remove("visible");
    panel.style.display = "none";
    // Bersihkan konten besar untuk mengurangi memori
    listContainer.innerHTML = "";
    detailContainer.innerHTML = "";
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    show: showPanel,
    hide: hidePanel,
  };
})();
