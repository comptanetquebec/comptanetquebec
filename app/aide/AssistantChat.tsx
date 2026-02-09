"use client";

import React, { useMemo, useRef, useState } from "react";
import { askAssistantMock, type AIResponse } from "./engine";

type Role = "user" | "assistant";

type Msg = {
  id: string;
  role: Role;
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour. Je peux répondre à des questions générales sur le processus, les documents à fournir et les types de déclarations. Dites-moi ce que vous cherchez.",
};

export default function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => {
    const t = input.trim();
    return status === "idle" && t.length > 0;
  }, [input, status]);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function onSend() {
    const text = input.trim();
    if (!text || status !== "idle") return;

    setErrorMsg(null);
    setStatus("thinking");
    setInput("");

    const userMsg: Msg = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res: AIResponse = await askAssistantMock(text);

      const assistantMsg: Msg = {
        id: uid(),
        role: "assistant",
        content: formatResponse(res),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus("idle");
      scrollToBottom();
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      // repasse en idle même si erreur, pour ne pas bloquer
      setStatus("idle");
      scrollToBottom();
    }
  }

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Chat d’aide (phase 1)</p>
            <p className="text-xs text-neutral-600">
              Réponses générales, sans accès à vos données.
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
            onClick={() => setMessages([WELCOME])}
          >
            Nouvelle conversation
          </button>
        </div>
      </div>

      <div className="h-[420px] overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {status === "thinking" && (
            <Bubble role="assistant" content="Je regarde ça…" />
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder="Écrivez votre question…"
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
            Envoyer
          </button>
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          Pour un avis personnalisé, il faut analyser votre situation et vos documents.
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
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-black text-white"
            : "bg-neutral-100 text-neutral-900",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}

function formatResponse(res: AIResponse): string {
  const parts: string[] = [];
  parts.push(res.content.trim());

  if (res.next_actions?.length) {
    parts.push("\nProchaines étapes possibles :");
    for (const a of res.next_actions) parts.push(`- ${a}`);
  }

  if (res.tags?.length) {
    parts.push(`\nMots-clés : ${res.tags.join(", ")}`);
  }

  return parts.join("\n");
}
