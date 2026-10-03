"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Script from "next/script";

type Grecaptcha = {
  getResponse: (widgetId?: number) => string;
  reset: (widgetId?: number) => void;
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      theme?: "light" | "dark";
    }
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
  lang?: "fr" | "en" | "es";
};

const RecaptchaV2 = forwardRef<RecaptchaV2Handle, Props>(function RecaptchaV2(
  {
    siteKey,
    theme = "light",
    className,
    lang = "fr",
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  const scriptSrc = `https://www.google.com/recaptcha/api.js?render=explicit&hl=${lang}`;

  const tryRender = () => {
    if (!containerRef.current) return;

    const g = window.grecaptcha;
    if (!g) return;

    if (widgetIdRef.current != null) return;

    widgetIdRef.current = g.render(containerRef.current, {
      sitekey: siteKey,
      theme,
    });
  };

  const onScriptLoad = () => {
    tryRender();
  };

  useEffect(() => {
    tryRender();

    const t = window.setTimeout(() => {
      tryRender();
    }, 250);

    return () => window.clearTimeout(t);
  }, [siteKey, theme, lang]);

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
    [siteKey, theme, lang]
  );

  return (
    <div className={className}>
      <Script
        key={scriptSrc}
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />

      <div ref={containerRef} />
    </div>
  );
});

export default RecaptchaV2;
