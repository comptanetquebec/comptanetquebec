"use client";

import React, { useState } from "react";
import { askAssistant, type AIResponse } from "@/lib/assistant";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function AssistantChat({ lang = "fr" }: { lang?: "fr" | "en" | "es" }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        lang === "fr"
          ? "Bonjour. Posez votre question sur les impôts au Québec."
          : lang === "en"
          ? "Hello. Ask your question about Québec taxes."
          : "Hola. Haga su pregunta sobre impuestos en Québec.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg: Msg = { id: uid(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res: AIResponse = await askAssistant(input, lang);
      const botMsg: Msg = { id: uid(), role: "assistant", content: res.content };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            lang === "fr"
              ? "Erreur. Veuillez réessayer."
              : lang === "en"
              ? "Error. Please try again."
              : "Error. Intente nuevamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl rounded-xl border bg-white p-4 shadow">
      <div className="mb-4 h-80 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-black text-white ml-auto max-w-[80%]"
                : "bg-neutral-100 text-black max-w-[80%]"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder={
            lang === "fr"
              ? "Écrivez votre question..."
              : lang === "en"
              ? "Write your question..."
              : "Escriba su pregunta..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "..." : lang === "fr" ? "Envoyer" : lang === "en" ? "Send" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
