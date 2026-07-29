import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const SKILL_TYPES = ['teach', 'learn'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const SKILL_CATEGORIES = ['Programming', 'Languages', 'Music', 'Health & Fitness', 'Arts', 'Business', 'Other'];

const LEVEL_META = {
  Beginner:     { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  Intermediate: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Expert:       { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
};

const TYPE_META = {
  teach: { bg: '#ede9fe', color: '#4f46e5', border: '#c4b5fd' },
  learn: { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
};

function Badge({ label, meta }) {
  const m = meta || { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
    }}>
      {label}
    </span>
  );
}

export default function AdminSkillsManage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await api.json('/admin/skills/');
      setSkills(data.results ?? data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (skill) => {
    if (!window.confirm(`Remove skill "${skill.title}" from the platform?`)) return;
    setDeleting((d) => ({ ...d, [skill.id]: true }));
    try {
      await api.deleteAdminSkill(skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      showToast(`"${skill.title}" removed.`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setDeleting((d) => ({ ...d, [skill.id]: false }));
    }
  };

  const startEdit = (skill) => {
    setEditingId(skill.id);
    setEditForm({
      title: skill.title,
      category: skill.category,
      type: skill.type,
      experience_level: skill.experience_level,
      description: skill.description || '',
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (skill) => {
    setSaving(true);
    try {
      const updated = await api.updateAdminSkill(skill.id, editForm);
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, ...updated } : s)));
      setEditingId(null);
      showToast(`"${editForm.title}" updated.`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = skills.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.experience_level || '').toLowerCase().includes(q);
    const matchType = filterType === 'All' || s.type === filterType;
    const matchCat = filterCategory === 'All' || s.category === filterCategory;
    return matchSearch && matchType && matchCat;
  });

  return (
    <div style={{ minHeight: '100%', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
          padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem; color: #334155; vertical-align: middle;
        }
        .manage-table tr:last-child td { border-bottom: none; }
        .manage-table tr:hover td { background: #f8fafc; }
        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 999px;
          padding: 0.45rem 1.1rem; font-size: 0.83rem; font-weight: 600;
          color: #334155; cursor: pointer; transition: all 0.18s; outline: none;
        }
        .back-btn:hover { background: #f1f5f9; border-color: #6366f1; color: #6366f1; }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
          border: 1.5px solid transparent; transition: all 0.15s; outline: none;
          font-size: 0.75rem; font-weight: 600;
        }
        .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .edit-input {
          width: 100%; border: 1.5px solid #e2e8f0; border-radius: 7px;
          padding: 0.3rem 0.55rem; font-size: 0.8rem; color: #334155;
          outline: none; font-family: inherit;
        }
        .edit-input:focus { border-color: #6366f1; }
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

      {toast && <div className="toast-bar">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button id="skills-back-btn" className="back-btn" onClick={() => navigate('/admin')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Skills</h1>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem', marginTop: '0.25rem' }}>
        Review, edit, and remove skill listings from the platform.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          id="skills-search"
          className="search-input"
          placeholder="Search by title, category, level…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {['All', ...SKILL_TYPES].map((t) => {
          const active = filterType === t;
          const m = TYPE_META[t] || { bg: '#ede9fe', color: '#4f46e5', border: '#c4b5fd' };
          return (
            <button
              key={t}
              className="filter-chip"
              style={{
                background: active ? (t === 'All' ? '#ede9fe' : m.bg) : '#f8fafc',
                color: active ? (t === 'All' ? '#4f46e5' : m.color) : '#64748b',
                borderColor: active ? (t === 'All' ? '#c4b5fd' : m.border) : '#e2e8f0',
              }}
              onClick={() => setFilterType(t)}
            >
              {t === 'teach' ? '📚 Teach' : t === 'learn' ? '🎓 Learn' : 'All Types'}
            </button>
          );
        })}
        <select
          id="skills-category-filter"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#334155', outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">All Categories</option>
          {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.85rem 1rem', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading skills…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No skills found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>User ID</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((skill) => {
                  const isEditing = editingId === skill.id;
                  return (
                    <tr key={skill.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="edit-input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            style={{ minWidth: 140 }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{skill.title}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="edit-input"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : skill.category}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="edit-input"
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          >
                            {SKILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <Badge label={skill.type} meta={TYPE_META[skill.type]} />
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="edit-input"
                            value={editForm.experience_level}
                            onChange={(e) => setEditForm({ ...editForm, experience_level: e.target.value })}
                          >
                            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <Badge label={skill.experience_level} meta={LEVEL_META[skill.experience_level]} />
                        )}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{skill.user}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {new Date(skill.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
                              <button
                                id={`skill-save-${skill.id}`}
                                className="icon-btn"
                                disabled={saving}
                                onClick={() => saveEdit(skill)}
                                style={{ background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0', width: 'auto', padding: '0 0.65rem' }}
                              >
                                {saving ? '…' : 'Save'}
                              </button>
                              <button
                                className="icon-btn"
                                onClick={cancelEdit}
                                style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0', width: 'auto', padding: '0 0.65rem' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                id={`skill-edit-${skill.id}`}
                                className="icon-btn"
                                onClick={() => startEdit(skill)}
                                title="Edit skill"
                                style={{ background: '#ede9fe', color: '#4f46e5', borderColor: '#c4b5fd' }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                id={`skill-delete-${skill.id}`}
                                className="icon-btn"
                                disabled={deleting[skill.id]}
                                onClick={() => handleDelete(skill)}
                                title="Delete skill"
                                style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}
                              >
                                {deleting[skill.id] ? '…' : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
