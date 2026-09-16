// app/admin/dossiers/page.tsx

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AdminDossiersClient, {
  type AdminDossierRow,
} from "./AdminDossiersClient";

type ProfileRow = {
  is_admin: boolean | null;
};

type PaymentStatus = "unpaid" | "paid";

type FormRow = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  form_type: string | null;
  annee: number | null;
  data: Record<string, unknown> | null;
  user_id: string | null;
  cq_id: string | null;
  payment_status: PaymentStatus | null;
};

type StatusRow = {
  formulaire_id: string;
  status: "recu" | "en_cours" | "attente_client" | "termine";
  updated_at: string | null;
};

type ClientData = {
  client?: {
    prenom?: string;
    nom?: string;
    courriel?: string;
    tel?: string;
    telCell?: string;
  };

  /*
   * Ancienne structure :
   * certains anciens T1 contiennent une section TA directement
   * dans leur JSON.
   */
  travailleurAutonome?: {
    actif?: boolean;
    nomEntreprise?: string;
    revenus?: string;
    depenses?: string;
  };

  questionsGenerales?: {
    anneeImposition?: string | number;
    annee?: string | number;
    taxYear?: string | number;
  };

  anneeImposition?: string | number;
  annee?: string | number;
  taxYear?: string | number;
};

/* =========================================================
   HELPERS
========================================================= */

function safePayment(value: unknown): PaymentStatus {
  return value === "paid" ? "paid" : "unpaid";
}

function parseTaxYear(value: unknown): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  return null;
}

function resolveTaxYear(
  form: FormRow,
  data: ClientData | null
): number | null {
  /*
   * Source principale :
   * colonne réelle "annee" de formulaires_fiscaux.
   */
  const columnYear = parseTaxYear(form.annee);

  if (columnYear) {
    return columnYear;
  }

  /*
   * Repli pour les anciens dossiers si l'année
   * existe seulement dans le JSON.
   */
  const candidates: unknown[] = [
    data?.questionsGenerales?.anneeImposition,
    data?.questionsGenerales?.annee,
    data?.questionsGenerales?.taxYear,
    data?.anneeImposition,
    data?.annee,
    data?.taxYear,
  ];

  for (const candidate of candidates) {
    const year = parseTaxYear(candidate);

    if (year) {
      return year;
    }
  }

  return null;
}

/*
 * Détermine le libellé affiché dans l'admin.
 *
 * Nouveau système :
 * form_type = "autonome" -> TA
 *
 * Ancien système :
 * T1 avec data.travailleurAutonome.actif = true
 * -> T1 + TA
 *
 * Sinon :
 * on conserve le form_type réel.
 */
function resolveFormTypeLabel(
  form: FormRow,
  data: ClientData | null
): string | null {
  const rawFormType = (
    form.form_type ?? ""
  )
    .trim()
    .toLowerCase();

  /*
   * Nouveau formulaire TA
   */
  if (
    rawFormType === "autonome" ||
    rawFormType === "ta"
  ) {
    return "TA";
  }

  /*
   * Ancien T1 contenant la section TA.
   */
  const oldT1WithTA =
    !!data?.travailleurAutonome?.actif;

  if (oldT1WithTA) {
    return "T1 + TA";
  }

  /*
   * T1 / T2 / autres anciens types.
   */
  return form.form_type ?? null;
}

/* =========================================================
   PAGE ADMIN
========================================================= */

