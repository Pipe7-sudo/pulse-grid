/**
 * PulseGrid Triage & Readiness Engine
 * Converts raw WhatsApp text into actionable medical intelligence using OpenRouter (Gemini 1.5 Flash).
 */
class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.modelId = "google/gemini-2.0-flash-lite-001";
  }

  async triageMessage(userInput, history = []) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error("Invalid input: message text is required.");
    }

    const systemPrompt = `
      System Role & Persona:
      You are the PulseGrid Triage & Readiness Engine. Your goal is to convert raw, panicked citizen text into medical intelligence.

      Triage Logic:
      - RED (Immediate): Life-threatening (e.g., unconscious, heavy bleeding, heart attack).
      - YELLOW (Urgent): Serious but stable (e.g., fractures, high fever, moderate pain).
      - GREEN (Non-Urgent): Minor (e.g., flu, small cuts).

      Rules:
      1. If the situation is vague, status MUST be "INVESTIGATING" and you must ask a "follow_up_question".
      2. If status is "TRIAGED", provide clear instructions and list hardware/specialists.
      3. Always request "LIVE LOCATION" for RED or YELLOW cases if not already provided.

      STRICT JSON Format:
      {
        "triage_tier": "RED" | "YELLOW" | "GREEN",
        "status": "TRIAGED" | "INVESTIGATING",
        "brief": "One-sentence situational summary for doctors",
        "medical_intelligence": "Clinical summary",
        "hardware_needed": ["Ventilator", "Oxygen", etc.],
        "specialist_needed": ["Surgeon", "Cardiologist", etc.],
        "citizen_instructions": ["Step 1", "Step 2", "Step 3"],
        "follow_up_question": "Question if INVESTIGATING",
        "location_requested": true/false
      }
    `;

    try {
      // Map history to OpenAI format
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text || ""
        })),
        { role: "user", content: userInput }
      ];

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pulse-grid.app", // Optional for OpenRouter
          "X-Title": "PulseGrid Triage Engine" // Optional for OpenRouter
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: messages,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      // Ensure JSON is clean
      return this.cleanJSONResponse(responseText);
    } catch (error) {
      console.error("AI Triage Error (OpenRouter):", error);
      throw new Error(`Failed to triage message: ${error.message}`);
    }
  }

  /**
   * Cleans the AI response to extract only valid JSON.
   */
  cleanJSONResponse(rawText) {
    try {
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        return JSON.parse(rawText);
      }
      const jsonStr = rawText.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("JSON Parsing Error:", err);
      throw new Error("Failed to parse AI response as JSON.");
    }
  }
}

module.exports = new AIService();