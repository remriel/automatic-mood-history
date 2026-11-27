// Provider IDs are persisted in settings and history. Hosts and credential names
// are fixed here, so synced settings cannot redirect journal text or credentials.
const PROVIDERS = new Map([
  ["groq", { name: "Groq", model: "openai/gpt-oss-20b", env: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions" }],
  ["openai", { name: "OpenAI", model: "gpt-5.4-mini", env: "OPENAI_API_KEY", url: "https://api.openai.com/v1/chat/completions" }],
  ["anthropic", { name: "Anthropic Claude", model: "claude-haiku-5-5", env: "ANTHROPIC_API_KEY", url: "https://api.anthropic.com/v1/messages" }],
  ["gemini", { name: "Google Gemini", model: "gemini-3.5-flash-lite", env: "GEMINI_API_KEY", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" }],
  ["deepseek", { name: "DeepSeek", model: "deepseek-flash", env: "DEEPSEEK_API_KEY", url: "https://api.deepseek.com/chat/completions" }]
]);

function providerRequest(id, key, payload) {
  const { url } = PROVIDERS.get(id);
  const headers = { "Content-Type": "application/json" };
  let body;
  if (id === "anthropic") {
    headers["x-api-key"] = key;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model: payload.model,
      max_tokens: payload.max_completion_tokens,
      system: payload.messages[0].content,
      messages: payload.messages.slice(1)
    };
    if (payload.response_format) {
      // Claude accepts a subset of JSON Schema. The prompt and local validator
      // still enforce scoring bounds and the permitted list and string lengths.
      const unsupported = new Set(["minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"]);
      const schema = JSON.parse(JSON.stringify(payload.response_format.json_schema.schema,
        (key, value) => unsupported.has(key) ? undefined : value));
      body.output_config = { format: { type: "json_schema", schema } };
    }
  } else {
    headers.Authorization = `Bearer ${key}`;
    body = { ...payload };
    if (id === "openai") body.store = false;
    if (id === "deepseek" || id === "gemini") {
      body.max_tokens = body.max_completion_tokens;
      delete body.max_completion_tokens;
    }
  }
  return { url, headers, method: "POST", body: JSON.stringify(body), throw: false };
}

function providerResponse(id, json) {
  if (id !== "anthropic") return json;
  const text = Array.isArray(json?.content)
    ? json.content.filter(block => block?.type === "text").map(block => block.text).join("")
    : "";
  return { choices: [{
    finish_reason: json?.stop_reason === "max_tokens" ? "length" : json?.stop_reason,
    message: { content: text }
  }] };
}

module.exports = { PROVIDERS, providerRequest, providerResponse };
