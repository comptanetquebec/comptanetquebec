"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { askAssistant, type AIResponse, type Lang } from "@/lib/assistant";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
};

const MAX_CHARS = 1500;

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

function safetyLine(lang: Lang) {
  if (lang === "en")
    return "Security: do not share SIN, passwords, card numbers, or full ID documents in chat. Use the secure portal for documents.";
  if (lang === "es")
    return "Seguridad: no compartas NAS/SIN, contraseñas, tarjetas, ni documentos de identidad completos. Usa el portal seguro.";
  return "Sécurité : ne partagez pas votre NAS, mots de passe, numéros de carte, ni documents d’identité complets dans le chat. Utilisez le portail sécurisé.";
}

function quickPrompts(lang: Lang): string[] {
  if (lang === "en") {
    return [
      "What documents are needed for an individual return (T1)?",
      "What documents are needed for self-employed?",
      "What is the difference between T1, self-employed, and corporate (T2)?",
      "How does the secure portal work?",
    ];
  }
  if (lang === "es") {
    return [
      "¿Qué documentos se necesitan para una declaración personal (T1)?",
      "¿Qué documentos se necesitan para autónomo?",
      "¿Cuál es la diferencia entre T1, autónomo y corporación (T2)?",
      "¿Cómo funciona el portal seguro?",
    ];
  }
  return [
    "Quels documents pour une déclaration T1 (particulier) ?",
    "Quels documents pour travailleur autonome ?",
    "Différence entre T1, autonome et T2 ?",
    "Comment fonctionne le portail sécurisé ?",
  ];
}

export default function AssistantChat({ lang = "fr" }: { lang?: Lang }) {
  const [messages, setMessages] = useState<Msg[]>([welcomeFor(lang)]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);

  // Reset si la langue change
  useEffect(() => {
    setMessages([welcomeFor(lang)]);
    setInput("");
    setErrorMsg(null);
    setStatus("idle");
    reqIdRef.current++;
  }, [lang]);

  const remaining = MAX_CHARS - input.length;

  const canSend = useMemo(() => {
    const t = input.trim();
    return status !== "thinking" && t.length > 0 && t.length <= MAX_CHARS;
  }, [input, status]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status, errorMsg]);

  async function onSend(textOverride?: string) {
    const raw = (textOverride ?? input).trim();
    if (!raw || status === "thinking") return;

    if (raw.length > MAX_CHARS) {
      setErrorMsg(
        lang === "fr"
          ? `Message trop long (max ${MAX_CHARS} caractères).`
          : lang === "en"
          ? `Message too long (max ${MAX_CHARS} characters).`
          : `Mensaje demasiado largo (máx ${MAX_CHARS} caracteres).`
      );
      return;
    }

    setErrorMsg(null);
    setStatus("thinking");
    setInput("");

    const myReq = ++reqIdRef.current;

    setMessages((prev) => [...prev, { id: uid(), role: "user", content: raw }]);

    try {
      const res: AIResponse = await askAssistant(raw, lang);
      if (myReq !== reqIdRef.current) return;

      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: res.content }]);
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

  function report() {
    const subject =
      lang === "fr"
        ? "Signalement — Assistant ComptaNet"
        : lang === "en"
        ? "Report — ComptaNet Assistant"
        : "Reporte — Asistente ComptaNet";

    const lastMsgs = messages.slice(-6).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const body =
      `${safetyLine(lang)}\n\n` +
      (lang === "fr"
        ? "Décrivez le problème (ex: réponse inappropriée, demande dangereuse, etc.).\n\n"
        : lang === "en"
        ? "Describe the issue (e.g., inappropriate answer, unsafe request, etc.).\n\n"
        : "Describe el problema (p. ej., respuesta inapropiada, solicitud peligrosa, etc.).\n\n") +
      lastMsgs;

    // adapte l'email si tu veux (support@..., etc.)
    window.location.href = `mailto:comptanetquebec@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Assistant ComptaNet</p>
            <p className="text-xs text-neutral-600">
              {lang === "fr"
                ? "Info générale seulement. Aucun avis personnalisé."
                : lang === "en"
                ? "General information only. No personalized advice."
                : "Solo información general. Sin asesoría personalizada."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
              onClick={copyLastAssistant}
              title={lang === "fr" ? "Copier la dernière réponse" : "Copy last answer"}
            >
              {lang === "fr" ? "Copier" : lang === "en" ? "Copy" : "Copiar"}
            </button>

            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
              onClick={report}
              title={lang === "fr" ? "Signaler" : "Report"}
            >
              {lang === "fr" ? "Signaler" : lang === "en" ? "Report" : "Reportar"}
            </button>

            <button
              type="button"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
              onClick={onReset}
            >
              {lang === "fr" ? "Nouvelle" : lang === "en" ? "New" : "Nueva"}
            </button>
          </div>
        </div>

        {/* Safety banner */}
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {safetyLine(lang)}
        </div>

        {/* Quick prompts */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts(lang).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSend(p)}
              className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-neutral-50"
              disabled={status === "thinking"}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-[420px] overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {status === "thinking" && <TypingBubble />}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {(lang === "fr" ? "Erreur : " : lang === "en" ? "Error: " : "Error: ") + errorMsg}
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
            onClick={() => onSend()}
          >
            {status === "thinking"
              ? "…"
              : lang === "fr"
              ? "Envoyer"
              : lang === "en"
              ? "Send"
              : "Enviar"}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            {lang === "fr"
              ? "Pour un avis personnalisé, il faut analyser votre situation et vos documents."
              : lang === "en"
              ? "For personalized advice, we must review your situation and documents."
              : "Para una respuesta personalizada, debemos revisar tu situación y documentos."}
          </p>

          <p className={`text-xs ${remaining < 0 ? "text-red-600" : "text-neutral-500"}`}>
            {remaining}
          </p>
        </div>
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
