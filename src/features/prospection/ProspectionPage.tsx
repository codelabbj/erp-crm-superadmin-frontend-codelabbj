import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import {
  adminApi,
  type ProspectionCabinet,
  type ProspectionCabinetCreate,
} from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { cn } from "@/lib/utils";

const STATUT_OPTIONS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "email_manquant", label: "Email manquant" },
  { value: "email_a_verifier", label: "Email à vérifier" },
  { value: "pret", label: "Prêt à envoyer" },
  { value: "contacte", label: "Contacté" },
  { value: "relance_1", label: "Relancé (1)" },
  { value: "relance_2", label: "Relancé (2)" },
  { value: "repondu", label: "A répondu" },
  { value: "partenaire", label: "Partenaire" },
  { value: "refuse", label: "Refusé" },
];

const STATUT_CLASS: Record<string, string> = {
  nouveau: "bg-slate-100 text-slate-800",
  email_manquant: "bg-amber-100 text-amber-900",
  email_a_verifier: "bg-orange-100 text-orange-900",
  pret: "bg-sky-100 text-sky-900",
  contacte: "bg-indigo-100 text-indigo-900",
  relance_1: "bg-violet-100 text-violet-900",
  relance_2: "bg-purple-100 text-purple-900",
  repondu: "bg-emerald-100 text-emerald-900",
  partenaire: "bg-green-100 text-green-900",
  refuse: "bg-red-100 text-red-800",
};

const PAYS_CHOICES = [
  "Bénin",
  "Côte d'Ivoire",
  "Togo",
  "Sénégal",
  "Mali",
  "Burkina Faso",
  "Niger",
  "Guinée",
  "Cameroun",
];

