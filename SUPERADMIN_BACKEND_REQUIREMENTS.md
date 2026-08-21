# Super Admin Backend Requirements (ERP/CRM)

## Objectif du document

Ce document décrit les besoins backend pour la console **Super Admin global** du projet ERP/CRM.

Le scope ici est **global plateforme** (multi-tenant), et non l'administration locale d'une organisation.

---

## Principes de scope

- **Super Admin global** = pilote les tenants, la sécurité, la facturation, l'observabilité, et l'exploitation.
- **Tenant Admin** = gère les données métier internes à une organisation.
- Les routes qui exigent une `organization active` côté utilisateur final ne doivent pas bloquer la console globale, sauf si c'est volontairement documenté.

---

## Navigation cible et besoins API

## 1) Vue d'ensemble

### 1.1 Vue d'ensemble (Overview)
- **But UI**: afficher une synthèse instantanée de la plateforme.
- **Route souhaitée**: `GET /api/admin/overview/` (déjà utilisée)
- **Champs attendus**:
  - `organizations` (number)
  - `users` (number)
  - `active_modules` (number)
  - `active_subscriptions` (number)
  - `mrr` (number, optionnel recommandé)
  - `arr` (number, optionnel recommandé)
  - `new_signups_today` (number, optionnel recommandé)

### 1.2 Santé plateforme (Platform Health) — *coming soon côté frontend*
- **But UI**: monitorer latence/erreurs/disponibilité globales.
- **Routes souhaitées**:
  - `GET /api/admin/platform-health/summary/`
  - `GET /api/admin/platform-health/services/`
- **Champs attendus**:
  - `global_uptime_percent`
  - `avg_api_latency_ms`
  - `error_rate_percent`
  - `services[]`: `name`, `status`, `latency_ms`, `error_rate`
  - `updated_at`

### 1.3 Métriques business — *coming soon côté frontend*
- **But UI**: pilotage revenu/croissance.
- **Route souhaitée**: `GET /api/admin/business-metrics/`
- **Champs attendus**:
  - `mrr`, `arr`
  - `active_tenants`
  - `churn_rate`
  - `net_revenue_retention`
  - `trial_to_paid_rate`
  - séries temporelles (30j / 12 mois)

---

## 2) Gestion des tenants

### 2.1 Organisations
- **But UI**: lister/rechercher/activer-désactiver les tenants.
- **Routes existantes utilisées**:
  - `GET /api/admin/organizations/`
  - `PATCH /api/admin/organizations/`
- **Besoins complémentaires**:
  - `POST /api/admin/organizations/` (création)
  - `GET /api/admin/organizations/{id}/` (détail)
  - `DELETE /api/admin/organizations/{id}/` (archivage/suppression contrôlée)
  - actions lifecycle:
    - `POST /api/admin/organizations/{id}/suspend/`
    - `POST /api/admin/organizations/{id}/reactivate/`
    - `POST /api/admin/organizations/{id}/archive/`

### 2.2 Onboarding — *coming soon côté frontend*
- **But UI**: suivre les tenants en setup/trial.
- **Routes souhaitées**:
  - `GET /api/admin/onboarding-jobs/`
  - `GET /api/admin/onboarding-jobs/{id}/`
  - `POST /api/admin/onboarding-jobs/{id}/retry/`
- **Champs attendus**:
  - `tenant_id`, `tenant_name`
  - `stage` (`provisioning`, `seed_data`, `domain`, `billing`, `done`)
  - `status`, `started_at`, `completed_at`, `error`

### 2.3 Domaines & SSL — *coming soon côté frontend*
- **But UI**: gérer CNAME/certificats.
- **Routes souhaitées**:
  - `GET /api/admin/domains/`
  - `POST /api/admin/domains/`
  - `GET /api/admin/domains/{id}/`
  - `POST /api/admin/domains/{id}/verify/`
  - `POST /api/admin/domains/{id}/renew-certificate/`
- **Champs attendus**:
  - `tenant_id`, `domain`, `status`
  - `cname_target`, `dns_verified`
  - `certificate_status`, `certificate_expires_at`

---

## 3) Revenus & plans

### 3.1 Abonnements
- **But UI**: vue globale des abonnements actifs/échus/trial.
- **Route existante utilisée**:
  - `GET /api/admin/subscriptions/`
- **Besoins complémentaires**:
  - `PATCH /api/admin/subscriptions/{id}/` (changer statut/cycle/plan)
  - actions:
    - `POST /api/admin/subscriptions/{id}/suspend/`
    - `POST /api/admin/subscriptions/{id}/resume/`
    - `POST /api/admin/subscriptions/{id}/change-plan/`

### 3.2 Plans & fonctionnalités — *coming soon côté frontend*
- **But UI**: catalogue offres + quotas + entitlements.
- **Routes souhaitées**:
  - `GET /api/admin/plans/`
  - `POST /api/admin/plans/`
  - `PATCH /api/admin/plans/{id}/`
  - `GET /api/admin/entitlements/`
  - `PATCH /api/admin/entitlements/{plan_id}/`
