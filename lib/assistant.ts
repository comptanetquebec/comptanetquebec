export type Lang = "fr" | "en" | "es";

export type AIResponse = {
  content: string;
  next_actions?: string[];
  tags?: string[];
};

type AssistantApiResponse = {
  ok?: boolean;
  content?: string;
  next_actions?: string[];
  tags?: string[];
  error?: string;
};

function normalizeLang(lang?: string): Lang {
  if (lang === "en") return "en";
  if (lang === "es") return "es";
  return "fr";
}

function defaultErrorMessage(lang: Lang): string {
  if (lang === "en") return "Assistant error";
  if (lang === "es") return "Error del asistente";
  return "Erreur assistant";
}

export async function askAssistant(
  message: string,
  lang: Lang = "fr"
): Promise<AIResponse> {
  const currentLang = normalizeLang(lang);

  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      message,
      lang: currentLang,
    }),
  });

  let data: AssistantApiResponse;

  try {
    data = (await res.json()) as AssistantApiResponse;
  } catch {
    throw new Error(defaultErrorMessage(currentLang));
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || defaultErrorMessage(currentLang));
  }

  return {
    content: typeof data.content === "string" ? data.content : "",
    next_actions: Array.isArray(data.next_actions) ? data.next_actions : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}
