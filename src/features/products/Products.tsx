import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Boxes,
  Layers,
  Package,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { OrgContextBanner } from "@/components/OrgContextBanner";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ProductEditModal } from "@/features/products/ProductEditModal";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { adminApi, type AdminProduct } from "@/lib/adminApi";
import { formatMoneyFromApi } from "@/lib/money";
import { ORG_QUERY_KEY, orgDetailPath, readOrgIdFromSearch } from "@/lib/orgNavigation";
import { paginatedCount } from "@/lib/pagination";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-brand-purple-500">{icon}</span>
      </div>
      <p className="m-0 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="m-0 mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orgFromUrl = readOrgIdFromSearch(`?${searchParams.toString()}`);
  const [q, setQ] = useState("");
  const [orgFilter, setOrgFilter] = useState(orgFromUrl || "");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [feedback, setFeedback] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(30);
  const qc = useQueryClient();

  const effectiveOrgId = orgFromUrl || orgFilter || undefined;

  const { data: orgsData } = useQuery({
    queryKey: ["orgs-picker"],
    queryFn: () => adminApi.organizations({ limit: 200, sort: "name" }),
    staleTime: 120_000,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-products", debouncedQ, effectiveOrgId, category, sort, page],
    queryFn: () =>
      adminApi.products({
        q: debouncedQ || undefined,
        org_id: effectiveOrgId,
        category: category || undefined,
        sort,
        limit: pageSize,
        offset,
      }),
  });

  const orgOptions = useMemo(
    () =>
      (orgsData?.results ?? []).map((o) => ({
        value: o.id,
        label: o.name,
      })),
    [orgsData],
  );

  const categoryOptions = useMemo(
    () => (data?.categories ?? []).map((c) => ({ value: c, label: c })),
    [data?.categories],
  );

  const rows = data?.results ?? [];
  const total = paginatedCount(data);

  const pageStock = useMemo(() => rows.reduce((sum, p) => sum + (p.stock_qty || 0), 0), [rows]);
  const pageVariants = useMemo(() => rows.reduce((sum, p) => sum + (p.variants_count || 0), 0), [rows]);

  const openEdit = (product: AdminProduct) => {
    setEditingProduct(product);
  };

  const handleOrgFilterChange = (value: string) => {
    setOrgFilter(value);
    resetPage();
    if (orgFromUrl) {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(ORG_QUERY_KEY, value);
      else next.delete(ORG_QUERY_KEY);
      setSearchParams(next, { replace: true });
    }
  };

  const clearOrgScope = () => {
    setOrgFilter("");
    resetPage();
    if (orgFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.delete(ORG_QUERY_KEY);
      setSearchParams(next, { replace: true });
    }
  };

  const scopedOrgName = orgFromUrl
    ? orgsData?.results?.find((o) => o.id === orgFromUrl)?.name
    : undefined;

  return (
    <ListPageShell>
      {orgFromUrl ? <OrgContextBanner orgId={orgFromUrl} label={scopedOrgName} /> : null}

      <PageHeader
        title={orgFromUrl ? "Produits de l'organisation" : "Catalogue produits"}
        description={
          orgFromUrl
            ? "Inventaire et tarification des articles pour ce tenant."
            : "Vue plateforme — recherche, filtrage et édition des produits par organisation."
        }
      />

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <KpiCard label="Produits" value={total} icon={<Package size={18} />} />
        <KpiCard
          label="Stock (page)"
          value={pageStock}
          hint="Somme des quantités affichées"
          icon={<Boxes size={18} />}
        />
        <KpiCard
          label="Variantes (page)"
          value={pageVariants}
          hint="Total des variantes listées"
          icon={<Layers size={18} />}
        />
        <KpiCard
          label="Catégories"
          value={categoryOptions.length}
          hint={effectiveOrgId ? "Pour ce tenant" : "Référencées"}
          icon={<TrendingUp size={18} />}
        />
      </div>

      <FilterBar>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            resetPage();
          }}
          placeholder="SKU, nom, catégorie, organisation…"
          className="min-w-[200px] flex-1"
        />
        {!orgFromUrl ? (
          <FilterSelect
            value={orgFilter}
            onChange={handleOrgFilterChange}
            placeholder="Toutes les orgs"
            options={orgOptions}
            className="h-9 min-w-[180px] shrink-0"
          />
        ) : null}
        <FilterSelect
          value={category}
          onChange={(v) => {
            setCategory(v);
            resetPage();
          }}
          placeholder="Toutes catégories"
          options={categoryOptions}
          className="h-9 min-w-[160px] shrink-0"
        />
        <FilterSelect
          value={sort}
          onChange={(v) => {
            setSort(v);
            resetPage();
          }}
          options={[
            { value: "-created_at", label: "Plus récents" },
            { value: "created_at", label: "Plus anciens" },
            { value: "name", label: "Nom A→Z" },
            { value: "-name", label: "Nom Z→A" },
            { value: "-sale_price", label: "Prix vente ↓" },
            { value: "sale_price", label: "Prix vente ↑" },
            { value: "-stock_qty", label: "Stock ↓" },
            { value: "stock_qty", label: "Stock ↑" },
          ]}
          className="h-9 w-[150px] shrink-0"
        />
        {orgFilter && !orgFromUrl ? (
          <button type="button" className="btn-secondary h-9 shrink-0 px-3 text-xs" onClick={clearOrgScope}>
            Effacer filtre org
          </button>
        ) : null}
      </FilterBar>

      {feedback ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300" role="status">
          {feedback}
        </p>
      ) : null}
      {isLoading ? <p className="text-xs text-text-muted dark:text-slate-400">Chargement…</p> : null}
      {isError ? <p className="text-sm text-red-700">{getErrorMessage(error)}</p> : null}

      <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Produit</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Catégorie</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Prix achat</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Prix vente</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Stock</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Var.</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Créé</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-200 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-purple-100 text-brand-purple-700 dark:bg-brand-purple-900/40 dark:text-brand-purple-300">
                      <Package size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 truncate font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                      <code className="text-[11px] text-slate-500">{p.sku}</code>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="inline-flex max-w-[160px] items-center gap-1 truncate text-left text-xs font-medium text-brand-purple-700 hover:underline dark:text-brand-purple-300"
                    onClick={() => navigate(orgDetailPath(p.org.id))}
                    title={p.org.name}
                  >
                    <Building2 size={12} className="shrink-0" />
                    <span className="truncate">{p.org.name}</span>
                  </button>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{p.category || "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                  {formatMoneyFromApi(p.purchase_price)}
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                  {formatMoneyFromApi(p.sale_price)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                  {p.stock_qty}
                  <span className="ml-0.5 text-[10px] text-slate-400">{p.unit}</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                  {p.variants_count}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{formatIsoDate(p.created_at)}</td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-sm text-slate-400">
                  Aucun produit ne correspond aux critères.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {editingProduct ? (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setEditingProduct(null);
            setFeedback(`Produit « ${updated.name} » mis à jour.`);
            qc.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      ) : null}
    </ListPageShell>
  );
}
