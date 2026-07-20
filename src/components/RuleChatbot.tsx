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
      text: "Halo! Saya **Yool-Bot**, asisten virtual pintar Anda untuk platform **YOOL-DO!**.\n\nSilakan tanyakan hal-hal seputar dashboard kepada ahlinya!",
      timestamp: new Date(),
      quickReplies: [
        { text: "📊 Rumus Insentif SPV", query: "spv" },
        { text: "⭐ Rumus Insentif SE", query: "se" },
        { text: "🔄 Cara Atasi Error 403 / Sync", query: "sync" },
        { text: "💡 Apa beda Sell In/Through/Out?", query: "sell" }
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

  // Predefined Q&A Knowledge Base for Rules mode
  const getBotResponse = (input: string): { text: string; quickReplies?: { text: string; query: string }[] } => {
    const text = input.toLowerCase().trim();

    // 1. Incentives SPV
    if (text.includes("spv") || text.includes("internal") || text.includes("exclusive") || text.includes("insentif spv") || text.includes("supervisor")) {
      return {
        text: "**Rumus Insentif SPV (Supervisor) di YOOL-DO!:**\n\nSPV Incentive dihitung secara berkala berdasarkan beberapa komponen utama:\n1. **Pencapaian GMV (Gross Merchandise Value)**: Mencapai target GMV total (target vs actual) cabang.\n2. **Incentive Active Outlet (AO)**: Dihitung dari jumlah outlet aktif yang melakukan transaksi.\n3. **Incentive Must Sell List (MSL)**: Tambahan bonus untuk penyebaran produk prioritas wajib jual.\n\n*Perbedaan SPV Internal & Exclusive terletak pada jenis distributor dan otorisasi wilayah cabang yang terdaftar di sistem.*",
        quickReplies: [
          { text: "⭐ Rumus Insentif SE", query: "se" },
          { text: "🔄 Cara Atasi Error Sync", query: "sync" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 2. Incentives SE
    if (text.includes("se ") || text.includes(" se") || text.includes("sales executive") || text.includes("se") || text.includes("salesman") || text.includes("executive")) {
      return {
        text: "**Rumus Insentif SE (Sales Executive) di YOOL-DO!:**\n\nIncentive SE berfokus pada performa eksekusi sales di lapangan:\n1. **Ach GMV**: Persentase pencapaian target volume penjualan.\n2. **Ach AO**: Target keaktifan jumlah toko binaan.\n3. **Product Focus ST & AO**: Bonus tambahan jika SE berhasil menjual SKU fokus tertentu ke toko retail.\n\nData ini diperbarui berkala berdasarkan unggahan data dari Google Sheets distributor.",
        quickReplies: [
          { text: "📊 Rumus Insentif SPV", query: "spv" },
          { text: "🔄 Cara Atasi Error Sync", query: "sync" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 3. Sync & Error 403
    if (text.includes("sync") || text.includes("error") || text.includes("403") || text.includes("gagal") || text.includes("forbidden") || text.includes("loading") || text.includes("koneksi") || text.includes("sheet")) {
      return {
        text: "**Cara Mengatasi Error Sinkronisasi / Error 403 (Forbidden):**\n\nMasalah ini biasanya disebabkan oleh pembatasan hak akses (permission) pada Google Apps Script Anda. Silakan ikuti panduan berikut:\n\n1. Buka halaman **Google Apps Script** dari spreadsheet Anda.\n2. Klik tombol **Deploy** di sudut kanan atas, lalu pilih **New Deployment**.\n3. Atur konfigurasi deployment:\n   - *Execute as:* **Me (Email Anda)**\n   - *Who has access:* **Anyone** (Siapa saja / umum)\n4. Klik **Deploy** dan salin URL Web App baru yang berakhiran dengan `/exec`.\n5. Masukkan URL tersebut pada konfigurasi di dashboard Yool-Do.",
        quickReplies: [
          { text: "📊 Rumus Insentif SPV", query: "spv" },
          { text: "💡 Apa beda Sell In/Through/Out?", query: "sell" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 4. Sell In / Sell Through / Sell Out
    if (text.includes("sell") || text.includes("beda") || text.includes("in") || text.includes("through") || text.includes("out") || text.includes("aliran")) {
      return {
        text: "**Perbedaan Aliran Data Penjualan (Sales Funnel):**\n\n* **Sell In**: Penjualan barang dari **Prinsipal / Pabrik ke Distributor** (Stok masuk gudang distributor).\n* **Sell Through**: Penjualan barang dari **Distributor ke Toko / Retail / Grosir** (Stok masuk pasar ritel).\n* **Sell Out**: Penjualan barang dari **Toko langsung ke Konsumen Akhir** (Konsumsi nyata di pasar).\n\nDashboard ini memantau ketiga metrik tersebut untuk menjaga keseimbangan stok di pasar.",
        quickReplies: [
          { text: "🎯 Apa itu SKU Focus?", query: "sku" },
          { text: "📦 Penjelasan Stock Analysis", query: "stock" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 5. Stock Analysis
    if (text.includes("stock") || text.includes("stok") || text.includes("soh") || text.includes("death") || text.includes("woi")) {
      return {
        text: "**Panduan Metrik Stock Analysis:**\n\nFitur ini berfungsi memantau kesehatan persediaan stok di gudang distributor:\n* **SOH (Stock on Hand)**: Jumlah stok fisik yang tersedia saat ini di gudang.\n* **WOI (Weeks of Inventory)**: Estimasi berapa minggu stok akan habis berdasarkan rata-rata penjualan mingguan.\n* **Death Stock**: Indikator produk yang tidak mengalami penjualan sama sekali dalam 30 hari terakhir. Sebaiknya segera buat program promo untuk produk berkategori ini.",
        quickReplies: [
          { text: "💡 Apa beda Sell In/Through/Out?", query: "sell" },
          { text: "🎯 Apa itu SKU Focus?", query: "sku" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 6. SKU Focus
    if (text.includes("sku") || text.includes("focus") || text.includes("prioritas") || text.includes("eligible")) {
      return {
        text: "**Penjelasan Menu SKU Focus:**\n\nMenu **SKU Focus** melacak tingkat distribusi produk-produk unggulan/prioritas (*focus product*) ke retail. Fitur ini membantu:\n1. Mengetahui seberapa banyak toko binaan yang sudah mengorder SKU fokus tersebut.\n2. Menentukan kelayakan (*Eligibility*) distributor dalam mendapatkan bonus distribusi khusus berdasarkan pencapaian target yang ditetapkan.",
        quickReplies: [
          { text: "📦 Penjelasan Stock Analysis", query: "stock" },
          { text: "💡 Apa beda Sell In/Through/Out?", query: "sell" },
          { text: "Kembali ke Menu Utama", query: "menu" }
        ]
      };
    }

    // 7. Menu utama / Reset / Bantuan
    if (text.includes("menu") || text.includes("bantuan") || text.includes("reset") || text.includes("halo") || text.includes("hi") || text.includes("pagi") || text.includes("siang") || text.includes("sore") || text.includes("malam")) {
      return {
        text: "Halo! Berikut adalah topik informasi populer yang dapat saya bantu jawab secara instan. Silakan pilih salah satu opsi di bawah:",
        quickReplies: [
          { text: "📊 Rumus Insentif SPV", query: "spv" },
          { text: "⭐ Rumus Insentif SE", query: "se" },
          { text: "🔄 Cara Atasi Error 403 / Sync", query: "sync" },
          { text: "💡 Apa beda Sell In, Through & Out?", query: "sell" },
          { text: "📦 Penjelasan Stock Analysis", query: "stock" },
          { text: "🎯 Apa itu SKU Focus?", query: "sku" }
        ]
      };
    }

    // 8. Fallback / Default Response
    return {
      text: "Maaf, saya tidak menemukan kata kunci yang tepat untuk menjawab pertanyaan Anda.\n\nCobalah untuk mengetik dengan kata kunci yang lebih spesifik seperti **'spv'**, **'se'**, **'sync'**, **'sell'**, **'stock'**, atau **'sku'**. Atau Anda bisa mengklik opsi bantuan instan berikut ini:",
      quickReplies: [
        { text: "📊 Rumus Insentif SPV", query: "spv" },
        { text: "⭐ Rumus Insentif SE", query: "se" },
        { text: "🔄 Cara Atasi Error 403 / Sync", query: "sync" },
        { text: "Kembali ke Menu Utama", query: "menu" }
      ]
    };
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate natural response timing delay
    setTimeout(() => {
      const responseData = getBotResponse(textToSend);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: responseData.text,
        timestamp: new Date(),
        quickReplies: responseData.quickReplies
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
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
                    Yool-Bot
                  </h3>
                  <p className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wider">Asisten Virtual Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      sender: "bot",
                      text: "Halo! Saya **Yool-Bot**, asisten virtual pintar Anda untuk platform **YOOL-DO!**.\n\nSaya berjalan secara lokal tanpa limit kuota. Silakan tanyakan hal-hal seputar dashboard, rumus insentif, atau kendala sinkronisasi data!",
                      timestamp: new Date(),
                      quickReplies: [
                        { text: "📊 Rumus Insentif SPV", query: "spv" },
                        { text: "⭐ Rumus Insentif SE", query: "se" },
                        { text: "🔄 Cara Atasi Error 403 / Sync", query: "sync" },
                        { text: "💡 Apa beda Sell In/Through/Out?", query: "sell" }
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