function statutLabel(value: string) {
  return STATUT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function sendButtonLabel(cabinet: ProspectionCabinet) {
  if (!cabinet.date_envoi) return "Envoyer l’email de partenariat";
  if (!cabinet.date_relance_1) return "Envoyer la 1re relance";
  return "Envoyer la 2e relance";
}

export function ProspectionPage() {
  const queryClient = useQueryClient();
  const [pays, setPays] = useState("");
  const [statut, setStatut] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pageError, setPageError] = useState("");

  const listQuery = useQuery({
    queryKey: ["prospection-cabinets", pays, statut, q],
    queryFn: () =>
      adminApi.prospectionCabinets({
        pays: pays || undefined,
        statut: statut || undefined,
        q: q || undefined,
      }),
  });

  const statsQuery = useQuery({
    queryKey: ["prospection-stats"],
    queryFn: () => adminApi.prospectionStats(),
  });

  const cabinets = listQuery.data ?? [];
  const selected = cabinets.find((item) => item.id === selectedId) ?? null;
  const paysOptions = useMemo(() => {
    const fromList = (listQuery.data ?? []).map((item) => item.pays);
    const values = [...new Set([...PAYS_CHOICES, ...fromList].filter(Boolean))];
    return values.sort((a, b) => a.localeCompare(b, "fr")).map((value) => ({ value, label: value }));
  }, [listQuery.data]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["prospection-cabinets"] });
    await queryClient.invalidateQueries({ queryKey: ["prospection-stats"] });
  };

  return (
    <ListPageShell>
      <PageHeader
        title="Prospection cabinets comptables"
        description="Ajoutez un cabinet, complétez l’email s’il manque, puis envoyez le courrier de partenariat depuis la console."
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} />
            Ajouter un prospect
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 text-xs text-neutral-6">
        {(statsQuery.data ?? []).map((row) => (
          <span key={row.statut} className="rounded-full bg-neutral-1 px-2 py-1">
            {statutLabel(row.statut)} · {row.total}
          </span>
        ))}
      </div>

      {pageError ? <p className="text-xs text-red-700">{pageError}</p> : null}

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Nom, email, ville, notes…" />
        <FilterSelect value={pays} onChange={setPays} options={paysOptions} placeholder="Tous les pays" />
        <FilterSelect value={statut} onChange={setStatut} options={STATUT_OPTIONS} placeholder="Tous les statuts" />
      </FilterBar>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-neutral-6">
                <th className="px-3 py-2">Cabinet</th>
                <th className="px-3 py-2">Pays</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Téléphone</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Dernier contact</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td className="px-3 py-6 text-neutral-6" colSpan={6}>
                    Chargement…
                  </td>
                </tr>
              ) : cabinets.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-neutral-6" colSpan={6}>
                    Aucun cabinet.
                  </td>
                </tr>
              ) : (
                cabinets.map((cabinet) => (
                  <tr
                    key={cabinet.id}
                    className={cn(
                      "cursor-pointer border-b last:border-0 hover:bg-neutral-1",
                      selectedId === cabinet.id && "bg-primary-5/40",
                    )}
                    onClick={() => setSelectedId(cabinet.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{cabinet.nom_cabinet}</div>
                      <div className="text-xs text-neutral-6">{cabinet.ville || "—"}</div>
                    </td>
                    <td className="px-3 py-2">{cabinet.pays}</td>
                    <td className="px-3 py-2">{cabinet.email || "—"}</td>
                    <td className="px-3 py-2">{cabinet.telephone || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUT_CLASS[cabinet.statut] || "bg-slate-100")}>
                        {statutLabel(cabinet.statut)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatDate(cabinet.last_contact)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <CabinetDetail
          cabinet={selected}
          onSaved={async (updated) => {
            if (
              (statut === "email_manquant" || statut === "email_a_verifier" || statut === "pret") &&
              (updated.statut === "pret" || updated.statut === "contacte")
            ) {
              setStatut("");
            }
            await refresh();
          }}
        />
      </div>

      {isCreateOpen ? (
        <AddCabinetDialog
          onClose={() => setIsCreateOpen(false)}
          onCreated={async (created, sent) => {
            setPageError(sent === "failed" ? "Prospect créé, mais l’email n’a pas pu être envoyé. Réessayez depuis le panneau." : "");
            setPays("");
            setStatut("");
            setQ("");
            setSelectedId(created.id);
            setIsCreateOpen(false);
            await refresh();
          }}
        />
      ) : null}
    </ListPageShell>
  );
}

function AddCabinetDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (cabinet: ProspectionCabinet, sent: "yes" | "no" | "failed") => Promise<void>;
}) {
  const [form, setForm] = useState<ProspectionCabinetCreate>({
    pays: "Bénin",
    ville: "",
    nom_cabinet: "",
    site_web: "",
    email: "",
    telephone: "",
    notes: "",
  });
  const [sendNow, setSendNow] = useState(true);
  const [error, setError] = useState("");

  const canSend = looksLikeEmail(form.email || "");

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await adminApi.createProspectionCabinet({
        ...form,
        nom_cabinet: form.nom_cabinet.trim(),
        email: (form.email || "").trim(),
        ville: (form.ville || "").trim(),
        telephone: (form.telephone || "").trim(),
        site_web: (form.site_web || "").trim(),
        notes: (form.notes || "").trim(),
      });
      if (sendNow && looksLikeEmail(created.email)) {
        try {
          const sent = await adminApi.sendProspectionCabinetEmail(created.id);
          return { cabinet: sent, sent: "yes" as const };
        } catch {
          return { cabinet: created, sent: "failed" as const };
        }
      }
      return { cabinet: created, sent: "no" as const };
    },
    onSuccess: ({ cabinet, sent }) => {
      void onCreated(cabinet, sent);
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  });

  const setField = (key: keyof ProspectionCabinetCreate, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Nouveau prospect</h3>
          <button type="button" className="btn-ghost h-9 w-9 p-0 text-slate-400" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {error ? <p className="mb-3 text-xs text-red-700">{error}</p> : null}
        <div className="space-y-3">
          <label className="block text-xs font-medium">
            Cabinet *
            <input
              className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
              value={form.nom_cabinet}
              onChange={(e) => setField("nom_cabinet", e.target.value)}
              placeholder="Nom du cabinet"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium">
              Pays *
              <select
                className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
                value={form.pays}
                onChange={(e) => setField("pays", e.target.value)}
              >
                {PAYS_CHOICES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium">
              Ville
              <input
                className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
                value={form.ville}
                onChange={(e) => setField("ville", e.target.value)}
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            Email
            <input
              className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="contact@cabinet.com"
            />
          </label>
          <label className="block text-xs font-medium">
            Téléphone
            <input
              className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
              value={form.telephone}
              onChange={(e) => setField("telephone", e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium">
            Site web
            <input
              className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
              value={form.site_web}
              onChange={(e) => setField("site_web", e.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="block text-xs font-medium">
            Notes
            <textarea
              className="mt-1 min-h-20 w-full rounded-lg border border-neutral-4 px-2 py-1 text-sm"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={sendNow && canSend}
              disabled={!canSend}
              onChange={(e) => setSendNow(e.target.checked)}
            />
            <span>
              Envoyer tout de suite l’email de partenariat (IONOS, team@codelab.bj).
              {!canSend ? " Saisissez un email valide pour activer l’envoi." : ""}
            </span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary px-4" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-primary px-4"
            disabled={mutation.isPending || !form.nom_cabinet.trim()}
            onClick={() => {
              setError("");
              mutation.mutate();
            }}
          >
            {mutation.isPending
              ? sendNow && canSend
                ? "Création et envoi…"
                : "Création…"
              : sendNow && canSend
                ? "Créer et envoyer"
                : "Créer le prospect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CabinetDetail({
  cabinet,
  onSaved,
}: {
  cabinet: ProspectionCabinet | null;
  onSaved: (updated: ProspectionCabinet) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState("");
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!cabinet) return;
    setEmail(cabinet.email);
    setNotes(cabinet.notes);
    setStatut(cabinet.statut);
    setSendError("");
  }, [cabinet]);

  const pendingEmail = statut === "email_manquant" || statut === "email_a_verifier";
  const canValidateEmail = pendingEmail && looksLikeEmail(email);
  const canSend = Boolean(cabinet && looksLikeEmail(email) && statut !== "refuse");

  const previewQuery = useQuery({
    queryKey: ["prospection-email-preview", cabinet?.id, cabinet?.email, cabinet?.date_envoi, cabinet?.date_relance_1],
    queryFn: () => adminApi.prospectionEmailPreview(cabinet!.id),
    enabled: Boolean(cabinet?.id && looksLikeEmail(cabinet.email) && cabinet.statut !== "refuse"),
  });

  const mutation = useMutation({
    mutationFn: (nextStatut: string) => {
      if (!cabinet) throw new Error("Aucun cabinet");
      return adminApi.updateProspectionCabinet(cabinet.id, { email: email.trim(), notes, statut: nextStatut });
    },
    onSuccess: (updated) => {
      setStatut(updated.statut);
      setEmail(updated.email);
      void onSaved(updated);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!cabinet) throw new Error("Aucun cabinet");
      if (email.trim() !== cabinet.email || notes !== cabinet.notes || canValidateEmail) {
        await adminApi.updateProspectionCabinet(cabinet.id, {
          email: email.trim(),
          notes,
          statut: canValidateEmail ? "pret" : statut,
        });
      }
      return adminApi.sendProspectionCabinetEmail(cabinet.id);
    },
    onSuccess: (updated) => {
      setSendError("");
      setStatut(updated.statut);
      setEmail(updated.email);
      void onSaved(updated);
    },
    onError: (err: unknown) => setSendError(getErrorMessage(err)),
  });

  if (!cabinet) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-4 p-4 text-sm text-neutral-6">
        Sélectionnez un cabinet, ou ajoutez un prospect pour lui envoyer le mail.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-sm font-semibold">{cabinet.nom_cabinet}</h2>
        <p className="text-xs text-neutral-6">
          {cabinet.ville ? `${cabinet.ville} · ` : ""}
          {cabinet.pays}
        </p>
        {cabinet.site_web ? (
          <a className="text-xs text-primary-1 underline" href={cabinet.site_web} target="_blank" rel="noreferrer">
            {cabinet.site_web}
          </a>
        ) : null}
      </div>

      {pendingEmail ? (
        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
          {statut === "email_manquant"
            ? "Email manquant : saisissez une adresse puis validez ou envoyez le courrier."
            : "Email à vérifier : confirmez ou corrigez l’adresse puis validez ou envoyez."}
        </p>
      ) : null}

      <label className="block text-xs font-medium">
        Email
        <input
          className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-xs font-medium">
        Statut
        <select
          className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          {STATUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium">
        Notes
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-neutral-4 px-2 py-1 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {previewQuery.data ? (
        <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800">
          <div className="font-medium">{previewQuery.data.subject}</div>
          <div className="mt-1 line-clamp-4 whitespace-pre-wrap text-neutral-6">{previewQuery.data.body}</div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {canSend ? (
          <button
            type="button"
            className="h-9 rounded-lg bg-indigo-700 px-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={sendMutation.isPending || mutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? "Envoi…" : sendButtonLabel(cabinet)}
          </button>
        ) : null}
        {pendingEmail ? (
          <button
            type="button"
            className="h-9 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={mutation.isPending || !canValidateEmail}
            onClick={() => mutation.mutate("pret")}
          >
            {mutation.isPending ? "Validation…" : "Valider l’email → Prêt à envoyer"}
          </button>
        ) : null}
        <button
          type="button"
          className="h-9 rounded-lg bg-primary-1 px-3 text-sm font-medium text-white disabled:opacity-60"
          disabled={mutation.isPending || sendMutation.isPending}
          onClick={() => mutation.mutate(canValidateEmail ? "pret" : statut)}
        >
          {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {pendingEmail && !canValidateEmail ? (
        <p className="text-xs text-amber-800">Indiquez un email valide (ex. contact@cabinet.com) pour débloquer l’envoi.</p>
      ) : null}
      {mutation.isError ? <p className="text-xs text-red-700">Impossible d’enregistrer.</p> : null}
      {sendError ? <p className="text-xs text-red-700">{sendError}</p> : null}
      {sendMutation.isSuccess ? <p className="text-xs text-emerald-700">Email envoyé. Le statut a été mis à jour.</p> : null}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-6">Historique</h3>
        {cabinet.logs.length === 0 ? (
          <p className="text-xs text-neutral-6">Aucun événement pour l’instant.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {cabinet.logs.map((log) => (
              <li key={log.id} className="rounded-lg bg-neutral-1 px-2 py-1.5">
                <div className="font-medium">
                  {log.type_event} · {formatDate(log.date)}
                </div>
                {log.objet ? <div>{log.objet}</div> : null}
                {log.extrait ? <div className="text-neutral-6">{log.extrait}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
