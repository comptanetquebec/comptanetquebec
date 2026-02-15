"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Script from "next/script";

type Grecaptcha = {
  getResponse: (widgetId?: number) => string;
  reset: (widgetId?: number) => void;
  render: (
    container: HTMLElement,
    params: { sitekey: string; theme?: "light" | "dark" }
  ) => number;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export type RecaptchaV2Handle = {
  getToken: () => string;
  reset: () => void;
};

type Props = {
  siteKey: string;
  theme?: "light" | "dark";
  className?: string;
};

const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";

const RecaptchaV2 = forwardRef<RecaptchaV2Handle, Props>(function RecaptchaV2(
  { siteKey, theme = "light", className },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  const tryRender = () => {
    if (!containerRef.current) return;
    const g = window.grecaptcha;
    if (!g) return;

    // évite double render
    if (widgetIdRef.current != null) return;

    widgetIdRef.current = g.render(containerRef.current, {
      sitekey: siteKey,
      theme,
    });
  };

  // 1) Tentative au moment où le script se charge
  const onScriptLoad = () => {
    tryRender();
  };

  // 2) Tentative fallback (script déjà en cache / déjà injecté / onLoad pas déclenché)
  useEffect(() => {
    tryRender();

    // petit retry si grecaptcha arrive un poil après
    const t = window.setTimeout(() => {
      tryRender();
    }, 250);

    return () => window.clearTimeout(t);
    // on rerender si siteKey/theme changent
  }, [siteKey, theme]);

  useImperativeHandle(
    ref,
    () => ({
      getToken: () => {
        const g = window.grecaptcha;
        const id = widgetIdRef.current ?? undefined;
        if (!g) return "";
        return g.getResponse(id);
      },
      reset: () => {
        const g = window.grecaptcha;
        const id = widgetIdRef.current ?? undefined;
        if (!g) return;
        g.reset(id);
      },
    }),
    [siteKey, theme] // important: éviter stale closure
  );

  return (
    <div className={className}>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onLoad={onScriptLoad} />
      <div ref={containerRef} />
    </div>
  );
});

export default RecaptchaV2;
