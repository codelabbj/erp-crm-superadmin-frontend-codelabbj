import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Crown, Globe2, Layers, Users, X } from "lucide-react";
import {
  adminApi,
  type AnnouncementAudience,
  type AnnouncementTarget,
  type AnnouncementTargetType,
} from "@/lib/adminApi";
import { SearchInput } from "@/components/ui/FilterBar";
import { cn } from "@/lib/utils";

type Props = {
  value: AnnouncementTarget;
  onChange: (next: AnnouncementTarget) => void;
};

const TARGET_OPTIONS: { value: AnnouncementTargetType; label: string; icon: typeof Globe2 }[] = [
  { value: "all", label: "Toutes", icon: Globe2 },
  { value: "orgs", label: "Organisations", icon: Building2 },
  { value: "plans", label: "Plans", icon: Layers },
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; icon: typeof Users }[] = [
  { value: "members", label: "Tous les membres", icon: Users },
  { value: "owners", label: "Propriétaires", icon: Crown },
];

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon: typeof Globe2 }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-neutral-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition",
            value === v
              ? "bg-neutral-0 text-primary-1 shadow-sm"
              : "text-neutral-7 hover:text-neutral-9",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function AnnouncementTargetPicker({ value, onChange }: Props) {
  const [orgSearch, setOrgSearch] = useState("");
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounced(orgSearch);
  const debouncedTarget = useDebounced(value, 400);

  const orgsQuery = useQuery({
    queryKey: ["announcement-orgs", debouncedSearch],
    queryFn: () => adminApi.organizations({ q: debouncedSearch || undefined, limit: 30, sort: "name" }),
    enabled: value.target_type === "orgs",
  });

  const plansQuery = useQuery({
    queryKey: ["announcement-plans"],
    queryFn: () => adminApi.licensingPlans(),
    enabled: value.target_type === "plans",
  });

  const reachQuery = useQuery({
    queryKey: ["announcement-reach", debouncedTarget],
    queryFn: () => adminApi.announcementTargetPreview(debouncedTarget),
  });

  const set = (patch: Partial<AnnouncementTarget>) => onChange({ ...value, ...patch });
  const orgs = orgsQuery.data?.results ?? [];
  const plans = plansQuery.data ?? [];
  const orgName = (id: string) => orgNames[id] || orgs.find((o) => o.id === id)?.name || "Organisation";
  const toggleOrg = (id: string, name: string) => {
    setOrgNames((prev) => ({ ...prev, [id]: name }));
    set({ target_org_ids: toggle(value.target_org_ids, id) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-neutral-7">Destinataires</p>
        <Segmented options={TARGET_OPTIONS} value={value.target_type} onChange={(v) => set({ target_type: v })} />
      </div>

      {value.target_type === "orgs" ? (
        <div className="space-y-2">
          {value.target_org_ids.length ? (
            <div className="flex flex-wrap gap-1.5">
              {value.target_org_ids.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-5 px-2 py-0.5 text-xs font-medium text-primary-6 dark:text-primary-9"
                >
                  {orgName(id)}
                  <button
                    type="button"
                    aria-label="Retirer"
                    onClick={() => set({ target_org_ids: value.target_org_ids.filter((x) => x !== id) })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <SearchInput value={orgSearch} onChange={setOrgSearch} placeholder="Rechercher une organisation…" />
          <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-neutral-4 bg-neutral-0 p-1">
            {orgsQuery.isLoading ? (
              <p className="px-2 py-3 text-center text-xs text-neutral-6">Chargement…</p>
            ) : orgs.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-neutral-6">Aucune organisation trouvée</p>
            ) : (
              orgs.map((org) => (
                <label
                  key={org.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-1"
                >
                  <input
                    type="checkbox"
                    checked={value.target_org_ids.includes(org.id)}
                    onChange={() => toggleOrg(org.id, org.name)}
                  />
                  <span className="min-w-0 flex-1 truncate text-neutral-9">{org.name}</span>
                  {org.plan_name ? <span className="shrink-0 text-[11px] text-neutral-6">{org.plan_name}</span> : null}
                </label>
              ))
            )}
          </div>
        </div>
      ) : null}

      {value.target_type === "plans" ? (
        <div className="flex flex-wrap gap-1.5">
          {plansQuery.isLoading ? (
            <p className="text-xs text-neutral-6">Chargement des plans…</p>
          ) : (
            plans.map((plan) => {
              const checked = value.target_plan_ids.includes(plan.id);
              return (
                <label
                  key={plan.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    checked
                      ? "border-primary-1 bg-primary-5 text-primary-6 dark:text-primary-9"
                      : "border-neutral-4 text-neutral-7 hover:border-neutral-6",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => set({ target_plan_ids: toggle(value.target_plan_ids, plan.id) })}
                  />
                  {plan.name}
                  {!plan.is_active ? <span className="text-[10px] opacity-70">(inactif)</span> : null}
                </label>
              );
            })
          )}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-neutral-7">Public</p>
        <Segmented options={AUDIENCE_OPTIONS} value={value.audience} onChange={(v) => set({ audience: v })} />
      </div>

      <div className="rounded-xl border border-primary-1/30 bg-primary-5 px-3 py-2 text-xs text-primary-6 dark:text-primary-9">
        {reachQuery.data ? (
          <>
            <strong>{reachQuery.data.users_count}</strong> utilisateur{reachQuery.data.users_count > 1 ? "s" : ""} dans{" "}
            <strong>{reachQuery.data.orgs_count}</strong> organisation{reachQuery.data.orgs_count > 1 ? "s" : ""}
          </>
        ) : (
          "Calcul de la portée…"
        )}
      </div>
    </div>
  );
}
