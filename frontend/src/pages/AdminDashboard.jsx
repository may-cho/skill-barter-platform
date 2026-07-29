import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CARDS = [
  {
    key: 'users',
    label: 'Users',
    subtitle: 'Total registered accounts',
    countKey: 'users_count',
    subCountKey: 'active_users',
    subLabel: 'Active',
    route: '/admin/users-manage',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    glowColor: 'rgba(79,70,229,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="34" height="34">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'skills',
    label: 'Skills',
    subtitle: 'Published skill listings',
    countKey: 'skills_count',
    subCountKey: null,
    subLabel: null,
    route: '/admin/skills-manage',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
    glowColor: 'rgba(8,145,178,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="34" height="34">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'proposals',
    label: 'Proposals',
    subtitle: 'Skill-barter proposals',
    countKey: 'proposals_count',
    subCountKey: 'pending_proposals',
    subLabel: 'Pending',
    route: '/admin/proposals-manage',
    gradient: 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)',
    glowColor: 'rgba(219,39,119,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="34" height="34">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard stats');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100%', padding: '2.5rem 2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .admin-stat-card {
          position: relative;
          border-radius: 20px;
          padding: 2rem 2rem 1.75rem;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s cubic-bezier(.4,0,.2,1);
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 210px;
          outline: none;
          border: none;
          text-align: left;
          user-select: none;
        }
        .admin-stat-card:hover {
          transform: translateY(-6px) scale(1.015);
        }
        .admin-stat-card:focus-visible {
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px #6366f1;
        }
        .admin-stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.06);
          border-radius: inherit;
          pointer-events: none;
        }
        .card-noise {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
        }
        .card-orb {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          right: -40px;
          bottom: -60px;
          pointer-events: none;
        }
        .card-orb-sm {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          right: 90px;
          bottom: 60px;
          pointer-events: none;
        }
        .card-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(4px);
          flex-shrink: 0;
        }
        .card-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          opacity: 0.85;
          transition: opacity 0.2s, gap 0.2s;
        }
        .admin-stat-card:hover .card-arrow {
          opacity: 1;
          gap: 10px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: 1fr; }
        }
        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          margin-right: 6px;
          animation: pulse-anim 2s infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Site Management Overview
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.95rem' }}>
          <span className="pulse-dot" />
          Live platform statistics — click a card to manage
        </p>
      </header>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem 1.25rem', color: '#b91c1c', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        {CARDS.map((card) => {
          const count = stats ? stats[card.countKey] : null;
          const subCount = card.subCountKey && stats ? stats[card.subCountKey] : null;

          return (
            <button
              id={`admin-card-${card.key}`}
              key={card.key}
              className="admin-stat-card"
              style={{
                background: card.gradient,
                boxShadow: `0 8px 32px ${card.glowColor}, 0 2px 8px rgba(0,0,0,0.1)`,
              }}
              onClick={() => navigate(card.route)}
              aria-label={`Manage ${card.label}`}
            >
              <div className="card-noise" />
              <div className="card-orb" />
              <div className="card-orb-sm" />

              {/* Top row: icon + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                <div className="card-icon-wrap">{card.icon}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 2 }}>{card.subtitle}</div>
                </div>
              </div>

              {/* Count */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {loading ? (
                  <div className="skeleton" style={{ height: 48, width: 80 }} />
                ) : (
                  <div style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {count ?? '—'}
                  </div>
                )}
                {subCount !== null && !loading && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', opacity: 0.8 }}>
                    <span style={{ fontWeight: 700 }}>{subCount}</span> {card.subLabel}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
                <span className="card-arrow">
                  Manage {card.label}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick info strip */}
      {stats && !loading && (
        <div style={{
          marginTop: '2.5rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', flexShrink: 0 }}>
            At a glance
          </div>
          {[
            { label: 'Total Users', value: stats.users_count },
            { label: 'Active Users', value: stats.active_users },
            { label: 'Total Skills', value: stats.skills_count },
            { label: 'Total Proposals', value: stats.proposals_count },
            { label: 'Pending Proposals', value: stats.pending_proposals },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
