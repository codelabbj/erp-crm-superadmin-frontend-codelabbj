import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import {
  adminApi,
  type ProspectionCabinet,
} from "@/lib/adminApi";
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

function statutLabel(value: string) {
  return STATUT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ProspectionPage() {
  const queryClient = useQueryClient();
  const [pays, setPays] = useState("");
  const [statut, setStatut] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
    const values = [...new Set(["Bénin", "Côte d'Ivoire", "Togo", "Sénégal", ...fromList].filter(Boolean))];
    return values.sort((a, b) => a.localeCompare(b, "fr")).map((value) => ({ value, label: value }));
  }, [listQuery.data]);

  return (
    <ListPageShell>
      <PageHeader
        title="Prospection cabinets comptables"
        description="Suivi des cabinets contactés pour un partenariat OwoDesk. L’automatisation met à jour les statuts ; vous pouvez compléter un email ou ajuster après un appel."
      />

      <div className="flex flex-wrap gap-2 text-xs text-neutral-6">
        {(statsQuery.data ?? []).map((row) => (
          <span key={row.statut} className="rounded-full bg-neutral-1 px-2 py-1">
            {statutLabel(row.statut)} · {row.total}
          </span>
        ))}
      </div>

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
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ["prospection-cabinets"] });
            await queryClient.invalidateQueries({ queryKey: ["prospection-stats"] });
          }}
        />
      </div>
    </ListPageShell>
  );
}

function CabinetDetail({
  cabinet,
  onSaved,
}: {
  cabinet: ProspectionCabinet | null;
  onSaved: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState("");

  useEffect(() => {
    if (!cabinet) return;
    setEmail(cabinet.email);
    setNotes(cabinet.notes);
    setStatut(cabinet.statut);
  }, [cabinet]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!cabinet) throw new Error("Aucun cabinet");
      return adminApi.updateProspectionCabinet(cabinet.id, { email, notes, statut });
    },
    onSuccess: () => onSaved(),
  });

  if (!cabinet) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-4 p-4 text-sm text-neutral-6">
        Sélectionnez un cabinet pour voir l’historique et modifier le suivi.
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

      <label className="block text-xs font-medium">
        Email
        <input
          className="mt-1 h-9 w-full rounded-lg border border-neutral-4 px-2 text-sm"
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
      <button
        type="button"
        className="h-9 rounded-lg bg-primary-1 px-3 text-sm font-medium text-white disabled:opacity-60"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {mutation.isError ? <p className="text-xs text-red-700">Impossible d’enregistrer.</p> : null}

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
