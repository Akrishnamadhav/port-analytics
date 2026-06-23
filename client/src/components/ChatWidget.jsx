import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ChatWidget() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: "Hi! I'm PortBot 🚢 Ask me anything about port revenue, cargo, vessels, or financial performance.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // If user is not authenticated, do not show the widget at all
  if (authLoading || !user) {
    return null;
  }

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend || loading) return;

    // Append user message to state
    const newMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Map frontend messages format to backend expected history format
      // slice to the last 10 messages (not including the new user message we are sending in request body)
      const requestHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })).slice(-10);

      const response = await api.post('/api/chat', {
        message: textToSend,
        history: requestHistory
      });

      setMessages(prev => [...prev, { role: 'model', text: response.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: "Sorry, I couldn't reach the analytics server. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-80 h-[420px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#003366]/20 bg-white">
          {/* Header */}
          <div className="bg-[#003366] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#d4a843]">
              <span className="text-base">🚢</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm leading-tight">PortBot</h3>
              <p className="text-white/70 text-xs truncate">Port Analytics Assistant</p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === 'user'
                    ? 'bg-[#003366] text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[75%] self-end'
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 text-sm max-w-[75%] self-start shadow-sm border border-gray-100'
                }
              >
                {msg.text}
              </div>
            ))}

            {/* Bouncing Dots typing indicator */}
            {loading && (
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 text-sm max-w-[75%] self-start shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center justify-center py-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 flex gap-2 bg-white">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask PortBot..."
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/40"
            />
            <button
              disabled={loading || !input.trim()}
              onClick={handleSend}
              className="bg-[#003366] hover:bg-[#00264d] text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all bg-[#003366] hover:bg-[#00264d] border-none outline-none"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
