import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !(user.is_admin || user.is_staff || user.is_superuser)) return <Navigate to="/login" replace />;
  return children;
}

export default function AdminLayout() {
  const { logout, user } = useAuth();

  const links = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/proposals', label: 'Proposals' },
    { to: '/admin/skills', label: 'Skills' },
    { to: '/admin/notifications', label: 'Notifications' },
  ]

  return (
    <ProtectedAdminRoute>
      { <div className="min-h-screen bg-slate-50">
        {/* <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Admin</div>
              <h1 className="text-2xl font-bold text-slate-900">Management dashboard</h1>
            </div>
            <div className="text-sm text-slate-600">Signed in as {user?.username}</div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <nav className="flex flex-wrap gap-2">
              {links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className{
  "editor.fontFamily": "'JetBrains Mono', 'JetBrainsMono Nerd Font', monospace",
  "editor.fontLigatures": true,
  "terminal.integrated.fontFamily": "'JetBrainsMono Nerd Font', 'JetBrains Mono', monospace"
}={({ isActive }) =>
                    `px-4 py-2 rounded-full text-sm font-medium transition ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>  */}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <main>
            <Outlet />
          </main>
        </div>
      </div> }
    </ProtectedAdminRoute>
  );
}
