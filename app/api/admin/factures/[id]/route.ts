import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type ProfileRow = {
  is_admin: boolean | null;
};

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const supabase = await supabaseServer();

    // Vérifier l'utilisateur connecté
    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError || !auth?.user) {
      return NextResponse.json(
        {
          error: "Non connecté.",
        },
        { status: 401 }
      );
    }

    // Vérifier admin
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle<ProfileRow>();

    if (profileError) {
      console.error("Erreur profil:", profileError);

      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        {
          error: "Accès refusé.",
        },
        { status: 403 }
      );
    }

    // Récupérer l'ID
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "ID de facture manquant.",
        },
        { status: 400 }
      );
    }

    // Vérifier que la facture existe
    const { data: facture, error: factureError } =
      await supabase
        .from("factures")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (factureError) {
      console.error("Erreur recherche facture:", factureError);

      return NextResponse.json(
        {
          error: factureError.message,
        },
        { status: 500 }
      );
    }

    if (!facture) {
      return NextResponse.json(
        {
          error: "Facture introuvable.",
        },
        { status: 404 }
      );
    }

    // Supprimer les lignes associées
    const { error: lignesError } =
      await supabase
        .from("facture_lignes")
        .delete()
        .eq("facture_id", id);

    if (lignesError) {
      console.error(
        "Erreur suppression lignes:",
        lignesError
      );

      return NextResponse.json(
        {
          error: lignesError.message,
        },
        { status: 500 }
      );
    }

    // Supprimer la facture
    const { error: deleteError } =
      await supabase
        .from("factures")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Erreur suppression facture:",
        deleteError
      );

      return NextResponse.json(
        {
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Erreur DELETE facture:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue.",
      },
      { status: 500 }
    );
  }
}
