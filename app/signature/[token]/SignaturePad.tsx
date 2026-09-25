"use client";

import { useRef, useState } from "react";

type Props = {
  token: string;
  documentId: string;
  documentName: string;
};

export default function SignaturePad({
  token,
  documentId,
  documentName,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);

  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function pointFromEvent(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        canvas.width,
      y:
        ((event.clientY - rect.top) / rect.height) *
        canvas.height,
    };
  }

  function startDrawing(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (saved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const context = canvas.getContext("2d");
    if (!context) return;

    const point = pointFromEvent(event);

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    drawingRef.current = true;
  }

  function draw(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!drawingRef.current || saved) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const point = pointFromEvent(event);

    context.lineTo(point.x, point.y);
    context.stroke();

    hasInkRef.current = true;
  }

  function stopDrawing(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!drawingRef.current) return;

    event.preventDefault();

    const canvas = canvasRef.current;

    if (
      canvas &&
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }

    drawingRef.current = false;
  }

  function clear() {
    if (saved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    hasInkRef.current = false;
    setMessage(null);
  }

  async function saveSignature() {
    if (saving || saved) return;

    if (!hasInkRef.current) {
      setMessage(
        "❌ Signez dans la zone blanche avant de continuer."
      );
      return;
    }

    if (!consent) {
      setMessage(
        "❌ Vous devez confirmer que cette signature est la vôtre."
      );
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    setMessage(null);

    try {
      const signatureDataUrl =
        canvas.toDataURL("image/png");

      const response = await fetch(
        "/api/signatures/capture",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            documentId,
            signatureDataUrl,
            consent: true,
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Impossible d’enregistrer la signature."
        );
      }

      setSaved(true);
      setMessage("✅ Signature enregistrée.");
    } catch (error) {
      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : "Erreur d’enregistrement."
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="font-semibold text-slate-900">
        Signez ce document
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Sur un téléphone ou une tablette, signez avec
        votre doigt. Sur un ordinateur, utilisez la souris
        ou le pavé tactile.
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={(event) => {
            if (drawingRef.current) {
              stopDrawing(event);
            }
          }}
          className={`block h-44 w-full ${
            saved
              ? "cursor-default opacity-70"
              : "cursor-crosshair"
          }`}
          style={{
            touchAction: "none",
          }}
          aria-label={`Zone de signature pour ${documentName}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={saving || saved}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Effacer
        </button>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consent}
          disabled={saved}
          onChange={(event) =>
            setConsent(event.target.checked)
          }
          className="mt-1 h-4 w-4"
        />

        <span>
          Je confirme que cette signature est la mienne
          et j’autorise son utilisation pour signer ce
          document.
        </span>
      </label>

      <button
        type="button"
        onClick={() => void saveSignature()}
        disabled={saving || saved}
        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saved
          ? "✓ Signature enregistrée"
          : saving
          ? "Enregistrement…"
          : "Confirmer la signature"}
      </button>

      {message && (
        <div
          className={`mt-3 text-sm font-semibold ${
            message.startsWith("✅")
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
