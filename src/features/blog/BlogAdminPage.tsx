import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Newspaper, Plus, Trash2 } from "lucide-react";
import { adminApi, type BlogPost } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { cn } from "@/lib/utils";
import { BlogRichEditor } from "./BlogRichEditor";

const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://www.owo.bj").replace(/\/$/, "");

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publié" },
  { value: "archived", label: "Archivé" },
];

const emptyDraft = {
  title: "",
  slug: "",
  excerpt: "",
  cover_url: "",
  body_html: "",
  status: "draft",
  author_name: "",
  seo_title: "",
  seo_description: "",
  tags: "",
};

function statusClass(status: string) {
  if (status === "published") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "archived") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function BlogAdminPage() {
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);

  const listQuery = useQuery({
    queryKey: ["admin-blog", search, statusFilter],
    queryFn: () =>
      adminApi.blogPosts({
        q: search || undefined,
        status: statusFilter || undefined,
        limit: 200,
      }),
  });

  const posts = listQuery.data?.results ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-blog"] });

  const createMut = useMutation({
    mutationFn: (payload: Partial<BlogPost> & { title: string }) => adminApi.createBlogPost(payload),
    onSuccess: (data) => {
      setSelectedId(data.id);
      setDraft({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        cover_url: data.cover_url,
        body_html: data.body_html,
        status: data.status,
        author_name: data.author_name,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        tags: (data.tags || []).join(", "),
      });
      setFormError("");
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; data: Partial<BlogPost> }) =>
      adminApi.updateBlogPost(payload.id, payload.data),
    onSuccess: (data) => {
      setDraft({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        cover_url: data.cover_url,
        body_html: data.body_html,
        status: data.status,
        author_name: data.author_name,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        tags: (data.tags || []).join(", "),
      });
      setFormError("");
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlogPost(id),
    onSuccess: () => {
      close();
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const counts = useMemo(() => {
    const all = listQuery.data?.count ?? posts.length;
    return { all, listed: posts.length };
  }, [listQuery.data?.count, posts.length]);

  const openCreate = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
    setFormError("");
    setMode("edit");
  };

  const openEdit = (post: BlogPost) => {
    setSelectedId(post.id);
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      cover_url: post.cover_url,
      body_html: post.body_html,
      status: post.status,
      author_name: post.author_name,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      tags: (post.tags || []).join(", "),
    });
    setFormError("");
    setMode("edit");
  };

  const payloadFromDraft = (status = draft.status) => ({
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    excerpt: draft.excerpt.trim(),
    cover_url: draft.cover_url.trim(),
    body_html: draft.body_html,
    status,
    author_name: draft.author_name.trim(),
    seo_title: draft.seo_title.trim(),
    seo_description: draft.seo_description.trim(),
    tags: parseTags(draft.tags),
  });

  const save = (status = draft.status) => {
    const title = draft.title.trim();
    if (!title) {
      setFormError("Indiquez un titre.");
      return;
    }
    const payload = payloadFromDraft(status);
    if (selectedId) {
      updateMut.mutate({ id: selectedId, data: payload });
    } else {
      createMut.mutate(payload);
    }
    setDraft((d) => ({ ...d, status }));
  };

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    try {
      const uploaded = await adminApi.uploadImage(file);
      if (uploaded?.url) setDraft((d) => ({ ...d, cover_url: uploaded.url }));
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setCoverBusy(false);
    }
  };

  const busy = createMut.isPending || updateMut.isPending;

  if (mode === "edit") {
    return (
      <ListPageShell>
        <PageHeader
          title={selectedId ? "Modifier l'article" : "Nouvel article"}
          description="Rédigez comme dans un traitement de texte, puis publiez. L'article apparaît ensuite sur owo.bj/blog."
          actions={
            <button type="button" className="btn-secondary" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </button>
          }
        />

        {formError ? <p className="text-sm text-danger-1">{formError}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-neutral-7">
              Titre
              <input
                className="input mt-1 w-full text-lg font-semibold"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ex. Comment facturer avec la MECeF au Bénin"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-7">
              Chapô (résumé affiché sur la liste)
              <textarea
                className="input mt-1 min-h-[84px] w-full"
                value={draft.excerpt}
                onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
                placeholder="2 à 3 phrases pour donner envie de lire…"
              />
            </label>
            <p className="text-xs text-neutral-6">
              Images dans l&apos;article : <strong>1200 × 800 px</strong> max, JPEG ou WebP, moins de 400&nbsp;Ko.
              Évitez les captures d&apos;écran floues.
            </p>
            <BlogRichEditor
              value={draft.body_html}
              resetKey={selectedId || "new"}
              onChange={(html) => setDraft((d) => ({ ...d, body_html: html }))}
            />
          </div>

          <aside className="space-y-3 rounded-2xl border border-neutral-4 bg-neutral-1 p-4 dark:border-neutral-6">
            <p className="text-sm font-semibold text-neutral-9">Publication</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => save("draft")}>
                Enregistrer le brouillon
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => save("published")}>
                Publier
              </button>
            </div>
            {selectedId && draft.status === "published" ? (
              <a
                className="inline-flex items-center gap-1 text-sm text-primary-1"
                href={`${PUBLIC_SITE}/blog/${draft.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Voir sur le site
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-xs text-neutral-6">
                Tant que l'article n'est pas publié, il n'est visible que ici.
              </p>
            )}

            <label className="block text-xs font-medium text-neutral-7">
              Auteur affiché
              <input
                className="input mt-1 w-full"
                value={draft.author_name}
                onChange={(e) => setDraft((d) => ({ ...d, author_name: e.target.value }))}
                placeholder="Ex. Équipe OwoDesk"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-7">
              Adresse web (slug)
              <input
                className="input mt-1 w-full"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="généré automatiquement si vide"
              />
            </label>
            <label className="block text-xs font-medium text-neutral-7">
              Mots-clés (séparés par des virgules)
              <input
                className="input mt-1 w-full"
                value={draft.tags}
                onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                placeholder="PME, facturation, MECeF"
              />
            </label>
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-7">Image de couverture</p>
              <p className="text-xs leading-relaxed text-neutral-6">
                Taille idéale : <strong>1200 × 630 px</strong> (paysage 16:9). JPEG ou WebP, moins de
                400&nbsp;Ko. Placez le sujet au centre : la liste et l&apos;article recadrent légèrement
                les bords. C&apos;est aussi le format WhatsApp / LinkedIn.
              </p>
              {draft.cover_url ? (
                <img src={draft.cover_url} alt="" className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-neutral-4 text-xs text-neutral-6">
                  1200 × 630 px
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={coverBusy}
                onChange={(e) => {
                  void onCover(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <label className="block text-xs font-medium text-neutral-7">
              Titre Google (optionnel)
              <input
                className="input mt-1 w-full"
                value={draft.seo_title}
                onChange={(e) => setDraft((d) => ({ ...d, seo_title: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-medium text-neutral-7">
              Description Google (optionnel)
              <textarea
                className="input mt-1 min-h-[72px] w-full"
                value={draft.seo_description}
                onChange={(e) => setDraft((d) => ({ ...d, seo_description: e.target.value }))}
              />
            </label>
            {selectedId ? (
              <button
                type="button"
                className="btn-secondary w-full text-rose-700"
                onClick={() =>
                  ask({
                    title: "Supprimer cet article ?",
                    description: "Il disparaîtra du site public s'il était publié.",
                    danger: true,
                    confirmText: "Supprimer",
                    action: () => deleteMut.mutate(selectedId),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            ) : null}
          </aside>
        </div>
        {renderDialog()}
      </ListPageShell>
    );
  }

  return (
    <ListPageShell>
      <PageHeader
        title="Blog OwoDesk"
        description="Rédigez et publiez des articles sur www.owo.bj/blog, sans passer par un développeur."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvel article
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Titre, auteur, slug…" />
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
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-4 py-12 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-neutral-5" />
          <p className="text-sm font-medium text-neutral-8">Aucun article pour l'instant</p>
          <p className="mt-1 text-xs text-neutral-6">Créez le premier article, enregistrez un brouillon, puis publiez.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-1 text-xs uppercase tracking-wide text-neutral-6">
              <tr>
                <th className="px-3 py-2 font-medium">Article</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Auteur</th>
                <th className="px-3 py-2 font-medium">Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="cursor-pointer border-t border-neutral-4 hover:bg-neutral-1"
                  onClick={() => openEdit(post)}
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-neutral-9">{post.title}</p>
                    <p className="text-xs text-neutral-6">/blog/{post.slug}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(post.status))}>
                      {statusLabel(post.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-7">{post.author_name || "—"}</td>
                  <td className="px-3 py-3 text-neutral-6">{formatIsoDate(post.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-neutral-4 px-3 py-2 text-xs text-neutral-6">
            {counts.listed} article{counts.listed > 1 ? "s" : ""}
          </p>
        </div>
      )}
      {renderDialog()}
    </ListPageShell>
  );
}
