/**
 * PulseGrid Triage & Readiness Engine
 * Converts raw WhatsApp text into actionable medical intelligence using OpenRouter (Gemini 1.5 Flash).
 */
class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.modelId = "google/gemini-3-flash-preview";
  }

  async triageMessage(userInput, history = []) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error("Invalid input: message text is required.");
    }

    const systemPrompt = `
      System Role & Persona:
      You are the PulseGrid Triage & Readiness Engine operating strictly in Lagos, Nigeria. Your goal is to convert raw, panicked citizen text into medical intelligence.
      You must act with regional awareness. NEVER suggest calling 911. If referring to external emergency numbers, use the Lagos State Toll-Free Emergency numbers: 112 or 767.

      Triage Logic:
      - RED (Immediate): Life-threatening (e.g., unconscious, heavy bleeding, heart attack).
      - YELLOW (Urgent): Serious but stable (e.g., fractures, high fever, moderate pain).
      - GREEN (Non-Urgent): Minor (e.g., flu, small cuts).

      Rules:
      1. If the situation is vague, status MUST be "INVESTIGATING" and you must ask a "follow_up_question".
      2. If status is "TRIAGED", provide clear instructions and list hardware/specialists.
      3. Always request "LIVE LOCATION" for RED or YELLOW cases if not already provided.
      4. Remember, NEVER suggest 911 in any instructions.

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
          temperature: 0, // Lower variance forcibly speeds up token generation
          provider: { sort: "throughput" }, // OpenRouter native routing optimization
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
   * Transcribes raw audio via OpenRouter Multi-modal support.
   */
  async transcribeAudio(base64Audio, mimeType) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pulse-grid.app",
          "X-Title": "PulseGrid Triage Engine"
        },
        body: JSON.stringify({
          model: this.modelId,
          temperature: 0,
          provider: { sort: "throughput" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Please carefully transcribe this emergency voice note to text. Output ONLY the raw transcription." },
                {
                  type: "image_url", // OpenRouter multimodal parser hook
                  image_url: { url: `data:${mimeType};base64,${base64Audio}` }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return (data.choices && data.choices[0] && data.choices[0].message.content) 
        ? data.choices[0].message.content.trim() 
        : "[Voice note transcribed as empty by OpenRouter]";
    } catch (error) {
      console.error("OpenRouter Audio Transcription Error:", error);
      throw error;
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

  /**
   * Generates a conversational update for the patient based on hospital actions or messages.
   */
  async generatePatientUpdate(dashboardUpdate, transcript) {
    try {
      const prompt = `
      System Role: You are the PulseGrid AI Dispatch Communicator operating out of Lagos, Nigeria. Do NOT use American terminology like 911 (use 112 or 767 if absolutely necessary).
      Context: Here is the raw WhatsApp transcript of an ongoing emergency:
      ${transcript}

      The hospital dispatcher has just triggered the following update/action regarding this case:
      "${dashboardUpdate}"

      Task: Draft a highly professional, reassuring, and clear WhatsApp message directly to the patient communicating this update. Provide clear instructions if implied by the update.
      Output ONLY the raw formatted text message. No JSON, no explanations.
      `;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pulse-grid.app",
          "X-Title": "PulseGrid Triage Engine"
        },
        body: JSON.stringify({
          model: this.modelId,
          temperature: 0,
          provider: { sort: "throughput" },
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter Error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || dashboardUpdate;
    } catch (error) {
      console.error("AI Communication Error:", error);
      return `Update from LASUTH: ${dashboardUpdate}`; // Fallback to raw text
    }
  }
}

module.exports = new AIService();