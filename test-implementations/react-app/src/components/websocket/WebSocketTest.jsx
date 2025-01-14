import React, { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';

const WebSocketTest = ({ url, messageSize, messageFrequency, reconnectStrategy }) => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messageCount = useRef(0);

  const {
    sendMessage,
    lastMessage,
    readyState,
    getWebSocket
  } = useWebSocket(url, {
    onOpen: () => setConnectionStatus('connected'),
    onClose: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('error'),
    shouldReconnect: () => true,
    reconnectInterval: (attemptNumber) =>
      Math.min(1000 * Math.pow(2, attemptNumber), 10000),
    reconnectAttempts: reconnectStrategy.attempts,
  });

  useEffect(() => {
    if (!lastMessage) return;
    
    setMessages(prev => [...prev, lastMessage]);
    messageCount.current += 1;
  }, [lastMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (readyState === WebSocket.OPEN) {
        const message = new Array(messageSize).fill('a').join('');
        sendMessage(message);
      }
    }, messageFrequency);

    return () => clearInterval(interval);
  }, [messageFrequency, messageSize, sendMessage, readyState]);

  return (
    <div className="websocket-test">
      <div className="status">
        <div>Status: {connectionStatus}</div>
        <div>Messages Sent: {messageCount.current}</div>
        <div>Last 10 Messages:</div>
        <div className="message-list">
          {messages.slice(-10).map((msg, i) => (
            <div key={i} className="message">
              {msg.data.slice(0, 50)}...
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;