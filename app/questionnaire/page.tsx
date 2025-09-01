'use client';

import { useState } from 'react';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/XXXXYYYY'; // <-- remplace par ton URL Formspree

type Dependent = { firstName: string; lastName: string; birth: string; nas: string };

export default function QuestionnairePage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | 'ok' | 'err'>(null);
  const [dependents, setDependents] = useState<Dependent[]>([
    { firstName: '', lastName: '', birth: '', nas: '' },
  ]);

  const addDependent = () =>
    setDependents((d) => [...d, { firstName: '', lastName: '', birth: '', nas: '' }]);

  const updateDependent = (i: number, key: keyof Dependent, val: string) => {
    setDependents((d) => {
      const copy = [...d];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setSent(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Ajoute les enfants en JSON
    fd.append('dependents', JSON.stringify(dependents));

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setSent('ok');
        form.reset();
        setDependents([{ firstName: '', lastName: '', birth: '', nas: '' }]);
      } else {
        setSent('err');
      }
    } catch {
      setSent('err');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Bandeau d’en-tête */}
      <section
        className="relative bg-[url('/banniere.png')] bg-cover bg-center"
        aria-label="En-tête visuel"
      >
        <div className="backdrop-brightness-75">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="bg-white/95 rounded-2xl p-6 sm:p-10 shadow-xl max-w-2xl">
              <p className="text-gray-600 mb-2">Faites vos impôts en ligne avec</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">
                ComptaNet Québec
              </h1>
              <p className="mt-4 text-gray-700 leading-7">
                Remplissez ce court questionnaire pour que nous préparions votre dossier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* IDENTIFICATION */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Identification</h2>
            <p className="text-sm text-gray-500 mb-6">
              Vous + conjoint(e) (au besoin).
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium">Prénom</label>
                <input name="prenom" required className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input name="nom" required className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">NAS (123-456-789)</label>
                <input name="nas" inputMode="numeric" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Date de naissance</label>
                <input type="date" name="naissance" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="block text-sm font-medium">État civil</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {['Célibataire','Conjoint de fait','Marié(e)','Séparé(e)','Divorcé(e)','Veuf(ve)'].map((v) => (
                    <label key={v} className="inline-flex items-center gap-2">
                      <input type="radio" name="etatCivil" value={v} className="h-4 w-4" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Conjoint */}
              <div className="sm:col-span-2 border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-4">Conjoint(e) (si applicable)</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium">Prénom</label>
                    <input name="conjoint_prenom" className="mt-1 w-full rounded-lg border p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Nom</label>
                    <input name="conjoint_nom" className="mt-1 w-full rounded-lg border p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">NAS du conjoint</label>
                    <input name="conjoint_nas" inputMode="numeric" className="mt-1 w-full rounded-lg border p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Date de naissance</label>
                    <input type="date" name="conjoint_naissance" className="mt-1 w-full rounded-lg border p-2.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COORDONNÉES */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <input name="telephone" inputMode="tel" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Courriel</label>
                <input type="email" name="courriel" required className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Adresse</label>
                <input name="adresse" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Ville</label>
                <input name="ville" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Province</label>
                <input name="province" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium">Code postal</label>
                <input name="code_postal" className="mt-1 w-full rounded-lg border p-2.5" />
              </div>
            </div>
          </div>

          {/* ASSURANCE MÉDICAMENTS */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Assurance médicaments</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-6">
              <fieldset>
                <legend className="text-sm font-medium text-gray-800">Vous</legend>
                <div className="mt-2 space-y-2 text-sm">
                  {['RAMQ','Mon propre régime collectif','Régime du conjoint/d’un parent'].map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input type="radio" name="assurance_vous" value={v} className="h-4 w-4" /> {v}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-gray-800">Conjoint(e)</legend>
                <div className="mt-2 space-y-2 text-sm">
                  {['RAMQ','Son propre régime collectif','Régime du conjoint/d’un parent'].map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input type="radio" name="assurance_conjoint" value={v} className="h-4 w-4" /> {v}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* PERSONNES À CHARGE */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Personnes à charge</h2>
              <button type="button" onClick={addDependent} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                + Ajouter
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {dependents.map((d, i) => (
                <div key={i} className="grid sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
                  <input
                    className="rounded-lg border p-2.5" placeholder="Prénom"
                    value={d.firstName} onChange={(e) => updateDependent(i, 'firstName', e.target.value)}
                  />
                  <input
                    className="rounded-lg border p-2.5" placeholder="Nom"
                    value={d.lastName} onChange={(e) => updateDependent(i, 'lastName', e.target.value)}
                  />
                  <input
                    type="date" className="rounded-lg border p-2.5" placeholder="Naissance"
                    value={d.birth} onChange={(e) => updateDependent(i, 'birth', e.target.value)}
                  />
                  <input
                    className="rounded-lg border p-2.5" placeholder="NAS (si attribué)"
                    value={d.nas} onChange={(e) => updateDependent(i, 'nas', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* QUESTIONS FINALES */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Questions finales</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                'Avez-vous habité seul(e) toute l’année (hors personnes à charge) ?',
                'Possédez-vous plus de 100 000 $ de biens à l’étranger ?',
                'Êtes-vous citoyen(ne) canadien(ne) ?',
                'Êtes-vous non-résident(e) pour fins fiscales ?',
                'Avez-vous acheté une première habitation ou vendu votre résidence principale ?',
                'Souhaitez-vous qu’un technicien vous appelle ?',
              ].map((q, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <label className="text-gray-800">{q}</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1">
                      <input type="radio" name={`q${idx}`} value="Oui" className="h-4 w-4" /> Oui
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input type="radio" name={`q${idx}`} value="Non" className="h-4 w-4" /> Non
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium">Comment recevoir vos déclarations ?</label>
                <select name="remise" className="mt-1 w-full rounded-lg border p-2.5">
                  <option value="Email">Email</option>
                  <option value="EspaceClient">Espace client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Mode de paiement</label>
                <select name="paiement" className="mt-1 w-full rounded-lg border p-2.5">
                  <option value="Interac">Virement Interac (+1$)</option>
                  <option value="Carte">Carte de crédit (+3$)</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium">Commentaires</label>
              <textarea name="commentaires" rows={4} className="mt-1 w-full rounded-lg border p-2.5" placeholder="Ajoutez toute info utile..." />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {sending ? 'Envoi…' : 'Envoyer mon questionnaire'}
            </button>
            {sent === 'ok' && <p className="text-green-700">Merci! Votre questionnaire a été envoyé.</p>}
            {sent === 'err' && <p className="text-red-700">Oups — échec de l’envoi. Réessayez.</p>}
          </div>
        </form>

        {/* Note vie privée */}
        <p className="mt-8 text-xs text-gray-500">
          En envoyant ce formulaire, vous acceptez que ComptaNet Québec traite vos informations pour préparer votre dossier fiscal.
        </p>
      </section>
    </main>
  );
}
