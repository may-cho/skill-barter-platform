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
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../components/ui";
import { timeAgo, formatHours, formatDate } from "../utils";
// ASSUMPTION: adjust these two paths/names to match your actual codebase
import { useAuth } from "../context/AuthContext";
import CounterOfferForm from "./CounterOfferForm";
import ProposalChat from "./ProposalChat";

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
  const { user } = useAuth(); // ASSUMPTION: replace with your real auth hook
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [proposals, setProposals] = useState([]);
  const [counterForm, setCounterForm] = useState({});
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
    <div className="h-full flex flex-col bg-[#fafafa] overflow-hidden">
      {/* ─── Header ─── */}
      <div className="shrink-0 bg-white border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {["all", "pending", "negotiating", "accepted", "completed"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                    filter === f
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-48 focus:w-64 transition-all focus:border-slate-400 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.45); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.25) transparent; }
      `}</style>
    </div>
  );
}

/* ─── Clean Proposal Card ────────────────────────────────────────── */
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
  const s = proposal.status?.toString().toLowerCase() || "";
  const isPending = s === "pending";
  const isNegotiating = s === "negotiating";
  const isOpenForAction = isPending || isNegotiating;
  const isAccepted = s === "accepted";
  const isCompleted = s === "completed";
  const isRejected = s === "canceled";

  const isReceiver = user && proposal.receiver === user.id;

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

  const giveSkills = Array.isArray(proposal.youGive)
    ? proposal.youGive
    : proposal.offered_skill_titles?.map((t, i) => ({
        name: t,
        hours: Array.isArray(proposal.offered_hours)
          ? formatHours(proposal.offered_hours[i])
          : formatHours(proposal.offered_hours),
      })) || [{ name: "—", hours: "0" }];

  const recSkills = Array.isArray(proposal.youReceive)
    ? proposal.youReceive
    : proposal.requested_skill_titles?.map((t, i) => ({
        name: t,
        hours: Array.isArray(proposal.requested_hours)
          ? formatHours(proposal.requested_hours[i])
          : formatHours(proposal.requested_hours),
      })) || [{ name: "—", hours: "0" }];

  const hasExtras =
    isCounterOpen || isChatOpen || proposal.counter_offers?.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
      <div className="group flex items-center gap-5 px-5 py-3.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
          />
          {isAccepted && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-400" />
          )}
        </div>

        {/* User */}
        <div className="w-36 shrink-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {name}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{time}</p>
        </div>

        {/* Exchange – inline pills */}
        <div className="shrink-0 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          {/* Give side */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-700">
              {giveSkills[0]?.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {giveSkills[0]?.hours}h
            </span>
            {giveSkills.length > 1 && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-0.5">
                +{giveSkills.length - 1}
              </span>
            )}
          </div>

          <ArrowRightLeft className="w-3 h-3 text-slate-300 shrink-0" />

          {/* Receive side */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-700">
              {recSkills[0]?.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {recSkills[0]?.hours}h
            </span>
            {recSkills.length > 1 && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-0.5">
                +{recSkills.length - 1}
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {isPending && proposal.message && (
          <p className="flex-1 min-w-0 text-xs text-slate-500 leading-relaxed truncate px-2">
            {proposal.message}
          </p>
        )}
        {!isPending && <div className="flex-1" />}

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
          {isOpenForAction && isReceiver && (
            <>
              <button
                onClick={() => act(proposal.id, "accept")}
                className="px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => act(proposal.id, "reject")}
                className="px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {isOpenForAction && (
            <button
              onClick={onToggleCounter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Counter
            </button>
          )}

          {isAccepted && (
            <>
              <button
                onClick={onToggleChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <Link
                to={`/calendar?proposal=${proposal.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </Link>
              <button
                onClick={() => act(proposal.id, "complete")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Accepted
              </span>
            </>
          )}

          {isCompleted && (
            <>
              <Link
                to={`/reviews/new?proposal=${proposal.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-lg transition-colors"
              >
                <Star className="w-3.5 h-3.5" /> Review
              </Link>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{" "}
                Completed
              </span>
            </>
          )}

          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Rejected
            </span>
          )}

          {!isCompleted && !isRejected && (
            <button
              onClick={() => act(proposal.id, "cancel")}
              title="Cancel proposal"
              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Expandable extras: counter form / negotiation history / chat ─── */}
      {hasExtras && (
        <div className="px-5 pb-4 pt-1 border-t border-slate-100">
          {isCounterOpen && (
            <div className="pt-3">
              <CounterOfferForm
                proposalId={proposal.id}
                onSubmit={onSubmitCounter}
              />
            </div>
          )}

          {proposal.counter_offers?.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Negotiation History
              </p>
              {proposal.counter_offers.map((c) => (
                <p key={c.id} className="text-sm text-slate-600">
                  {c.author_name}: {c.offered_hours}h ↔ {c.requested_hours}h
                  {c.message && ` — "${c.message}"`}
                </p>
              ))}
            </div>
          )}

          {isChatOpen && (
            <div className="pt-3">
              <ProposalChat proposalId={proposal.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-base font-medium text-slate-700">No proposals yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Find matches on the Discover page to get started
        </p>
      </div>
    </div>
  );
}