- **Champs attendus**:
  - `plan_code`, `name`, `price_monthly`, `price_yearly`
  - `limits` (users, storage, api_calls, etc.)
  - `enabled_modules[]`

### 3.3 Factures (via Billing Ops actuellement)
- **Routes existantes utilisées**:
  - `GET /api/billing/clients/`
  - `GET /api/billing/invoices/`
  - `GET /api/billing/payments/`
- **Actions recommandées (si non exposées pour super-admin)**:
  - `POST /api/billing/invoices/{id}/finalize/`
  - `POST /api/billing/invoices/{id}/cancel/`
  - `POST /api/billing/invoices/{id}/close/`
  - `POST /api/billing/payments/{id}/confirm/`

---

## 4) Opérations plateforme

### 4.1 Feature Flags — *coming soon côté frontend*
- **But UI**: activer/désactiver des fonctionnalités globalement ou par tenant.
- **Routes souhaitées**:
  - `GET /api/admin/feature-flags/`
  - `PATCH /api/admin/feature-flags/{flag_key}/`
  - `GET /api/admin/feature-flags/overrides/`
  - `POST /api/admin/feature-flags/overrides/`
- **Champs attendus**:
  - `flag_key`, `default_enabled`
  - `scope` (`global`, `tenant`)
  - `tenant_id` (si override)

### 4.2 Modules
- **Routes existantes utilisées**:
  - `GET /api/admin/modules/`
  - `PATCH /api/admin/modules/`
- **Besoins complémentaires**:
  - `POST /api/admin/modules/`
  - `DELETE /api/admin/modules/{id}/`

### 4.3 Jobs en arrière-plan (Data Ops partiellement branché)
- **Routes existantes utilisées**:
  - `GET /api/io/imports/`
  - `GET /api/io/exports/`
- **Actions recommandées**:
  - `POST /api/io/imports/{id}/retry/`
  - `POST /api/io/exports/{id}/retry/`
  - `POST /api/io/imports/{id}/cancel/`
  - `POST /api/io/exports/{id}/cancel/`

---

## 5) Sécurité & conformité

### 5.1 Utilisateurs staff (actuellement mappé sur users globaux)
- **But UI**: gérer les comptes admin internes plateforme.
- **Routes souhaitées**:
  - `GET /api/admin/staff-users/`
  - `POST /api/admin/staff-users/`
  - `PATCH /api/admin/staff-users/{id}/`
  - `POST /api/admin/staff-users/{id}/reset-mfa/`
- **Champs attendus**:
  - `email`, `full_name`, `role`, `is_active`, `last_login`, `mfa_enabled`

### 5.2 Journaux d'audit
- **Route existante utilisée**:
  - `GET /api/audit-logs/`
- **Besoins complémentaires recommandés**:
  - filtres backend:
    - `action`, `entity_type`, `user_email`, `date_from`, `date_to`
  - pagination backend (`limit`, `offset`)
  - export:
    - `GET /api/audit-logs/export/`

### 5.3 IP bannies / WAF — *coming soon côté frontend*
- **Routes souhaitées**:
  - `GET /api/admin/security/banned-ips/`
  - `POST /api/admin/security/banned-ips/`
  - `DELETE /api/admin/security/banned-ips/{id}/`
  - `GET /api/admin/security/waf-rules/`
  - `PATCH /api/admin/security/waf-rules/{id}/`

---

## Exigences transverses (toutes routes super-admin)

- Auth JWT super-admin obligatoire
- Contrôle permission serveur explicite (`is_superuser` ou permission dédiée)
- Pagination standard sur les listes:
  - `count`, `results`, `limit`, `offset`
- Filtrage/recherche standard:
  - `q`, `sort`
- Format d'erreur uniforme:
  - `{ "detail": "..." }` pour messages UX propres
- Audit interne de toutes actions write super-admin:
  - create/update/delete/suspend/impersonate/override

---

## Priorités backend proposées

### P0 (immédiat)
1. Stabiliser et documenter `overview`, `organizations`, `users`, `modules`, `subscriptions`
2. Ajouter filtres + pagination robustes sur `audit-logs`
3. Exposer actions opérationnelles `billing` (finalize/cancel/confirm)
4. Uniformiser les schémas de réponse (éviter les `schema: {}` trop génériques)

### P1 (court terme)
1. API `plans/entitlements`
2. API `feature-flags` + overrides tenant
3. API `staff-users`
4. API `onboarding-jobs`

### P2 (moyen terme)
1. API `platform-health`
2. API `business-metrics`
3. API `domains-ssl`
4. API `security` (banned IPs / WAF)

---

## État frontend actuel (référence)

### Déjà implémenté côté UI
- Overview/Dashboard
- Organizations
- Users
- Modules
- Subscriptions
- Audit Logs
- Billing Ops
- Data Ops

### Menus en coming soon (attente API dédiée)
- Platform Health
- Business Metrics
- Onboarding
- Domains & SSL
- Plans & Features
- Feature Flags
- Banned IPs / WAF

