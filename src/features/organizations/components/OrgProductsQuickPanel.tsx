import { useNavigate } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { orgProductsPath } from "@/lib/orgNavigation";

type Props = {
  orgId: string;
  orgName: string;
  productsCount?: number;
};

/** Accès rapide au catalogue produits d'une organisation. */
export function OrgProductsQuickPanel({ orgId, orgName, productsCount }: Props) {
  const navigate = useNavigate();

  const previewQuery = useQuery({
    queryKey: ["admin-products-preview", orgId],
    queryFn: () => adminApi.products({ org_id: orgId, limit: 5, sort: "-created_at" }),
    staleTime: 60_000,
  });

  const total = previewQuery.data?.count ?? productsCount ?? 0;
  const preview = previewQuery.data?.results ?? [];

  return (
    <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <Package size={14} /> Catalogue produits
          </h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            {total} produit{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""} pour {orgName}
          </p>
        </div>
        <button
          type="button"
          className="btn-magenta inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          onClick={() => navigate(orgProductsPath(orgId))}
        >
          Gérer les produits
          <ArrowRight size={14} />
        </button>
      </div>

      {previewQuery.isLoading ? (
        <p className="px-5 py-6 text-sm text-slate-500">Chargement du catalogue…</p>
      ) : preview.length ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {preview.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <p className="m-0 truncate font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                <p className="m-0 text-[11px] text-slate-500">
                  <code>{p.sku}</code>
                  {p.category ? ` · ${p.category}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                Stock {p.stock_qty}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-slate-400">Aucun produit pour cette organisation.</p>
      )}
    </section>
  );
}
