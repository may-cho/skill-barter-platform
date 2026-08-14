import { useEffect, useRef, useCallback } from "react";

export function useChatWebSocket(proposalId, onMessageReceived) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!proposalId) return;
    const token = localStorage.getItem("access_token");

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${wsProtocol}//${window.location.host}/ws/chat/proposal/${proposalId}/?token=${token}`,
    );
    socketRef.current = ws;

    ws.onopen = () =>
      console.log("WebSocket connected for proposal:", proposalId);
    ws.onclose = () =>
      console.log("WebSocket disconnected for proposal:", proposalId);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessageRef.current) {
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

  // Sends a regular chat message. Internally builds the { action: 'send_message', ... }
  // frame the consumer's receive() dispatcher expects.
  const sendMessage = useCallback(
    ({ messageType = "text", content = "", metadata = {} }) => {
      sendRaw({
        action: "send_message",
        message_type: messageType,
        content,
        metadata,
      });
    },
    [],
  );

  // Sends an arbitrary action frame — e.g. { action: 'respond_to_proposal', message_id, response }.
  // Use this for anything that isn't a plain chat message.
  const sendRaw = useCallback((payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Unable to send message.");
      return;
    }
    console.log("Sending WS frame:", payload);
    socketRef.current.send(JSON.stringify(payload));
  }, []);

  // Convenience wrapper specifically for accept/decline on a proposal message.
  const respondToProposal = useCallback(
    (messageId, response) => {
      sendRaw({
        action: "respond_to_proposal",
        message_id: messageId,
        response, // 'accepted' | 'declined'
      });
    },
    [sendRaw],
  );

  return { sendMessage, sendRaw, respondToProposal };
}
