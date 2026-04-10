/**
 * PulseGrid Triage Engine
 * Calls Google Gemini 2.0 Flash directly (no OpenRouter hop) for minimum latency.
 */

// System prompt is a constant — not rebuilt per request
const SYSTEM_PROMPT = `You are the PulseGrid Triage Engine. Convert emergency WhatsApp messages into JSON medical intelligence.

TRIAGE TIERS:
- RED: Life-threatening (unconscious, heavy bleeding, heart attack, stroke)
- YELLOW: Urgent but stable (fractures, high fever, chest pain)
- GREEN: Non-urgent (flu, minor cuts, mild symptoms)

RULES:
1. If vague, set status="INVESTIGATING" and include follow_up_question.
2. If clear, set status="TRIAGED" with full instructions.
3. For RED/YELLOW always set location_requested=true.

RETURN ONLY this JSON, no markdown, no extra text:
{"triage_tier":"RED|YELLOW|GREEN","status":"TRIAGED|INVESTIGATING","brief":"one sentence for doctor","medical_intelligence":"clinical summary","hardware_needed":[],"specialist_needed":[],"citizen_instructions":["step 1","step 2"],"follow_up_question":"only if INVESTIGATING","location_requested":true}`;

class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    // Direct Gemini endpoint — no OpenRouter overhead
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
  }

  async triageMessage(userInput, history = []) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error("Invalid input: message text is required.");
    }

    if (!this.geminiKey) {
      throw new Error("GEMINI_API_KEY is not set in .env");
    }

    // Build conversation contents from history
    const contents = [];

    // Map prior turns
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text || "" }]
      });
    }

    // Current user message
    contents.push({ role: 'user', parts: [{ text: userInput }] });

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,      // Low temp = faster, more deterministic
        maxOutputTokens: 512,  // Cap output — triage JSON rarely needs more
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini Error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) throw new Error("Empty response from Gemini.");

      return this.cleanJSONResponse(rawText);
    } catch (error) {
      console.error("AI Triage Error (Gemini):", error);
      throw new Error(`Failed to triage message: ${error.message}`);
    }
  }

  cleanJSONResponse(rawText) {
    try {
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) return JSON.parse(rawText);
      return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
    } catch (err) {
      console.error("JSON Parsing Error:", err);
      throw new Error("Failed to parse AI response as JSON.");
    }
  }
}

module.exports = new AIService();
