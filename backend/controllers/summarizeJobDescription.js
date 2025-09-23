require("dotenv").config(); // Load .env file
const axios = require("axios");

// Configuration from .env
const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_MODEL = process.env.GROQ_MODEL;
const KEYWORD_EXTRACTION_PROMPT = process.env.KEYWORD_EXTRACTION_PROMPT;
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS, 10);
const TEMPERATURE = parseFloat(process.env.TEMPERATURE);

// Validate env vars
if (!GROQ_API_URL || !GROQ_MODEL || !KEYWORD_EXTRACTION_PROMPT || isNaN(MAX_TOKENS) || isNaN(TEMPERATURE) || !process.env.GROQ_API_KEY) {
  throw new Error("Missing or invalid environment variables. Check .env file.");
}

const summarizeJobDescription = async (req, res) => {
  // Validate input
  const { input } = req.body;
  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return res.status(400).json({ error: "Input (URL or job description) is required" });
  }
  const trimmedInput = input.trim();

  // Ensure API key is available
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: Missing Groq API key" });
  }

  try {
    // Make request to Groq API with input (model auto-detects URL vs. text)
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: KEYWORD_EXTRACTION_PROMPT },
          { role: "user", content: trimmedInput }
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        response_format: { type: "json_object" }, // Ensures JSON output
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Extract and parse JSON response
    const rawContent = response.data?.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
      throw new Error("Invalid response from Groq API");
    }

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      // Fallback: If JSON fails, extract keywords manually from content
      console.warn("JSON parse failed; using fallback extraction");
      const keywords = rawContent.split(/[\s,.;]+/).filter(word => word.length > 3).slice(0, 20);
      result = { keywords, source: "Direct text" };
    }

    if (!result.keywords || !Array.isArray(result.keywords) || !result.source) {
      throw new Error("Invalid response format from Groq API (missing keywords or source)");
    }

    // Validate keyword count (10-20)
    if (result.keywords.length < 10 || result.keywords.length > 20) {
      console.warn("Keyword count outside recommended range:", result.keywords.length);
    }

    // Return successful response
    res.status(200).json(result);
  } catch (error) {
    // Enhanced logging for debugging
    console.error("Keyword extraction error:", {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data || "No additional details",
      input: trimmedInput.substring(0, 100) + "...",
    });

    // Handle specific Groq API errors
    if (error.response?.status === 400 && error.response?.data?.error?.code === 'model_decommissioned') {
      return res.status(500).json({ error: "Model deprecated. Please check Groq docs for updates: https://console.groq.com/docs/deprecations" });
    }
    if (error.response?.status === 404 && error.response?.data?.error?.code === 'model_not_found') {
      return res.status(500).json({ error: "Model not available. Please check Groq console for access." });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    }
    if (error.response?.status === 401) {
      return res.status(500).json({ error: "Server configuration error: Invalid Groq API key" });
    }

    // Generic error response
    res.status(500).json({ error: "Failed to extract keywords from job input" });
  }
};

module.exports = { summarizeJobDescription };