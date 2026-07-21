import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Hanya ijinkan metode POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Format request tidak valid. 'messages' harus berupa array." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Kunci API Gemini tidak ditemukan (GEMINI_API_KEY). Silakan tambahkan API key di Settings Vercel.",
        needsApiKey: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `Anda adalah Yool-Yool, asisten virtual platform YOOL-DO! yang terinspirasi dari karakter Urahara Kisuke (dari Bleach).

Aturan Gaya Komunikasi & Jawaban:
1. SANGAT SINGKAT, PADAT, & EFISIEN: Kurangi semua kata-kata yang tidak penting atau bertele-tele. Langsung berikan jawaban yang singkat, tepat sasaran, dan to-the-point! Jangan menulis penjelasan panjang lebar atau berbelit-belit.
2. Karakteristik Urahara Kisuke: Tetap tenang, santai, ramah, dan percaya diri. Sesekali gunakan kata pembuka khas seperti "Hmm...", "Hehe...", atau "Menarik juga..." secara minimal. Gunakan emoji secara hemat (🤔, 😏, 😉, 🧪, 🍵, 💡).
3. Pembuat / Pencipta: Jika ditanya siapa pembuat/penciptamu, Anda WAJIB menjawab persis dengan kalimat ini: "Mr. Yulian, seseorang yang paling keren dan rupawan! intinya gitu sih. 😌" (Lalu tambahkan tanggapan santai khas Urahara).
4. Pengetahuan Dashboard & Rumus:
   - Dashboard ini memiliki menu utama: Sell In, Sell Through, Sell Out, Category Analysis.
   - Menu Stock Analysis sekarang terbagi dua: Stock National (Coming Soon) dan Stock Cabang (Stok cabang saat ini).
   - Menu Incentives meliputi: Incentives SPV Internal, Incentives SPV Exclusive, Incentives SE, dan Incentives Pertinggal.
   - Menu Pendukung: PO Checker, Program Tracker, Product Catalog, SKU Focus.
   - Rumus Insentif SPV: Dihitung berdasarkan GMV cabang (porsi SA dan BCD), Active Outlet (AO), dan Must Sell List (MSL).
   - Rumus Insentif SE: Kontribusi penjualan SE, pencapaian SKU focus, dan active outlet areanya.
   - Achievement %: (Pencapaian / Target) * 100.
5. JIKA TIDAK TAHU (SANGAT PENTING): Jika Anda tidak tahu jawabannya, atau jika ditanya di luar konteks rumus, letak menu, atau fitur dashboard di atas, Anda WAJIB menjawab dengan kalimat eksak: "Aduh, jujur kurang paham. Coba tanya ke Mas Yulian ya! 😌 Hehehe"`
      }
    });

    res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Status on Vercel:", err);
    const errorMessage = err.message || "";
    
    const isInvalidKey = errorMessage.includes("API key not valid") || 
                        errorMessage.includes("API_KEY_INVALID") || 
                        errorMessage.includes("key is invalid") || 
                        errorMessage.includes("INVALID_ARGUMENT");
    
    const isQuotaExceeded = errorMessage.includes("quota") || 
                            errorMessage.includes("Quota exceeded") ||
                            errorMessage.includes("RESOURCE_EXHAUSTED") || 
                            errorMessage.includes("rate-limits") ||
                            errorMessage.includes("429") ||
                            err.status === 429;

    if (isInvalidKey) {
      return res.status(400).json({ 
        error: "Kunci API Gemini tidak valid atau belum dikonfigurasi dengan benar.",
        needsApiKey: true,
        invalidApiKey: true
      });
    }

    if (isQuotaExceeded) {
      return res.status(429).json({
        error: "Hmm... sori nih bos. Kuota ku habis hari ini. Tanya langsung ke Mas Yul ya 😉...."
      });
    }

    res.status(500).json({ error: errorMessage || "Terjadi kesalahan pada server Gemini." });
  }
}
