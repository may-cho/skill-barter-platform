import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Video,
  FileText,
  MoreHorizontal,
  AlertTriangle,
  Ban,
  Star,
  Calendar,
  Send,
  Paperclip,
  Repeat,
  Smile,
  Clock,
  ShieldCheck,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { timeAgo, STATUS_META } from "./utils";
import { useAuth } from "../../context/AuthContext";

// ─── Pre‑call banner ──────────────────────────────────────────────
function PreCallBanner({ conv }) {
  const [minutesLeft, setMinutesLeft] = useState(null);

  useEffect(() => {
    if (!conv.nextSession || conv.status !== "accepted") return;
    const calc = () => {
      const diff = Math.ceil(
        (new Date(conv.nextSession).getTime() - Date.now()) / 60000,
      );
      setMinutesLeft(diff > 0 && diff <= 15 ? diff : null);
    };
    calc();
    const iv = setInterval(calc, 30000);
    return () => clearInterval(iv);
  }, [conv.nextSession, conv.status]);

  if (minutesLeft === null) return null;

  return (
    <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[13px] font-medium text-slate-700 tracking-tight">
          Session starts in{" "}
          <span className="font-semibold">{minutesLeft} min</span>
        </span>
      </div>
      <button className="text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors">
        Join Early
      </button>
    </div>
  );
}

