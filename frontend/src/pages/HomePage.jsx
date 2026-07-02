import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Spinner } from '../components/ui';

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? matches.filter(
        (m) =>
          m.i_can_teach_for_them.some((s) => s.toLowerCase().includes(filter.toLowerCase())) ||
          m.they_can_teach_for_me.some((s) => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : matches;

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Smart Matches</h1>
        <p className="text-slate-600 mt-1">
          Users whose skills intersect with yours — teach what they want, learn what they offer.
        </p>
      </div>

      <input
        type="text"
        placeholder="Filter by skill..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-md px-4 py-2 mb-6 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <p>No matches yet. Add skills you can teach and want to learn in your profile.</p>
          <Link to="/profile" className="text-indigo-600 font-medium mt-2 inline-block">Go to Profile</Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((match) => (
            <Card key={match.user_id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{match.username}</h3>
                  <p className="text-sm text-slate-500">{match.location || 'No location'} · {match.timezone}</p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                  {match.match_score} match{match.match_score !== 1 ? 'es' : ''}
                </span>
              </div>
              {match.bio && <p className="text-sm text-slate-600 mb-4">{match.bio}</p>}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-green-700">You can teach them:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.i_can_teach_for_them.map((s) => (
                      <span key={s} className="bg-green-50 text-green-800 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-blue-700">They can teach you:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.they_can_teach_for_me.map((s) => (
                      <span key={s} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                to={`/proposals/new?user=${match.user_id}`}
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Send barter proposal →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
