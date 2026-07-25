import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';

const CARD_STYLES = 'bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow';
const ICON_STYLES = 'text-2xl';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeSection, setActiveSection] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const u = await api.json('/admin/users/');
        setUsers(u.results || u);
        if ((u.results || u).length) setSelectedUser((u.results || u)[0]);
        const p = await api.json('/admin/proposals/');
        setProposals(p.results || p);
        if ((p.results || p).length) setSelectedProposal((p.results || p)[0]);
        const s = await api.json('/admin/skills/');
        setSkills(s.results || s);
        if ((s.results || s).length) setSelectedSkill((s.results || s)[0]);
        const n = await api.json('/admin/notifications/');
        setNotifications(n.results || n);
      } catch (err) {
        console.error('Failed to load admin data', err);
        setError(err.message || 'Unauthorized or server error');
      }
    }
    load();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000/ws/admin/notifications/?token=${token}`);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'notification') {
          setNotifications(n => [data.notification, ...n]);
        }
      } catch (e) {
        console.error('Notification parse error', e);
      }
    };
    return () => ws.close();
  }, []);

  const proposalsByUser = useMemo(() => {
    const map = {};
    proposals.forEach(p => {
      map[p.sender] = (map[p.sender] || 0) + 1;
      map[p.receiver] = (map[p.receiver] || 0) + 1;
    });
    return map;
  }, [proposals]);

  const skillsByUser = useMemo(() => {
    const map = {};
    skills.forEach(s => {
      map[s.user] = (map[s.user] || 0) + 1;
    });
    return map;
  }, [skills]);

  const selectedUserProposals = useMemo(
    () => proposals.filter(p => selectedUser && (p.sender === selectedUser.id || p.receiver === selectedUser.id)),
    [proposals, selectedUser]
  );

  const selectedUserSkills = useMemo(
    () => skills.filter(s => selectedUser && s.user === selectedUser.id),
    [skills, selectedUser]
  );

  const renderSectionCard = (type, label, count, icon, active) => (
    <button
      type="button"
      onClick={() => setActiveSection(type)}
      className={`${CARD_STYLES} ${active ? 'ring-2 ring-indigo-500' : ''} text-left w-full`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500 uppercase tracking-[0.2em]">{label}</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{count}</div>
          <div className="mt-1 text-sm text-slate-500">Total {label.toLowerCase()}</div>
        </div>
        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <span className={ICON_STYLES}>{icon}</span>
        </div>
      </div>
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Site management overview</h1>
        </div>
      </header>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderSectionCard('users', 'Users', users.length, '👥', activeSection === 'users')}
        {renderSectionCard('proposals', 'Proposals', proposals.length, '📝', activeSection === 'proposals')}
        {renderSectionCard('skills', 'Skills', skills.length, '⚡', activeSection === 'skills')}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{activeSection === 'users' ? 'User details' : activeSection === 'proposals' ? 'Proposal details' : 'Skill details'}</h2>
              <p className="mt-1 text-sm text-slate-500">Click any row to inspect details.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Active: {activeSection}</div>
          </div>

          {activeSection === 'users' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map(u => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full ${CARD_STYLES} ${selectedUser?.id === u.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{u.username}</div>
                        <div className="text-sm text-slate-500">{u.email}</div>
                      </div>
                      <div className="text-2xl">👤</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{selectedUser?.id === u.id ? selectedUserProposals.length : proposalsByUser[u.id] || 0}</div>
                        <div>Proposals</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{selectedUser?.id === u.id ? selectedUserSkills.length : skillsByUser[u.id] || 0}</div>
                        <div>Skills</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{u.is_admin || u.is_staff || u.is_superuser ? 'Yes' : 'No'}</div>
                        <div>Admin</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedUser ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected user</p>
                      <h3 className="text-2xl font-semibold text-slate-900">{selectedUser.username}</h3>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">Profile status: {selectedUser.is_admin ? 'Admin' : selectedUser.is_staff ? 'Staff' : 'User'}</div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Joined</p>
                      <p className="mt-2 text-slate-900 font-medium">{new Date(selectedUser.date_joined).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Proposals</p>
                      <div className="mt-3 space-y-2">
                        {selectedUserProposals.map(p => (
                          <div key={p.id} className="rounded-2xl border border-slate-200 p-3">
                            <div className="font-medium text-slate-900">Proposal #{p.id}</div>
                            <div className="text-xs text-slate-500">{p.status}</div>
                          </div>
                        ))}
                        {!selectedUserProposals.length && <div className="text-sm text-slate-500">No proposals yet</div>}
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Skills</p>
                      <div className="mt-3 space-y-2">
                        {selectedUserSkills.map(s => (
                          <div key={s.id} className="rounded-2xl border border-slate-200 p-3">
                            <div className="font-medium text-slate-900">{s.title}</div>
                            <div className="text-xs text-slate-500">{s.category} • {s.experience_level}</div>
                          </div>
                        ))}
                        {!selectedUserSkills.length && <div className="text-sm text-slate-500">No skills yet</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Select a user to see their full details.</div>
              )}
            </div>
          )}

          {activeSection === 'proposals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {proposals.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProposal(p)}
                    className={`${CARD_STYLES} ${selectedProposal?.id === p.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left w-full`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">Proposal #{p.id}</div>
                        <div className="text-sm text-slate-500">{p.status}</div>
                      </div>
                      <div className="text-2xl">📄</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{p.offered_skill || '—'}</div>
                        <div>Offered</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{p.requested_skill || '—'}</div>
                        <div>Requested</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{new Date(p.created_at).toLocaleDateString()}</div>
                        <div>Created</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedProposal ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected proposal</p>
                      <h3 className="text-2xl font-semibold text-slate-900">Proposal #{selectedProposal.id}</h3>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">{selectedProposal.status}</div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Sender</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedProposal.sender}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Receiver</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedProposal.receiver}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Offered Skill</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedProposal.offered_skill || 'None'}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Requested Skill</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedProposal.requested_skill || 'None'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Select a proposal to view details.</div>
              )}
            </div>
          )}

          {activeSection === 'skills' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {skills.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSkill(s)}
                    className={`${CARD_STYLES} ${selectedSkill?.id === s.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left w-full`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{s.title}</div>
                        <div className="text-sm text-slate-500">{s.category}</div>
                      </div>
                      <div className="text-2xl">🏷️</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{s.experience_level}</div>
                        <div>Level</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{s.type}</div>
                        <div>Type</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{new Date(s.created_at).toLocaleDateString()}</div>
                        <div>Created</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedSkill ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected skill</p>
                      <h3 className="text-2xl font-semibold text-slate-900">{selectedSkill.title}</h3>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">{selectedSkill.category}</div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Owner</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedSkill.user}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-sm text-slate-500">Experience</p>
                      <p className="mt-2 text-slate-900 font-medium">{selectedSkill.experience_level}</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl bg-white p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="mt-3 text-slate-900">{selectedSkill.description || 'No description provided.'}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Select a skill to see details.</div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span>Total users</span>
                <strong>{users.length}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 pt-3">
                <span>Total proposals</span>
                <strong>{proposals.length}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 pt-3">
                <span>Total skills</span>
                <strong>{skills.length}</strong>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span>Total notifications</span>
                <strong>{notifications.length}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">All Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{n.topic}</div>
                  <div className="mt-2 text-sm text-slate-600">{n.body}</div>
                </div>
              ))}
              {!notifications.length && <div className="text-sm text-slate-500">No notifications available.</div>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
