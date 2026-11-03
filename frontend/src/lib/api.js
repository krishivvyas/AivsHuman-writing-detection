const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export { API_URL };

/** Turn a FastAPI error body into a readable message. */
async function readError(response) {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg).join(" ");
  } catch {
    /* body was not JSON */
  }
  return `Request failed with status ${response.status}.`;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      `Cannot reach the backend at ${API_URL}. Make sure the FastAPI server is running (see README).`
    );
  }
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export function getHealth() {
  return request("/health");
}

export function predictText(text, signal) {
  return request("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
}
