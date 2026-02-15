"use client";

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
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

const RecaptchaV2 = forwardRef<RecaptchaV2Handle, Props>(function RecaptchaV2(
  { siteKey, theme = "light", className },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  const onLoad = () => {
    if (!containerRef.current) return;
    const g = window.grecaptcha;
    if (!g) return;

    // évite un double render
    if (widgetIdRef.current != null) return;

    widgetIdRef.current = g.render(containerRef.current, {
      sitekey: siteKey,
      theme,
    });
  };

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
    []
  );

  const scriptSrc = useMemo(
    () => "https://www.google.com/recaptcha/api.js?render=explicit",
    []
  );

  return (
    <div className={className}>
      <Script src={scriptSrc} strategy="afterInteractive" onLoad={onLoad} />
      <div ref={containerRef} />
    </div>
  );
});

export default RecaptchaV2;