// ─── Chat header ──────────────────────────────────────────────────
function ChatHeader({
  conv,
  onBack,
  onToggleDeal,
  dealOpen,
  onReport,
  onBlock,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_META[conv.status.toLowerCase()];
  const avatar =
    conv.partner.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(conv?.partner?.name)}&background=f1f5f9&color=475569`;
  const presence = conv.partner.online
    ? "Online now"
    : `Last active ${timeAgo(conv.partner.lastActive)}`;

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 py-4 z-10">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative">
          <img
            src={avatar}
            className="w-10 h-10 rounded-full ring-2 ring-slate-100 object-cover"
            alt=""
          />
          {conv.partner.online && (
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
              {conv.partner.name}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 bg-slate-100">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-slate-400">{presence}</span>
            <span className="text-slate-200">·</span>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-medium text-slate-600">
                {conv.partner.rating}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {conv.status === "accepted" && (
          <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors">
            <Video className="w-4 h-4" />
            Join Call
          </button>
        )}
        <button
          onClick={onToggleDeal}
          className={`hidden xl:flex p-2.5 rounded-xl transition-colors ${dealOpen ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
        >
          <FileText className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 py-1 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onReport();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />{" "}
                  Report
                </button>
                <button
                  onClick={() => {
                    onBlock();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" /> Block User
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers for structured messages ─────────────────────────────
function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEndTime(start, durationMin) {
  const [h, m] = start.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m) + durationMin);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Message sub‑components ───────────────────────────────────────
function TermProposalMessage({
  proposal,
  isMe,
  responseStatus,
  createdAt,
  onAccept,
  onCounter,
  onDecline,
}) {
  const { giveHours, receiveHours } = proposal || {};
  const [submitting, setSubmitting] = useState(null);

  const waitingText = () => {
    if (!createdAt) return "Awaiting response...";
    const hoursSince = (Date.now() - createdAt) / 3600000;
    if (hoursSince < 1) return "Awaiting response...";
    if (hoursSince < 24)
      return `Awaiting response · sent ${Math.floor(hoursSince)}h ago`;
    return `Awaiting response · sent ${Math.floor(hoursSince / 24)}d ago`;
  };

  const isResolved =
    responseStatus === "accepted" || responseStatus === "declined";

  const handleAccept = () => {
    if (submitting || isResolved) return;
    setSubmitting("accept");
    onAccept();
  };
  const handleDecline = () => {
    if (submitting || isResolved) return;
    setSubmitting("decline");
    onDecline();
  };

  if (isResolved) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-3`}>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            {responseStatus === "accepted" ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-rose-500 font-bold">✕</span>
            )}
            <span className="text-xs font-medium">
              {responseStatus === "accepted"
                ? "Term change accepted"
                : "Term change declined"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-4`}>
      <div className="max-w-[92%] md:max-w-sm w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <Repeat className="w-3 h-3 text-slate-700" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Term Change Proposal
            </span>
          </div>
          <h4 className="text-[13px] font-bold text-slate-900">Adjust hours</h4>
        </div>
        <div className="px-5 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">You Teach</span>
            <span className="font-bold text-slate-900">{giveHours}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">You Learn</span>
            <span className="font-bold text-slate-900">{receiveHours}h</span>
          </div>
        </div>
        {!isMe && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-2 bg-white">
            <button
              onClick={handleAccept}
              disabled={submitting !== null}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting === "accept" ? "Accepting…" : "Accept"}
            </button>
            <button
              onClick={onCounter}
              disabled={submitting !== null}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Counter
            </button>
            <button
              onClick={handleDecline}
              disabled={submitting !== null}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting === "decline" ? "Declining…" : "Decline"}
            </button>
          </div>
        )}
        {isMe && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[11px] text-slate-400 text-center font-medium">
              {waitingText()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionProposalMessage({
  metadata,
  isMe,
  responseStatus,
  onAccept,
  onDecline,
}) {
  const sessions = metadata?.sessions || [];
  const isRecurring = metadata?.type === "recurring";
  const [submitting, setSubmitting] = useState(null);

  const isResolved =
    responseStatus === "accepted" || responseStatus === "declined";

  const handleAccept = () => {
    if (submitting || isResolved) return;
    setSubmitting("accept");
    onAccept();
  };
  const handleDecline = () => {
    if (submitting || isResolved) return;
    setSubmitting("decline");
    onDecline();
  };

  if (isResolved) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-5`}>
        <div className="max-w-[92%] md:max-w-sm w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            {responseStatus === "accepted" ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-rose-500 font-bold">✕</span>
            )}
            <span className="text-xs font-medium">
              {responseStatus === "accepted"
                ? "Schedule accepted"
                : "Schedule declined"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-5`}>
      <div className="max-w-[92%] md:max-w-sm w-full">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/30 overflow-hidden">
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-slate-700" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Session Proposal
              </span>
            </div>
            <h4 className="text-[13px] font-bold text-slate-900">
              {isRecurring
                ? `${sessions.length} sessions · ${Math.ceil(sessions.length / (metadata.pattern?.days?.length || 1))} weeks`
                : `${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
            </h4>
            {isRecurring && metadata.pattern && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {metadata.pattern.days
                  .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                  .join(", ")}{" "}
                · {formatTime(metadata.pattern.startTime)} –{" "}
                {getEndTime(
                  metadata.pattern.startTime,
                  metadata.pattern.duration,
                )}
              </p>
            )}
          </div>
          <div className="px-5 py-3 space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {sessions.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 border border-slate-100"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      month: "short",
                    })}
                  </span>
                  <span className="text-[13px] font-bold text-slate-900 leading-none mt-0.5">
                    {new Date(s.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-800">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      weekday: "long",
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(s.startTime)} –{" "}
                    {getEndTime(s.startTime, s.duration)} ·{" "}
                    {s.duration >= 60
                      ? `${s.duration / 60}h`
                      : `${s.duration}m`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {!isMe && (
            <div className="px-5 py-4 border-t border-slate-100 space-y-2 bg-white">
              <button
                onClick={handleAccept}
                disabled={submitting !== null}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-sm shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting === "accept" ? "Accepting…" : "Accept Schedule"}
              </button>
              <div className="flex gap-2">
                <button
                  disabled={submitting !== null}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suggest Changes
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting !== null}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting === "decline" ? "Declining…" : "Decline"}
                </button>
              </div>
            </div>
          )}
          {isMe && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30">
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Awaiting response...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionConfirmedMessage({ sessions }) {
  return (
    <div className="flex justify-center my-6">
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 max-w-sm w-full text-center">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2.5">
          <Check className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
        </div>
        <h4 className="text-[13px] font-bold text-emerald-900 mb-0.5">
          Schedule Confirmed
        </h4>
        <p className="text-[11px] text-emerald-700/70 mb-4">
          {sessions.length} session{sessions.length > 1 ? "s" : ""} added
        </p>
        <div className="space-y-1.5 text-left">
          {sessions.slice(0, 3).map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-emerald-100/60"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-[11px]">
                {new Date(s.date).getDate()}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">
                  {new Date(s.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-slate-500">
                  {s.startTime} · {s.duration / 60}h
                </p>
              </div>
            </div>
          ))}
          {sessions.length > 3 && (
            <p className="text-[11px] text-emerald-700 font-medium text-center pt-1">
              + {sessions.length - 3} more
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Image & File Viewers ──────────────────────────────────────────
function ImageMessage({ msg, isMe }) {
  const imageUrl = msg.file_url || msg.file || msg.metadata?.url;
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-2`}>
      <div className="max-w-[70%] space-y-1">
        <img
          src={imageUrl}
          alt={msg.metadata?.file_name || "Sent image"}
          className="rounded-2xl max-h-72 object-cover border border-slate-200/60 shadow-sm"
        />
        {msg.content && (
          <p className={`text-[13px] px-3 py-1.5 rounded-xl ${isMe ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
            {msg.content}
          </p>
        )}
      </div>
    </div>
  );
}

function FileMessage({ msg, isMe }) {
  const fileUrl = msg.file_url || msg.file || msg.metadata?.url;
  const fileName = msg.metadata?.file_name || "Attachment File";
  const fileSize = msg.metadata?.file_size
    ? `${(msg.metadata.file_size / 1024).toFixed(1)} KB`
    : null;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-2`}>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className={`flex items-center gap-3 p-3.5 rounded-2xl border max-w-xs transition-all ${
          isMe
            ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
            : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
        } shadow-sm`}
      >
        <div className={`p-2.5 rounded-xl ${isMe ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate leading-tight">
            {fileName}
          </p>
          {fileSize && (
            <p className={`text-[11px] mt-0.5 ${isMe ? "text-slate-400" : "text-slate-500"}`}>
              {fileSize}
            </p>
          )}
        </div>
      </a>
    </div>
  );
}

// ─── Main MessageBubble ──────────────────────────────────────────
function MessageBubble({
  msg,
  partner,
  onAcceptProposal,
  onDeclineProposal,
  onAcceptTerm,
  onDeclineTerm,
  onCounterTerm,
}) {
  const { user } = useAuth();
  const isMe = msg.sender_id === user?.id || msg.sender === user?.id || msg.isMe;
  const avatar =
    partner?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name)}&background=f1f5f9&color=475569`;

  const Receipt = () => {
    if (!isMe || msg.message_type === "system") return null;
    if (msg.status === "read")
      return <CheckCheck className="w-3 h-3 text-emerald-500 ml-1 inline" />;
    if (msg.status === "delivered")
      return <Check className="w-3 h-3 text-slate-400 ml-1 inline" />;
    return <Clock className="w-3 h-3 text-slate-300 ml-1 inline" />;
  };

  if ((msg.is_system || !msg.sender_id) && msg.message_type === "deal") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-w-sm w-full text-center">
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-[13px] font-bold text-slate-800 mb-2">
            {msg?.content}
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
              {msg.metadata?.offered_skills?.join(", ")} (
              {msg.metadata?.offered_hours}h)
            </span>
            <span className="text-slate-300 font-bold">⇄</span>
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
              {msg.metadata?.requested_skills?.join(", ")} (
              {msg.metadata?.requested_hours}h)
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.message_type === "session_proposal")
    return (
      <SessionProposalMessage
        metadata={msg.metadata}
        isMe={isMe}
        responseStatus={msg.response_status}
        onAccept={onAcceptProposal}
        onDecline={onDeclineProposal}
      />
    );

  if (msg.message_type === "session_confirmed")
    return <SessionConfirmedMessage sessions={msg.metadata?.sessions || []} />;

  if (msg.message_type === "term_proposal")
    return (
      <TermProposalMessage
        proposal={msg.metadata}
        isMe={isMe}
        responseStatus={msg.response_status}
        createdAt={msg.createdAt}
        onAccept={onAcceptTerm}
        onCounter={onCounterTerm}
        onDecline={onDeclineTerm}
      />
    );

  if (msg.message_type === "image")
    return <ImageMessage msg={msg} isMe={isMe} />;

  if (msg.message_type === "file")
    return <FileMessage msg={msg} isMe={isMe} />;

  if (msg.message_type === "session_ended") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 max-w-xs w-full text-center">
          <p className="text-[11px] font-bold text-slate-500">
            <Clock className="w-3 h-3 inline mr-1" /> Session ended ·{" "}
            {msg.metadata?.duration}
          </p>
        </div>
      </div>
    );
  }

  if (msg.message_type === "schedule") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-w-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-900">
                Session Scheduled
              </p>
              <p className="text-[11px] text-slate-500">{msg.metadata?.date}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 text-[12px] font-semibold text-slate-700 border border-slate-100">
            {msg.metadata?.time}
          </div>
        </div>
      </div>
    );
  }

  // Standard text message
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
      <div
        className={`flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {!isMe && (
          <img
            src={avatar}
            className="w-6 h-6 rounded-full mb-1 ring-2 ring-white object-cover"
            alt=""
          />
        )}
        <div
          className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm flex items-end gap-1 ${isMe ? "bg-slate-900 text-white rounded-2xl rounded-br-md" : "bg-white text-slate-700 border border-slate-200/60 rounded-2xl rounded-bl-md"}`}
        >
          <span>{msg.content}</span>
          <Receipt />
        </div>
      </div>
    </div>
  );
}

