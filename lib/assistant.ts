export type Lang = "fr" | "en" | "es";

export type AIResponse = {
  content: string;
  next_actions?: string[];
  tags?: string[];
};

export async function askAssistant(message: string, lang: Lang = "fr"): Promise<AIResponse> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, lang }),
  });

  const data = (await res.json()) as { ok?: boolean; content?: string; error?: string };

  if (!res.ok || !data.ok) throw new Error(data.error || "Erreur assistant");
  return { content: data.content ?? "" };
}
