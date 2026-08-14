import { useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Star,
  Video,
  MoreHorizontal,
  ShieldCheck,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Shared form components ──────────────────────────────────────────

function InputField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Input({ type = "text", value, onChange, className = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all ${className}`}
    />
  );
}

// ─── ScheduleComposer ───────────────────────────────────────────────

export function ScheduleComposer({ onSend, onCancel }) {
  const [mode, setMode] = useState("quick");
  const [proposals, setProposals] = useState([
    { id: 1, date: "", startTime: "14:00", duration: 120, note: "" },
  ]);
  const [recurring, setRecurring] = useState({
    days: [],
    startDate: "",
    weeks: 4,
    startTime: "14:00",
    duration: 120,
  });

  const weekDays = [
    { key: "mon", label: "M" },
    { key: "tue", label: "T" },
    { key: "wed", label: "W" },
    { key: "thu", label: "T" },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
    { key: "sun", label: "S" },
  ];

  const addSlot = () =>
    setProposals([
      ...proposals,
      { id: Date.now(), date: "", startTime: "14:00", duration: 120, note: "" },
    ]);
  const updateSlot = (id, field, value) =>
    setProposals(
      proposals.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  const removeSlot = (id) =>
    proposals.length > 1 && setProposals(proposals.filter((p) => p.id !== id));
  const toggleDay = (day) =>
    setRecurring((r) => ({
      ...r,
      days: r.days.includes(day)
        ? r.days.filter((d) => d !== day)
        : [...r.days, day].sort(),
    }));

  const generatedSessions = useMemo(() => {
    if (
      mode !== "recurring" ||
      !recurring.startDate ||
      recurring.days.length === 0
    )
      return [];
    const sessions = [];
    const start = new Date(recurring.startDate);
    for (let w = 0; w < recurring.weeks; w++) {
      recurring.days.forEach((dayKey) => {
        const dayIndex = weekDays.findIndex((d) => d.key === dayKey);
        const date = new Date(start);
        date.setDate(
          start.getDate() + w * 7 + ((dayIndex - start.getDay() + 7) % 7),
        );
        if (date >= start)
          sessions.push({
            date: date.toISOString().split("T")[0],
            startTime: recurring.startTime,
            duration: recurring.duration,
          });
      });
    }
    return sessions.slice(0, 20);
  }, [recurring, mode]);

  const handleSend = () => {
    if (mode === "quick") {
      const valid = proposals.filter((p) => p.date && p.startTime);
      if (valid.length === 0) return;
      onSend({ type: "quick", sessions: valid });
    } else {
      if (generatedSessions.length === 0) return;
      onSend({
        type: "recurring",
        sessions: generatedSessions,
        pattern: recurring,
      });
    }
  };

  const formatDisplayDate = (str) =>
    str
      ? new Date(str).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/20 backdrop-blur-sm p-0 md:p-6">
      <div className="bg-white w-full md:max-w-xl md:rounded-3xl rounded-t-3xl shadow-2xl shadow-black/10 max-h-[90vh] flex flex-col animate-modal-up">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100/80 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
              Propose Schedule
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Suggest concrete times for your exchange
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex p-1 bg-slate-100/80 rounded-xl">
            {["quick", "recurring"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "quick" ? "Specific Dates" : "Recurring Weekly"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          {mode === "quick" ? (
            <div className="space-y-3">
              {proposals.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 group hover:border-slate-300/80 transition-all"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 tracking-wide mb-1 block">
                        Date
                      </label>
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) =>
                          updateSlot(slot.id, "date", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 tracking-wide mb-1 block">
                        Start
                      </label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.id, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 tracking-wide mb-1 block">
                        Duration
                      </label>
                      <Select
                        value={slot.duration}
                        onChange={(e) =>
                          updateSlot(
                            slot.id,
                            "duration",
                            Number(e.target.value),
                          )
                        }
                        options={[
                          { value: 60, label: "1 hour" },
                          { value: 90, label: "1.5 hours" },
                          { value: 120, label: "2 hours" },
                          { value: 180, label: "3 hours" },
                        ]}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addSlot}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Date
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Days per week
                </label>
                <div className="flex gap-1.5">
                  {weekDays.map((day) => (
                    <button
                      key={day.key}
                      onClick={() => toggleDay(day.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        recurring.days.includes(day.key)
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Start Date">
                  <Input
                    type="date"
                    value={recurring.startDate}
                    onChange={(e) =>
                      setRecurring({ ...recurring, startDate: e.target.value })
                    }
                  />
                </InputField>
                <InputField label="Duration">
                  <Select
                    value={recurring.duration}
                    onChange={(e) =>
                      setRecurring({
                        ...recurring,
                        duration: Number(e.target.value),
                      })
                    }
                    options={[
                      { value: 60, label: "1 hour" },
                      { value: 90, label: "1.5 hours" },
                      { value: 120, label: "2 hours" },
                    ]}
                  />
                </InputField>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Weeks: <span className="text-slate-900">{recurring.weeks}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={recurring.weeks}
                  onChange={(e) =>
                    setRecurring({
                      ...recurring,
                      weeks: Number(e.target.value),
                    })
                  }
                  className="w-full accent-slate-900 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <InputField label="Start Time">
                <Input
                  type="time"
                  value={recurring.startTime}
                  onChange={(e) =>
                    setRecurring({ ...recurring, startTime: e.target.value })
                  }
                />
              </InputField>
              {generatedSessions.length > 0 && (
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Preview ({generatedSessions.length} sessions)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedSessions.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-white px-2 py-1 rounded-md border border-slate-100 text-slate-700"
                      >
                        {formatDisplayDate(s.date)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100/80 flex gap-3 shrink-0 bg-white/80 md:rounded-b-3xl">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={
              mode === "quick"
                ? proposals.every((p) => !p.date)
                : generatedSessions.length === 0
            }
            className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Send Proposal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TermChangeModal ───────────────────────────────────────────────

export function TermChangeModal({
  currentGive,
  currentReceive,
  onSend,
  onCancel,
}) {
  const [giveHours, setGiveHours] = useState(currentGive.hours);
  const [receiveHours, setReceiveHours] = useState(currentReceive.hours);
  const unchanged =
    giveHours === currentGive.hours && receiveHours === currentReceive.hours;

  const handleSubmit = () => {
    if (unchanged) {
      onCancel();
      return;
    }
    onSend({ giveHours, receiveHours });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-black/10 p-6 animate-modal-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Propose Term Change
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60">
            <p className="text-xs font-medium text-slate-400 tracking-wide mb-2">
              Current Terms
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                You teach{" "}
                <span className="font-semibold text-slate-900">
                  {currentGive.skill}
                </span>
              </span>
              <span className="font-semibold text-slate-900">
                {currentGive.hours}h
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1.5">
              <span className="text-slate-600">
                You learn{" "}
                <span className="font-semibold text-slate-900">
                  {currentReceive.skill}
                </span>
              </span>
              <span className="font-semibold text-slate-900">
                {currentReceive.hours}h
              </span>
            </div>
          </div>

          <InputField label={`You Teach – ${currentGive.skill}`}>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={giveHours}
                onChange={(e) => setGiveHours(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-slate-500">hours</span>
            </div>
          </InputField>

          <InputField label={`You Learn – ${currentReceive.skill}`}>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={receiveHours}
                onChange={(e) => setReceiveHours(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-slate-500">hours</span>
            </div>
          </InputField>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={unchanged}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send Proposal
            </button>
          </div>
          {unchanged && (
            <p className="text-sm text-slate-400 text-center">
              Change a value to propose new terms
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DealContextPanel ──────────────────────────────────────────────

export function DealContextPanel({
  conv,
  safetyDismissed,
  onDismissSafety,
  onProposeChange,
}) {
  const [showHistory, setShowHistory] = useState(false);
  const status = conv.status;

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-white/50">
      {/* Profile header */}
      <div className="p-5 text-center border-b border-slate-200/50">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-full ring-4 ring-white shadow-sm overflow-hidden">
            <img
              src={conv.partner.avatar}
              className="w-full h-full object-cover"
              alt={conv.partner.name}
            />
          </div>
          {conv.partner.online && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white" />
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-3 tracking-tight">
          {conv.partner.name}
        </h3>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-sm font-semibold text-slate-700">
              {conv.partner.rating}
            </span>
          </div>
          <span className="text-slate-300 text-xs">·</span>
          <span className="text-xs text-slate-400">
            {conv.partner.trades} trades
          </span>
        </div>
        <div className="flex gap-2 mt-3 justify-center">
          <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <Calendar className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {!safetyDismissed && (
          <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="flex-1 text-left leading-relaxed">
              Negotiations are permanent. Never share payment details.
            </span>
            <button
              onClick={onDismissSafety}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Exchange terms */}
      <div className="p-5 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              Exchange
            </h4>
            <button
              onClick={onProposeChange}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              Propose Change
            </button>
          </div>
          <div className="space-y-2">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                You Teach
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {conv.youGive.skill}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {conv.youGive.hours} hours
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Repeat className="w-3 h-3 text-slate-400" />
              </div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                You Learn
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {conv.youReceive.skill}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {conv.youReceive.hours} hours
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors group"
          >
            History
            <span className="transition-transform duration-200">
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showHistory ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-3 relative pl-3 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-slate-200">
              {conv.termsHistory && conv.termsHistory.length > 0 ? (
                conv.termsHistory.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-3 top-1 w-2.5 h-2.5 rounded-full ring-[3px] ring-white ${
                        idx === conv.termsHistory.length - 1
                          ? "bg-emerald-400"
                          : "bg-slate-300"
                      }`}
                    />
                    <p className="text-xs font-semibold text-slate-800">
                      {entry.note || "Terms changed"}
                    </p>
                    {entry.fromGiveH !== undefined && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Give: {entry.fromGiveH}h → {entry.toGiveH}h · Receive:{" "}
                        {entry.fromReceiveH}h → {entry.toReceiveH}h
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {entry.date || "Just now"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">
                  No changes recorded
                </div>
              )}
              <div className="relative">
                <span className="absolute -left-3 top-1 w-2.5 h-2.5 rounded-full bg-slate-200 ring-[3px] ring-white" />
                <p className="text-xs font-medium text-slate-500">
                  Current terms
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GlobalStyles ──────────────────────────────────────────────────

export function GlobalStyles() {
  return (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      
      @keyframes modal-up {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-modal-up { animation: modal-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%;
        background: #0f172a; cursor: pointer; border: 3px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px; height: 16px; border-radius: 50%;
        background: #0f172a; cursor: pointer; border: 3px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
    `}</style>
  );
}