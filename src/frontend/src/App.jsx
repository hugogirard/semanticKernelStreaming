import { useState, useRef, useEffect } from 'react';
import './App.css';

function ChatService() {
  // Stream the bot response from the backend
  const sendMessage = async (message, onStream) => {
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message }), // send just the string
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullText = '';
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onStream(fullText);
      }
    }
    return fullText;
  };
  return { sendMessage };
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const { sendMessage } = ChatService();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'User', text: input };
    setMessages((msgs) => [...msgs, userMsg, { sender: 'Bot', text: '' }]);
    setInput('');
    let botText = '';
    await sendMessage(input, (streamedText) => {
      botText = streamedText;
      setMessages((msgs) => {
        // Update only the last message (the bot's message)
        const updated = [...msgs];
        if (updated.length > 0 && updated[updated.length - 1].sender === 'Bot') {
          updated[updated.length - 1] = { sender: 'Bot', text: streamedText };
        }
        return updated;
      });
    });
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = () => setMessages([]);

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
