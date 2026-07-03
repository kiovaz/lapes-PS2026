import { useState, useRef, useEffect } from 'react';
import { /* MessageSquare, */ X, Send, Sparkles } from 'lucide-react';
import { aiApi, type ChatHistoryItem } from '../api/ai';
import { useAuth } from '../contexts/AuthContext';

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    {
      role: 'model',
      content: 'Olá! Sou o assistente virtual da 8-Bit Books. Como posso ajudar você hoje? Posso ajudar a buscar livros, verificar seus pedidos ou validar cupons!',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Only render if the user is authenticated
  if (!isAuthenticated) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');

    // Add user message to UI
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Send to API
      const result = await aiApi.chat(userMessage, history);

      // Update local history for backend context
      const newHistory: ChatHistoryItem[] = [
        ...history,
        { role: 'user', content: userMessage },
        { role: 'model', content: result.response },
      ];
      setHistory(newHistory);

      // Add model response to UI
      setMessages((prev) => [...prev, { role: 'model', content: result.response }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Erro desconhecido.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `Desculpe, ocorreu um erro ao processar sua mensagem. Detalhes: ${errMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Abrir chat com assistente">
          <Sparkles size={20} className="fab-icon-sparkles" />
          <span className="fab-text">Assistente IA</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="chat-title">Assistente 8-Bit</div>
                <div className="chat-status">
                  <span className="status-dot"></span> Online
                </div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar chat">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message-wrapper ${msg.role === 'user' ? 'user' : 'model'}`}>
                <div className="chat-message-bubble">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message-wrapper model">
                <div className="chat-message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Pergunte sobre produtos, pedidos..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="chat-send-btn" disabled={!message.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
