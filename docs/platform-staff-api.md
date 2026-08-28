# Contrat API — Platform Staff (console Super Admin)

## Objectif

Multi-comptes pour la console SA avec rôles plateforme (distincts des rôles tenant ERP), invitation e-mail, OTP, idle timeout, audit acteur.

## Accès console

Un utilisateur accède à la console si :
- `is_active` et
- (`is_superuser` **ou** membership `PlatformStaffProfile` actif)

Permissions effectives :
- `is_superuser` sans profil → traité comme **owner** (compat migration)
- sinon → permissions du rôle `owner|ops|support|viewer`

## Rôles & permissions (phase 1)

| Permission | owner | ops | support | viewer |
|---|---|---|---|---|
| `console.access` | x | x | x | x |
| `orgs.read` | x | x | x | x |
| `orgs.write` | x | x | | |
| `billing.write` | x | x | | |
| `plans.write` | x | | | |
| `staff.manage` | x | | | |
| `audit.read` | x | x | x | |
| `settings.self` | x | x | x | x |

## Endpoints

### Auth (existants, extensions)

| Méthode | Chemin | Notes |
|---|---|---|
| `POST` | `/api/token/` | body: `email`, `password`, `client=superadmin`. Si OTP: `{otp_required, challenge_id, email_hint}` |
| `POST` | `/api/auth/login/verify-otp/` | body: `challenge_id`, `code`, **`client=superadmin`** |
| `POST` | `/api/auth/login/resend-otp/` | body: `challenge_id` |
| `GET` | `/api/me/` | enrichi: `platform_role`, `permissions[]`, `console_idle_timeout_seconds`, `email_otp_enabled` |
| `GET/PATCH` | `/api/me/security-otp/` | OTP settings (existant) |
| `PATCH` | `/api/me/console-preferences/` | `{ console_idle_timeout_seconds }` — valeurs: 300,600,1800,3600,14400,86400,604800 |

### Platform staff

| Méthode | Chemin | Permission | Body / réponse |
|---|---|---|---|
| `GET` | `/api/admin/platform-staff/` | `staff.manage` ou `audit.read` | liste membres |
| `POST` | `/api/admin/platform-staff/invite/` | `staff.manage` | `{email, full_name?, role}` → invite + e-mail |
| `POST` | `/api/admin/platform-staff/accept/` | public (token) | `{token, password, full_name?}` |
| `GET` | `/api/admin/platform-staff/invite/validate/?token=` | public | `{email, role, expires_at}` |
| `PATCH` | `/api/admin/platform-staff/{id}/` | `staff.manage` | `{role?, is_active?}` |
| `POST` | `/api/admin/platform-staff/{id}/revoke/` | `staff.manage` | désactive membership + `is_superuser=False` si non owner restant |
| `POST` | `/api/admin/platform-staff/{id}/resend-invite/` | `staff.manage` | renvoie e-mail si pending |

### Audit plateforme

| Méthode | Chemin | Permission |
|---|---|---|
| `GET` | `/api/admin/platform-audit-logs/` | `audit.read` |

## Invitation

1. Owner invite → token signé (TTL 72h) + e-mail lien `{SA_FRONTEND_URL}/accept-invite?token=...`
2. Accept → set password, crée/active User + PlatformStaffProfile, enable OTP for owner/ops
3. Login SA normal

## Idle timeout

- Stocké sur User: `console_idle_timeout_seconds` (défaut 3600)
- Front: déconnexion après inactivité
- Min UI: 300 (5 min)

## Ops Phase 0 (prod)

```bash
python manage.py migrate_platform_owner \
  --email owodeskapp@gmail.com \
  --deactivate-emails admin@gmail.com
# Mot de passe via prompt ou --password-env OWNER_PASSWORD
```

Ne jamais committer le mot de passe. Forcer OTP après création.
