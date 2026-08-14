import { useState, useMemo, useEffect } from "react";
import {
  MessageSquare,
  ArrowRightLeft,
  Plus,
  Search,
  Sparkles,
  Check,
  X,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../components/ui";
import { timeAgo, formatHours, formatDate } from "../utils";
import { useAuth } from "../context/AuthContext";
// import ProposalChat from "./ProposalChat"; // uncomment when available

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-amber-700 bg-amber-50",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  negotiating: {
    label: "Negotiating",
    color: "text-indigo-700 bg-indigo-50",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
  },
  accepted: {
    label: "Accepted",
    color: "text-emerald-700 bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  completed: {
    label: "Completed",
    color: "text-slate-600 bg-slate-100",
    dot: "bg-slate-400",
    border: "border-slate-200",
  },
  canceled: {
    label: "Rejected",
    color: "text-rose-600 bg-rose-50",
    dot: "bg-rose-400",
    border: "border-rose-200",
  },
};

export default function ProposalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [proposals, setProposals] = useState([]);
  const [counterForm, setCounterForm] = useState({}); // no type annotations
  const [activeChat, setActiveChat] = useState(null);

  const load = () => api.getMyProposals().then(setProposals);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return proposals.filter((p) => {
      const status = p.status?.toString().toLowerCase() || "";
      const matchesFilter = filter === "all" || status === filter;

      const fields = [
        p.sender_name,
        p.receiver_name,
        p.message,
        p.otherUser?.username,
        p.youGive?.skill,
        p.youReceive?.skill,
        p.offered_hours,
        p.requested_hours,
        ...(Array.isArray(p.offered_skill_titles)
          ? p.offered_skill_titles
          : []),
        ...(Array.isArray(p.requested_skill_titles)
          ? p.requested_skill_titles
          : []),
      ];

      const searchableText = fields.filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [proposals, filter, search]);

  const act = async (id, action, data = {}) => {
    try {
      await api.proposalAction(id, action, data);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {["all", "pending", "negotiating", "accepted", "completed"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${
                    filter === f
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ),
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-48 focus:w-64 transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {filtered.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  user={user}
                  act={act}
                  isCounterOpen={!!counterForm[proposal.id]}
                  onToggleCounter={() =>
                    setCounterForm((f) => ({
                      ...f,
                      [proposal.id]: !f[proposal.id],
                    }))
                  }
                  onSubmitCounter={(data) =>
                    act(proposal.id, "counter", data).then(() =>
                      setCounterForm((f) => ({ ...f, [proposal.id]: false })),
                    )
                  }
                  isChatOpen={activeChat === proposal.id}
                  onToggleChat={() =>
                    setActiveChat((c) =>
                      c === proposal.id ? null : proposal.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.3) transparent; }
      `}</style>
    </div>
  );
}

/* ─── Proposal Card ──────────────────────────────────────────── */
function ProposalCard({
  proposal,
  user,
  act,
  isCounterOpen,
  onToggleCounter,
  onSubmitCounter,
  isChatOpen,
  onToggleChat,
}) {
  console.log({ proposal });
  console.log("U pp:", proposal.offered_skill_titles);
  const s = proposal.status?.toString().toLowerCase() || "";
  const isPending = s === "pending";
  const isNegotiating = s === "negotiating";
  const isOpenForAction = isPending || isNegotiating;
  const isAccepted = s === "accepted";
  const isCompleted = s === "completed";
  const isRejected = s === "canceled";

  const isReceiver = user && proposal.receiver.id === user.id;

  const name =
    proposal.otherUser?.username ||
    proposal.receiver_name ||
    proposal.sender_name ||
    "—";
  const avatar =
    proposal.otherUser?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=475569`;

  const time =
    timeAgo(proposal.createdAt) || timeAgo(proposal.created_at) || "";

  const giveSkills = proposal.offered_skill_titles?.map((t, i) => ({
    name: t,
    hours: Array.isArray(proposal.offered_hours)
      ? formatHours(proposal.offered_hours[i])
      : formatHours(proposal.offered_hours),
  })) || [{ name: "—", hours: "0" }];
  console.log("offered skills titles", proposal.offered_skill_titles);
  console.log({ giveSkills });

  const recSkills = Array.isArray(proposal.youReceive)
    ? proposal.youReceive
    : proposal.requested_skill_titles?.map((t, i) => ({
        name: t,
        hours: Array.isArray(proposal.requested_hours)
          ? formatHours(proposal.requested_hours[i])
          : formatHours(proposal.requested_hours),
      })) || [{ name: "—", hours: "0" }];

  const hasExtras = isChatOpen || proposal.counter_offers?.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 hover:border-indigo-200/80 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Card Body */}
      <div className="group flex flex-wrap items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all"
          />
          {isAccepted && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-400" />
          )}
        </div>

        {/* User & time */}
        <div className="min-w-[130px] shrink-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
            {time}
          </p>
        </div>

        {/* Exchange pills */}
        <div className="shrink-0 flex items-center gap-3 bg-slate-50/80 rounded-xl px-4 py-2 border border-slate-100/80">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              {giveSkills[0]?.name}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {giveSkills[0]?.hours}h
            </span>
            {giveSkills.length > 1 && (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                +{giveSkills.length - 1}
              </span>
            )}
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300" />

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              {recSkills[0]?.name}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {recSkills[0]?.hours}h
            </span>
            {recSkills.length > 1 && (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                +{recSkills.length - 1}
              </span>
            )}
          </div>
        </div>

        {/* Message (only for pending) */}
        {isPending && proposal.message && (
          <p className="flex-1 min-w-0 text-sm text-slate-500 leading-relaxed truncate px-1">
            “{proposal.message}”
          </p>
        )}
        {!isPending && <div className="flex-1" />}

        {/* Action Buttons */}
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {isOpenForAction && isReceiver && (
            <>
              <button
                onClick={() => act(proposal.id, "accept")}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl transition-all duration-200 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                onClick={() => act(proposal.id, "reject")}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl transition-all duration-200 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          {isOpenForAction && (
            <button
              onClick={onToggleCounter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl transition-all duration-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isCounterOpen ? "rotate-180" : ""}`}
              />
              Counter
            </button>
          )}

          {isAccepted && (
            <>
              <button
                onClick={onToggleChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <Link
                to={`/calendar?proposal=${proposal.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </Link>
              <button
                onClick={() => act(proposal.id, "complete")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl transition-all duration-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Accepted
              </span>
            </>
          )}

          {isCompleted && (
            <>
              <Link
                to={`/reviews/new?proposal=${proposal.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-xl transition-all duration-200"
              >
                <Star className="w-3.5 h-3.5" /> Review
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{" "}
                Completed
              </span>
            </>
          )}

          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Rejected
            </span>
          )}

          {!isCompleted && !isRejected && (
            <button
              onClick={() => act(proposal.id, "cancel")}
              title="Cancel proposal"
              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-200"
            >
              <XCircle className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable extras */}
      {(isCounterOpen || hasExtras) && (
        <div className="px-5 pb-4 pt-1 border-t border-slate-100/80 bg-slate-50/40">
          {isCounterOpen && (
            <div className="pt-3 animate-fadeIn">
              <CounterOfferForm
                proposalId={proposal.id}
                onSubmit={onSubmitCounter}
                onCancel={onToggleCounter}
              />
            </div>
          )}

          {proposal.counter_offers?.length > 0 && !isCounterOpen && (
            <div className="pt-3">
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                Negotiation History
              </p>
              <div className="space-y-1.5">
                {proposal.counter_offers.map((c) => (
                  <p
                    key={c.id}
                    className="text-sm text-slate-600 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-100"
                  >
                    <span className="font-medium">{c.author_name}</span>:{" "}
                    {c.offered_hours}h ↔ {c.requested_hours}h
                    {c.message && ` — “${c.message}”`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {isChatOpen && (
            <div className="pt-3">
              {/* <ProposalChat proposalId={proposal.id} /> */}
              <div className="text-sm text-slate-500 italic">
                Chat component goes here
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ─── Counter Offer Form ───────────────────────────────────────── */
function CounterOfferForm({ proposalId, onSubmit, onCancel }) {
  const [offeredHours, setOfferedHours] = useState("");
  const [requestedHours, setRequestedHours] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!offeredHours || !requestedHours) {
      alert("Please fill in both hour fields.");
      return;
    }
    setSubmitting(true);
    onSubmit({
      offered_hours: parseFloat(offeredHours),
      requested_hours: parseFloat(requestedHours),
      message: message.trim() || undefined,
    }).finally(() => setSubmitting(false));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Offered Hours
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={offeredHours}
            onChange={(e) => setOfferedHours(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
            placeholder="e.g. 2.5"
            required
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Requested Hours
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={requestedHours}
            onChange={(e) => setRequestedHours(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
            placeholder="e.g. 3"
            required
          />
        </div>
        <div className="flex-[2] min-w-[160px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Message (optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
            placeholder="Add a note..."
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Sending..." : "Send Counter"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─── Empty State ───────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Sparkles className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-700">
          No proposals yet
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Find matches on the Discover page to start exchanging skills.
        </p>
      </div>
    </div>
  );
}
