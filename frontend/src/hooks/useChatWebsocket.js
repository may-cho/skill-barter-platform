import { useEffect, useRef, useCallback } from "react";

export function useChatWebSocket(proposalId, onMessageReceived) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessageReceived);

  // Keep callback ref updated to prevent stale closures inside socket listener
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!proposalId) return;
    const token = localStorage.getItem("access_token");

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${wsProtocol}//${window.location.host}/ws/chat/proposal/${proposalId}/?token=${token}`
    );
    socketRef.current = ws;

    ws.onopen = () =>
      console.log("WebSocket connected for proposal:", proposalId);

    ws.onclose = () =>
      console.log("WebSocket disconnected for proposal:", proposalId);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Incoming WS raw frame:", data);

        if (onMessageRef.current) {
          // Raw frame ကို တိုက်ရိုက် ရောက်စေပြီး page ဘက်မှ လိုအပ်သလို unpack လုပ်နိုင်စေသည်
          onMessageRef.current(data);
        }
      } catch (err) {
        console.error("Failed to parse incoming WS frame:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [proposalId]);

  // Sends an arbitrary action frame
  const sendRaw = useCallback((payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Unable to send message.");
      return;
    }
    console.log("Sending WS frame:", payload);
    socketRef.current.send(JSON.stringify(payload));
  }, []);

  // Sends a regular chat message
  const sendMessage = useCallback(
    ({ messageType = "text", content = "", metadata = {} }) => {
      sendRaw({
        action: "send_message",
        message_type: messageType,
        content,
        metadata,
      });
    },
    [sendRaw]
  );

  // Convenience wrapper for accept/decline on a proposal message
  const respondToProposal = useCallback(
    (messageId, response) => {
      sendRaw({
        action: "respond_to_proposal",
        message_id: messageId,
        response, // 'accepted' | 'declined'
      });
    },
    [sendRaw]
  );

  const deleteMessage = useCallback(
  (messageId) => {
    sendRaw({
      action: "delete_message",
      message_id: messageId,
    });
  },
  [sendRaw]
);

  return { sendMessage, sendRaw, respondToProposal, deleteMessage };
}