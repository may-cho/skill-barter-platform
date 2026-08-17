import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { api } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/negotiations/Sidebar";
import ChatThread from "../components/negotiations/ChatThread";
import {
  DealContextPanel,
  ScheduleComposer,
  TermChangeModal,
  GlobalStyles,
} from "../components/negotiations/Overlays";
import { useChatWebSocket } from "../hooks/useChatWebsocket";
import { useAuth } from "../context/AuthContext";
import { Paperclip, Calendar, Repeat, Smile, Send } from "lucide-react";

export default function NegotiationsPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedId = proposalId ? Number(proposalId) : null;

  const [dealPanelOpen, setDealPanelOpen] = useState(true);
  const [mobileView, setMobileView] = useState("list");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTermChange, setShowTermChange] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [typingMap, setTypingMap] = useState({});
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // 1. Initial REST API Data Fetch
  useEffect(() => {
    let cancelled = false;
    const fetchConversations = async () => {
      try {
        const result = await api.getConversations();
        if (!cancelled) setConversations(result || []);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };
    fetchConversations();
    return () => { cancelled = true; };
  }, []);

  // 2. Default Navigation to First Proposal if URL lacks proposalId
  useEffect(() => {
    if (!proposalId && conversations.length > 0) {
      navigate(`/negotiations/${conversations[0].id}`, { replace: true });
    }
  }, [proposalId, conversations, navigate]);

  const activeConv = useMemo(() => {
    return conversations.find((c) => String(c.id) === String(proposalId));
  }, [conversations, proposalId]);

  const updateConv = useCallback((targetId, updater) => {
    setConversations((prev) =>
      prev.map((c) => (String(c.id) === String(targetId) ? updater(c) : c))
    );
  }, []);

  const formatMessageTime = (msg) => {
    if (!msg) return "Just now";
    const rawDate = typeof msg === "object" ? (msg.created_at || msg.timestamp || msg.created_on || msg.time) : msg;
    if (!rawDate) return "Just now";

    const d = new Date(rawDate);
    return isNaN(d.getTime())
      ? "Just now"
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 3. Handle Incoming Frames Broadcasted by ProposalChatConsumer
const handleIncomingMessage = useCallback(
  (incomingData) => {
    if (!incomingData) return;

    // Log incoming payload for debugging
    console.log("WS Data Received:", incomingData);

    if (incomingData.type === "connection_established") {
      console.log("WS Connected for proposal:", incomingData.proposal_id);
      return;
    }

    if (incomingData.type === "error") {
      console.error("Backend WebSocket Error:", incomingData.detail);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 🔴 1. REAL-TIME DELETE EVENT HANDLING
    // ─────────────────────────────────────────────────────────────
    if (incomingData.type === "message_deleted" || incomingData.action === "delete_message") {
      const deletedMsgId = incomingData.message_id || incomingData.id;
      const targetProposalId = String(
        incomingData.proposal_id || incomingData.proposal || proposalId
      );

      if (!deletedMsgId) return;

      setConversations((prevConversations) =>
        prevConversations.map((c) => {
          if (String(c.id) !== targetProposalId) return c;


          const updatedMessages = (c.messages || []).filter(
            (m) => String(m.id) !== String(deletedMsgId)
          );


          const lastMsg = updatedMessages[updatedMessages.length - 1];
          let lastMsgText = "No messages yet";
          let lastTimeText = "Just now";

          if (lastMsg) {
            lastMsgText = lastMsg.content || "New message received";
            if (lastMsg.message_type === "image") lastMsgText = "📷 Sent an image";
            if (lastMsg.message_type === "file") lastMsgText = "📁 Sent a file";
            lastTimeText = formatMessageTime(lastMsg);
          }

          return {
            ...c,
            messages: updatedMessages,
            lastMessage: lastMsgText,
            lastTime: lastTimeText,
          };
        })
      );
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 🟢 2. REAL-TIME CREATE / UPDATE EVENT HANDLING
    // ─────────────────────────────────────────────────────────────
    // Safely extract message object across different backend WS framing styles
    const msg =
      incomingData.message ||
      (incomingData.id ? incomingData : null) ||
      (incomingData.data?.id ? incomingData.data : null);

    if (!msg || (!msg.id && !msg.temp_id)) return;

    // Use String comparison to eliminate Number vs String bugs
    const targetProposalId = String(
      incomingData.proposal_id || msg.proposal_id || msg.proposal || proposalId
    );

    const msgType = incomingData.type || msg.message_type || msg.type;

    setConversations((prevConversations) => {
      // If conversation doesn't exist yet, return unchanged
      const targetIndex = prevConversations.findIndex(
        (c) => String(c.id) === targetProposalId
      );

      if (targetIndex === -1) {
        console.warn("Target conversation not found in state:", targetProposalId);
        return prevConversations;
      }

      return prevConversations.map((c) => {
        if (String(c.id) !== targetProposalId) return c;

        const existingMessages = c.messages || [];
        const existingIndex = existingMessages.findIndex(
          (m) => (m.id && m.id === msg.id) || (m.temp_id && m.temp_id === msg.temp_id)
        );

        let updatedMessages;
        if (existingIndex >= 0) {
          updatedMessages = existingMessages.map((m, idx) =>
            idx === existingIndex ? { ...m, ...msg } : m
          );
        } else {
          updatedMessages = [...existingMessages, msg];
        }

        let youGive = { ...c.youGive };
        let youReceive = { ...c.youReceive };
        let status = c.status;
        let nextSession = c.nextSession;

        if (
          msgType === "terms_updated" ||
          (msgType === "term_proposal" && msg.response_status === "accepted")
        ) {
          const meta = msg.metadata || {};
          youGive = {
            ...youGive,
            skill: meta.offered_skills?.join(", ") ?? youGive.skill,
            hours: meta.offered_hours ?? youGive.hours,
          };
          youReceive = {
            ...youReceive,
            skill: meta.requested_skills?.join(", ") ?? youReceive.skill,
            hours: meta.requested_hours ?? youReceive.hours,
          };
        }

        if (msgType === "session_proposal" && msg.response_status === "accepted") {
          status = "accepted";
          const sessions = msg.metadata?.sessions || [];
          if (sessions.length > 0) {
            nextSession = new Date(
              `${sessions[0].date}T${sessions[0].startTime}`
            ).toISOString();
          }
        }

        let lastMsgText = msg.content || "New message received";
        if (msgType === "image" || msg.message_type === "image") lastMsgText = "📷 Sent an image";
        if (msgType === "file" || msg.message_type === "file") lastMsgText = "📁 Sent a file";

        return {
          ...c,
          youGive,
          youReceive,
          status,
          nextSession,
          messages: updatedMessages,
          lastMessage: lastMsgText,
          lastTime: formatMessageTime(msg),
        };
      });
    });
  },
  [proposalId]
);

  // 4. Connect with WebSocket Hook
  const { sendMessage, respondToProposal } = useChatWebSocket(
    proposalId,
    handleIncomingMessage
  );

  const handleSendMessage = (text) => {
    sendMessage({
      messageType: "text",
      content: text,
    });
  };

  const handleSendFile = async (file, caption = "") => {
  if (!proposalId || !file) return;

  try {
    // 1. Upload file via REST API
    const response = await api.uploadMessageFile(proposalId, file, caption);


    const savedData = response?.data || response;


    const savedMsg = savedData?.message || (savedData?.id ? savedData : null);

    if (savedMsg) {

      handleIncomingMessage(savedMsg);
    }
  } catch (err) {
    console.error("File upload failed in handleSendFile:", err);
  }
};

  const handleSendProposal = (proposalData) => {
    if (!activeConv) return;
    sendMessage({
      messageType: "session_proposal",
      content: "Sent a schedule proposal",
      metadata: proposalData,
    });
    setShowScheduler(false);
  };

  const handleTermChange = (changes) => {
    if (!activeConv) return;
    sendMessage({
      messageType: "term_proposal",
      content: "Sent a term change proposal",
      metadata: {
        offered_hours: changes.giveHours,
        requested_hours: changes.receiveHours,
        ...changes,
      },
    });
    setShowTermChange(false);
  };

  const handleAcceptProposal = (msgId) => {
    respondToProposal(msgId, "accepted");
  };

  const handleDeclineProposal = (msgId) => {
    respondToProposal(msgId, "declined");
  };

  const handleArchive = (convId) => {
    updateConv(convId, (c) => ({
      ...c,
      archived: !c.archived,
      status: c.archived ? "pending" : "archived",
    }));
    if (selectedId === convId) navigate("/negotiations");
  };

  const handleMute = (convId) => {
    updateConv(convId, (c) => ({ ...c, muted: !c.muted }));
  };

  const getSidebarDot = (conv) => {
    if (conv.archived) return "bg-slate-400";
    if (conv.status === "completed") return "bg-slate-300";
    const hasPending = conv.messages?.some(
      (m) =>
        (m.message_type === "term_proposal" || m.message_type === "session_proposal") &&
        m.response_status === "PENDING" &&
        m.sender_id !== user?.id
    );
    if (hasPending) return "bg-amber-400";
    if (conv.unread > 0) return "bg-blue-400";
    if (conv.nextSession) return "bg-emerald-400";
    return "bg-slate-300";
  };

  const visibleConversations = useMemo(
    () => conversations.filter((c) => (showArchived ? c.archived : !c.archived)),
    [conversations, showArchived]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[300px] lg:w-[320px] shrink-0 h-full bg-white border-r border-slate-200/70 flex flex-col overflow-hidden">
          <Sidebar
            conversations={visibleConversations}
            selectedId={selectedId}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived(!showArchived)}
            onSelect={(id) => {
              navigate(`/negotiations/${id}`);
              setMobileView("chat");
              updateConv(id, (c) => ({ ...c, unread: 0 }));
            }}
            onArchive={handleArchive}
            onMute={handleMute}
            getSidebarDot={getSidebarDot}
            mobileView={mobileView}
          />
        </div>

        {/* Center Chat Thread */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          <ChatThread
            conv={activeConv}
            sendMessage={handleSendMessage}
            sendFile={handleSendFile}
            typing={activeConv ? typingMap[activeConv.id] : false}
            mobileView={mobileView}
            onBack={() => setMobileView("list")}
            onToggleDeal={() => setDealPanelOpen(!dealPanelOpen)}
            dealOpen={dealPanelOpen}
            onReport={() => alert("Report submitted")}
            onBlock={() => alert("User blocked")}
            onAcceptProposal={handleAcceptProposal}
            onDeclineProposal={handleDeclineProposal}
            onAcceptTerm={handleAcceptProposal}
            onDeclineTerm={handleDeclineProposal}
            onCounterTerm={() => setShowTermChange(true)}
            onOpenScheduler={() => setShowScheduler(true)}
            onOpenTermChange={() => setShowTermChange(true)}
          />
        </div>

        {/* Right Deal Context Panel */}
        {dealPanelOpen && activeConv && (
          <div className="hidden xl:flex w-[300px] shrink-0 h-full bg-slate-50/40 border-l border-slate-200/70 flex-col overflow-hidden">
            <DealContextPanel
              conv={activeConv}
              safetyDismissed={safetyDismissed}
              onDismissSafety={() => setSafetyDismissed(true)}
              onProposeChange={() => setShowTermChange(true)}
            />
          </div>
        )}
      </div>

      {showScheduler && (
        <ScheduleComposer
          onSend={handleSendProposal}
          onCancel={() => setShowScheduler(false)}
        />
      )}
      {showTermChange && activeConv && (
        <TermChangeModal
          currentGive={activeConv.youGive}
          currentReceive={activeConv.youReceive}
          onSend={handleTermChange}
          onCancel={() => setShowTermChange(false)}
        />
      )}
      <GlobalStyles />
    </div>
  );
}

// ─── Direct Attached ChatInput Component ──────────────────────────
export function ChatInput({ onSendMessage, sendFile, onOpenScheduler, onOpenTermChange }) {
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (sendFile) {
        await sendFile(file);
      } else {
        console.error("sendFile prop is not provided to ChatInput");
      }
      e.target.value = "";
    }
  };

  const handleSend = () => {
    if (!msg.trim()) return;
    onSendMessage(msg.trim());
    setMsg("");
  };

  return (
    <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-4">
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