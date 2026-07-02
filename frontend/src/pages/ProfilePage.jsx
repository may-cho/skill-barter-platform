import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, CATEGORIES, LEVELS, TIMEZONES } from '../lib/api';
import { Button, Card, Input, Select, Spinner, Textarea } from '../components/ui';

function SkillForm({ type, onAdded }) {
  const [form, setForm] = useState({
    type, category: 'Programming', title: '', description: '', experience_level: 'Beginner',
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createSkill(form);
      setForm({ ...form, title: '', description: '' });
      onAdded();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select label="Level" value={form.experience_level} onChange={set('experience_level')}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
      <Input label="Skill Title" value={form.title} onChange={set('title')} required />
      <Textarea label="Description" value={form.description} onChange={set('description')} />
      <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Skill'}</Button>
    </form>
  );
}

function SkillList({ skills, onDelete }) {
  if (!skills?.length) return <p className="text-sm text-slate-500 mt-2">No skills added yet.</p>;
  return (
    <ul className="mt-3 space-y-2">
      {skills.map((s) => (
        <li key={s.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg text-sm">
          <div>
            <span className="font-medium">{s.title}</span>
            <span className="text-slate-500 ml-2">{s.category} · {s.experience_level}</span>
          </div>
          <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
        </li>
      ))}
    </ul>
  );
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [skills, setSkills] = useState({ teach: [], learn: [] });
  const [profile, setProfile] = useState({ bio: user?.bio || '', location: user?.location || '', timezone: user?.timezone || 'UTC' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSkills = () => api.getMySkills().then(setSkills);

  useEffect(() => {
    loadSkills().finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(profile);
      await refreshProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (id) => {
    await api.deleteSkill(id);
    loadSkills();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Basic Info</h2>
        <form onSubmit={saveProfile} className="space-y-4 max-w-lg">
          <Textarea label="Bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          <Input label="Location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
          <Select label="Timezone" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </Select>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-green-700">Skills I Can Teach</h2>
          <SkillList skills={skills.teach} onDelete={deleteSkill} />
          <SkillForm type="teach" onAdded={loadSkills} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-blue-700">Skills I Want to Learn</h2>
          <SkillList skills={skills.learn} onDelete={deleteSkill} />
          <SkillForm type="learn" onAdded={loadSkills} />
        </Card>
      </div>
    </div>
  );
}
