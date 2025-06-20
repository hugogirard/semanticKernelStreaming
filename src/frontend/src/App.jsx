import { useState, useRef, useEffect } from 'react';
import './App.css';

function generateGuid() {
  // Simple GUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(() => generateGuid());
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'User', text: input };
    setMessages((msgs) => [...msgs, userMsg, { sender: 'Bot', text: '' }]);
    setInput('');

    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input, id: chatId }),
    });
    if (!response.body) return;
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].sender === 'Bot') {
          updated[updated.length - 1] = {
            sender: 'Bot',
            text: (updated[updated.length - 1].text || '') + value
          };
        }
        return updated;
      });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = async () => {
    // Call backend to delete chat history for this chat_id
    await fetch(`http://localhost:8000/api/chat?chat_id=${chatId}`, {
      method: 'DELETE',
    });
    setMessages([]);
    setChatId(generateGuid()); // New chat session
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="clear-btn" onClick={handleClear}>Clear Chat</button>
      </div>
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender.toLowerCase()}`}>
            <span className="chat-label">{msg.sender} &rarr;</span> {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Type your message..."
        />
        <button className="send-btn" onClick={handleSend} aria-label="Send">
          <svg height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}

export default App;
