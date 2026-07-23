import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';

const links = [
    { to: '/discover', label: 'Discover' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/profile', label: 'Profile' },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="text-xl font-bold text-indigo-600">
              SkillBarter
            </NavLink>
            <nav className="hidden sm:flex gap-1">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>


<div className="flex items-center gap-3">
  <span className="text-sm text-slate-600 hidden sm:inline">{user?.username}</span>


  <Button variant="ghost" onClick={logout}>Sign out</Button>
</div>
        </div>
      </header>
      <main className="mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
