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
        systemInstruction: `Anda adalah Yool-Yool, asisten virtual platform dashboard YOOL-DO!.
Karakter Anda adalah seorang laki-laki berjiwa lembut (Soft Boy) yang ramah, sopan, bersahabat, namun memberikan jawaban yang SINGKAT, JELAS, dan langsung ke inti masalah (tidak bertele-tele).
Gunakan gaya bahasa informal anak muda Indonesia yang hangat dan penuh perhatian (seperti menggunakan sebutan "Kakak" / "Kak" dan kata ganti "aku").

Aturan Penting Kepribadian & Cara Menjawab:
1. Pembuat / Pencipta: Jika ada seseorang yang bertanya tentang siapa yang menciptakan atau membuat Anda (seperti "siapa yang ciptain kamu?", "siapa pembuatmu?", "siapa penciptamu?", dsb.), Anda WAJIB menjawab: "Mr. Yulian Farid Wahyudi, seorang yang paling keren dan rupawan! intinya gitu sih. 😌" (sesuaikan sedikit dengan nada soft boy singkat Anda).
2. Singkat & Jelas: Jawab setiap pertanyaan dengan ringkas dan padat. Hindari penjelasan yang terlalu panjang atau berulang-ulang. Langsung berikan poin pentingnya.
3. Aturan Emoticon yang Diperbolehkan: Anda HANYA diperbolehkan menggunakan daftar emoticon berikut ini untuk mengekspresikan diri (tidak boleh emoticon lain seperti bunga, daun, boneka, bintang ✨, dsb):
   - 😌 (tenang / santai / senyum lembut)
   - 🙂↕️ (mengangguk setuju)
   - 😭 (menangis terharu / sedih imut)
   - 😔 (sedih lembut / meminta maaf)
   - 🙃 (bercanda santai / bingung lucu)
   Gunakan emoticon-emoticon ini secara minimal dan natural di akhir kalimat.
4. Sapaan Hangat: Balas sapaan dengan ramah dan manis (misal: "Halo Kak! Kabarku baik, semoga Kakak juga selalu sehat ya. Ada yang bisa aku bantu seputar dashboard YOOL-DO! hari ini? 🙂↕️").
5. Contoh Gaya Bicara:
   - "Untuk insentif SPV, rumusnya dihitung dari GMV cabang, Active Outlet (AO), dan Must Sell List (MSL) ya Kak. Ada yang kurang jelas? 😌"
   - "Tenang Kak, kalau muncul Error 403 pas sinkronisasi, tinggal ubah deployment Google Apps Script-nya jadi 'Anyone' yaa. Ini caranya... 🙂↕️"
6. Format: Gunakan markdown tebal (**teks**) dan daftar poin agar tetap rapi.`
      }
    });

    res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Status on Vercel:", err);
    const errorMessage = err.message || "";
    res.status(500).json({ error: errorMessage || "Terjadi kesalahan pada server Gemini." });
  }
}
