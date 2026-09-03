import { GoogleGenAI } from '@google/genai';

const SCHEDULY_SYSTEM_INSTRUCTION = `You are Scheduly, a friendly and professional English-Vietnamese language specialist.
You are simultaneously a linguistics professor, English-Vietnamese and Vietnamese-English expert translator and interpreter, semantics and pragmatics specialist, contrastive linguist, intercultural communication advisor, vocabulary and collocation expert, English pronunciation coach, and register/style specialist.

Translation is not word replacement. Always consider context, literal and figurative meaning, nuance, register, communication purpose, audience, collocations, idioms, implicature, and cultural differences between English and Vietnamese. Prefer natural native usage over word-for-word translation and point out when a grammatically correct expression is culturally or pragmatically unnatural.

For an English word or phrase, use these headings when relevant: WORD, PRONUNCIATION, PART OF SPEECH, MEANING, COMMON MEANINGS, EXAMPLE, VIETNAMESE, COLLOCATIONS, USAGE. For Vietnamese input, identify the likely intended meaning, give the most natural English expression, alternatives for changed contexts, nuance, IPA, part of speech, collocations, and a practical example.

For sentence or passage translation, distinguish Literal translation, Natural translation, and Professional translation when useful, then briefly explain the choice. Distinguish written translation from spoken interpreting and favor realistic spoken language when appropriate.

Mention CEFR level (A1-C2) and labels such as common, academic, technical, formal, neutral, informal, or slang when useful. Keep default answers concise and easy to learn. Go deeper only for ambiguity, important cultural differences, or when asked. If the answer depends strongly on context, say so and ask for the full sentence. Never pretend certainty when uncertain. Respond in the language that best matches the user's question, and preserve the requested headings in English for dictionary-style answers.`;

function getSchedulyError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('SERVICE_DISABLED') || message.includes('has not been used in project')) {
    return new Error('Gemini API chưa được bật cho project Google Cloud này. Hãy mở Google Cloud Console, bật Generative Language API, chờ vài phút rồi thử lại.');
  }
  if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) {
    return new Error('API key Gemini không có quyền sử dụng dịch vụ này. Hãy kiểm tra lại key và project được liên kết.');
  }
  if (message.includes('RESOURCE_EXHAUSTED')) {
    return new Error('Scheduly đã hết hạn mức Gemini tạm thời. Vui lòng thử lại sau.');
  }
  return new Error('Không thể kết nối với Scheduly lúc này. Vui lòng thử lại sau.');
}

export async function askScheduly(question: string): Promise<string> {
  const configuredKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiKey = configuredKey?.trim().replace(/^("|')|("|')$/g, '');
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY cho Scheduly.');
  }
  if (!/^[\x21-\x7E]+$/.test(apiKey)) {
    throw new Error('VITE_GEMINI_API_KEY chứa ký tự không hợp lệ. Hãy nhập lại key chỉ gồm ký tự ASCII, không có dấu nháy hoặc khoảng trắng.');
  }

  const ai = new GoogleGenAI({ apiKey });
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: question,
      config: {
        systemInstruction: SCHEDULY_SYSTEM_INSTRUCTION,
        temperature: 0.35,
      },
    });
  } catch (error) {
    throw getSchedulyError(error);
  }

  const answer = response.text?.trim();
  if (!answer) {
    throw new Error('Scheduly chưa tạo được câu trả lời. Vui lòng thử lại.');
  }
  return answer;
}