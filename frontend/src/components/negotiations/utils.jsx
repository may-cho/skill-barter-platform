export function timeAgo(dateStr) {
  if (!dateStr) return "Offline";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getEndTime(start, durationMin) {
  const [h, m] = start.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m) + durationMin);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const CURRENT_USER = {
  id: "me",
  name: "You",
  avatar: "https://i.pravatar.cc/150?u=me",
};

export const STATUS_META = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    sidebarDot: "bg-amber-400",
  },
  accepted: {
    label: "Active",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    sidebarDot: "bg-emerald-400",
  },
  completed: {
    label: "Done",
    dot: "bg-slate-300",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    sidebarDot: "bg-slate-300",
  },
  archived: {
    label: "Archived",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-500 ring-slate-400/20",
    sidebarDot: "bg-slate-400",
  },
};

export const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    partner: {
      id: "u1",
      name: "thura-hz1",
      avatar: "https://i.pravatar.cc/150?u=1",
      online: true,
      lastActive: new Date().toISOString(),
      rating: 4.9,
      trades: 23,
    },
    status: "pending",
    archived: false,
    muted: false,
    youGive: { skill: "English Conversation", hours: 2, category: "language" },
    youReceive: { skill: "Japanese Basics", hours: 2, category: "language" },
    lastMessage: "Can we change it to 3 hours instead?",
    lastTime: "2m ago",
    unread: 2,
    nextSession: null,
    termsHistory: [
      {
        id: "v0",
        date: "Yesterday, 4:20 PM",
        fromGiveH: 0,
        fromReceiveH: 0,
        toGiveH: 2,
        toReceiveH: 2,
        note: "Initial proposal",
      },
    ],
    messages: [
      {
        id: 1,
        sender: "them",
        type: "text",
        content:
          "Hi! I saw your profile and I am very interested in learning English.",
        time: "Yesterday, 4:20 PM",
        status: "read",
      },
      {
        id: 2,
        sender: "me",
        type: "text",
        content: "Hey! I would love to help. I have been teaching for 2 years.",
        time: "Yesterday, 4:22 PM",
        status: "read",
      },
      {
        id: 3,
        sender: "them",
        type: "text",
        content: "That is great. In return I can teach you Japanese N5 level.",
        time: "Yesterday, 4:25 PM",
        status: "read",
      },
      {
        id: 4,
        sender: "system",
        type: "deal",
        content: "Proposal terms agreed",
        meta: {
          give: "English Conversation",
          giveH: 2,
          receive: "Japanese Basics",
          receiveH: 2,
        },
        time: "Yesterday, 4:30 PM",
      },
      {
        id: 5,
        sender: "them",
        type: "text",
        content:
          "Can we change it to 3 hours instead? I think we need more time for grammar.",
        time: "2m ago",
        status: "delivered",
      },
    ],
  },
  {
    id: 2,
    partner: {
      id: "u2",
      name: "sakura_dev",
      avatar: "https://i.pravatar.cc/150?u=2",
      online: false,
      lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      rating: 4.7,
      trades: 12,
    },
    status: "accepted",
    archived: false,
    muted: false,
    youGive: { skill: "React Architecture", hours: 3, category: "tech" },
    youReceive: { skill: "Guitar Fingerstyle", hours: 3, category: "music" },
    lastMessage: "See you tomorrow at 2pm for the session!",
    lastTime: "1h ago",
    unread: 0,
    nextSession: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
    termsHistory: [
      {
        id: "v0",
        date: "Mon, 3:00 PM",
        fromGiveH: 2,
        fromReceiveH: 2,
        toGiveH: 2,
        toReceiveH: 2,
        note: "Initial proposal",
      },
      {
        id: "v1",
        date: "Mon, 3:10 PM",
        fromGiveH: 2,
        fromReceiveH: 2,
        toGiveH: 3,
        toReceiveH: 3,
        note: "Counter-offer accepted",
      },
    ],
    messages: [
      {
        id: 1,
        sender: "me",
        type: "text",
        content: "I am excited to learn guitar!",
        time: "Mon, 3:00 PM",
        status: "read",
      },
      {
        id: 2,
        sender: "them",
        type: "text",
        content:
          "Me too! I have been coding for 5 years but music is my passion.",
        time: "Mon, 3:05 PM",
        status: "read",
      },
      {
        id: 3,
        sender: "system",
        type: "deal",
        content: "Proposal accepted",
        meta: {
          give: "React Architecture",
          giveH: 3,
          receive: "Guitar Fingerstyle",
          receiveH: 3,
        },
        time: "Mon, 3:10 PM",
      },
      {
        id: 4,
        sender: "me",
        type: "schedule",
        content: "Scheduled a session",
        meta: { date: "Wed, Jul 30", time: "2:00 PM - 5:00 PM" },
        time: "Mon, 3:15 PM",
      },
      {
        id: 5,
        sender: "them",
        type: "text",
        content: "See you tomorrow at 2pm for the session!",
        time: "1h ago",
        status: "read",
      },
    ],
  },
  {
    id: 3,
    partner: {
      id: "u3",
      name: "marco_design",
      avatar: "https://i.pravatar.cc/150?u=3",
      online: false,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      rating: 5.0,
      trades: 8,
    },
    status: "completed",
    archived: false,
    muted: false,
    youGive: { skill: "UI/UX Critique", hours: 1.5, category: "art" },
    youReceive: { skill: "Italian Cooking", hours: 1.5, category: "art" },
    lastMessage: "Thank you so much! The pasta was amazing.",
    lastTime: "3d ago",
    unread: 0,
    nextSession: null,
    termsHistory: [
      {
        id: "v0",
        date: "Jul 25, 2:00 PM",
        fromGiveH: 1.5,
        fromReceiveH: 1.5,
        toGiveH: 1.5,
        toReceiveH: 1.5,
        note: "Completed",
      },
    ],
    messages: [
      {
        id: 1,
        sender: "system",
        type: "session_ended",
        content: "Session ended",
        meta: { duration: "3h 02m" },
        time: "Jul 25, 5:02 PM",
      },
      {
        id: 2,
        sender: "them",
        type: "text",
        content: "Thank you so much! The pasta was amazing.",
        time: "Jul 25, 5:15 PM",
        status: "read",
      },
    ],
  },
];

export function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ring-1 ${s.badge}`}
    >
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
