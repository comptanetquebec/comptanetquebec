"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { askAssistant, type AIResponse, type Lang } from "@/lib/assistant";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
  actions?: string[];
};

const MAX_CHARS = 1500;
const BRAND_BLUE = "#004aad";

const ACTION_LINKS: Record<string, string> = {
  "Ouvrir un dossier": "/espace-client",
  "Open a file": "/espace-client",
  "Abrir expediente": "/espace-client",
  "Portail sécurisé": "/espace-client",
  "Secure portal": "/espace-client",
  "Portal seguro": "/espace-client",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function t(lang: Lang, fr: string, en: string, es: string): string {
  if (lang === "en") return en;
  if (lang === "es") return es;
  return fr;
}

function welcomeFor(lang: Lang): Msg {
  return {
    id: "welcome",
    role: "assistant",
    content: t(
      lang,
      "Bonjour 👋 Je suis l’assistant de ComptaNet Québec.\nJe peux vous orienter rapidement selon votre situation.",
      "Hi 👋 I’m the ComptaNet Québec assistant.\nI can quickly guide you based on your situation.",
      "Hola 👋 Soy el asistente de ComptaNet Québec.\nPuedo orientarte rápidamente según tu situación."
    ),
    actions:
      lang === "fr"
        ? ["T1", "Travailleur autonome", "T2", "Ouvrir un dossier"]
        : lang === "en"
        ? ["T1", "Self-employed", "T2", "Open a file"]
        : ["T1", "Autónomo", "T2", "Abrir expediente"],
  };
}

function microSafety(lang: Lang) {
  return t(
    lang,
    "Astuce : évitez d’écrire des infos sensibles (NAS, carte, mots de passe).",
    "Tip: avoid sharing sensitive info (SIN, card numbers, passwords).",
    "Consejo: evita compartir datos sensibles (NAS/SIN, tarjetas, contraseñas)."
  );
}

function quickPrompts(lang: Lang): string[] {
  if (lang === "en") {
    return [
      "What documents are needed for a T1?",
      "What documents are needed for self-employed?",
      "Difference between T1, self-employed, and T2?",
      "How does the secure portal work?",
    ];
  }

  if (lang === "es") {
    return [
      "¿Qué documentos se necesitan para una T1?",
      "¿Qué documentos se necesitan para autónomo?",
      "¿Diferencia entre T1, autónomo y T2?",
      "¿Cómo funciona el portal seguro?",
    ];
  }

  return [
    "Quels documents pour une T1 ?",
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

  const intro = t(
    lang,
    "Décrivez le problème (ex: réponse inappropriée, erreur, etc.).\n\n",
    "Describe the issue (e.g., inappropriate answer, error, etc.).\n\n",
    "Describa el problema (p. ej., respuesta inapropiada, error, etc.).\n\n"
  );

  return `${microSafety(lang)}\n\n${intro}${lastMsgs}`;
}

export default function AssistantChat({ lang = "fr" }: { lang?: Lang }) {
  const [messages, setMessages] = useState<Msg[]>([welcomeFor(lang)]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    setMessages([welcomeFor(lang)]);
    setInput("");
    setErrorMsg(null);
    setStatus("idle");
    reqIdRef.current++;
  }, [lang]);

  const remaining = MAX_CHARS - input.length;

  const canSend = useMemo(() => {
    const text = input.trim();
    return status !== "thinking" && text.length > 0 && text.length <= MAX_CHARS;
  }, [input, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status, errorMsg]);

  async function onSend(textOverride?: string) {
    const raw = (textOverride ?? input).trim();
    if (!raw || status === "thinking") return;

    if (raw.length > MAX_CHARS) {
      setErrorMsg(
        t(
          lang,
          `Message trop long (max ${MAX_CHARS} caractères).`,
          `Message too long (max ${MAX_CHARS} characters).`,
          `Mensaje demasiado largo (máx ${MAX_CHARS} caracteres).`
        )
      );
      return;
    }

    setErrorMsg(null);
    setStatus("thinking");
    setInput("");

    const myReq = ++reqIdRef.current;

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: raw },
    ]);

    try {
      const res: AIResponse = await askAssistant(raw, lang);

      if (myReq !== reqIdRef.current) return;

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: res.content,
          actions: res.next_actions,
        },
      ]);
    } catch (e: unknown) {
      if (myReq !== reqIdRef.current) return;

      const fallback = t(
        lang,
        "Erreur inattendue.",
        "Unexpected error.",
        "Error inesperado."
      );

      const msg = e instanceof Error ? e.message : fallback;
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
    const subject = t(
      lang,
      "Signalement — Assistant ComptaNet",
      "Report — ComptaNet Assistant",
      "Reporte — Asistente ComptaNet"
    );

    const body = reportBody(lang, messages);
    window.location.href = `mailto:comptanetquebec@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border bg-white">
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
                {t(
                  lang,
                  "Info générale — aucun avis personnalisé.",
                  "General info — no personalized advice.",
                  "Información general — sin asesoría personalizada."
                )}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500 sm:line-clamp-1">
                {microSafety(lang)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={copyLastAssistant}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              title={t(
                lang,
                "Copier la dernière réponse",
                "Copy last answer",
                "Copiar la última respuesta"
              )}
            >
              {t(lang, "Copier", "Copy", "Copiar")}
            </button>

            <button
              type="button"
              onClick={report}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              title={t(lang, "Signaler", "Report", "Reportar")}
            >
              {t(lang, "Signaler", "Report", "Reportar")}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              {t(lang, "Nouvelle", "New", "Nueva")}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts(lang).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSend(prompt)}
              disabled={status === "thinking"}
              className="rounded-full border bg-white px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] overflow-y-auto px-3 py-4 sm:h-[380px] sm:px-4 lg:h-[420px]">
        <div className="space-y-3">
          {messages.map((m) => (
            <Bubble
              key={m.id}
              role={m.role}
              content={m.content}
              actions={m.actions}
              onAction={onSend}
            />
          ))}

          {status === "thinking" && <TypingBubble />}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {t(lang, "Erreur : ", "Error: ", "Error: ") + errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t p-3 sm:p-4">
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] max-h-[140px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(0,74,173,0.18)]"
            placeholder={t(
              lang,
              "Écrivez votre question… (Entrée pour envoyer)",
              "Write your question… (Enter to send)",
              "Escriba su pregunta… (Enter para enviar)"
            )}
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
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            {status === "thinking"
              ? "…"
              : t(lang, "Envoyer", "Send", "Enviar")}
          </button>
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="max-w-[80%] text-xs text-neutral-500">
            {t(
              lang,
              "Pour un avis personnalisé, il faut analyser votre situation et vos documents.",
              "For personalized advice, we must review your situation and documents.",
              "Para una respuesta personalizada, debemos revisar su situación y sus documentos."
            )}
          </p>

          <p className={`shrink-0 text-xs ${remaining < 0 ? "text-red-600" : "text-neutral-500"}`}>
            {remaining}
          </p>
        </div>
      </div>
    </section>
  );
}

function Bubble({
  role,
  content,
  actions,
  onAction,
}: {
  role: Role;
  content: string;
  actions?: string[];
  onAction?: (a: string) => void;
}) {
  const isUser = role === "user";

  const linkActions = (actions ?? []).filter((action) => ACTION_LINKS[action]);
  const buttonActions = (actions ?? []).filter((action) => !ACTION_LINKS[action]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[85%]",
          isUser ? "text-white" : "bg-neutral-100 text-neutral-900",
        ].join(" ")}
        style={isUser ? { backgroundColor: BRAND_BLUE } : undefined}
      >
        {content}

        {!!buttonActions.length && (
          <div className="mt-3 flex flex-wrap gap-2">
            {buttonActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {!!linkActions.length && (
          <div className="mt-3 space-y-2">
            {linkActions.map((action) => {
              const href = ACTION_LINKS[action];

              return (
                <a
                  key={action}
                  href={href}
                  className="block w-full rounded-xl px-4 py-2 text-center text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  {action}
                </a>
              );
            })}
          </div>
        )}
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
