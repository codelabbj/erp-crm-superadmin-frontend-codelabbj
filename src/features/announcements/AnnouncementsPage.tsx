import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Megaphone, Plus, Send, Trash2, Undo2 } from "lucide-react";
import {
  adminApi,
  type AnnouncementTarget,
  type PlatformAnnouncement,
  type PlatformAnnouncementWrite,
} from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { cn } from "@/lib/utils";
import { BlogRichEditor } from "@/features/blog/BlogRichEditor";
import { AnnouncementTargetPicker } from "./AnnouncementTargetPicker";
import { AnnouncementPreviewModal } from "./AnnouncementPreviewModal";

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publiée" },
  { value: "archived", label: "Retirée" },
];

const emptyDraft: PlatformAnnouncementWrite = {
  title: "",
  body_html: "",
  target_type: "all",
  target_org_ids: [],
  target_plan_ids: [],
  audience: "members",
};

function statusClass(status: string) {
  if (status === "published") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "archived") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function targetSummary(a: PlatformAnnouncement) {
  const audience = a.audience === "owners" ? " · propriétaires" : "";
  if (a.target_type === "orgs") {
    const n = a.target_org_ids.length;
    return `${n} organisation${n > 1 ? "s" : ""}${audience}`;
  }
  if (a.target_type === "plans") {
    const n = a.target_plan_ids.length;
    return `${n} plan${n > 1 ? "s" : ""}${audience}`;
  }
  return `Toutes les organisations${audience}`;
}

function isBodyEmpty(html: string) {
  return !html.replace(/<[^>]+>/g, "").trim() && !/<(img|iframe)/i.test(html);
}

function toDraft(a: PlatformAnnouncement): PlatformAnnouncementWrite {
  return {
    title: a.title,
    body_html: a.body_html,
    target_type: a.target_type,
    target_org_ids: a.target_org_ids ?? [],
    target_plan_ids: a.target_plan_ids ?? [],
    audience: a.audience,
  };
}