export default async function AdminDossiersPage() {
  const supabase = await supabaseServer();

  /* =========================
     AUTH
  ========================= */

  const {
    data: auth,
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !auth?.user) {
    redirect(
      "/espace-client?next=/admin/dossiers"
    );
  }

  /* =========================
     VÉRIFICATION ADMIN
  ========================= */

  const {
    data: profile,
    error: profErr,
  } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();

  if (profErr || !profile?.is_admin) {
    return (
      <div className="p-6">
        Accès refusé
      </div>
    );
  }

  /* =========================
     FORMULAIRES
  ========================= */

  const {
    data: forms,
    error: formsErr,
  } = await supabase
    .from("formulaires_fiscaux")
    .select(
      `
        id,
        created_at,
        updated_at,
        form_type,
        annee,
        data,
        user_id,
        cq_id,
        payment_status
      `
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(500)
    .returns<FormRow[]>();

  if (formsErr) {
    return (
      <div className="p-6">
        Erreur chargement formulaires:{" "}
        {formsErr.message}
      </div>
    );
  }

  const list = forms ?? [];

  const ids = list.map(
    (form) => form.id
  );

  if (ids.length === 0) {
    return (
      <AdminDossiersClient
        initialRows={[]}
      />
    );
  }

  /* =========================
     DOCUMENTS
  ========================= */

  const {
    data: docsRows,
    error: docsErr,
  } = await supabase
    .from("formulaire_documents")
    .select("formulaire_id")
    .in("formulaire_id", ids)
    .limit(100000);

  const docsMap =
    new Map<string, number>();

  if (!docsErr && docsRows) {
    for (
      const row of docsRows as {
        formulaire_id: string;
      }[]
    ) {
      docsMap.set(
        row.formulaire_id,
        (docsMap.get(
          row.formulaire_id
        ) ?? 0) + 1
      );
    }
  }

  /* =========================
     STATUTS
  ========================= */

  const {
    data: statusData,
    error: statusError,
  } = await supabase
    .from("dossier_statuses")
    .select(
      "formulaire_id, status, updated_at"
    )
    .in("formulaire_id", ids)
    .returns<StatusRow[]>();

  const statusMap =
    new Map<string, StatusRow>();

  if (!statusError && statusData) {
    for (const status of statusData) {
      statusMap.set(
        status.formulaire_id,
        status
      );
    }
  }

  /* =========================
     CONSTRUCTION DES DOSSIERS
     POUR L'ADMIN
  ========================= */

  const rows: AdminDossierRow[] =
    list.map((form) => {
      const filled = !!(
        form.data &&
        typeof form.data === "object" &&
        Object.keys(form.data).length > 0
      );

      const status =
        statusMap.get(form.id);

      const data =
        form.data as ClientData | null;

      /* ---------- Client ---------- */

      const clientName = `${
        data?.client?.prenom ?? ""
      } ${
        data?.client?.nom ?? ""
      }`.trim();

      const clientEmail =
        data?.client?.courriel ?? null;

      const clientPhone =
        data?.client?.telCell ||
        data?.client?.tel ||
        null;

      /* ---------- Type ---------- */

      const formTypeLabel =
        resolveFormTypeLabel(
          form,
          data
        );

      /* ---------- Année ---------- */

      const taxYear =
        resolveTaxYear(
          form,
          data
        );

      /* ---------- Ligne admin ---------- */

      return {
        formulaire_id: form.id,

        cq_id:
          form.cq_id ?? null,

        client_name:
          clientName || null,

        client_email:
          clientEmail,

        client_phone:
          clientPhone,

        payment_status:
          safePayment(
            form.payment_status
          ),

        created_at:
          form.created_at ?? null,

        status:
          status?.status ?? "recu",

        updated_at:
          status?.updated_at ??
          form.updated_at ??
          form.created_at ??
          null,

        /*
         * Affichage :
         *
         * TA       = nouveau formulaire TA
         * T1 + TA  = ancien T1 avec TA intégré
         * T1       = T1 normal
         * T2       = société
         */
        form_type:
          formTypeLabel,

        tax_year:
          taxYear,

        form_filled:
          filled,

        docs_count:
          docsMap.get(form.id) ?? 0,
      };
    });

  /* =========================
     RENDER
  ========================= */

  return (
    <AdminDossiersClient
      initialRows={rows}
    />
  );
}
