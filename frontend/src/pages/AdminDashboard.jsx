import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CARD_STYLES = 'bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow';
const ICON_STYLES = 'text-2xl';
const PROPOSAL_STATUSES = ['Pending', 'Negotiating', 'Accepted', 'Completed', 'Canceled'];
const SKILL_TYPES = ['teach', 'learn'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const SKILL_CATEGORIES = ['Programming', 'Languages', 'Music', 'Health & Fitness', 'Arts', 'Business', 'Other'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSection = ['users', 'proposals', 'skills', 'notifications'].includes(location.pathname.split('/').filter(Boolean).pop())
    ? location.pathname.split('/').filter(Boolean).pop()
    : 'overview';

  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [userForm, setUserForm] = useState({ is_admin: false, is_active: true });
  const [proposalStatus, setProposalStatus] = useState('Pending');
  const [skillForm, setSkillForm] = useState({ title: '', category: 'Programming', experience_level: 'Beginner', type: 'teach', description: '' });

  async function loadData() {
    try {
      const [u, p, s, n] = await Promise.all([
        api.json('/admin/users/'),
        api.json('/admin/proposals/'),
        api.json('/admin/skills/'),
        api.json('/admin/notifications/'),
      ]);

      const usersData = u.results || u;
      const proposalsData = p.results || p;
      const skillsData = s.results || s;
      const notificationsData = n.results || n;

      setUsers(usersData);
      setProposals(proposalsData);
      setSkills(skillsData);
      setNotifications(notificationsData);
      if (!selectedUser && usersData.length) setSelectedUser(usersData[0]);
      if (!selectedProposal && proposalsData.length) setSelectedProposal(proposalsData[0]);
      if (!selectedSkill && skillsData.length) setSelectedSkill(skillsData[0]);
    } catch (err) {
      console.error('Failed to load admin data', err);
      setError(err.message || 'Unauthorized or server error');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000/ws/admin/notifications/?token=${token}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications((current) => [data.notification, ...current]);
        }
      } catch (error) {
        console.error('Admin notification parse error', error);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (selectedUser && !users.some((user) => user.id === selectedUser.id)) {
      setSelectedUser(users[0] || null);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (selectedProposal && !proposals.some((proposal) => proposal.id === selectedProposal.id)) {
      setSelectedProposal(proposals[0] || null);
    }
  }, [proposals, selectedProposal]);

  useEffect(() => {
    if (selectedSkill && !skills.some((skill) => skill.id === selectedSkill.id)) {
      setSelectedSkill(skills[0] || null);
    }
  }, [skills, selectedSkill]);

  useEffect(() => {
    if (selectedUser) {
      setUserForm({
        is_admin: Boolean(selectedUser.is_admin || selectedUser.is_staff || selectedUser.is_superuser),
        is_active: selectedUser.is_active !== false,
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedProposal) {
      setProposalStatus(selectedProposal.status || 'Pending');
    }
  }, [selectedProposal]);

  useEffect(() => {
    if (selectedSkill) {
      setSkillForm({
        title: selectedSkill.title || '',
        category: selectedSkill.category || 'Programming',
        experience_level: selectedSkill.experience_level || 'Beginner',
        type: selectedSkill.type || 'teach',
        description: selectedSkill.description || '',
      });
    }
  }, [selectedSkill]);

  const proposalsByUser = useMemo(() => {
    const map = {};
    proposals.forEach((proposal) => {
      map[proposal.sender] = (map[proposal.sender] || 0) + 1;
      map[proposal.receiver] = (map[proposal.receiver] || 0) + 1;
    });
    return map;
  }, [proposals]);

  const skillsByUser = useMemo(() => {
    const map = {};
    skills.forEach((skill) => {
      map[skill.user] = (map[skill.user] || 0) + 1;
    });
    return map;
  }, [skills]);

  const selectedUserProposals = useMemo(
    () => proposals.filter((proposal) => selectedUser && (proposal.sender === selectedUser.id || proposal.receiver === selectedUser.id)),
    [proposals, selectedUser]
  );

  const selectedUserSkills = useMemo(
    () => skills.filter((skill) => selectedUser && skill.user === selectedUser.id),
    [skills, selectedUser]
  );

  const goToSection = (section) => {
    navigate(section === 'overview' ? '/admin' : `/admin/${section}`);
  };

  const handleUserSave = async () => {
    if (!selectedUser) return;
    try {
      const updated = await api.updateAdminUser(selectedUser.id, {
        is_admin: userForm.is_admin,
        is_staff: userForm.is_admin,
        is_active: userForm.is_active,
      });
      setUsers((current) => current.map((user) => (user.id === selectedUser.id ? { ...user, ...updated } : user)));
      setSelectedUser((current) => (current && current.id === selectedUser.id ? { ...current, ...updated } : current));
      setFeedback('User role and access were updated.');
    } catch (err) {
      setFeedback(err.message || 'Unable to update user.');
    }
  };

  const handleProposalSave = async () => {
    if (!selectedProposal) return;
    try {
      const updated = await api.updateAdminProposal(selectedProposal.id, { status: proposalStatus });
      setProposals((current) => current.map((proposal) => (proposal.id === selectedProposal.id ? { ...proposal, ...updated } : proposal)));
      setSelectedProposal((current) => (current && current.id === selectedProposal.id ? { ...current, ...updated } : current));
      setFeedback('Proposal status updated.');
    } catch (err) {
      setFeedback(err.message || 'Unable to update proposal.');
    }
  };

  const handleSkillSave = async () => {
    if (!selectedSkill) return;
    try {
      const updated = await api.updateAdminSkill(selectedSkill.id, skillForm);
      setSkills((current) => current.map((skill) => (skill.id === selectedSkill.id ? { ...skill, ...updated } : skill)));
      setSelectedSkill((current) => (current && current.id === selectedSkill.id ? { ...current, ...updated } : current));
      setFeedback('Skill details updated.');
    } catch (err) {
      setFeedback(err.message || 'Unable to update skill.');
    }
  };

  const handleSkillDelete = async () => {
    if (!selectedSkill) return;
    if (!window.confirm('Remove this skill from the platform?')) return;
    try {
      await api.deleteAdminSkill(selectedSkill.id);
      const nextSkills = skills.filter((skill) => skill.id !== selectedSkill.id);
      setSkills(nextSkills);
      setSelectedSkill(nextSkills[0] || null);
      setFeedback('Skill removed.');
    } catch (err) {
      setFeedback(err.message || 'Unable to delete skill.');
    }
  };

  const renderSectionCard = (type, label, count, icon) => (
    <button
      type="button"
      onClick={() => goToSection(type)}
      className={`${CARD_STYLES} ${currentSection === type ? 'ring-2 ring-indigo-500' : ''} text-left w-full`}
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
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {currentSection === 'overview' ? 'Overview' : `${currentSection[0].toUpperCase()}${currentSection.slice(1)}`}
        </div>
      </header>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
      {feedback && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{feedback}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderSectionCard('users', 'Users', users.length, '👥')}
        {renderSectionCard('proposals', 'Proposals', proposals.length, '📝')}
        {renderSectionCard('skills', 'Skills', skills.length, '⚡')}
      </section>

      {currentSection === 'overview' && (
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">System overview</h2>
            <p className="mt-2 text-sm text-slate-500">Manage people, proposals, and skills from one place.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Active users</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{users.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Open proposals</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{proposals.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Published skills</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{skills.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Latest system updates</h2>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.topic}</div>
                  <div className="mt-2 text-sm text-slate-600">{item.body}</div>
                </div>
              ))}
              {!notifications.length && <div className="text-sm text-slate-500">No notifications yet.</div>}
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          {currentSection === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Users</h2>
                  <p className="mt-1 text-sm text-slate-500">Manage roles and restrict accounts quickly.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`w-full ${CARD_STYLES} ${selectedUser?.id === user.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{user.username}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                      <div className="text-2xl">👤</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{proposalsByUser[user.id] || 0}</div>
                        <div>Proposals</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{skillsByUser[user.id] || 0}</div>
                        <div>Skills</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{user.is_admin || user.is_staff ? 'Yes' : 'No'}</div>
                        <div>Admin</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'proposals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Proposals</h2>
                  <p className="mt-1 text-sm text-slate-500">Review proposal details and update status.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {proposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    type="button"
                    onClick={() => setSelectedProposal(proposal)}
                    className={`${CARD_STYLES} ${selectedProposal?.id === proposal.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left w-full`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">Proposal #{proposal.id}</div>
                        <div className="text-sm text-slate-500">{proposal.status}</div>
                      </div>
                      <div className="text-2xl">📄</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{proposal.offered_skill || '—'}</div>
                        <div>Offered</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{proposal.requested_skill || '—'}</div>
                        <div>Requested</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{new Date(proposal.created_at).toLocaleDateString()}</div>
                        <div>Created</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
                  <p className="mt-1 text-sm text-slate-500">Review skill listings and manage their details.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkill(skill)}
                    className={`${CARD_STYLES} ${selectedSkill?.id === skill.id ? 'border-indigo-500 bg-indigo-50' : ''} text-left w-full`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{skill.title}</div>
                        <div className="text-sm text-slate-500">{skill.category}</div>
                      </div>
                      <div className="text-2xl">🏷️</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{skill.experience_level}</div>
                        <div>Level</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{skill.type}</div>
                        <div>Type</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center">
                        <div className="font-semibold text-slate-900">{new Date(skill.created_at).toLocaleDateString()}</div>
                        <div>Created</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest platform updates and announcements.</p>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">{notification.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{notification.topic}</div>
                    <div className="mt-2 text-sm text-slate-600">{notification.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {currentSection === 'users' && selectedUser ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected user</p>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedUser.username}</h3>
              </div>
              <dl className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedUser.email}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-slate-500">Joined</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{new Date(selectedUser.date_joined).toLocaleDateString()}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-slate-500">Active proposals</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedUserProposals.length}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-slate-500">Skills</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedUserSkills.length}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 border border-slate-200">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Admin access</span>
                  <input
                    type="checkbox"
                    checked={userForm.is_admin}
                    onChange={(event) => setUserForm({ ...userForm, is_admin: event.target.checked })}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Restrict account</span>
                  <input
                    type="checkbox"
                    checked={!userForm.is_active}
                    onChange={(event) => setUserForm({ ...userForm, is_active: !event.target.checked })}
                  />
                </label>
                <button type="button" onClick={handleUserSave} className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save user management</button>
              </div>
            </div>
          ) : currentSection === 'users' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Select a user to manage access.</div>
          ) : null}

          {currentSection === 'proposals' && selectedProposal ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected proposal</p>
                <h3 className="text-2xl font-semibold text-slate-900">Proposal #{selectedProposal.id}</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-slate-500">Sender</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedProposal.sender}</div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-slate-500">Receiver</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedProposal.receiver}</div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-slate-500">Offered skill</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedProposal.offered_skill || '—'}</div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-slate-500">Requested skill</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedProposal.requested_skill || '—'}</div>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700">
                  Proposal status
                  <select value={proposalStatus} onChange={(event) => setProposalStatus(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    {PROPOSAL_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={handleProposalSave} className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save proposal status</button>
              </div>
            </div>
          ) : currentSection === 'proposals' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Select a proposal to manage its status.</div>
          ) : null}

          {currentSection === 'skills' && selectedSkill ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Selected skill</p>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedSkill.title}</h3>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Title
                  <input value={skillForm.title} onChange={(event) => setSkillForm({ ...skillForm, title: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select value={skillForm.category} onChange={(event) => setSkillForm({ ...skillForm, category: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    {SKILL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Type
                  <select value={skillForm.type} onChange={(event) => setSkillForm({ ...skillForm, type: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    {SKILL_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Experience level
                  <select value={skillForm.experience_level} onChange={(event) => setSkillForm({ ...skillForm, experience_level: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <textarea value={skillForm.description} onChange={(event) => setSkillForm({ ...skillForm, description: event.target.value })} rows="4" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={handleSkillSave} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save skill</button>
                  <button type="button" onClick={handleSkillDelete} className="flex-1 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Remove skill</button>
                </div>
              </div>
            </div>
          ) : currentSection === 'skills' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Select a skill to edit its details.</div>
          ) : null}

          {currentSection === 'overview' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <div className="mt-4 space-y-3">
                {notifications.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
