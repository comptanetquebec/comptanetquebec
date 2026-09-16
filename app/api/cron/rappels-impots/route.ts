import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }

  return value;
}

function daysSince(date: string) {
  const time = new Date(date).getTime();

  if (!Number.isFinite(time)) {
    return 0;
  }

  return Math.floor((Date.now() - time) / DAY_MS);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailContent({
  name,
  taxYear,
  reminderNumber,
}: {
  name: string;
  taxYear: number | null;
  reminderNumber: 1 | 2 | 3;
}) {
  const safeName = escapeHtml(name || "Bonjour");
  const yearText = taxYear ? ` ${taxYear}` : "";

  if (reminderNumber === 1) {
    return {
      subject: `Rappel – votre dossier d'impôt${yearText}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">ComptaNet Québec</h2>

          <p>Bonjour ${safeName},</p>

          <p>
            Petit rappel concernant votre dossier d'impôt${yearText}.
            Nous sommes toujours en attente de certains renseignements
            ou documents afin de pouvoir poursuivre votre dossier.
          </p>

          <p>
            Vous pouvez vous connecter à votre espace client ComptaNet Québec
            afin de compléter votre dossier ou d'ajouter les documents manquants.
          </p>

          <p>
            Si vous avez déjà transmis les éléments demandés récemment,
            vous pouvez ignorer ce message.
          </p>

          <p>
            Merci,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  if (reminderNumber === 2) {
    return {
      subject: `2e rappel – dossier d'impôt${yearText} incomplet`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">ComptaNet Québec</h2>

          <p>Bonjour ${safeName},</p>

          <p>
            Nous vous rappelons que votre dossier d'impôt${yearText}
            est toujours en attente.
          </p>

          <p>
            Certains renseignements ou documents sont nécessaires
            avant que nous puissions poursuivre le traitement de votre dossier.
          </p>

          <p>
            Veuillez vous connecter à votre espace client et transmettre
            les éléments manquants dès que possible.
          </p>

          <p>
            Si vous venez de les transmettre, aucune action supplémentaire
            n'est nécessaire.
          </p>

          <p>
            Merci,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  return {
    subject: `Dernier rappel – dossier d'impôt${yearText}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
        <h2 style="color:#1d4ed8">ComptaNet Québec</h2>

        <p>Bonjour ${safeName},</p>

        <p>
          Ceci est notre dernier rappel concernant votre dossier
          d'impôt${yearText}.
        </p>

        <p>
          Nous sommes toujours en attente des renseignements ou documents
          nécessaires pour poursuivre votre dossier.
        </p>

        <p>
          Sans réception des éléments manquants, votre dossier sera considéré
          comme inactif jusqu'à ce que vous nous transmettiez de nouveaux
          renseignements ou documents.
        </p>

        <p>
          Vous pourrez reprendre votre dossier par la suite en vous connectant
          à votre espace client ComptaNet Québec.
        </p>

        <p>
          Merci,<br>
          <strong>ComptaNet Québec</strong>
        </p>
      </div>
    `,
  };
}

export async function GET(request: Request) {
  try {
    /*
     * Quand on ajoutera CRON_SECRET dans Vercel,
     * Vercel pourra protéger cette route.
     *
     * Pour l'instant, si CRON_SECRET n'existe pas,
     * la route peut quand même être testée.
     */
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (cronSecret) {
      const authorization = request.headers.get("authorization");

      if (authorization !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { ok: false, error: "Non autorisé" },
          { status: 401 }
        );
      }
    }

    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = getEnv("RESEND_API_KEY");

    const fromEmail =
      process.env.FROM_EMAIL?.trim() ||
      "ComptaNet Québec <info@comptanetquebec.com>";

    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() || undefined;

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const resend = new Resend(resendApiKey);

    /*
     * On récupère uniquement les dossiers actuellement
     * en attente client.
     */
    const { data: statuses, error: statusError } =
      await supabase
        .from("dossier_statuses")
        .select(
          `
            formulaire_id,
            status,
            waiting_since,
            last_reminder_at,
            reminder_count,
            inactive_at
          `
        )
        .eq("status", "attente_client")
        .not("waiting_since", "is", null);

    if (statusError) {
      throw new Error(
        `Lecture dossier_statuses: ${statusError.message}`
      );
    }

    const results: Array<Record<string, unknown>> = [];

    for (const statusRow of statuses ?? []) {
      const formulaireId = String(
        statusRow.formulaire_id ?? ""
      );

      if (!formulaireId || !statusRow.waiting_since) {
        continue;
      }

      /*
       * Un dossier déjà déclaré inactif ne reçoit
       * plus de rappels.
       */
      if (statusRow.inactive_at) {
        continue;
      }

      const days = daysSince(statusRow.waiting_since);
      const reminderCount = Number(
        statusRow.reminder_count ?? 0
      );

      let reminderNumber: 1 | 2 | 3 | null = null;

      /*
       * IMPORTANT :
       *
       * On vérifie d'abord J+10, ensuite J+5, ensuite J+2.
       * Comme ça, si le Cron ne fonctionne pas pendant quelques jours,
       * il n'envoie jamais 3 courriels d'un coup.
       */
      if (days >= 10 && reminderCount < 3) {
        reminderNumber = 3;
      } else if (days >= 5 && reminderCount < 2) {
        reminderNumber = 2;
      } else if (days >= 2 && reminderCount < 1) {
        reminderNumber = 1;
      }

      if (!reminderNumber) {
        continue;
      }

      /*
       * On cherche les informations du client.
       *
       * Cette requête suppose que la table des formulaires
       * contient le formulaire_id et les renseignements client.
       *
       * Si ton projet utilise une vue différente, on l'ajustera
       * après le premier test sans envoyer de courriel.
       */
      const { data: formulaire, error: formError } =
        await supabase
          .from("formulaires")
          .select("*")
          .eq("id", formulaireId)
          .maybeSingle();

      if (formError) {
        results.push({
          formulaire_id: formulaireId,
          ok: false,
          error: formError.message,
        });

        continue;
      }

      if (!formulaire) {
        results.push({
          formulaire_id: formulaireId,
          ok: false,
          error: "Formulaire introuvable",
        });

        continue;
      }

      const clientEmail = String(
        formulaire.email ??
          formulaire.client_email ??
          ""
      ).trim();

      const clientName = String(
        formulaire.nom ??
          formulaire.client_name ??
          formulaire.name ??
          "Client"
      ).trim();

      const taxYearRaw =
        formulaire.tax_year ??
        formulaire.annee ??
        null;

      const taxYear =
        taxYearRaw != null &&
        Number.isFinite(Number(taxYearRaw))
          ? Number(taxYearRaw)
          : null;

      if (!clientEmail) {
        results.push({
          formulaire_id: formulaireId,
          ok: false,
          error: "Aucun courriel client",
        });

        continue;
      }

      const message = emailContent({
        name: clientName,
        taxYear,
        reminderNumber,
      });

      const { data: sent, error: sendError } =
        await resend.emails.send({
          from: fromEmail,
          to: clientEmail,
          replyTo,
          subject: message.subject,
          html: message.html,
        });

      if (sendError) {
        results.push({
          formulaire_id: formulaireId,
          ok: false,
          reminder: reminderNumber,
          error: sendError.message,
        });

        continue;
      }

      const now = new Date().toISOString();

      const updateData: {
        reminder_count: number;
        last_reminder_at: string;
        inactive_at?: string;
      } = {
        reminder_count: reminderNumber,
        last_reminder_at: now,
      };

      /*
       * Après le dernier rappel, on garde le dossier,
       * mais on le considère inactif.
       *
       * On NE SUPPRIME RIEN.
       */
      if (reminderNumber === 3) {
        updateData.inactive_at = now;
      }

      const { error: updateError } =
        await supabase
          .from("dossier_statuses")
          .update(updateData)
          .eq("formulaire_id", formulaireId);

      results.push({
        formulaire_id: formulaireId,
        ok: !updateError,
        reminder: reminderNumber,
        email_id: sent?.id ?? null,
        inactive: reminderNumber === 3,
        error: updateError?.message ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      checked: statuses?.length ?? 0,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Rappels impôts:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
