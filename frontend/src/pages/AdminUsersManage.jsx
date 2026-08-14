import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function AdminUsersManage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await api.json('/admin/users/');
      setUsers(data.results ?? data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (user, field) => {
    setSaving((s) => ({ ...s, [user.id]: true }));
    const patch = {};
    if (field === 'is_active') patch.is_active = !user.is_active;
    if (field === 'is_admin') {
      patch.is_admin = !(user.is_admin || user.is_staff);
      patch.is_staff = patch.is_admin;
    }
    try {
      const updated = await api.updateAdminUser(user.id, patch);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
      showToast(`${user.username} updated.`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving((s) => ({ ...s, [user.id]: false }));
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const isAdmin = u.is_admin || u.is_staff || u.is_superuser;
    const matchRole =
      filterRole === 'All' ||
      (filterRole === 'Admin' && isAdmin) ||
      (filterRole === 'User' && !isAdmin) ||
      (filterRole === 'Inactive' && !u.is_active);
    return matchSearch && matchRole;
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
          padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9;
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
        .toggle-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.28rem 0.7rem; border-radius: 999px; font-size: 0.75rem;
          font-weight: 600; cursor: pointer; border: 1.5px solid transparent;
          transition: all 0.15s; outline: none;
        }
        .toggle-btn:disabled { opacity: 0.45; cursor: not-allowed; }
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
        .avatar-circle {
          width: 32px; height: 32px; border-radius: 50%; display: inline-flex;
          align-items: center; justify-content: center; font-size: 0.8rem;
          font-weight: 700; flex-shrink: 0;
        }
      `}</style>

      {toast && <div className="toast-bar">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button id="users-back-btn" className="back-btn" onClick={() => navigate('/admin')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Users</h1>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem', marginTop: '0.25rem' }}>
        Manage user roles, admin access, and account status.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          id="users-search"
          className="search-input"
          placeholder="Search by username or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {['All', 'Admin', 'User', 'Inactive'].map((role) => {
          const active = filterRole === role;
          const colors = {
            All:      { bg: '#ede9fe', color: '#4f46e5', border: '#c4b5fd' },
            Admin:    { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
            User:     { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
            Inactive: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
          };
          const c = colors[role];
          return (
            <button
              key={role}
              className="filter-chip"
              style={{
                background: active ? c.bg : '#f8fafc',
                color: active ? c.color : '#64748b',
                borderColor: active ? c.border : '#e2e8f0',
              }}
              onClick={() => setFilterRole(role)}
            >
              {role}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
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
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="manage-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Admin Access</th>
                  <th>Account Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isAdmin = user.is_admin || user.is_staff || user.is_superuser;
                  const avatarBg = isAdmin ? '#ede9fe' : '#dbeafe';
                  const avatarColor = isAdmin ? '#4f46e5' : '#2563eb';
                  const initials = (user.username || '?')[0].toUpperCase();
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="avatar-circle" style={{ background: avatarBg, color: avatarColor }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.username}</div>
                            {user.first_name && (
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.first_name} {user.last_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{user.email || '—'}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                          fontSize: '0.75rem', fontWeight: 600,
                          background: user.is_active ? '#d1fae5' : '#fee2e2',
                          color: user.is_active ? '#065f46' : '#991b1b',
                          border: `1px solid ${user.is_active ? '#a7f3d0' : '#fca5a5'}`,
                        }}>
                          {user.is_active ? 'Active' : 'Restricted'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                          fontSize: '0.75rem', fontWeight: 600,
                          background: isAdmin ? '#fef3c7' : '#f1f5f9',
                          color: isAdmin ? '#92400e' : '#64748b',
                          border: `1px solid ${isAdmin ? '#fde68a' : '#e2e8f0'}`,
                        }}>
                          {isAdmin ? '⭐ Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <button
                          id={`toggle-admin-${user.id}`}
                          className="toggle-btn"
                          disabled={saving[user.id]}
                          onClick={() => handleToggle(user, 'is_admin')}
                          style={{
                            background: isAdmin ? '#fef3c7' : '#f8fafc',
                            color: isAdmin ? '#92400e' : '#64748b',
                            borderColor: isAdmin ? '#fde68a' : '#e2e8f0',
                          }}
                        >
                          {isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                        </button>
                      </td>
                      <td>
                        <button
                          id={`toggle-active-${user.id}`}
                          className="toggle-btn"
                          disabled={saving[user.id]}
                          onClick={() => handleToggle(user, 'is_active')}
                          style={{
                            background: user.is_active ? '#fee2e2' : '#d1fae5',
                            color: user.is_active ? '#991b1b' : '#065f46',
                            borderColor: user.is_active ? '#fca5a5' : '#a7f3d0',
                          }}
                        >
                          {user.is_active ? 'Restrict' : 'Activate'}
                        </button>
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
