import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Badge, Button, Card, Input, Spinner } from '../components/ui';
import ProposalChat from '../components/ProposalChat';

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [counterForm, setCounterForm] = useState({});

  const load = () => api.getProposals().then(setProposals);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const act = async (id, action, data = {}) => {
    try {
      await api.proposalAction(id, action, data);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Barter Proposals</h1>
      </div>

      {proposals.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">No proposals yet.</Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <Card key={p.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge status={p.status} />
                    <span className="text-sm text-slate-500">#{p.id}</span>
                  </div>
                  <p className="font-medium">
                    {p.sender === user.id ? 'You' : p.sender_name} offer{' '}
                    <span className="text-indigo-600">{p.offered_hours}h of {p.offered_skill_title}</span>
                    {' '}for{' '}
                    <span className="text-indigo-600">{p.requested_hours}h of {p.requested_skill_title}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {p.sender === user.id ? `To: ${p.receiver_name}` : `From: ${p.sender_name}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {p.status === 'Accepted' && (
                  <Button variant="ghost" onClick={() => setActiveChat(activeChat === p.id ? null : p.id)}>
                    Chat
                  </Button>
                  )}
                  {p.status === 'Accepted' && (
                    <Link to={`/calendar?proposal=${p.id}`}>
                      <Button variant="secondary">Schedule</Button>
                    </Link>
                  )}
                  {['Pending', 'Negotiating'].includes(p.status) && p.receiver === user.id && (
                    <>
                      <Button onClick={() => act(p.id, 'accept')}>Accept</Button>
                      <Button variant="danger" onClick={() => act(p.id, 'reject')}>Reject</Button>
                    </>
                  )}
                  {['Pending', 'Negotiating'].includes(p.status) && (
                    <Button variant="secondary" onClick={() => setCounterForm({ ...counterForm, [p.id]: !counterForm[p.id] })}>
                      Counter
                    </Button>
                  )}
                  {p.status === 'Accepted' && (
                    <Button onClick={() => act(p.id, 'complete')}>Mark Complete</Button>
                  )}
                  {!['Completed', 'Canceled'].includes(p.status) && (
                    <Button variant="ghost" onClick={() => act(p.id, 'cancel')}>Cancel</Button>
                  )}
                {p.status === 'Completed' && (
             <Link to={`/reviews/new?proposal=${p.id}`}>
              <Button variant="secondary">Leave Review</Button>
            </Link>
              )}
                </div>
              </div>

              {counterForm[p.id] && (
                <CounterOfferForm
                  proposalId={p.id}
                  onSubmit={(data) => act(p.id, 'counter', data).then(() => setCounterForm({ ...counterForm, [p.id]: false }))}
                />
              )}

              {p.counter_offers?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Negotiation History</p>
                  {p.counter_offers.map((c) => (
                    <p key={c.id} className="text-sm text-slate-600">
                      {c.author_name}: {c.offered_hours}h ↔ {c.requested_hours}h
                      {c.message && ` — "${c.message}"`}
                    </p>
                  ))}
                </div>
              )}

              {activeChat === p.id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <ProposalChat proposalId={p.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CounterOfferForm({ proposalId, onSubmit }) {
  const [offered_hours, setOffered] = useState('2');
  const [requested_hours, setRequested] = useState('2');
  const [message, setMessage] = useState('');

  return (
    <form
      className="mt-4 p-4 bg-slate-50 rounded-lg flex flex-wrap gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ offered_hours, requested_hours, message });
      }}
    >
      <Input label="Offer hours" type="number" step="0.5" value={offered_hours} onChange={(e) => setOffered(e.target.value)} className="w-28" />
      <Input label="Request hours" type="number" step="0.5" value={requested_hours} onChange={(e) => setRequested(e.target.value)} className="w-28" />
      <Input label="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1 min-w-[200px]" />
      <Button type="submit">Send Counter</Button>
    </form>
  );
}

export function NewProposalPage() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const [skills, setSkills] = useState({ mine: { teach: [] }, theirs: [] });
  const [form, setForm] = useState({
    receiver: targetUserId || '', offered_skill: '', requested_skill: '',
    offered_hours: '2', requested_hours: '2',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getMySkills(),
      targetUserId ? api.getSkills(`user=${targetUserId}&type=teach`) : api.getSkills('type=teach'),
    ]).then(([mine, theirs]) => {
      setSkills({ mine, theirs: theirs.results || theirs });
    }).finally(() => setLoading(false));
  }, [targetUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProposal({
        ...form,
        receiver: Number(form.receiver),
        offered_skill: Number(form.offered_skill),
        requested_skill: Number(form.requested_skill),
      });
      window.location.href = '/proposals';
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <Card className="p-6 max-w-lg">
      <h1 className="text-xl font-bold mb-4">New Barter Proposal</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!targetUserId && (
          <Input label="Receiver User ID" type="number" value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} required />
        )}
        <select className="w-full px-3 py-2 border rounded-lg" value={form.offered_skill} onChange={(e) => setForm({ ...form, offered_skill: e.target.value })} required>
          <option value="">Your skill to offer</option>
          {skills.mine.teach?.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select className="w-full px-3 py-2 border rounded-lg" value={form.requested_skill} onChange={(e) => setForm({ ...form, requested_skill: e.target.value })} required>
          <option value="">Skill you want</option>
          {(skills.theirs?.results || skills.theirs || []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Hours you offer" type="number" step="0.5" value={form.offered_hours} onChange={(e) => setForm({ ...form, offered_hours: e.target.value })} />
          <Input label="Hours you request" type="number" step="0.5" value={form.requested_hours} onChange={(e) => setForm({ ...form, requested_hours: e.target.value })} />
        </div>
        <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Proposal'}</Button>
      </form>
    </Card>
  );
}
