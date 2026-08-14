import { useState } from "react";
import { MoreHorizontal, Archive, VolumeX, Volume2 } from "lucide-react";
import { formatTime } from "./utils";
/* ------------------------------------------------------------------
   ConversationRow – minimal, with clean typography and subtle animations
   ------------------------------------------------------------------ */
function ConversationRow({ conv, active, onClick, onArchive, onMute }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar =
    conv?.partner?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(conv?.partner?.name)}&background=f1f5f9&color=475569`;
  const isoString = conv?.lastTime;
  const date = new Date(isoString);
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <div
      onClick={onClick}
      className={`
        relative px-4 py-3.5 cursor-pointer transition-all duration-200
        ${active ? "bg-slate-50/80" : "hover:bg-slate-50/50"}
      `}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-slate-400/50 rounded-full transition-all duration-300" />
      )}

      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <img
            src={avatar}
            className={`
              w-10 h-10 rounded-full object-cover shadow-sm
              ${active ? "ring-2 ring-slate-200" : ""}
              transition-all duration-200
            `}
            alt=""
          />
          {conv?.partner.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`
                text-sm truncate tracking-tight
                ${active ? "font-semibold text-slate-900" : "font-medium text-slate-800"}
              `}
            >
              {conv.partner.name}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">
              {formattedTime}
            </span>
          </div>

          {/* Last message – clean & readable */}
          <p className="text-[13px] text-slate-500 truncate leading-relaxed mt-0.5">
            {conv.lastMessage}
          </p>
        </div>

        {/* Right side – status + menu */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1 mt-1">
          {conv.unread > 0 && !conv.muted && (
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
          )}
          {conv.muted && <VolumeX className="w-3 h-3 text-slate-300" />}

          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-lg shadow-slate-900/5 py-1 z-20 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMute();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    {conv.muted ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    {conv.muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    {conv.archived ? "Unarchive" : "Archive"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Sidebar – refined, minimal, with clean typography
   ------------------------------------------------------------------ */
export default function Sidebar({
  conversations,
  selectedId,
  showArchived,
  onToggleArchived,
  onSelect,
  onArchive,
  onMute,
  mobileView,
}) {
  return (
    <aside
      className={`
        ${mobileView === "list" ? "flex" : "hidden"}
        md:flex md:relative absolute inset-0 z-10
        w-full md:w-[280px] lg:w-[320px]
        bg-white border-r border-slate-200/60
        flex-col shrink-0
      `}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 border-b border-slate-100/80">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">
            Negotiations
          </h2>
          <span className="text-[12px] font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/60">
            {conversations.length}
          </span>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">Your active exchanges</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Archive className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No conversations
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Start a new exchange from Discover
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                active={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
                onArchive={() => onArchive(conv.id)}
                onMute={() => onMute(conv.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100/80 bg-slate-50/30">
        <button
          onClick={onToggleArchived}
          className="text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 group"
        >
          <Archive className="w-4 h-4 transition-transform group-hover:scale-95" />
          <span>{showArchived ? "Hide archived" : "Show archived"}</span>
        </button>
      </div>

      {/* Scrollbar & animations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.25);
          border-radius: 10px;
          transition: background 0.2s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.25) transparent; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </aside>
  );
}
