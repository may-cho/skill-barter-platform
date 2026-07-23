import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button, Input } from './ui';

export default function ProposalChat({ proposalId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getMessages(proposalId).then((data) => {
      setMessages(data.messages || []);
      setQuickReplies(data.quick_replies || []);
    });
  }, [proposalId]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/chat/proposal/${proposalId}/?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connection_established') {
        setQuickReplies(data.quick_replies || []);
      } else if (data.type === 'chat_message') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [proposalId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (message) => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message }));
    setText('');
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 flex justify-between">
        <span>Proposal Chat #{proposalId}</span>
        <span className={connected ? 'text-green-600' : 'text-red-500'}>
          {connected ? '● Live' : '○ Disconnected'}
        </span>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((m) => (
          <div
            key={m.id || m.sent_at + m.message_text}
            className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
              m.sender_id === user.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {m.sender_id !== user.id && (
                <p className="text-xs opacity-70 mb-0.5">{m.sender_name}</p>
              )}
              {m.message_text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {quickReplies.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-slate-100">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              onClick={() => send(qr)}
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100"
            >
              {qr.length > 50 ? qr.slice(0, 50) + '…' : qr}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex gap-2 p-3 border-t border-slate-200"
        onSubmit={(e) => { e.preventDefault(); send(text); }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
