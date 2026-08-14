import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const PROPOSAL_STATUSES = [
  "Pending",
  "Negotiating",
  "Accepted",
  "Completed",
  "Canceled",
];

const STATUS_META = {
  Pending: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  Negotiating: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  Accepted: { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  Completed: { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" },
  Canceled: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || {
    bg: "#f1f5f9",
    color: "#334155",
    border: "#cbd5e1",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
      }}
    >
      {status}
    </span>
  );
}

export default function AdminProposalsManage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await api.json("/admin/proposals/");
      setProposals(data.results ?? data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (proposal, newStatus) => {
    setSaving((s) => ({ ...s, [proposal.id]: true }));
    try {
      const updated = await api.updateAdminProposal(proposal.id, {
        status: newStatus,
      });
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, ...updated } : p)),
      );
      showToast(`Proposal #${proposal.id} → ${newStatus}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving((s) => ({ ...s, [proposal.id]: false }));
    }
  };

  const filtered = proposals.filter((p) => {
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(p.id).includes(q) ||
      String(p.sender).toLowerCase().includes(q) ||
      String(p.receiver).toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .manage-table { width: 100%; border-collapse: collapse; }
        .manage-table th {
          background: #f8fafc; padding: 0.7rem 1rem; text-align: left;
          font-size: 0.72rem; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.1em;
          border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 2;
        }
        .manage-table td {
          padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem; color: #334155; vertical-align: middle;
        }
        .manage-table tr:last-child td { border-bottom: none; }
        .manage-table tr:hover td { background: #f8fafc; }
        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 999px;
          padding: 0.45rem 1.1rem; font-size: 0.83rem; font-weight: 600;
          color: #334155; cursor: pointer; transition: all 0.18s;
          text-decoration: none; outline: none;
        }
        .back-btn:hover { background: #f1f5f9; border-color: #6366f1; color: #6366f1; }
        .status-select {
          border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0.3rem 0.6rem;
          font-size: 0.8rem; font-weight: 500; color: #334155;
          background: #fff; cursor: pointer; outline: none;
          transition: border-color 0.15s;
        }
        .status-select:focus { border-color: #6366f1; }
        .status-select:disabled { opacity: 0.5; cursor: not-allowed; }
        .toast-bar {
          position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
          background: #0f172a; color: #fff; padding: 0.65rem 1.4rem;
          border-radius: 999px; font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .search-input {
          border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0.5rem 0.9rem;
          font-size: 0.85rem; color: #334155; outline: none; width: 220px;
          transition: border-color 0.15s;
        }
        .search-input:focus { border-color: #6366f1; }
        .filter-chip {
          display: inline-flex; align-items: center; padding: 0.3rem 0.85rem;
          border-radius: 999px; font-size: 0.78rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s;
        }
      `}</style>

      {/* Toast */}
      {toast && <div className="toast-bar">{toast}</div>}

      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          id="proposals-back-btn"
          className="back-btn"
          onClick={() => navigate("/admin")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            width="14"
            height="14"
          >
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Dashboard
        </button>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Proposals
          </h1>
        </div>
      </div>
      <p
        style={{
          color: "#64748b",
          fontSize: "0.875rem",
          marginBottom: "1.75rem",
          marginTop: "0.25rem",
        }}
      >
        Review and update the status of all skill-barter proposals.
      </p>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          alignItems: "center",
        }}
      >
        <input
          id="proposals-search"
          className="search-input"
          placeholder="Search by ID, user, status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["All", ...PROPOSAL_STATUSES].map((s) => {
          const active = filterStatus === s;
          const m = STATUS_META[s];
          return (
            <button
              key={s}
              className="filter-chip"
              style={{
                background: active ? (m ? m.bg : "#ede9fe") : "#f8fafc",
                color: active ? (m ? m.color : "#4f46e5") : "#64748b",
                borderColor: active ? (m ? m.border : "#c4b5fd") : "#e2e8f0",
              }}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          );
        })}
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8rem",
            color: "#94a3b8",
            fontWeight: 500,
          }}
        >
          {filtered.length} proposal{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "0.85rem 1rem",
            color: "#b91c1c",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
          >
            Loading proposals…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
          >
            No proposals found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="manage-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Offered Skill</th>
                  <th>Requested Skill</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      #{p.id}
                    </td>
                    <td>{p.sender}</td>
                    <td>{p.receiver}</td>
                    <td style={{ color: "#64748b" }}>
                      {p.offered_skill_titles?.join(", ") || "—"}
                    </td>
                    <td style={{ color: "#64748b" }}>
                      {p.requested_skill_titles?.join(", ") || "—"}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={p.status}
                        disabled={saving[p.id]}
                        onChange={(e) => handleStatusChange(p, e.target.value)}
                        aria-label={`Change status for proposal ${p.id}`}
                      >
                        {PROPOSAL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
