import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";
import { ChevronDown, User, Settings, LogOut, Sparkles } from "lucide-react";

// Navigation links (excluding Profile)
const mainLinks = [
  { to: "/discover", label: "Discover" },
  { to: "/proposals", label: "Proposals" },
  { to: "/calendar", label: "Calendar" },
  { to: "/negotiations/", label: "Negotiations" },
];

const adminLinks = [{ to: "/admin", label: "Admin" }];

export function Layout() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const closeUserMenu = () => setUserMenuOpen(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      {/* Header – taller, softer, more breathing room */}
      <header className="relative z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[4.5rem] flex items-center justify-between">
          {/* Logo – lighter weight, tighter tracking */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">
              SkillBarter
            </span>
          </NavLink>

          {/* Navigation – wider gaps, subtle active state, no heavy shadows */}
          <nav className="hidden md:flex items-center gap-2">
            {!(user?.is_admin || user?.is_staff || user?.is_superuser)
              ? mainLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-slate-900 bg-slate-100/80"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/60"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))
              : adminLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-slate-900 bg-slate-100/80"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/60"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
          </nav>

          {/* User menu – slightly larger touch target */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <img
                src={user?.avatar || "https://i.pravatar.cc/150?u=default"}
                alt={user?.username}
                className="w-8 h-8 rounded-full ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all object-cover"
              />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user?.username}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeUserMenu} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-900/5 py-1 z-50 overflow-visible animate-fade-in">
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={closeUserMenu}
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={closeUserMenu}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </NavLink>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      closeUserMenu();
                      logout();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content – full width & height (minus header) */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
