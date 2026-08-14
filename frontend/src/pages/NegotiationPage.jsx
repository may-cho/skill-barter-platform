import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Sparkles, Bell, Archive } from "lucide-react";
import {
  CURRENT_USER,
  INITIAL_CONVERSATIONS,
} from "../components/negotiations/utils";
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
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        const result = await api.getConversations();
        if (!cancelled) {
          setConversations(result);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };

    fetchConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!proposalId && conversations.length > 0) {
      navigate(`/negotiations/${conversations[0].id}`, { replace: true });
    }
  }, [proposalId, conversations, navigate]);

  const activeConv = conversations.find((c) => c.id === selectedId);
  const activeConvRef = useRef(activeConv);
  activeConvRef.current = activeConv;

  const updateConv = useCallback((id, updater) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  // ─── Typing simulation ────────────────────────────────────────────
  useEffect(() => {
    console.log("Selected Id changed:", selectedId);
    const conv = activeConvRef.current;
    if (!conv || conv.status === "completed") return;

    let innerTimer;
    const outerTimer = setTimeout(() => {
      setTypingMap((prev) => ({ ...prev, [conv.id]: true }));
      innerTimer = setTimeout(() => {
        setTypingMap((prev) => ({ ...prev, [conv.id]: false }));
      }, 3000);
    }, 2000);

    return () => {
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
    };
  }, [selectedId]);

  const handleIncomingMessage = useCallback(
    (incomingData) => {
      const msg = incomingData.message;
      if (!msg) return;

      switch (
        incomingData.type // == msg.message_type
      ) {
        case "text": {
          const numericId = Number(proposalId);
          updateConv(numericId, (c) => ({
            ...c,
            messages: [...c.messages, msg],
            lastMessage: msg.content,
            lastTime: "Just now",
          }));
          break;
        }
        case "session_proposal": {
          const numericId = Number(proposalId);
          updateConv(numericId, (c) => ({
            ...c,
            messages: [...c.messages, msg],
            lastMessage: msg.content || "Sent a schedule proposal",
            lastTime: "Just now",
          }));
          break;
        }
        case "term_proposal": {
          const numericId = Number(proposalId);
          updateConv(numericId, (c) => ({
            ...c,
            messages: [...c.messages, msg],
            lastMessage: "Sent a term change proposal",
            lastTime: "Just now",
          }));
          break;
        }
        case "deal": {
          const numericId = Number(proposalId);
          const meta = msg.metadata || {};
          updateConv(numericId, (c) => ({
            ...c,
            youGive: {
              ...c.youGive,
              skill: meta.offered_skills?.join(", ") ?? c.youGive.skill,
              hours: meta.offered_hours ?? c.youGive.hours,
            },
            youReceive: {
              ...c.youReceive,
              skill: meta.requested_skills?.join(", ") ?? c.youReceive.skill,
              hours: meta.requested_hours ?? c.youReceive.hours,
            },
            messages: [...c.messages, msg],
            lastMessage: "Terms updated",
            lastTime: "Just now",
          }));
          break;
        }
        case "session_confirmed": {
          const numericId = Number(proposalId);
          const sessions = msg.metadata?.sessions || [];
          const nextSesh = sessions.length
            ? new Date(
                `${sessions[0].date}T${sessions[0].startTime}`,
              ).toISOString()
            : null;
          updateConv(numericId, (c) => ({
            ...c,
            status: "accepted",
            nextSession: nextSesh,
            messages: [...c.messages, msg],
            lastMessage: "Schedule confirmed",
            lastTime: "Just now",
          }));
          break;
        }
        case "error": {
          console.error("Server error:", incomingData.detail);
          break;
        }
        default:
          console.warn("Unhandled type:", incomingData.type, msg);
      }
    },
    [proposalId, updateConv],
  );

  const { sendMessage, respondToProposal } = useChatWebSocket(
    proposalId,
    handleIncomingMessage,
  );

  const handleSendMessage = (text) => {
    sendMessage({
      messageType: "text",
      content: text,
    });
  };

  const handleAcceptProposal = (msgId) => {
    respondToProposal(msgId, "accepted");
  };

  const handleDeclineProposal = (msgId) => {
    respondToProposal(msgId, "declined");
  };

  const handleTermChange = (changes) => {
    if (!activeConv) return;
    const now = Date.now();
    const newMsg = {
      id: now,
      sender: user.id,
      message_type: "term_proposal",
      proposal: changes,
      time: "Just now",
      createdAt: now,
      status: "sent",
      responded: false,
    };
    updateConv(activeConv.id, (c) => ({
      ...c,
      messages: [...c.messages, newMsg],
      lastMessage: "Sent a term change proposal",
      lastTime: "Just now",
    }));
    setShowTermChange(false);
  };

  const handleAcceptTerm = (msgId) => {
    if (!activeConv) return;
    updateConv(activeConv.id, (c) => {
      const proposalMsg = c.messages.find((m) => m.id === msgId);
      const ch = proposalMsg?.proposal || {};
      const newGiveH = ch.giveHours ?? c.youGive.hours;
      const newReceiveH = ch.receiveHours ?? c.youReceive.hours;
      const newVersion = {
        id: `v${c.termsHistory.length}`,
        date: "Just now",
        fromGiveH: c.youGive.hours,
        fromReceiveH: c.youReceive.hours,
        toGiveH: newGiveH,
        toReceiveH: newReceiveH,
        note: "Terms updated",
      };
      return {
        ...c,
        youGive: { ...c.youGive, hours: newGiveH },
        youReceive: { ...c.youReceive, hours: newReceiveH },
        termsHistory: [...c.termsHistory, newVersion],
        messages: [
          ...c.messages.map((m) =>
            m.id === msgId
              ? { ...m, responded: true, response: "accepted" }
              : m,
          ),
          {
            id: Date.now() + 1,
            sender_id: "system",
            sender_name: "System",
            type: "deal",
            content: "Terms updated",
            meta: {
              give: c.youGive.skill,
              giveH: newGiveH,
              receive: c.youReceive.skill,
              receiveH: newReceiveH,
            },
            time: "Just now",
          },
        ],
        lastMessage: "Terms updated",
        lastTime: "Just now",
      };
    });
  };

  const handleDeclineTerm = (msgId) => {
    if (!activeConv) return;
    updateConv(activeConv.id, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.id === msgId ? { ...m, responded: true, response: "declined" } : m,
      ),
      lastMessage: "Term change declined",
      lastTime: "Just now",
    }));
  };

  const handleSendProposal = (proposalData) => {
    console.log("Sending proposal:", proposalData);
    if (!activeConv) return;
    const now = Date.now();
    const newMsg = {
      id: now,
      sender_id: user.id,
      sender_name: user.username,
      type: "session_proposal",
      metadata: proposalData,
      time: "Just now",
      createdAt: now,
      status: "sent",
    };

    sendMessage({
      messageType: "session_proposal",
      content: "Sent a schedule proposal",
      metadata: proposalData,
    });
    setShowScheduler(false);
  };

  const handleArchive = (convId) => {
    updateConv(convId, (c) => ({
      ...c,
      archived: !c.archived,
      status: c.archived ? "pending" : "archived",
    }));
    if (selectedId === convId) setSelectedId(null);
  };

  const handleMute = (convId) => {
    updateConv(convId, (c) => ({ ...c, muted: !c.muted }));
  };

  const getSidebarDot = (conv) => {
    if (conv.archived) return "bg-slate-400";
    if (conv.status === "completed") return "bg-slate-300";
    const hasPending = conv.messages.some(
      (m) => m.type === "term_proposal" && m.sender === "them" && !m.responded,
    );
    if (hasPending) return "bg-amber-400";
    if (conv.unread > 0) return "bg-blue-400";
    if (conv.nextSession) return "bg-emerald-400";
    return "bg-slate-300";
  };

  const visibleConversations = useMemo(
    () =>
      conversations.filter((c) => (showArchived ? c.archived : !c.archived)),

    [conversations, showArchived],
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar ─── */}
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

        {/* ─── Center Chat ─── */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          <ChatThread
            conv={activeConv}
            sendMessage={handleSendMessage}
            typing={activeConv ? typingMap[activeConv.id] : false}
            mobileView={mobileView}
            onBack={() => setMobileView("list")}
            onToggleDeal={() => setDealPanelOpen(!dealPanelOpen)}
            dealOpen={dealPanelOpen}
            onReport={() => alert("Report submitted")}
            onBlock={() => alert("User blocked")}
            onAcceptProposal={handleAcceptProposal}
            onDeclineProposal={handleDeclineProposal}
            onAcceptTerm={handleAcceptTerm}
            onDeclineProposal={handleDeclineProposal}
            onDeclineTerm={handleDeclineTerm}
            onCounterTerm={() => setShowTermChange(true)}
            onOpenScheduler={() => setShowScheduler(true)}
            onOpenTermChange={() => setShowTermChange(true)}
          />
        </div>

        {/* ─── Right Deal Panel ─── */}
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
