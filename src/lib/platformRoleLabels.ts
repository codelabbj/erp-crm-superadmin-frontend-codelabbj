import type { PlatformRole } from "@/lib/adminApi";

/** Libellés métier des rôles console (phase 1). */
export type PlatformRoleMeta = {
  value: PlatformRole;
  /** Nom court dans listes */
  label: string;
  /** Titre explicite */
  title: string;
  /** Ce que la personne peut faire */
  summary: string;
  /** Détails pour l'Owner au moment de l'invitation */
  details: string[];
};

export const PLATFORM_ROLE_META: PlatformRoleMeta[] = [
  {
    value: "owner",
    label: "Propriétaire (Owner)",
    title: "Propriétaire plateforme",
    summary: "Accès total + gestion de l'équipe console et des plans tarifaires.",
    details: [
      "Inviter / révoquer les membres de l'équipe console",
      "Créer et modifier les plans plateforme",
      "Orgs, abonnements, facturation Business, audit",
      "Récupération de son propre mot de passe (/owner/forgot-password)",
    ],
  },
  {
    value: "ops",
    label: "Exploitation (Ops)",
    title: "Responsable exploitation",
    summary: "Pilotage opérationnel : orgs, abonnements et facturation — sans admin d'équipe ni plans.",
    details: [
      "Suspendre / réactiver des organisations, assigner des plans aux tenants",
      "Factures Business, sièges, entrepôts, transactions",
      "Consulter les journaux d'audit",
      "Mot de passe oublié : contacter l'Owner (lien envoyé depuis Équipe console)",
    ],
  },
  {
    value: "support",
    label: "Support",
    title: "Support plateforme",
    summary: "Lecture des orgs et de l'audit pour investiguer — aucune action sensible.",
    details: [
      "Voir fiches orgs, utilisateurs, abonnements (lecture)",
      "Consulter les journaux d'audit",
      "Pas de facturation, suspension, ni modification de plans",
    ],
  },
  {
    value: "viewer",
    label: "Lecture seule (Viewer)",
    title: "Observateur",
    summary: "Tableaux de bord et listes en lecture seule — le minimum pour suivre la plateforme.",
    details: [
      "Dashboard, métriques, listes orgs (sans actions)",
      "Pas d'audit dédié, pas de facturation, pas d'équipe console",
    ],
  },
];

export function platformRoleMeta(role: string | null | undefined): PlatformRoleMeta | undefined {
  return PLATFORM_ROLE_META.find((r) => r.value === role);
}

export function platformRoleLabel(role: string | null | undefined): string {
  return platformRoleMeta(role)?.label ?? role ?? "—";
}
