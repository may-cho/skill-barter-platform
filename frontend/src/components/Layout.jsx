import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { Button } from "./ui";
import { ChevronDown, User, Settings, LogOut, Sparkles } from "lucide-react";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/proposals", label: "Proposals" },
  { to: "/calendar", label: "Calendar" },
  { to: "/reviews", label: "Review" },
  { to: "/negotiations/", label: "Negotiations" },
];

const adminLinks = [{ to: "/admin", label: "Admin" }];

const TYPE_META = {
  proposal_received: { icon: "📩", color: "#6366f1", label: "New Proposal" },
  counter_offer: { icon: "🔄", color: "#f59e0b", label: "Counter Offer" },
  proposal_accepted: { icon: "✅", color: "#10b981", label: "Accepted" },
  proposal_cancelled: { icon: "❌", color: "#ef4444", label: "Cancelled" },
  review_received: { icon: "⭐", color: "#f59e0b", label: "New Review" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleOpen = () => setOpen((v) => !v);
  const handleMarkRead = () => markAllRead();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <style>{`
        @keyframes bellShake {
          0%,100% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-13deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(5deg); }
        }
        .bell-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        }
        .bell-btn:hover { background: #f1f5f9; }
        .bell-btn.has-unread svg { animation: bellShake 1s ease 0.2s; }
        .notif-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #fff;
          animation: badgePop 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes badgePop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 360px;
          max-height: 480px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: dropIn 0.2s cubic-bezier(.4,0,.2,1);
          z-index: 999;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .notif-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
        .notif-mark-btn {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6366f1;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .notif-mark-btn:hover { background: #f0f0ff; }
        .notif-list { overflow-y: auto; flex: 1; }
        .notif-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 20px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
          cursor: default;
        }
        .notif-item:hover { background: #f8fafc; }
        .notif-item.unread { background: #fafaff; }
        .notif-item.unread:hover { background: #f0f0ff; }
        .notif-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          background: #f8fafc;
        }
        .notif-body-text { font-size: 0.8rem; color: #64748b; margin-top: 2px; line-height: 1.4; }
        .notif-time { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
        .notif-unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6366f1;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .notif-empty { padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 0.85rem; }
        @media (max-width: 480px) {
          .notif-dropdown { width: calc(100vw - 24px); right: -60px; }
        }
      `}</style>

      <button
        id="notification-bell-btn"
        className={`bell-btn${unreadCount > 0 ? " has-unread" : ""}`}
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        title="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="22"
          height="22"
          style={{ color: "#374151" }}
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown"
          role="dialog"
          aria-label="Notifications panel"
        >
          <div className="notif-header">
            <span className="notif-title">
              Notifications
              {unreadCount > 0 && (
                <span style={{ color: "#6366f1", marginLeft: 6 }}>
                  ({unreadCount})
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                className="notif-mark-btn"
                onClick={handleMarkRead}
                id="notif-mark-all-read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || {
                  icon: "🔔",
                  color: "#6366f1",
                };
                return (
                  <div
                    key={n.id}
                    className={`notif-item${!n.is_read ? " unread" : ""}`}
                  >
                    <div
                      className="notif-icon-wrap"
                      style={{ background: meta.color + "18" }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.83rem",
                          fontWeight: 600,
                          color: "#1e293b",
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="notif-body-text">{n.body}</div>
                      )}
                      <div className="notif-time">{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div className="notif-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LoadingFallback({ message = "Loading your account..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.is_admin || user?.is_staff || user?.is_superuser;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setUserMenuOpen((v) => !v);
  const closeUserMenu = () => setUserMenuOpen(false);

  const navItems = isAdmin ? adminLinks : links;

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="relative z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[4.5rem] flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">
              SkillBarter
            </span>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
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

          {/* Right side: notifications + merged avatar/profile dropdown */}
          <div className="flex items-center gap-2">
            {!isAdmin && <NotificationBell />}

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
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeUserMenu} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-900/5 py-1 z-50 overflow-visible">
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback message="Preparing your workspace..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
