"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { askAssistant, type AIResponse, type Lang } from "@/lib/assistant";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
};

const MAX_CHARS = 1500;
const BRAND_BLUE = "#004aad";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function welcomeFor(lang: Lang): Msg {
  return {
    id: "welcome",
    role: "assistant",
    content:
      lang === "fr"
        ? "Bonjour 👋 Je suis l’assistant de ComptaNet Québec.\nComment puis-je vous aider avec vos impôts aujourd’hui ?"
        : lang === "en"
        ? "Hi 👋 I’m the ComptaNet Québec assistant.\nHow can I help you with your taxes today?"
        : "Hola 👋 Soy el asistente de ComptaNet Québec.\n¿Cómo puedo ayudarte con tus impuestos hoy?",
  };
}

/** Micro-sécurité (court, non anxiogène) */
function microSafety(lang: Lang) {
  return lang === "fr"
    ? "Astuce : évitez d’écrire des infos sensibles (NAS, carte, mots de passe)."
    : lang === "en"
    ? "Tip: avoid sharing sensitive info (SIN, card numbers, passwords)."
    : "Consejo: evita compartir datos sensibles (NAS/SIN, tarjetas, contraseñas).";
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

function reportBody(lang: Lang, messages: Msg[]) {
  const lastMsgs = messages
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const intro =
    lang === "fr"
      ? "Décrivez le problème (ex: réponse inappropriée, demande dangereuse, etc.).\n\n"
      : lang === "en"
      ? "Describe the issue (e.g., inappropriate answer, unsafe request, etc.).\n\n"
      : "Describe el problema (p. ej., respuesta inapropiada, solicitud peligrosa, etc.).\n\n";

  return `${microSafety(lang)}\n\n${intro}${lastMsgs}`;
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

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: res.content },
      ]);
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
    const last = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.id !== "welcome");
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

    const body = reportBody(lang, messages);
    window.location.href = `mailto:comptanetquebec@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: logo + titles */}
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border bg-white">
              <Image
                src="/logo-cq.png"
                alt="ComptaNet Québec"
                fill
                sizes="36px"
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">
                Assistant ComptaNet Québec
              </p>
              <p className="truncate text-xs text-neutral-600">
                {lang === "fr"
                  ? "Info générale — aucun avis personnalisé."
                  : lang === "en"
                  ? "General info — no personalized advice."
                  : "Info general — sin asesoría personalizada."}
              </p>
              <p className="mt-1 line-clamp-1 text-[11px] text-neutral-500">
                {microSafety(lang)}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={copyLastAssistant}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              title={lang === "fr" ? "Copier la dernière réponse" : "Copy last answer"}
            >
              {lang === "fr" ? "Copier" : lang === "en" ? "Copy" : "Copiar"}
            </button>

            <button
              type="button"
              onClick={report}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              title={lang === "fr" ? "Signaler" : "Report"}
            >
              {lang === "fr" ? "Signaler" : lang === "en" ? "Report" : "Reportar"}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              {lang === "fr" ? "Nouvelle" : lang === "en" ? "New" : "Nueva"}
            </button>
          </div>
        </div>

        {/* Quick prompts (discrets) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts(lang).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSend(p)}
              disabled={status === "thinking"}
              className="rounded-full border bg-white px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages (hauteur responsive pour éviter de scroller la page) */}
      <div className="h-[320px] sm:h-[380px] lg:h-[420px] overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {status === "thinking" && <TypingBubble />}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {(lang === "fr" ? "Erreur : " : "Error: ") + errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] max-h-[140px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(0,74,173,0.18)]"
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
            disabled={!canSend}
            onClick={() => onSend()}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ backgroundColor: BRAND_BLUE }}
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
          isUser ? "text-white" : "bg-neutral-100 text-neutral-900",
        ].join(" ")}
        style={isUser ? { backgroundColor: BRAND_BLUE } : undefined}
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
