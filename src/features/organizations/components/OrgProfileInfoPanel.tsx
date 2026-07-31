import type { ReactNode } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Scale,
  Coins,
  Receipt,
  Settings2,
  KeyRound,
  Info,
} from "lucide-react";
import type { OrganizationDetail } from "@/lib/adminApi";
import { formatIsoDate } from "@/lib/ui";

function display(value: string | number | null | undefined, empty = "—"): string {
  if (value == null) return empty;
  const s = String(value).trim();
  return s || empty;
}

function boolLabel(value: boolean | undefined): string {
  if (value == null) return "—";
  return value ? "Oui" : "Non";
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</dt>
      <dd
        className={`mt-0.5 m-0 break-words text-sm text-slate-800 dark:text-slate-200 ${
          mono ? "font-mono text-[12px]" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <h4 className="m-0 mb-3 flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
        {icon}
        {title}
      </h4>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-4 gap-y-3">{children}</dl>
    </div>
  );
}

const INVOICE_MODE_LABELS: Record<string, string> = {
  simple: "Simple uniquement",
  normalized: "Normalisée uniquement",
  both: "Simple + normalisée",
};

const DEPLOYMENT_LABELS: Record<string, string> = {
  platform: "Plateforme OwoDesk",
  dedicated: "Serveur dédié",
};

type Props = {
  org: OrganizationDetail;
};

export function OrgProfileInfoPanel({ org }: Props) {
  const taxLabel = display(org.tax_id_label, "IFU");

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <Info size={14} /> Informations enregistrées
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-400">
            Profil tel que renseigné par l&apos;organisation (facturation Business, documents,
            support…). Lecture seule.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <Section title="Identité légale" icon={<Scale size={13} />}>
          <Field label="Raison sociale" value={display(org.name)} />
          <Field label="Slug" value={display(org.slug)} mono />
          <Field label="Forme juridique" value={display(org.legal_form)} />
          <Field label="Gérant principal" value={display(org.primary_manager_name)} />
          <Field label="RCCM" value={display(org.rccm)} mono />
          <Field
            label="Capital social"
            value={
              org.capital_social
                ? `${Number(org.capital_social).toLocaleString("fr-FR")} ${display(org.currency_display || org.currency, "")}`
                : "—"
            }
          />
          <Field label="Code espace employé" value={display(org.employee_code)} mono />
          <Field
            label="Hébergement"
            value={
              org.deployment_type
                ? DEPLOYMENT_LABELS[org.deployment_type] ?? org.deployment_type
                : "—"
            }
          />
        </Section>

        <Section title="Contact" icon={<Building2 size={13} />}>
          <Field
            label="Email"
            value={
              org.email ? (
                <a className="text-brand-purple-700 hover:underline dark:text-brand-purple-300" href={`mailto:${org.email}`}>
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12} /> {org.email}
                  </span>
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Téléphone"
            value={
              org.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={12} /> {org.phone}
                </span>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Adresse"
            value={
              org.address ? (
                <span className="inline-flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0" /> {org.address}
                </span>
              ) : (
                "—"
              )
            }
          />
        </Section>

        <Section title="Locale & devise" icon={<Coins size={13} />}>
          <Field label="Pays" value={display(org.country)} />
          <Field label="Devise (ISO)" value={display(org.currency)} mono />
          <Field label="Libellé monétaire" value={display(org.currency_display)} />
          <Field label="Décimales affichées" value={boolLabel(org.show_decimals)} />
          <Field label="Fuseau" value={display(org.timezone)} mono />
          <Field label="Locale" value={display(org.locale)} mono />
        </Section>

        <Section title="Fiscalité" icon={<Receipt size={13} />}>
          <Field label={taxLabel} value={display(org.tax_id)} mono />
          <Field label="Assujetti TVA" value={boolLabel(org.is_vat_registered)} />
          <Field
            label="Taux TVA"
            value={org.vat_rate != null ? `${org.vat_rate} %` : "—"}
          />
          <Field
            label="Mode facture"
            value={
              org.invoice_mode
                ? INVOICE_MODE_LABELS[org.invoice_mode] ?? org.invoice_mode
                : "—"
            }
          />
          <Field label="Adaptateur fiscal" value={display(org.fiscal_adapter_code)} mono />
          <Field label="Fiscal POS" value={boolLabel(org.fiscal_pos_enabled)} />
          <Field label="Facture normalisée" value={boolLabel(org.fiscal_invoice_enabled)} />
        </Section>

        <Section title="Facturation & opérations" icon={<Settings2 size={13} />}>
          <Field
            label="Édition groupe taxe ligne"
            value={boolLabel(org.billing_allow_line_tax_group_edit)}
          />
          <Field
            label="Seuil remise POS"
            value={
              org.pos_discount_threshold_percent != null
                ? `${org.pos_discount_threshold_percent} %`
                : "—"
            }
          />
          <Field label="Comptabilité auto" value={boolLabel(org.auto_accounting)} />
          <Field label="Vérif. géoloc." value={boolLabel(org.require_geo_verification)} />
          <Field
            label="Rapport avant départ"
            value={boolLabel(org.require_daily_report_before_clock_out)}
          />
          <Field
            label="Départ avant rapport"
            value={boolLabel(org.require_clock_out_before_daily_report)}
          />
          <Field label="Entrepôt défaut" value={display(org.default_warehouse_id)} mono />
          <Field
            label="Message pied de facture"
            value={display(org.invoice_footer_message)}
          />
          <Field
            label="Logo URL"
            value={display(org.logo_url)}
            mono
          />
          <Field
            label="Signature / cachet"
            value={display(org.signature_url)}
            mono
          />
          <Field
            label="Préférences paiement (JSON)"
            value={
              org.payment_settings && Object.keys(org.payment_settings).length > 0 ? (
                <pre className="m-0 max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-white/80 p-2 text-[11px] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {JSON.stringify(org.payment_settings, null, 2)}
                </pre>
              ) : (
                "—"
              )
            }
          />
        </Section>

        <Section title="Paiements PAL" icon={<KeyRound size={13} />}>
          <Field
            label="Secret key"
            value={
              org.pal_secret_key_set
                ? display(org.pal_secret_key, "••••••")
                : "Non configurée"
            }
            mono
          />
          <Field
            label="Public key"
            value={
              org.pal_public_key_set
                ? display(org.pal_public_key, "••••••")
                : "Non configurée"
            }
            mono
          />
          <Field
            label="User ID"
            value={org.pal_user_id_set ? display(org.pal_user_id) : "Non configuré"}
            mono
          />
        </Section>

        <Section title="Métadonnées" icon={<Info size={13} />}>
          <Field label="Créée le" value={formatIsoDate(org.created_at) || "—"} />
          <Field
            label="Mise à jour"
            value={org.updated_at ? formatIsoDate(org.updated_at) || "—" : "—"}
          />
          <Field label="Active" value={boolLabel(org.is_active)} />
          <Field label="Statut plan" value={display(org.plan_status)} />
          <Field
            label="Cycle"
            value={
              org.plan_billing_cycle === "yearly"
                ? "Annuel"
                : org.plan_billing_cycle === "monthly"
                  ? "Mensuel"
                  : display(org.plan_billing_cycle)
            }
          />
          <Field
            label="Fin d'essai"
            value={
              org.plan_trial_ends_at ? formatIsoDate(org.plan_trial_ends_at) || "—" : "—"
            }
          />
        </Section>
      </div>
    </section>
  );
}