// ─── Message List ──────────────────────────────────────────────────
function MessageList({
  conv,
  onAcceptProposal,
  onDeclineProposal,
  onAcceptTerm,
  onDeclineTerm,
  onCounterTerm,
}) {
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const messages = conv?.messages;
  const validMessages = Array.isArray(messages)
    ? messages.filter((msg) => Boolean(msg))
    : [];

  useEffect(() => {
    const currentLength = conv?.messages?.length || 0;
    if (currentLength > prevLengthRef.current && prevLengthRef.current > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = currentLength;
  }, [conv?.messages?.length]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white overscroll-contain">
      <div className="px-6 md:px-8 py-6 space-y-1">
        {validMessages.map((msg, i) => {
          const showDate = i === 0 || msg?.time !== conv.messages[i - 1]?.time;
          return (
            <div key={msg.id || `msg-${i}`}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                    {msg?.time}
                  </span>
                </div>
              )}
              <MessageBubble
                msg={msg}
                partner={conv.partner}
                onAcceptProposal={() => onAcceptProposal(msg.id)}
                onDeclineProposal={() => onDeclineProposal(msg.id)}
                onAcceptTerm={() => onAcceptTerm(msg.id)}
                onDeclineTerm={() => onDeclineTerm(msg.id)}
                onCounterTerm={onCounterTerm}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Chat Input ──────────────────────────────────────────────────
function ChatInput({ onSendMessage, sendFile, onOpenScheduler, onOpenTermChange }) {
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (typeof sendFile === "function") {
    await sendFile(file, "");
  } else {
    console.error("sendFile prop missing or invalid in ChatInput");
  }
  e.target.value = "";
};

  const handleSend = () => {
    if (!msg.trim()) return;
    onSendMessage(msg.trim());
    setMsg("");
  };

  return (
    <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.zip"
      />

      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2 focus-within:border-slate-300 focus-within:bg-white transition-all">
          <button
            type="button"
            onClick={handlePaperclipClick}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-[18px] h-[18px]" />
          </button>
          <button
            type="button"
            onClick={onOpenScheduler}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Propose schedule"
          >
            <Calendar className="w-[18px] h-[18px]" />
          </button>
          <button
            type="button"
            onClick={onOpenTermChange}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Propose terms"
          >
            <Repeat className="w-[18px] h-[18px]" />
          </button>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-transparent py-2.5 px-1 text-[14px] text-slate-800 outline-none resize-none max-h-28 placeholder:text-slate-400 placeholder:font-light leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Smile className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!msg.trim()}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-900 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/30">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <svg
            className="w-7 h-7 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Select a conversation
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Choose a proposal to start negotiating
        </p>
      </div>
    </div>
  );
}

export default function ChatThread({
  conv,
  mobileView,
  onBack,
  onToggleDeal,
  dealOpen,
  onReport,
  onBlock,
  onAcceptProposal,
  onDeclineProposal,
  onAcceptTerm,
  onDeclineTerm,
  onCounterTerm,
  onOpenScheduler,
  onOpenTermChange,
  sendMessage,
  sendFile,
  onDeleteMessage,
}) {
  if (!conv) return <EmptyChatState />;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.6); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.4) transparent; }
      `}</style>

      <main
        className={`
          ${mobileView === "chat" ? "flex" : "hidden"}
          md:flex flex-1 min-h-0 flex-col bg-white relative overflow-hidden
        `}
      >
        <PreCallBanner conv={conv} />
        <ChatHeader
          conv={conv}
          onBack={onBack}
          onToggleDeal={onToggleDeal}
          dealOpen={dealOpen}
          onReport={onReport}
          onBlock={onBlock}
        />
        <MessageList
          conv={conv}
          onAcceptProposal={onAcceptProposal}
          onDeclineProposal={onDeclineProposal}
          onAcceptTerm={onAcceptTerm}
          onDeclineTerm={onDeclineTerm}
          onCounterTerm={onCounterTerm}
          onDeleteMessage={onDeleteMessage}
        />
        <ChatInput
          onSendMessage={sendMessage}
          sendFile={sendFile}
          onOpenScheduler={onOpenScheduler}
          onOpenTermChange={onOpenTermChange}
        />
      </main>
    </>
  );
}