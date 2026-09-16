import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type Lang = "fr" | "en" | "es";
type ReminderNumber = 1 | 2 | 3;

function getEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }

  return value;
}

function normalizeLang(value: unknown): Lang {
  const lang = String(value ?? "")
    .trim()
    .toLowerCase();

  if (lang === "en") return "en";
  if (lang === "es") return "es";

  return "fr";
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

function getClientName(formulaire: Record<string, unknown>) {
  const prenom = String(
    formulaire.prenom ??
      formulaire.first_name ??
      ""
  ).trim();

  const nom = String(
    formulaire.nom ??
      formulaire.last_name ??
      formulaire.client_name ??
      formulaire.name ??
      ""
  ).trim();

  const fullName = `${prenom} ${nom}`.trim();

  return fullName || "Client";
}

function getClientEmail(formulaire: Record<string, unknown>) {
  return String(
    formulaire.email ??
      formulaire.courriel ??
      formulaire.client_email ??
      ""
  ).trim();
}

function getTaxYear(formulaire: Record<string, unknown>) {
  const raw =
    formulaire.tax_year ??
    formulaire.annee ??
    formulaire.annee_imposition ??
    null;

  if (raw == null) {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}

function emailContent({
  lang,
  name,
  taxYear,
  reminderNumber,
}: {
  lang: Lang;
  name: string;
  taxYear: number | null;
  reminderNumber: ReminderNumber;
}) {
  const safeName = escapeHtml(name);
  const year = taxYear ? ` ${taxYear}` : "";

  /*
   * =========================
   * FRANÇAIS
   * =========================
   */
  if (lang === "fr") {
    if (reminderNumber === 1) {
      return {
        subject: `Rappel – votre dossier d'impôt${year}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
            <h2 style="color:#1d4ed8">
              ComptaNet Québec
            </h2>

            <p>Bonjour ${safeName},</p>

            <p>
              Petit rappel concernant votre dossier
              d'impôt${year}.
            </p>

            <p>
              Nous sommes toujours en attente de certains
              renseignements ou documents afin de pouvoir
              poursuivre votre dossier.
            </p>

            <p>
              Vous pouvez vous connecter à votre espace
              client ComptaNet Québec afin de compléter
              votre dossier ou d'ajouter les documents
              manquants.
            </p>

            <p>
              Si vous avez déjà transmis les éléments
              demandés récemment, vous pouvez ignorer
              ce message.
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
        subject: `2e rappel – dossier d'impôt${year} incomplet`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
            <h2 style="color:#1d4ed8">
              ComptaNet Québec
            </h2>

            <p>Bonjour ${safeName},</p>

            <p>
              Nous vous rappelons que votre dossier
              d'impôt${year} est toujours en attente.
            </p>

            <p>
              Certains renseignements ou documents sont
              nécessaires avant que nous puissions poursuivre
              le traitement de votre dossier.
            </p>

            <p>
              Veuillez vous connecter à votre espace client
              et transmettre les éléments manquants dès que
              possible.
            </p>

            <p>
              Si vous venez de les transmettre, aucune action
              supplémentaire n'est nécessaire.
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
      subject: `Dernier rappel – dossier d'impôt${year}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">
            ComptaNet Québec
          </h2>

          <p>Bonjour ${safeName},</p>

          <p>
            Ceci est notre dernier rappel concernant votre
            dossier d'impôt${year}.
          </p>

          <p>
            Nous sommes toujours en attente des renseignements
            ou documents nécessaires pour poursuivre votre
            dossier.
          </p>

          <p>
            Sans réception des éléments manquants, votre
            dossier sera considéré comme inactif jusqu'à
            ce que vous nous transmettiez de nouveaux
            renseignements ou documents.
          </p>

          <p>
            Vous pourrez reprendre votre dossier par la suite
            en vous connectant à votre espace client
            ComptaNet Québec.
          </p>

          <p>
            Merci,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  /*
   * =========================
   * ENGLISH
   * =========================
   */
  if (lang === "en") {
    if (reminderNumber === 1) {
      return {
        subject: `Reminder – your${year} tax return`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
            <h2 style="color:#1d4ed8">
              ComptaNet Québec
            </h2>

            <p>Hello ${safeName},</p>

            <p>
              This is a friendly reminder regarding your${year}
              tax return.
            </p>

            <p>
              We are still waiting for some information or
              documents before we can continue processing
              your file.
            </p>

            <p>
              Please sign in to your ComptaNet Québec client
              portal to complete your file or upload the
              missing documents.
            </p>

            <p>
              If you have recently submitted the requested
              information, please disregard this message.
            </p>

            <p>
              Thank you,<br>
              <strong>ComptaNet Québec</strong>
            </p>
          </div>
        `,
      };
    }

    if (reminderNumber === 2) {
      return {
        subject: `Second reminder – your${year} tax return is incomplete`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
            <h2 style="color:#1d4ed8">
              ComptaNet Québec
            </h2>

            <p>Hello ${safeName},</p>

            <p>
              This is a second reminder that your${year}
              tax return is still waiting for additional
              information or documents.
            </p>

            <p>
              We need these items before we can continue
              processing your file.
            </p>

            <p>
              Please sign in to your client portal and
              submit the missing information as soon
              as possible.
            </p>

            <p>
              If you have just submitted the requested
              items, no further action is required.
            </p>

            <p>
              Thank you,<br>
              <strong>ComptaNet Québec</strong>
            </p>
          </div>
        `,
      };
    }

    return {
      subject: `Final reminder – your${year} tax return`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">
            ComptaNet Québec
          </h2>

          <p>Hello ${safeName},</p>

          <p>
            This is our final reminder regarding your${year}
            tax return.
          </p>

          <p>
            We are still waiting for the information or
            documents required to continue processing
            your file.
          </p>

          <p>
            If we do not receive the missing items, your
            file will be considered inactive until you
            provide new information or documents.
          </p>

          <p>
            You will still be able to resume your file later
            through your ComptaNet Québec client portal.
          </p>

          <p>
            Thank you,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  /*
   * =========================
   * ESPAÑOL
   * =========================
   */
  if (reminderNumber === 1) {
    return {
      subject: `Recordatorio – su declaración de impuestos${year}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">
            ComptaNet Québec
          </h2>

          <p>Hola ${safeName},</p>

          <p>
            Este es un pequeño recordatorio sobre su
            declaración de impuestos${year}.
          </p>

          <p>
            Todavía estamos esperando cierta información
            o algunos documentos para poder continuar
            con su expediente.
          </p>

          <p>
            Puede iniciar sesión en su espacio de cliente
            de ComptaNet Québec para completar su expediente
            o agregar los documentos faltantes.
          </p>

          <p>
            Si ya envió recientemente la información
            solicitada, puede ignorar este mensaje.
          </p>

          <p>
            Gracias,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  if (reminderNumber === 2) {
    return {
      subject: `Segundo recordatorio – declaración de impuestos${year} incompleta`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
          <h2 style="color:#1d4ed8">
            ComptaNet Québec
          </h2>

          <p>Hola ${safeName},</p>

          <p>
            Le recordamos que su declaración de
            impuestos${year} todavía está pendiente.
          </p>

          <p>
            Necesitamos cierta información o algunos
            documentos antes de poder continuar con
            el procesamiento de su expediente.
          </p>

          <p>
            Inicie sesión en su espacio de cliente y envíe
            la información o los documentos faltantes
            lo antes posible.
          </p>

          <p>
            Si acaba de enviarlos, no es necesario realizar
            ninguna otra acción.
          </p>

          <p>
            Gracias,<br>
            <strong>ComptaNet Québec</strong>
          </p>
        </div>
      `,
    };
  }

  return {
    subject: `Último recordatorio – declaración de impuestos${year}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
        <h2 style="color:#1d4ed8">
          ComptaNet Québec
        </h2>

        <p>Hola ${safeName},</p>

        <p>
          Este es nuestro último recordatorio sobre su
          declaración de impuestos${year}.
        </p>

        <p>
          Todavía estamos esperando la información o los
          documentos necesarios para continuar con su
          expediente.
        </p>

        <p>
          Si no recibimos los elementos faltantes, su
          expediente se considerará inactivo hasta que
          nos envíe nueva información o documentos.
        </p>

        <p>
          Podrá reanudar su expediente más adelante
          desde su espacio de cliente de ComptaNet Québec.
        </p>

        <p>
          Gracias,<br>
          <strong>ComptaNet Québec</strong>
        </p>
      </div>
    `,
  };
}

export async function GET(request: Request) {
  try {
    /*
     * Protection du Cron.
     *
     * Tant que CRON_SECRET n'est pas configuré,
     * la route fonctionne sans cette protection.
     */
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (cronSecret) {
      const authorization =
        request.headers.get("authorization");

      if (authorization !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          {
            ok: false,
            error: "Non autorisé",
          },
          { status: 401 }
        );
      }
    }

    const supabaseUrl = getEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

    /*
     * Supporte les deux noms au cas où ton ancienne
     * variable Vercel porte encore l'ancien nom.
     */
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SE_CE_ROLE_KEY?.trim();

    if (!serviceRoleKey) {
      throw new Error(
        "Variable Supabase Service Role manquante"
      );
    }

    const resendApiKey = getEnv("RESEND_API_KEY");

    const fromEmail =
      process.env.FROM_EMAIL?.trim() ||
      "ComptaNet Québec <info@comptanetquebec.com>";

    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() ||
      undefined;

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
     * Seulement les dossiers en attente client.
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

      if (
        !formulaireId ||
        !statusRow.waiting_since
      ) {
        continue;
      }

      /*
       * Un dossier inactif ne reçoit plus de rappel.
       */
      if (statusRow.inactive_at) {
        continue;
      }

      const days = daysSince(
        String(statusRow.waiting_since)
      );

      const reminderCount = Number(
        statusRow.reminder_count ?? 0
      );

      let reminderNumber:
        | ReminderNumber
        | null = null;

      /*
       * On commence par le délai le plus élevé.
       *
       * Ça évite d'envoyer plusieurs courriels
       * le même jour si le Cron n'a pas roulé
       * pendant quelques jours.
       */
      if (days >= 10 && reminderCount < 3) {
        reminderNumber = 3;
      } else if (
        days >= 5 &&
        reminderCount < 2
      ) {
        reminderNumber = 2;
      } else if (
        days >= 2 &&
        reminderCount < 1
      ) {
        reminderNumber = 1;
      }

      if (!reminderNumber) {
        continue;
      }

      /*
       * VRAIE TABLE T1 DE COMPTANET
       */
      const {
        data: formulaire,
        error: formError,
      } = await supabase
        .from("formulaires_fiscaux")
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

      const clientEmail =
        getClientEmail(formulaire);

      const clientName =
        getClientName(formulaire);

      const taxYear =
        getTaxYear(formulaire);

      /*
       * LANGUE AUTOMATIQUE DU DOSSIER
       */
      const lang = normalizeLang(
        formulaire.lang
      );

      if (!clientEmail) {
        results.push({
          formulaire_id: formulaireId,
          ok: false,
          error: "Aucun courriel client",
        });

        continue;
      }

      const message = emailContent({
        lang,
        name: clientName,
        taxYear,
        reminderNumber,
      });

      /*
       * ENVOI RESEND
       */
      const {
        data: sent,
        error: sendError,
      } = await resend.emails.send({
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
          lang,
          reminder: reminderNumber,
          error: sendError.message,
        });

        continue;
      }

      const now =
        new Date().toISOString();

      const updateData: {
        reminder_count: number;
        last_reminder_at: string;
        inactive_at?: string;
      } = {
        reminder_count: reminderNumber,
        last_reminder_at: now,
      };

      /*
       * Après le 3e rappel :
       * dossier conservé mais inactif.
       */
      if (reminderNumber === 3) {
        updateData.inactive_at = now;
      }

      const {
        error: updateError,
      } = await supabase
        .from("dossier_statuses")
        .update(updateData)
        .eq(
          "formulaire_id",
          formulaireId
        );

      results.push({
        formulaire_id: formulaireId,
        ok: !updateError,
        lang,
        reminder: reminderNumber,
        email_id: sent?.id ?? null,
        inactive:
          reminderNumber === 3,
        error:
          updateError?.message ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      checked:
        statuses?.length ?? 0,
      processed:
        results.length,
      results,
    });
  } catch (error) {
    console.error(
      "Rappels impôts:",
      error
    );

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
