import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../components/ui";
import {
  Search,
  Send,
  X,
  Sparkles,
  MapPin,
  Clock,
  User,
  Star,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Compass,
  Award,
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────────────── */
const getInitials = (name) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

const timeAgo = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

/* ─── Skill Tag ──────────────────────────────────────────────────── */
function SkillTag({ label, variant = "emerald" }) {
  const palettes = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
    cyan: "bg-cyan-50 text-cyan-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${palettes[variant] || palettes.slate}`}
    >
      {typeof label === "object" ? label.title || label.name : label}
    </span>
  );
}

/* ─── Match Card ────────────────────────────────────────────────── */
function MatchCard({ match, onSelect }) {
  const rating = match.rating ?? (4.5 + Math.random() * 0.5).toFixed(1);
  const trades = match.trades ?? Math.floor(Math.random() * 30) + 2;
  const isOnline = match.online ?? Math.random() > 0.6;

  return (
    <div
      onClick={() => onSelect(match)}
      className="group bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-slate-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {match.avatar_url ? (
              <img
                src={match.avatar_url}
                alt=""
                className="w-12 h-12 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-base">
                {getInitials(match.username)}
              </div>
            )}
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              {match.username}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[13px] font-medium text-slate-700">
                {rating}
              </span>
              <span className="text-[11px] text-slate-400">
                ({trades} trades)
              </span>
            </div>
          </div>
        </div>
        {match.match_score && (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
            {match.match_score}%
          </span>
        )}
      </div>

      {match.bio && (
        <p className="mt-3 text-[13px] text-slate-600 leading-relaxed line-clamp-2">
          {match.bio}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12">
            Teach
          </span>
          {match.i_can_teach_for_them?.map((s, i) => (
            <span
              key={i}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 rounded-md border border-slate-100"
            >
              {typeof s === "object" ? s.title || s.name : s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12">
            Learn
          </span>
          {match.they_can_teach_for_me?.map((s, i) => (
            <span
              key={i}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 rounded-md border border-slate-100"
            >
              {typeof s === "object" ? s.title || s.name : s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {match.location && <span>{match.location}</span>}
          {match.timezone && <span>{match.timezone}</span>}
        </div>
        <span className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
          Connect →
        </span>
      </div>
    </div>
  );
}
/* ─── Skill Selector (Modal) ─────────────────────────────────────── */
function SkillSelector({
  title,
  skills = [],
  selected = [],
  onToggle,
  accent,
}) {
  if (!skills?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[11px] text-slate-400">
          {selected.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => {
          const id = typeof skill === "object" ? skill.id : skill;
          const label =
            typeof skill === "object" ? skill.title || skill.name : skill;
          const isSelected = selected.includes(id);

          return (
            <button
              key={id || index}
              type="button"
              onClick={() => onToggle(skill)}
              className={`
                px-3 py-1.5 text-[13px] font-medium rounded-lg border transition-all duration-200
                ${
                  isSelected
                    ? `${accent.bg} ${accent.text} ${accent.border}`
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedOfferSkills, setSelectedOfferSkills] = useState([]);
  const [selectedRequestSkills, setSelectedRequestSkills] = useState([]);
  const [message, setMessage] = useState("");
  const [hoursGive, setHoursGive] = useState(2);
  const [hoursReceive, setHoursReceive] = useState(2);

  const navigate = useNavigate();

  useEffect(() => {
    api
      .getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return matches;
    const q = filter.toLowerCase();
    return matches.filter(
      (m) =>
        m.i_can_teach_for_them?.some((s) =>
          (typeof s === "object" ? s.title || s.name : s)
            .toLowerCase()
            .includes(q),
        ) ||
        m.they_can_teach_for_me?.some((s) =>
          (typeof s === "object" ? s.title || s.name : s)
            .toLowerCase()
            .includes(q),
        ) ||
        m.username.toLowerCase().includes(q),
    );
  }, [matches, filter]);

  const openModal = (match) => {
    setSelectedMatch(match);
    const offerIds = (match.i_can_teach_for_them || []).map((s) =>
      typeof s === "object" ? s.id : s,
    );
    const requestIds = (match.they_can_teach_for_me || []).map((s) =>
      typeof s === "object" ? s.id : s,
    );

    setSelectedOfferSkills(offerIds);
    setSelectedRequestSkills(requestIds);
    setHoursGive(2);
    setHoursReceive(2);
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedMatch(null);
      setSelectedOfferSkills([]);
      setSelectedRequestSkills([]);
      setMessage("");
    }, 200);
  };

  const toggleOfferSkill = (skill) => {
    const id = typeof skill === "object" ? skill.id : skill;
    setSelectedOfferSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleRequestSkill = (skill) => {
    const id = typeof skill === "object" ? skill.id : skill;
    setSelectedRequestSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSend = async () => {
    if (!selectedMatch) return;

    try {
      await api.createProposal({
        receiver: Number(selectedMatch.user_id),
        message: message || "",
        offered_skills: selectedOfferSkills.map(Number),
        requested_skills: selectedRequestSkills.map(Number),
        offered_hours: Number(hoursGive),
        requested_hours: Number(hoursReceive),
      });

      closeModal();
      navigate(`/proposals/`);
    } catch (err) {
      console.error("DRF Error:", err.response?.data || err.message);
    }
  };

  const isSendDisabled =
    selectedOfferSkills.length === 0 || selectedRequestSkills.length === 0;

  // ── Loading State ──
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Finding your matches…
          </p>
        </div>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="min-h-screen bg-slate-50/50 overflow-y-auto">
      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            {/* Left: Title */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                  Smart Matches
                </h1>
              </div>
              <p className="text-[15px] text-slate-500 leading-relaxed">
                Discover the perfect skill exchange partners. Teach what you
                know, learn what you love.
              </p>
            </div>

            {/* Right: Search */}
            <div className="w-full md:w-80 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search skills or people…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
                {filter && (
                  <button
                    onClick={() => setFilter("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">
                {matches.length}
              </span>
              <span className="text-[13px] text-slate-500">
                potential partners
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">
                {matches.reduce(
                  (acc, m) => acc + (m.i_can_teach_for_them?.length || 0),
                  0,
                )}
              </span>
              <span className="text-[13px] text-slate-500">
                skills to teach
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">
                {matches.reduce(
                  (acc, m) => acc + (m.they_can_teach_for_me?.length || 0),
                  0,
                )}
              </span>
              <span className="text-[13px] text-slate-500">
                skills to learn
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm max-w-md">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-slate-800">
                No matches found
              </p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Try a different filter or add more skills to your profile.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Update your profile <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((match) => (
              <MatchCard
                key={match.user_id}
                match={match}
                onSelect={openModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {selectedMatch.avatar_url ? (
                  <img
                    src={selectedMatch.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm">
                    {getInitials(selectedMatch.username)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    New Proposal
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    To{" "}
                    <span className="font-medium text-slate-700">
                      {selectedMatch.username}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-2 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
              <SkillSelector
                title="You offer to teach"
                skills={selectedMatch.i_can_teach_for_them}
                selected={selectedOfferSkills}
                onToggle={toggleOfferSkill}
                accent={{
                  bg: "bg-emerald-50",
                  text: "text-emerald-800",
                  border: "border-emerald-200",
                }}
              />

              <SkillSelector
                title="You want to learn"
                skills={selectedMatch.they_can_teach_for_me}
                selected={selectedRequestSkills}
                onToggle={toggleRequestSkill}
                accent={{
                  bg: "bg-violet-50",
                  text: "text-violet-800",
                  border: "border-violet-200",
                }}
              />

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    You teach
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hoursGive}
                      onChange={(e) => setHoursGive(Number(e.target.value))}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-800"
                    />
                    <span className="text-[13px] text-slate-500 shrink-0">
                      hrs
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    You learn
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hoursReceive}
                      onChange={(e) => setHoursReceive(Number(e.target.value))}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-800"
                    />
                    <span className="text-[13px] text-slate-500 shrink-0">
                      hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Message — kept as you like it */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Personal Note
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a friendly note..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 outline-none resize-none placeholder:text-slate-400 text-[14px] text-slate-800 leading-relaxed transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSendDisabled}
                className={`
            px-5 py-2 text-[13px] font-semibold rounded-xl transition-all flex items-center gap-2
            ${
              isSendDisabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
            }
          `}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <Link
                  to={`/users/${match.user_id}`}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  View Profile
                </Link>
                <Link
                  to={`/proposals/new?user=${match.user_id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Send barter proposal →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}