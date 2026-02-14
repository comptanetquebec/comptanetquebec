"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { askAssistant, type AIResponse, type Lang } from "@/lib/assistant";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function welcomeFor(lang: Lang): Msg {
  return {
    id: "welcome",
    role: "assistant",
    content:
      lang === "fr"
        ? "Bonjour 👋 Posez votre question sur l’impôt au Québec."
        : lang === "en"
        ? "Hi 👋 Ask your question about Québec taxes."
        : "Hola 👋 Haz tu pregunta sobre impuestos en Québec.",
  };
}

export default function AssistantChat({ lang = "fr" }: { lang?: Lang }) {
  const [messages, setMessages] = useState<Msg[]>([welcomeFor(lang)]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);

  // Si la langue change, on reset proprement (optionnel)
  useEffect(() => {
    setMessages([welcomeFor(lang)]);
    setInput("");
    setErrorMsg(null);
    setStatus("idle");
    reqIdRef.current++;
  }, [lang]);

  const canSend = useMemo(() => input.trim().length > 0 && status !== "thinking", [input, status]);

  // Auto-scroll dès qu’on ajoute un message / change status
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status, errorMsg]);

  async function onSend() {
    const text = input.trim();
    if (!text || status === "thinking") return;

    setErrorMsg(null);
    setStatus("thinking");
    setInput("");

    const myReq = ++reqIdRef.current;

    // add user msg
    const userMsg: Msg = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res: AIResponse = await askAssistant(text, lang);

      if (myReq !== reqIdRef.current) return; // ignore old request

      const assistantMsg: Msg = { id: uid(), role: "assistant", content: res.content };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: unknown) {
      if (myReq !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : "Erreur inattendue";
      setErrorMsg(msg);
    } finally {
      if (myReq === reqIdRef.current) setStatus("idle");
    }
  }

  function onReset() {
    reqIdRef.current++;
    setMessages([welcomeFor(lang)]);
    setInput("");
    setErrorMsg(null);
    setStatus("idle");
  }

  function copyLastAssistant() {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "welcome");
    if (!last) return;
    navigator.clipboard?.writeText(last.content).catch(() => {});
  }

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Assistant ComptaNet</p>
            <p className="text-xs text-neutral-600">
              Info générale seulement. Aucun avis personnalisé.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
              onClick={copyLastAssistant}
              title="Copier la dernière réponse"
            >
              Copier
            </button>

            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
              onClick={onReset}
            >
              Nouvelle
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={wrapRef} className="h-[420px] overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {status === "thinking" && <TypingBubble />}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {lang === "fr" ? "Erreur : " : lang === "en" ? "Error: " : "Error: "}
              {errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] max-h-[140px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder={
              lang === "fr"
                ? "Écrivez votre question… (Entrée pour envoyer)"
                : lang === "en"
                ? "Write your question… (Enter to send)"
                : "Escriba su pregunta… (Enter para enviar)"
            }
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />

          <button
            type="button"
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            disabled={!canSend}
            onClick={onSend}
          >
            {status === "thinking"
              ? lang === "fr"
                ? "…"
                : "…"
              : lang === "fr"
              ? "Envoyer"
              : lang === "en"
              ? "Send"
              : "Enviar"}
          </button>
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {lang === "fr"
            ? "Pour un avis personnalisé, il faut analyser votre situation et vos documents."
            : lang === "en"
            ? "For personalized advice, we must review your situation and documents."
            : "Para una respuesta personalizada, debemos revisar tu situación y documentos."}
        </p>
      </div>
    </section>
  );
}

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-black text-white" : "bg-neutral-100 text-neutral-900",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
        </span>
      </div>
    </div>
  );
}
