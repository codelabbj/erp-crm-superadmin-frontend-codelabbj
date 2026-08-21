import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { adminApi, type AdminProduct, type AdminProductUpdate } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

type Props = {
  product: AdminProduct;
  onClose: () => void;
  onSaved: (updated: AdminProduct) => void;
};

export function ProductEditModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    sku: product.sku,
    name: product.name,
    description: product.description,
    unit: product.unit,
    purchase_price: product.purchase_price,
    sale_price: product.sale_price,
  });
  const [error, setError] = useState("");
  const { ask, close, renderDialog } = useConfirmDialog();

  useEffect(() => {
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      unit: product.unit,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
    });
    setError("");
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (payload: AdminProductUpdate) => adminApi.updateProduct(product.id, payload),
    onSuccess: (updated) => onSaved(updated),
    onError: (e) => setError(getErrorMessage(e)),
    onSettled: () => close(),
  });

  const handleSubmit = () => {
    setError("");
    if (!form.sku.trim() || !form.name.trim()) {
      setError("SKU et nom sont obligatoires.");
      return;
    }
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description,
      unit: form.unit.trim() || "u",
      purchase_price: form.purchase_price,
      sale_price: form.sale_price,
    };
    ask({
      description: `Enregistrer les modifications sur « ${form.name.trim()} » ?`,
      confirmText: "Enregistrer",
      action: () => saveMutation.mutate(payload),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="grid w-full max-w-lg gap-4 rounded-2xl border border-border-soft bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-lg font-bold text-slate-900 dark:text-slate-100">Modifier le produit</h3>
            <p className="m-0 mt-1 text-xs text-slate-500">
              {product.org.name} · {product.category || "Sans catégorie"}
            </p>
          </div>
          <button type="button" className="btn-ghost h-9 w-9 p-0 text-slate-400" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500 sm:col-span-2">
            SKU
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500 sm:col-span-2">
            Nom
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500 sm:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500">
            Unité
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500">
            Prix d&apos;achat
            <input
              type="number"
              min={0}
              step="1"
              value={form.purchase_price}
              onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
              className="w-full"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-slate-500 sm:col-span-2">
            Prix de vente
            <input
              type="number"
              min={0}
              step="1"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              className="w-full"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saveMutation.isPending}>
            Annuler
          </button>
          <button type="button" className="btn-magenta" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
      {renderDialog(saveMutation.isPending)}
    </div>
  );
}
