"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type Txt = {
  brandSub: string;
  title: string;
  intro: string;
  password: string;
  confirmPassword: string;
  hint: string;
  button: string;
  loading: string;
  mismatch: string;
  tooShort: string;
  success: string;
  error: string;
  login: string;
  showPassword: string;
  hidePassword: string;
};

const TXT: Record<Lang, Txt> = {
  fr: {
    brandSub: "Portail sécurisé",
    title: "Nouveau mot de passe",
    intro:
      "Choisissez un nouveau mot de passe pour votre compte ComptaNet Québec.",
    password: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe",
    hint: "Minimum 8 caractères",
    button: "Enregistrer le nouveau mot de passe",
    loading: "Enregistrement…",
    mismatch: "Les mots de passe ne correspondent pas.",
    tooShort:
      "Votre mot de passe doit contenir au moins 8 caractères.",
    success:
      "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.",
    error:
      "Impossible de modifier le mot de passe. Le lien est peut-être expiré. Demandez un nouveau courriel de réinitialisation.",
    login: "Retour à la connexion",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
  },

  en: {
    brandSub: "Secure portal",
    title: "New password",
    intro:
      "Choose a new password for your ComptaNet Québec account.",
    password: "New password",
    confirmPassword: "Confirm new password",
    hint: "Minimum 8 characters",
    button: "Save new password",
    loading: "Saving…",
    mismatch: "Passwords do not match.",
    tooShort:
      "Your password must contain at least 8 characters.",
    success:
      "Your password has been changed. You can now log in.",
    error:
      "Unable to change your password. The link may have expired. Request a new reset email.",
    login: "Back to login",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },

  es: {
    brandSub: "Portal seguro",
    title: "Nueva contraseña",
    intro:
      "Elige una nueva contraseña para tu cuenta de ComptaNet Québec.",
    password: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    hint: "Mínimo 8 caracteres",
    button: "Guardar nueva contraseña",
    loading: "Guardando…",
    mismatch: "Las contraseñas no coinciden.",
    tooShort:
      "La contraseña debe contener al menos 8 caracteres.",
    success:
      "Tu contraseña ha sido modificada. Ya puedes iniciar sesión.",
    error:
      "No se pudo modificar la contraseña. Es posible que el enlace haya caducado. Solicita un nuevo correo de restablecimiento.",
    login: "Volver al inicio de sesión",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
  },
};

function normalizeLang(value?: string | null): Lang {
  if (value === "en" || value === "es") {
    return value;
  }

  return "fr";
}

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = useMemo(
    () => normalizeLang(searchParams.get("lang")),
    [searchParams]
  );

  const t = TXT[lang];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage(t.tooShort);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.mismatch);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(t.error);
      return;
    }

    setSuccess(true);
    setMessage(t.success);

    setTimeout(() => {
      router.replace(`/espace-client?lang=${lang}`);
    }, 1800);
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <header style={headerStyle}>
          <Image
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            width={42}
            height={42}
            priority
          />

          <div>
            <strong
              style={{
                display: "block",
                fontSize: "17px",
                color: "#101828",
              }}
            >
              ComptaNet Québec
            </strong>

            <span
              style={{
                color: "#667085",
                fontSize: "13px",
              }}
            >
              {t.brandSub}
            </span>
          </div>
        </header>

        <h1 style={titleStyle}>{t.title}</h1>

        <p style={introStyle}>{t.intro}</p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            {t.password}
          </label>

          <div style={passwordWrapperStyle}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              style={passwordInputStyle}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              title={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              style={eyeButtonStyle}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          <div style={hintStyle}>
            {t.hint}
          </div>

          <label style={labelStyle}>
            {t.confirmPassword}
          </label>

          <div style={passwordWrapperStyle}>
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              style={passwordInputStyle}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              aria-label={
                showConfirmPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              title={
                showConfirmPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              style={eyeButtonStyle}
            >
              <EyeIcon open={showConfirmPassword} />
            </button>
          </div>

          {message && (
            <div
              role="status"
              style={{
                ...messageStyle,
                background: success
                  ? "#ecfdf3"
                  : "#fff1f2",
                borderColor: success
                  ? "#a6f4c5"
                  : "#fecdd3",
                color: success
                  ? "#067647"
                  : "#b42318",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            style={{
              ...primaryButtonStyle,
              opacity:
                loading || success ? 0.7 : 1,
              cursor:
                loading || success
                  ? "default"
                  : "pointer",
            }}
          >
            {loading ? t.loading : t.button}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/espace-client?lang=${lang}`
            )
          }
          style={backButtonStyle}
        >
          ← {t.login}
        </button>
      </div>
    </main>
  );
}

function EyeIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle
            cx="12"
            cy="12"
            r="3"
          />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16.3 16.3 0 0 1-2.1 2.9" />
          <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.1-.8" />
        </>
      )}
    </svg>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f8fc",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "60px 20px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "470px",
  background: "#ffffff",
  padding: "36px",
  borderRadius: "20px",
  border: "1px solid #e8edf3",
  boxShadow:
    "0 16px 48px rgba(15, 23, 42, 0.08)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "30px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "32px",
  color: "#101828",
};

const introStyle: React.CSSProperties = {
  color: "#667085",
  lineHeight: "1.6",
  marginBottom: "28px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "700",
  fontSize: "14px",
  color: "#344054",
};

const passwordWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  marginBottom: "7px",
};

const passwordInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "52px",
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "0 52px 0 14px",
  fontSize: "16px",
  color: "#101828",
  background: "#ffffff",
  outline: "none",
};

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "10px",
  transform: "translateY(-50%)",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "#667085",
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  color: "#98a2b3",
  fontSize: "12px",
  marginBottom: "20px",
};

const messageStyle: React.CSSProperties = {
  padding: "13px 14px",
  margin: "18px 0",
  border: "1px solid",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: "1.5",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "52px",
  border: "none",
  borderRadius: "12px",
  background: "#0057b8",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "800",
};

const backButtonStyle: React.CSSProperties = {
  display: "block",
  margin: "24px auto 0",
  border: "none",
  background: "transparent",
  color: "#0057b8",
  fontWeight: "700",
  cursor: "pointer",
};
