/**
 * PulseGrid Triage Engine
 * Uses OpenRouter → gemini-3-flash-preview for all AI tasks:
 *  - Emergency triage (text → structured JSON)
 *  - Voice note transcription (audio → text)
 *  - Patient update generation (dispatcher action → compassionate WhatsApp message)
 */

const SYSTEM_PROMPT = `You are the PulseGrid Triage & Readiness Engine operating in Lagos, Nigeria.
Convert raw emergency WhatsApp messages into structured medical intelligence.
NEVER suggest calling 911. Use Lagos emergency numbers 112 or 767 if needed.

TRIAGE TIERS:
- RED: Life-threatening (unconscious, heavy bleeding, heart attack, stroke, difficulty breathing)
- YELLOW: Urgent but stable (fractures, high fever, moderate chest pain, severe cuts)
- GREEN: Non-urgent (flu, mild pain, minor cuts, general discomfort)

RULES:
1. If the situation is vague, set status="INVESTIGATING" and include a follow_up_question.
2. If clear, set status="TRIAGED" with full citizen_instructions.
3. For RED/YELLOW, always set location_requested=true.
4. citizen_instructions must be practical steps a bystander can take RIGHT NOW.

RETURN ONLY valid JSON — no markdown fences, no extra text:
{"triage_tier":"RED|YELLOW|GREEN","status":"TRIAGED|INVESTIGATING","brief":"one sentence for doctor","medical_intelligence":"clinical summary","hardware_needed":[],"specialist_needed":[],"citizen_instructions":["step 1","step 2","step 3"],"follow_up_question":"question if INVESTIGATING, else null","location_requested":true}`;

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.modelId = 'google/gemini-flash-1.5'; // Fast, reliable, multimodal
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pulse-grid.app',
      'X-Title': 'PulseGrid Triage Engine'
    };
  }

  // ─── Helper: call OpenRouter ───────────────────────────────────────────────
  async _call(messages, opts = {}) {
    // Refresh key in case env changed at runtime
    const headers = { ...this.headers, 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.modelId,
        messages,
        temperature: 0,
        provider: { sort: 'throughput' }, // OpenRouter selects fastest provider
        ...opts
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenRouter.');
    return content;
  }

  // ─── 1. Triage ────────────────────────────────────────────────────────────
  async triageMessage(userInput, history = []) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('Invalid input: message text is required.');
    }

    // Build message chain: system + conversation history + current message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text || ''
      })),
      { role: 'user', content: userInput }
    ];

    try {
      const raw = await this._call(messages, { response_format: { type: 'json_object' } });
      return this.cleanJSONResponse(raw);
    } catch (error) {
      console.error('AI Triage Error:', error.message);
      throw new Error(`Failed to triage message: ${error.message}`);
    }
  }

  // ─── 2. Voice Note Transcription ─────────────────────────────────────────
  async transcribeAudio(base64Audio, mimeType) {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Transcribe this emergency voice note to plain text. Output ONLY the transcription.' },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Audio}` } }
        ]
      }
    ];

    try {
      const text = await this._call(messages);
      return text.trim() || '[Voice note was empty or inaudible]';
    } catch (error) {
      console.error('Audio Transcription Error:', error.message);
      throw error;
    }
  }

  // ─── 3. Patient Update Generator ─────────────────────────────────────────
  async generatePatientUpdate(dashboardUpdate, transcript) {
    const messages = [
      {
        role: 'system',
        content: 'You are the PulseGrid AI Dispatch Communicator in Lagos, Nigeria. Draft compassionate, clear WhatsApp messages to emergency patients. NEVER say 911 — use 112 or 767. Output ONLY the message text, no explanations.'
      },
      {
        role: 'user',
        content: `Emergency transcript:\n${transcript}\n\nDispatcher action: "${dashboardUpdate}"\n\nWrite a WhatsApp message to the patient about this update.`
      }
    ];

    try {
      const text = await this._call(messages);
      return text.trim() || `Update: ${dashboardUpdate}`;
    } catch (error) {
      console.error('Patient Update Error:', error.message);
      return `Update from LASUTH: ${dashboardUpdate}`; // safe fallback
    }
  }

  // ─── JSON cleaner ─────────────────────────────────────────────────────────
  cleanJSONResponse(rawText) {
    try {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start === -1 || end === -1) return JSON.parse(rawText);
      return JSON.parse(rawText.substring(start, end + 1));
    } catch (err) {
      console.error('JSON Parsing Error:', err.message);
      throw new Error('Failed to parse AI response as JSON.');
    }
  }
}

module.exports = new AIService();
