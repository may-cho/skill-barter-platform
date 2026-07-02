import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatInTimezone } from '../lib/api';
import { Badge, Button, Card, Input, Spinner } from '../components/ui';

export default function CalendarPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectProposal = searchParams.get('proposal');
  const [appointments, setAppointments] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    proposal: preselectProposal || '',
    scheduled_time: '',
    duration_minutes: '60',
    meeting_link: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([api.getAppointments(), api.getProposals()])
      .then(([appts, props]) => {
        setAppointments(appts.results || appts);
        setProposals((props || []).filter((p) => p.status === 'Accepted'));
      });
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAppointment({
        proposal: Number(form.proposal),
        scheduled_time: new Date(form.scheduled_time).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        meeting_link: form.meeting_link,
      });
      setForm({ ...form, scheduled_time: '', meeting_link: '' });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared Calendar</h1>
        <p className="text-slate-600 mt-1">
          Schedule sessions for accepted proposals. Times shown in your timezone ({user?.timezone}).
        </p>
      </div>

      <Card className="p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Schedule Session</h2>
        {proposals.length === 0 ? (
          <p className="text-sm text-slate-500">No accepted proposals to schedule.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={form.proposal}
              onChange={(e) => setForm({ ...form, proposal: e.target.value })}
              required
            >
              <option value="">Select proposal</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id}: {p.offered_skill_title} ↔ {p.requested_skill_title}
                </option>
              ))}
            </select>
            <Input
              label="Date & Time (your local time)"
              type="datetime-local"
              value={form.scheduled_time}
              onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
            <Input
              label="Meeting Link (optional)"
              value={form.meeting_link}
              onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </form>
        )}
      </Card>

      <div>
        <h2 className="font-semibold mb-4">Upcoming Sessions</h2>
        {appointments.length === 0 ? (
          <Card className="p-6 text-slate-500 text-sm">No appointments scheduled.</Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <Card key={a.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {formatInTimezone(a.scheduled_time, user?.timezone)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Proposal #{a.proposal} · {a.duration_minutes} min
                    {a.scheduled_time_local && (
                      <span className="ml-2 text-xs">({a.scheduled_time_local})</span>
                    )}
                  </p>
                  {a.meeting_link && (
                    <a href={a.meeting_link} target="_blank" rel="noreferrer" className="text-sm text-indigo-600">
                      Join meeting
                    </a>
                  )}
                </div>
                <Badge status={a.status} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
