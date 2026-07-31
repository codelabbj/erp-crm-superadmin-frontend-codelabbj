import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Bug,
  Lightbulb,
  MessageSquarePlus,
  ExternalLink,
  Send,
  Trophy,
} from "lucide-react";
import { adminApi, type ProductFeedbackItem } from "@/lib/adminApi";
import { orgDetailPath } from "@/lib/orgNavigation";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  bug: Bug,
  improvement: Lightbulb,
  comment: MessageSquarePlus,
} as const;

const STATUS_OPTIONS = [
  { value: "new", label: "Nouveau" },
  { value: "in_progress", label: "En cours" },
  { value: "needs_info", label: "Besoin d'info" },
  { value: "planned", label: "Planifié" },
  { value: "resolved", label: "Résolu" },
  { value: "closed", label: "Clos" },
  { value: "rejected", label: "Rejeté" },
];

const STATUS_TABS = [{ value: "", label: "Tous" }, ...STATUS_OPTIONS] as const;

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "improvement", label: "Amélioration" },
  { value: "comment", label: "Commentaire" },
];

function typeLabel(value: string) {
  return TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function ProductFeedbackPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("feedback_id") || "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, pageSize, resetPage } = usePaginationState(20);

  const [selected, setSelected] = useState<ProductFeedbackItem | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [fixedVersion, setFixedVersion] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [detailError, setDetailError] = useState("");

  const listQuery = useQuery({
    queryKey: [
      "product-feedback",
      debouncedSearch,
      statusFilter,
      typeFilter,
      page,
      pageSize,
      focusId,
    ],
    queryFn: () =>
      adminApi.productFeedback({
        q: debouncedSearch || undefined,
        status: statusFilter || undefined,
        feedback_type: typeFilter || undefined,
        feedback_id: focusId || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const topReportersQuery = useQuery({
    queryKey: ["product-feedback-top-reporters"],
    queryFn: () => adminApi.productFeedbackTopReporters({ limit: 5 }),
  });

  const items = listQuery.data?.results ?? [];
  const total = listQuery.data?.count ?? 0;
  const topReporters = topReportersQuery.data?.results ?? [];

  useEffect(() => {
    if (!focusId || !items.length) return;
    const match = items.find((item) => item.id === focusId);
    if (match) openDetail(match);
  }, [focusId, items]);

  const updateMut = useMutation({
    mutationFn: (payload: {
      id: string;
      status?: string;
      admin_notes?: string;
      assigned_to_email?: string;
      fixed_in_version?: string;
    }) => adminApi.updateProductFeedback(payload.id, payload),
    onSuccess: (data) => {
      setSelected(data);
      void queryClient.invalidateQueries({ queryKey: ["product-feedback"] });
      void queryClient.invalidateQueries({ queryKey: ["product-feedback-top-reporters"] });
      setDetailError("");
    },
    onError: (err: unknown) => setDetailError(getErrorMessage(err)),
  });

  const replyMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      adminApi.replyProductFeedback(id, body),
    onSuccess: () => {
      setReplyBody("");
      void queryClient.invalidateQueries({ queryKey: ["product-feedback"] });
      if (selected) {
        void adminApi.productFeedbackDetail(selected.id).then(setSelected);
      }
      setDetailError("");
    },
    onError: (err: unknown) => setDetailError(getErrorMessage(err)),
  });

  const openDetail = (item: ProductFeedbackItem) => {
    setSelected(item);
    setStatusDraft(item.status);
    setAdminNotes(item.admin_notes || "");
    setAssignedEmail(item.assigned_to_email || "");
    setFixedVersion(item.fixed_in_version || "");
    setReplyBody("");
    setDetailError("");
  };

  const closeDetail = () => {
    setSelected(null);
    if (focusId) {
      searchParams.delete("feedback_id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <ListPageShell>
      <PageHeader
        title="Retours utilisateurs"
        description="Bugs, idées et commentaires remontés depuis l'application OwoDesk."
      />

      <nav
        className="-mb-px flex gap-0.5 overflow-x-auto border-b border-neutral-4 dark:border-neutral-6"
        aria-label="Filtrer par statut"
        role="tablist"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setStatusFilter(tab.value);
                resetPage();
              }}
              className={cn(
                "relative shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary-1 bg-primary-5/40 text-primary-1"
                  : "border-transparent text-neutral-6 hover:bg-neutral-1 hover:text-neutral-8",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {topReporters.length > 0 || topReportersQuery.isLoading ? (
        <div className="rounded-2xl border border-neutral-4 bg-neutral-0 p-4 dark:border-neutral-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary-1" />
            <h3 className="text-sm font-semibold text-neutral-9 dark:text-neutral-10">
              Top contributeurs
            </h3>
            <span className="text-xs text-neutral-6">5 utilisateurs les plus actifs</span>
          </div>
          {topReportersQuery.isLoading ? (
            <p className="text-sm text-neutral-6">Chargement…</p>
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {topReporters.map((reporter, index) => (
                <li key={reporter.email}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-xl border border-neutral-4 px-3 py-2 text-left transition hover:border-primary-3 hover:bg-neutral-1 dark:border-neutral-6"
                    onClick={() => {
                      setSearch(reporter.email);
                      resetPage();
                    }}
                    title={`Filtrer les retours de ${reporter.email}`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-2 text-[11px] font-bold text-neutral-7 dark:bg-neutral-7 dark:text-neutral-3">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-9 dark:text-neutral-10">
                        {reporter.name || reporter.email}
                      </span>
                      {reporter.name ? (
                        <span className="block truncate text-xs text-neutral-6">{reporter.email}</span>
                      ) : null}
                      <span className="mt-0.5 block text-xs font-semibold text-primary-1">
                        {reporter.feedback_count} retour{reporter.feedback_count > 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Référence, titre, e-mail…"
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            resetPage();
          }}
          placeholder="Tous les types"
          options={TYPE_OPTIONS}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-2xl border border-neutral-4 bg-neutral-0 dark:border-neutral-6">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-4 bg-neutral-1 text-xs uppercase tracking-wide text-neutral-6 dark:border-neutral-6">
            <tr>
              <th className="px-4 py-3">Réf.</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-6">
                  Chargement…
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-6">
                  Aucun retour
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const Icon = TYPE_ICONS[item.feedback_type as keyof typeof TYPE_ICONS] ?? MessageSquarePlus;
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-neutral-4 hover:bg-neutral-1 dark:border-neutral-6"
                    onClick={() => openDetail(item)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {typeLabel(item.feedback_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.title}</td>
                    <td className="px-4 py-3">{item.org_name}</td>
                    <td className="px-4 py-3">{statusLabel(item.status)}</td>
                    <td className="px-4 py-3 text-neutral-6">{formatIsoDate(item.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 sm:p-4">
          <aside className="flex h-full w-full max-w-xl flex-col bg-neutral-0 shadow-2xl dark:bg-neutral-9">
            <header className="flex items-start justify-between border-b border-neutral-4 px-5 py-4 dark:border-neutral-6">
              <div>
                <p className="font-mono text-xs text-neutral-6">{selected.reference}</p>
                <h2 className="text-lg font-bold text-neutral-9 dark:text-neutral-10">
                  {selected.title}
                </h2>
                <p className="text-sm text-neutral-6">
                  {selected.org_name} · {selected.reporter_name || selected.reporter_email}
                </p>
              </div>
              <button type="button" className="btn-ghost" onClick={closeDetail}>
                Fermer
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="rounded-xl border border-neutral-4 p-3 text-sm dark:border-neutral-6">
                <p className="whitespace-pre-wrap">{selected.description}</p>
              </div>

              {selected.context?.page_url ? (
                <a
                  href={selected.context.page_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-1 hover:underline"
                >
                  {selected.context.page_url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {selected.screenshot_urls?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {selected.screenshot_urls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="rounded-lg border border-neutral-4" />
                    </a>
                  ))}
                </div>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Statut</span>
                <select
                  className="input w-full"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Notes internes</span>
                <textarea
                  className="input w-full min-h-20"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Assigné à (e-mail)</span>
                <input
                  className="input w-full"
                  value={assignedEmail}
                  onChange={(e) => setAssignedEmail(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Corrigé en version</span>
                <input
                  className="input w-full"
                  value={fixedVersion}
                  onChange={(e) => setFixedVersion(e.target.value)}
                />
              </label>

              {selected.messages?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Messages</p>
                  {selected.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        msg.is_staff
                          ? "border-primary-3 bg-primary-5/30"
                          : "border-neutral-4 dark:border-neutral-6",
                      )}
                    >
                      <p className="text-xs text-neutral-6">
                        {msg.author_name || msg.author_email || "Utilisateur"} ·{" "}
                        {formatIsoDate(msg.created_at)}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Répondre à l'utilisateur</span>
                <textarea
                  className="input w-full min-h-24"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Votre réponse sera envoyée par e-mail…"
                />
              </label>

              {detailError ? <p className="text-sm text-danger-1">{detailError}</p> : null}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-neutral-4 px-5 py-4 dark:border-neutral-6">
              <button
                type="button"
                className="btn-primary"
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    id: selected.id,
                    status: statusDraft,
                    admin_notes: adminNotes,
                    assigned_to_email: assignedEmail,
                    fixed_in_version: fixedVersion,
                  })
                }
              >
                Enregistrer
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!replyBody.trim() || replyMut.isPending}
                onClick={() => replyMut.mutate({ id: selected.id, body: replyBody.trim() })}
              >
                <Send className="h-4 w-4" />
                Envoyer la réponse
              </button>
              <a
                className="btn-ghost ml-auto"
                href={orgDetailPath(selected.org, "overview")}
              >
                Voir l'organisation
              </a>
            </footer>
          </aside>
        </div>
      ) : null}
    </ListPageShell>
  );
}
