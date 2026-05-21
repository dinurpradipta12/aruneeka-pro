import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `Kamu adalah seorang konsultan content strategy berpengalaman untuk agency media sosial Indonesia. 
Tugasmu adalah membuat 4 ide konten yang sangat kreatif, viral, dan relevan sesuai spesifikasi yang diberikan.

ATURAN PENTING:
- Jawab HANYA dalam format JSON array, tanpa teks penjelasan apapun di luar JSON.
- Setiap ide harus orisinal, tidak generik, dan memiliki hook yang kuat.
- Gunakan gaya bahasa yang relevan dengan platform target.
- Pastikan setiap ide memiliki potensi viral yang tinggi.

FORMAT JSON yang HARUS diikuti (tanpa deviasi):
[
  {
    "headline": "Hook utama konten (maks 100 karakter)",
    "description": "Penjelasan singkat konsep konten, angle, dan cara eksekusi (maks 200 karakter)",
    "platform": "nama platform",
    "pillar": "pilar konten"
  }
]`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider = 'gemini', apiKey, platform, pillar, topic, agencyContext } = body;

    if (!apiKey) {
      return NextResponse.json({ error: `API Key untuk ${provider === 'openai' ? 'OpenAI' : 'Gemini'} diperlukan.` }, { status: 400 });
    }

    const userPrompt = `Buat 4 ide konten untuk:
- Platform: ${platform || 'TikTok'}
- Pilar Konten: ${pillar || 'Edukasi'}  
- Topik/Brand Focus: ${topic || 'bisnis digital dan media sosial'}
- Konteks Agensi: ${agencyContext || 'Agensi media sosial yang melayani brand lokal Indonesia'}

Pastikan setiap ide memiliki hook yang sangat kuat di kalimat pertama dan potensi viral yang tinggi untuk ${platform || 'TikTok'}.`;

    let ideas: any[] = [];

    if (provider === 'openai') {
      const openaiUrl = 'https://api.openai.com/v1/chat/completions';
      const openaiResponse = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.9,
          response_format: { type: "json_object" }
        })
      });

      if (!openaiResponse.ok) {
        const errData = await openaiResponse.json();
        const errMsg = errData?.error?.message || 'Gagal menghubungi OpenAI API';
        return NextResponse.json({ error: errMsg }, { status: openaiResponse.status });
      }

      const openaiData = await openaiResponse.json();
      const rawText = openaiData?.choices?.[0]?.message?.content || '{}';
      
      const parsedObj = JSON.parse(rawText.trim());
      // Handle cases where the model returns an object with a key or direct array
      if (Array.isArray(parsedObj)) {
        ideas = parsedObj;
      } else if (parsedObj.ideas && Array.isArray(parsedObj.ideas)) {
        ideas = parsedObj.ideas;
      } else {
        // Find any array key
        const arrayKey = Object.keys(parsedObj).find(k => Array.isArray(parsedObj[k]));
        if (arrayKey) {
          ideas = parsedObj[arrayKey];
        } else {
          throw new Error('Respons OpenAI tidak berformat array JSON yang valid.');
        }
      }
    } else {
      // Default: Gemini
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Mengerti. Saya akan memberikan respons HANYA dalam format JSON array yang diminta, tanpa teks tambahan apapun.' }] },
            { role: 'user', parts: [{ text: userPrompt }] }
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        }),
      });

      if (!geminiResponse.ok) {
        const errData = await geminiResponse.json();
        const errMsg = errData?.error?.message || 'Gagal menghubungi Gemini API';
        return NextResponse.json({ error: errMsg }, { status: geminiResponse.status });
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      let jsonText = rawText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      const parsedObj = JSON.parse(jsonText);
      if (Array.isArray(parsedObj)) {
        ideas = parsedObj;
      } else if (parsedObj.ideas && Array.isArray(parsedObj.ideas)) {
        ideas = parsedObj.ideas;
      } else {
        const arrayKey = Object.keys(parsedObj).find(k => Array.isArray(parsedObj[k]));
        if (arrayKey) {
          ideas = parsedObj[arrayKey];
        } else {
          throw new Error('Respons Gemini tidak berformat array JSON yang valid.');
        }
      }
    }

    if (!Array.isArray(ideas)) {
      throw new Error('Format respons tidak valid.');
    }

    return NextResponse.json({ ideas });
  } catch (err: any) {
    console.error('[AI Idea Route Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal memproses permintaan AI. Pastikan API Key Anda valid.' },
      { status: 500 }
    );
  }
}
