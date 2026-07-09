import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type CreditCatalogPack, type PatchCreditCatalogPayload } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";

type PackDraft = {
  code: string;
  label: string;
  credits: string;
  price_xof: string;
  is_active: boolean;
  sort_order: string;
};

function toDraft(pack: CreditCatalogPack): PackDraft {
  return {
    code: pack.code,
    label: pack.label,
    credits: String(pack.credits),
    price_xof: "",
    is_active: pack.is_active,
    sort_order: String(pack.sort_order),
  };
}

function formatXof(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export function CreditsCatalog() {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["admin-credit-catalog"],
    queryFn: () => adminApi.creditCatalog(),
  });

  const [unitPrice, setUnitPrice] = useState("15");
  const [purchaseEnabled, setPurchaseEnabled] = useState(true);
  const [packs, setPacks] = useState<PackDraft[]>([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!catalogQuery.data) return;
    setUnitPrice(String(catalogQuery.data.unit_price_xof));
    setPurchaseEnabled(catalogQuery.data.purchase_enabled);
    setPacks(catalogQuery.data.packs.map(toDraft));
  }, [catalogQuery.data]);

  const previewPacks = useMemo(() => {
    const unit = Math.max(1, Number(unitPrice) || 15);
    return packs.map((pack) => {
      const credits = Math.max(0, Number(pack.credits) || 0);
      const override = pack.price_xof.trim() ? Math.max(0, Number(pack.price_xof) || 0) : null;
      const price = override ?? credits * unit;
      return { ...pack, creditsNum: credits, price };
    });
  }, [packs, unitPrice]);

  const saveMutation = useMutation({
    mutationFn: (payload: PatchCreditCatalogPayload) => adminApi.patchCreditCatalog(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-credit-catalog"], data);
      setSaveError("");
    },
    onError: (err: unknown) => setSaveError(getErrorMessage(err)),
  });

  const handleSave = () => {
    const unit = Math.max(1, Number(unitPrice) || 15);
    const payload: PatchCreditCatalogPayload = {
      unit_price_xof: unit,
      purchase_enabled: purchaseEnabled,
      packs: packs.map((pack, index) => ({
        code: pack.code.trim().toLowerCase(),
        label: pack.label.trim(),
        credits: Math.max(0, Number(pack.credits) || 0),
        price_xof: pack.price_xof.trim() ? Math.max(0, Number(pack.price_xof) || 0) : null,
        is_active: pack.is_active,
        sort_order: Number(pack.sort_order) || index + 1,
      })),
    };
    saveMutation.mutate(payload);
  };

  const updatePack = (index: number, patch: Partial<PackDraft>) => {
    setPacks((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addPack = () => {
    setPacks((prev) => [
      ...prev,
      {
        code: `pack_${Date.now()}`,
        label: "Nouveau pack",
        credits: "500",
        price_xof: "",
        is_active: true,
        sort_order: String(prev.length + 1),
      },
    ]);
  };

  return (
    <ListPageShell>
      <PageHeader
        title="Catalogue crédits"
        subtitle="Prix unitaire et packs vendus via PAL (Mobile Money)."
      />

      {catalogQuery.isLoading ? (
        <p>Chargement…</p>
      ) : catalogQuery.isError ? (
        <p className="text-danger">{getErrorMessage(catalogQuery.error)}</p>
      ) : (
        <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>Prix unitaire (F CFA / crédit)</span>
              <input
                type="number"
                min={1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                style={{ width: "140px" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={purchaseEnabled}
                onChange={(e) => setPurchaseEnabled(e.target.checked)}
              />
              <span>Achat activé (tenants)</span>
            </label>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th>Crédits</th>
                  <th>Prix fixe (optionnel)</th>
                  <th>Prix calculé</th>
                  <th>Ordre</th>
                  <th>Actif</th>
                </tr>
              </thead>
              <tbody>
                {previewPacks.map((pack, index) => (
                  <tr key={`${pack.code}-${index}`}>
                    <td>
                      <input
                        value={pack.code}
                        onChange={(e) => updatePack(index, { code: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={pack.label}
                        onChange={(e) => updatePack(index, { label: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={pack.credits}
                        onChange={(e) => updatePack(index, { credits: e.target.value })}
                        style={{ width: "100px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        placeholder="auto"
                        value={pack.price_xof}
                        onChange={(e) => updatePack(index, { price_xof: e.target.value })}
                        style={{ width: "110px" }}
                      />
                    </td>
                    <td>{formatXof(pack.price)} F</td>
                    <td>
                      <input
                        type="number"
                        value={pack.sort_order}
                        onChange={(e) => updatePack(index, { sort_order: e.target.value })}
                        style={{ width: "70px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={pack.is_active}
                        onChange={(e) => updatePack(index, { is_active: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="button" className="btn-outline" onClick={addPack}>
              Ajouter un pack
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>

          {saveError ? <p className="text-danger">{saveError}</p> : null}
          {saveMutation.isSuccess ? (
            <p style={{ color: "var(--color-success, #16a34a)" }}>Catalogue mis à jour.</p>
          ) : null}
        </div>
      )}
    </ListPageShell>
  );
}