export function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [selected, setSelected] = useState<PlatformAnnouncement | null>(null);
  const [draft, setDraft] = useState<PlatformAnnouncementWrite>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const listQuery = useQuery({
    queryKey: ["admin-announcements", search, statusFilter],
    queryFn: () =>
      adminApi.announcements({ q: search || undefined, status: statusFilter || undefined, limit: 200 }),
  });
  const items = listQuery.data?.results ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });

  const onSaved = (data: PlatformAnnouncement) => {
    setSelected(data);
    setDraft(toDraft(data));
    setFormError("");
    void refresh();
  };

  const persist = async (): Promise<PlatformAnnouncement> => {
    const payload = { ...draft, title: draft.title.trim() };
    return selected
      ? adminApi.updateAnnouncement(selected.id, payload)
      : adminApi.createAnnouncement(payload);
  };

  const saveMut = useMutation({
    mutationFn: persist,
    onSuccess: (data) => {
      onSaved(data);
      setToast(data.status === "published" ? "Modifications enregistrées." : "Brouillon enregistré.");
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const publishMut = useMutation({
    mutationFn: async () => adminApi.publishAnnouncement((await persist()).id),
    onSuccess: (data) => {
      close();
      onSaved(data);
      setToast("Annonce publiée. Les utilisateurs concernés vont la voir.");
    },
    onError: (err: unknown) => {
      close();
      setFormError(getErrorMessage(err));
    },
  });

  const unpublishMut = useMutation({
    mutationFn: (id: string) => adminApi.unpublishAnnouncement(id),
    onSuccess: (data) => {
      close();
      onSaved(data);
      setToast("Annonce retirée.");
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      close();
      setMode("list");
      setSelected(null);
      setDraft(emptyDraft);
      setToast("Brouillon supprimé.");
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const openCreate = () => {
    setSelected(null);
    setDraft(emptyDraft);
    setFormError("");
    setMode("edit");
  };

  const openEdit = (a: PlatformAnnouncement) => {
    setSelected(a);
    setDraft(toDraft(a));
    setFormError("");
    setMode("edit");
  };

  const validate = (forPublish: boolean) => {
    if (!draft.title.trim()) return "Indiquez un titre.";
    if (!forPublish) return "";
    if (isBodyEmpty(draft.body_html)) return "Le message est vide.";
    if (draft.target_type === "orgs" && !draft.target_org_ids.length) return "Sélectionnez au moins une organisation.";
    if (draft.target_type === "plans" && !draft.target_plan_ids.length) return "Sélectionnez au moins un plan.";
    return "";
  };

  const onSaveDraft = () => {
    const error = validate(false);
    if (error) return setFormError(error);
    saveMut.mutate();
  };

  const onPublish = () => {
    const error = validate(true);
    if (error) return setFormError(error);
    ask({
      title: selected?.status === "archived" ? "Republier cette annonce ?" : "Publier cette annonce ?",
      description:
        "Les utilisateurs concernés la verront tout de suite s'ils sont connectés, sinon à leur prochaine connexion. Elle remplace l'annonce précédente pour ceux qui ne l'ont pas encore fermée.",
      confirmText: "Publier",
      action: () => publishMut.mutate(),
    });
  };

  const setTarget = (target: AnnouncementTarget) => setDraft((d) => ({ ...d, ...target }));
  const busy = saveMut.isPending || publishMut.isPending || unpublishMut.isPending || deleteMut.isPending;
  const status = selected?.status ?? "draft";

  const toastNode = toast ? (
    <div className="fixed right-5 bottom-5 z-40 rounded-xl border border-success-2 bg-neutral-0 px-4 py-3 text-sm font-medium text-success-3 shadow-lg">
      {toast}
    </div>
  ) : null;

  if (mode === "edit") {
    return (
      <ListPageShell>
        <PageHeader
          title={selected ? "Modifier l'annonce" : "Nouvelle annonce"}
          description="Rédigez le message, choisissez qui doit le recevoir, vérifiez l'aperçu puis publiez."
          actions={
            <button type="button" className="btn-secondary" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </button>
          }
        />

        {formError ? <p className="text-sm text-danger-1">{formError}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-neutral-7">
              Titre
              <input
                className="input mt-1 w-full text-lg font-semibold"
                value={draft.title}
                maxLength={200}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ex. Nouveau : la facturation normalisée arrive dans OwoDesk"
              />
            </label>
            <BlogRichEditor
              value={draft.body_html}
              resetKey={selected?.id || "new"}
              placeholder="Écrivez votre annonce. Ajoutez des liens avec le bouton dédié."
              onChange={(html) => setDraft((d) => ({ ...d, body_html: html }))}
            />
          </div>

          <aside className="space-y-4 rounded-2xl border border-neutral-4 bg-neutral-1 p-4 dark:border-neutral-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-9">Diffusion</p>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(status))}>
                {statusLabel(status)}
              </span>
            </div>

            <AnnouncementTargetPicker value={draft} onChange={setTarget} />

            {selected?.status === "published" ? (
              <p className="text-xs text-neutral-6">
                Publiée le {formatIsoDate(selected.published_at ?? undefined)} · fermée par{" "}
                <strong>{selected.dismissed_count}</strong> / {selected.target_users_count} utilisateurs.
              </p>
            ) : null}

            <div className="grid gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4" />
                Aperçu
              </button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={onSaveDraft}>
                {status === "published" ? "Enregistrer les modifications" : "Enregistrer le brouillon"}
              </button>
              {status !== "published" ? (
                <button type="button" className="btn-primary" disabled={busy} onClick={onPublish}>
                  <Send className="h-4 w-4" />
                  {status === "archived" ? "Republier" : "Publier"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    ask({
                      title: "Retirer cette annonce ?",
                      description: "Elle ne sera plus affichée aux utilisateurs qui ne l'ont pas encore fermée.",
                      confirmText: "Retirer",
                      danger: true,
                      action: () => selected && unpublishMut.mutate(selected.id),
                    })
                  }
                >
                  <EyeOff className="h-4 w-4" />
                  Retirer
                </button>
              )}
              {selected && status === "draft" ? (
                <button
                  type="button"
                  className="btn-secondary text-rose-700"
                  disabled={busy}
                  onClick={() =>
                    ask({
                      title: "Supprimer ce brouillon ?",
                      description: "Cette action est définitive.",
                      confirmText: "Supprimer",
                      danger: true,
                      action: () => deleteMut.mutate(selected.id),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              ) : null}
            </div>
          </aside>
        </div>

        {previewOpen ? (
          <AnnouncementPreviewModal
            title={draft.title}
            bodyHtml={draft.body_html}
            publishedAt={selected?.published_at}
            onClose={() => setPreviewOpen(false)}
          />
        ) : null}
        {renderDialog(publishMut.isPending || unpublishMut.isPending || deleteMut.isPending)}
        {toastNode}
      </ListPageShell>
    );
  }

  return (
    <ListPageShell>
      <PageHeader
        title="Annonces"
        description="Informez les utilisateurs du logiciel : le message s'affiche dans une modale à leur connexion, ou tout de suite s'ils sont connectés."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle annonce
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Titre ou contenu…" />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Tous les statuts"
          options={STATUS_OPTIONS}
        />
      </FilterBar>

      {listQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-6">Chargement…</p>
      ) : listQuery.isError ? (
        <p className="py-8 text-center text-sm text-danger-1">{getErrorMessage(listQuery.error)}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-4 py-12 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-neutral-5" />
          <p className="text-sm font-medium text-neutral-8">Aucune annonce pour l'instant</p>
          <p className="mt-1 text-xs text-neutral-6">
            Créez une annonce, vérifiez l'aperçu, puis publiez-la.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-1 text-xs uppercase tracking-wide text-neutral-6">
              <tr>
                <th className="px-3 py-2 font-medium">Annonce</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Destinataires</th>
                <th className="px-3 py-2 font-medium">Publiée le</th>
                <th className="px-3 py-2 font-medium">Fermée par</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer border-t border-neutral-4 hover:bg-neutral-1"
                  onClick={() => openEdit(a)}
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-neutral-9">{a.title}</p>
                    <p className="text-xs text-neutral-6">{a.created_by_email || "—"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(a.status))}>
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-7">{targetSummary(a)}</td>
                  <td className="px-3 py-3 text-neutral-6">{a.published_at ? formatIsoDate(a.published_at) : "—"}</td>
                  <td className="px-3 py-3 text-neutral-7">
                    {a.status === "draft" ? "—" : `${a.dismissed_count} / ${a.target_users_count}`}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {a.status === "published" ? (
                      <button
                        type="button"
                        className="btn-ghost h-8 px-2 text-xs"
                        title="Retirer"
                        onClick={(e) => {
                          e.stopPropagation();
                          ask({
                            title: "Retirer cette annonce ?",
                            description: "Elle ne sera plus affichée aux utilisateurs qui ne l'ont pas encore fermée.",
                            confirmText: "Retirer",
                            danger: true,
                            action: () => unpublishMut.mutate(a.id),
                          });
                        }}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Retirer
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-neutral-4 px-3 py-2 text-xs text-neutral-6">
            {items.length} annonce{items.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
      {renderDialog(unpublishMut.isPending)}
      {toastNode}
    </ListPageShell>
  );
}
