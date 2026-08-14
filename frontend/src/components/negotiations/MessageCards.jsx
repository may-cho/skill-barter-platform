import {
  Check,
  CheckCheck,
  Clock,
  Calendar,
  ShieldCheck,
  Repeat,
} from "lucide-react";
import { formatTime, getEndTime } from "./utils";

function TermProposalMessage({
  proposal,
  isMe,
  responded,
  response,
  createdAt,
  onAccept,
  onCounter,
  onDecline,
}) {
  const { giveHours, receiveHours } = proposal;

  const waitingText = () => {
    if (!createdAt) return "Awaiting response...";
    const hoursSince = (Date.now() - createdAt) / 3600000;
    if (hoursSince < 1) return "Awaiting response...";
    if (hoursSince < 24)
      return `Awaiting response · sent ${Math.floor(hoursSince)}h ago`;
    return `Awaiting response · sent ${Math.floor(hoursSince / 24)}d ago`;
  };

  if (responded) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-3`}>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            {response === "accepted" ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : response === "declined" ? (
              <span className="text-rose-500 font-bold">✕</span>
            ) : (
              <Clock className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs font-medium">
              {response === "accepted"
                ? "Term change accepted"
                : response === "declined"
                  ? "Term change declined"
                  : "Term change countered"}
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
              onClick={onAccept}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-sm hover:bg-slate-800 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onCounter}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Counter
            </button>
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              Decline
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

function SessionProposalMessage({ proposal, isMe, onAccept }) {
  const sessions = proposal.sessions || [];
  const isRecurring = proposal.type === "recurring";
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
                ? `${sessions.length} sessions · ${Math.ceil(sessions.length / (proposal.pattern?.days?.length || 1))} weeks`
                : `${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
            </h4>
            {isRecurring && proposal.pattern && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {proposal.pattern.days
                  .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                  .join(", ")}{" "}
                · {formatTime(proposal.pattern.startTime)} –{" "}
                {getEndTime(
                  proposal.pattern.startTime,
                  proposal.pattern.duration,
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
                onClick={onAccept}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-sm shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Accept Schedule
              </button>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Suggest Changes
                </button>
                <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors">
                  Decline
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
          {sessions.length} session{sessions.length > 1 ? "s" : ""} added to
          calendar
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

export default function MessageBubble({
  msg,
  partner,
  onAcceptProposal,
  onAcceptTerm,
  onDeclineTerm,
  onCounterTerm,
}) {
  const isMe = msg.sender === "me";

  const Receipt = () => {
    if (!isMe || msg.type === "system") return null;
    if (msg.status === "read")
      return <CheckCheck className="w-3 h-3 text-emerald-500 ml-1 inline" />;
    if (msg.status === "delivered")
      return <Check className="w-3 h-3 text-slate-400 ml-1 inline" />;
    return <Clock className="w-3 h-3 text-slate-300 ml-1 inline" />;
  };

  if (msg.sender === "system" && msg.type === "deal") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 max-w-sm w-full text-center">
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-[13px] font-bold text-slate-800 mb-2">
            {msg.content}
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
              {msg.meta.give} ({msg.meta.giveH}h)
            </span>
            <span className="text-slate-300 font-bold">⇄</span>
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
              {msg.meta.receive} ({msg.meta.receiveH}h)
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "session_proposal")
    return (
      <SessionProposalMessage
        proposal={msg.proposal}
        isMe={isMe}
        onAccept={onAcceptProposal}
      />
    );
  if (msg.type === "session_confirmed")
    return <SessionConfirmedMessage sessions={msg.sessions} />;
  if (msg.type === "term_proposal")
    return (
      <TermProposalMessage
        proposal={msg.proposal}
        isMe={isMe}
        responded={msg.responded}
        response={msg.response}
        createdAt={msg.createdAt}
        onAccept={onAcceptTerm}
        onCounter={onCounterTerm}
        onDecline={onDeclineTerm}
      />
    );

  if (msg.type === "session_ended") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 max-w-xs w-full text-center">
          <p className="text-[11px] font-bold text-slate-500">
            <Clock className="w-3 h-3 inline mr-1" />
            Session ended · {msg.meta.duration}
          </p>
        </div>
      </div>
    );
  }

  if (msg.type === "schedule") {
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
              <p className="text-[11px] text-slate-500">{msg.meta.date}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 text-[12px] font-semibold text-slate-700 border border-slate-100">
            {msg.meta.time}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
      <div
        className={`flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {!isMe && (
          <img
            src={partner.avatar}
            className="w-6 h-6 rounded-full mb-1 ring-2 ring-white"
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
