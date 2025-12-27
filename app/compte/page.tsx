"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./compte.css";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const TXT: Record<
  Lang,
  {
    title: string;
    intro: string;
    email: string;
    password: string;
    confirm: string;
    create: string;
    creating: string;
    already: string;
    login: string;
    pwRule: string;
    mismatch: string;
    sent: string;
    generic: string;
  }
> = {
  fr: {
    title: "Créer un compte",
    intro: "Créez votre compte pour accéder à votre portail sécurisé.",
    email: "Courriel",
    password: "Mot de passe",
    confirm: "Confirmer le mot de passe",
    create: "Créer mon compte",
    creating: "Création…",
    already: "Déjà un compte ?",
    login: "Se connecter",
    pwRule: "Minimum 8 caractères.",
    mismatch: "Les mots de passe ne correspondent pas.",
    sent: "Compte créé. Vérifiez vos courriels pour confirmer votre adresse.",
   

