import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, ArrowRight, Sparkles, RefreshCw, Layers, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  quickReplies?: { text: string; query: string }[];
}

export default function RuleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true); // Show a pulsing dot initially to catch attention
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Halo! Saya **Yool-Yool**, asisten virtual pintar Anda untuk **YOOL-DO!**.\n\nSilakan tanyakan hal-hal seputar dashboard, analisis penjualan, rumus insentif, atau kendala teknis kepada saya! Serahkan kepada ahlinya ya!",
      timestamp: new Date(),
      quickReplies: [
        { text: "📊 Rumus Insentif SPV", query: "Tolong jelaskan bagaimana Rumus Insentif SPV (Supervisor) dihitung." },
        { text: "⭐ Rumus Insentif SE", query: "Tolong jelaskan bagaimana Rumus Insentif SE (Sales Executive) dihitung." },
        { text: "🔄 Cara Atasi Error 403 / Sync", query: "Bagaimana cara mengatasi error sinkronisasi atau Error 403 Forbidden pada Google Sheets?" },
        { text: "💡 Apa beda Sell In/Through/Out?", query: "Apa perbedaan antara Sell In, Sell Through, dan Sell Out?" }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      // Connect directly to backend proxy endpoint which runs Gemini 2.5 Flash / 3.5 Flash
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            sender: msg.sender,
            text: msg.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "Gagal mendapatkan balasan dari AI.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("[Chatbot Gemini Failure]:", err);
      // Friendly, professional response if connection/API is down
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "Maaf, koneksi ke asisten AI Gemini sedang bermasalah atau terputus. Mohon pastikan koneksi internet Anda stabil dan silakan coba beberapa saat lagi!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  // Process markdown formatting inside chat bubbles elegantly
  const renderMessageText = (txt: string, isBot: boolean) => {
    return (
      <div className={`markdown-body text-xs leading-relaxed space-y-1.5 break-words ${isBot ? "text-slate-700" : "text-white"}`}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            strong: ({ children }) => <strong className="font-extrabold text-slate-900">{children}</strong>,
            code: ({ children }) => (
              <code className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${isBot ? "bg-slate-100 text-red-500" : "bg-blue-700 text-blue-100"}`}>
                {children}
              </code>
            )
          }}
        >
          {txt}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] h-[520px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between border-b border-slate-100/80 shadow-sm shadow-slate-50/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100/50 shadow-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 tracking-wide">
                    Yool-Yool
                  </h3>
                  <p className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wider">Asisten Virtual Ter-🔥💥🤯!</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      sender: "bot",
                      text: "Halo! Saya **Yool-Yool**, asisten virtual pintar Anda untuk platform **YOOL-DO!** .\n\nSilakan tanyakan hal-hal seputar dashboard, analisis penjualan, rumus insentif, atau kendala teknis kepada saya!",
                      timestamp: new Date(),
                      quickReplies: [
                        { text: "📊 Rumus Insentif SPV", query: "Tolong jelaskan bagaimana Rumus Insentif SPV (Supervisor) dihitung." },
                        { text: "⭐ Rumus Insentif SE", query: "Tolong jelaskan bagaimana Rumus Insentif SE (Sales Executive) dihitung." },
                        { text: "🔄 Cara Atasi Error 403 / Sync", query: "Bagaimana cara mengatasi error sinkronisasi atau Error 403 Forbidden pada Google Sheets?" },
                        { text: "💡 Apa beda Sell In/Through/Out?", query: "Apa perbedaan antara Sell In, Sell Through, dan Sell Out?" }
                      ]
                    }
                  ])}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  title="Reset Percakapan"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  title="Tutup Chat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${msg.sender === "bot" ? "bg-blue-50 text-blue-500 border-blue-100/50" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
                    {msg.sender === "bot" ? <Bot size={12} /> : <User size={12} />}
                  </div>

                  <div className="max-w-[75%] space-y-2">
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[11px] border ${
                      msg.sender === "bot" 
                        ? "bg-white border-slate-100/80 rounded-tl-none text-slate-700 shadow-sm shadow-slate-100/50" 
                        : "bg-blue-500 text-white border-blue-400/30 rounded-tr-none font-medium shadow-sm shadow-blue-100/30"
                    }`}>
                      {renderMessageText(msg.text, msg.sender === "bot")}
                    </div>

                    {msg.sender === "bot" && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.quickReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(reply.query)}
                            className="px-2.5 py-1 bg-white border border-slate-200/60 hover:bg-slate-50/50 hover:border-blue-400 hover:text-blue-500 rounded-full text-[9px] font-medium text-slate-500 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {reply.text}
                            <ArrowRight size={8} className="opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-500 border border-blue-100/50">
                    <Bot size={12} />
                  </div>
                  <div className="px-3.5 py-2.5 bg-white border border-slate-100/80 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>



            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 bg-white border-t border-slate-100/80 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanya rumus, sync, stock, atau ketik kata kunci..."
                className="flex-1 bg-slate-50/50 border border-slate-200/50 px-3.5 py-2 rounded-xl text-xs font-normal text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className={`p-2 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${inputValue.trim() && !isTyping ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600" : "bg-slate-100/60 text-slate-300 cursor-not-allowed"}`}
              >
                <Send size={12} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Action Button */}
      <button
        onClick={toggleChat}
        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-100/40 relative transition-all duration-300 transform hover:scale-105 group border border-blue-400/20 cursor-pointer"
        title="Buka Yool-Bot Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="bot-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Bot size={20} className="group-hover:animate-bounce" />
              {hasNewMessage && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
              )}
              {hasNewMessage && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
