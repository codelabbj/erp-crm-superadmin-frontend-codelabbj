import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminModuleUpdate } from "./lib/adminApi";
import { authApi } from "./lib/api";

type Tab = "dashboard" | "modules" | "subscriptions" | "organizations" | "users";

function formatIsoDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function LoginPage({ onLogged }: { onLogged: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useMutation({
    mutationFn: async () => {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("sa_access", data.access);
      localStorage.setItem("sa_refresh", data.refresh);
      const me = await authApi.me();
      if (!me.data.user.is_superuser) throw new Error("Ce compte n'est pas super admin.");
      return me;
    },
    onSuccess: () => onLogged(),
    onError: (e: unknown) => setError((e as { message?: string })?.message || "Connexion impossible"),
  });

  return (
    <div className="login-wrap">
      <div className="card">
        <h1>Super Admin</h1>
        <p>Connexion console séparée</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="error">{error}</p> : null}
        <button onClick={() => login.mutate()} disabled={login.isPending}>
          {login.isPending ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const queryClient = useQueryClient();
  const logout = () => {
    localStorage.removeItem("sa_access");
    localStorage.removeItem("sa_refresh");
    window.location.reload();
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Super Admin</h2>
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          Vue globale
        </button>
        <button className={tab === "modules" ? "active" : ""} onClick={() => setTab("modules")}>
          Modules
        </button>
        <button className={tab === "subscriptions" ? "active" : ""} onClick={() => setTab("subscriptions")}>
          Abonnements
        </button>
        <button className={tab === "organizations" ? "active" : ""} onClick={() => setTab("organizations")}>
          Organisations
        </button>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          Utilisateurs
        </button>
        <button onClick={logout}>Déconnexion</button>
        <button onClick={() => queryClient.invalidateQueries()}>Rafraîchir</button>
      </aside>
      <main className="content">
        {tab === "dashboard" && <Dashboard />}
        {tab === "modules" && <Modules />}
        {tab === "subscriptions" && <Subscriptions />}
        {tab === "organizations" && <Organizations />}
        {tab === "users" && <Users />}
      </main>
    </div>
  );
}

function Dashboard() {
  const { data } = useQuery({ queryKey: ["overview"], queryFn: adminApi.overview });
  return (
    <div className="grid">
      <div className="card">
        <h3>Organisations</h3>
        <strong>{data?.organizations ?? 0}</strong>
      </div>
      <div className="card">
        <h3>Utilisateurs</h3>
        <strong>{data?.users ?? 0}</strong>
      </div>
      <div className="card">
        <h3>Modules actifs (catalogue)</h3>
        <strong>{data?.active_modules ?? 0}</strong>
      </div>
      <div className="card">
        <h3>Abonnements actifs / essai</h3>
        <strong>{data?.active_subscriptions ?? 0}</strong>
      </div>
    </div>
  );
}

function Modules() {
  const { data } = useQuery({ queryKey: ["modules"], queryFn: () => adminApi.modules({ sort: "sort_order" }) });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (p: AdminModuleUpdate) => adminApi.updateModule(p),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });

  return (
    <div className="card">
      <h3>Modules (catalogue licensing)</h3>
      <p className="muted">
        Champs alignés sur <code>licensing.Module</code> : prix, essai, ordre d’affichage, liaison abonnements via{" "}
        <code>module_id</code>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ordre</th>
              <th>Code</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Mensuel</th>
              <th>Annuel</th>
              <th>Essai (j)</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id}>
                <td style={{ maxWidth: 72 }}>
                  <input
                    className="input-narrow"
                    type="number"
                    defaultValue={m.sort_order}
                    onBlur={(e) => mut.mutate({ id: m.id, sort_order: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <code>{m.code}</code>
                </td>
                <td>
                  <input defaultValue={m.name} onBlur={(e) => mut.mutate({ id: m.id, name: e.target.value })} />
                </td>
                <td style={{ minWidth: 200 }}>
                  <textarea
                    rows={2}
                    defaultValue={m.description}
                    onBlur={(e) => mut.mutate({ id: m.id, description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    defaultValue={m.price_monthly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_monthly: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    defaultValue={m.price_yearly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_yearly: e.target.value })}
                  />
                </td>
                <td style={{ maxWidth: 80 }}>
                  <input
                    type="number"
                    defaultValue={m.trial_days}
                    onBlur={(e) => mut.mutate({ id: m.id, trial_days: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => mut.mutate({ id: m.id, is_active: !m.is_active })}>
                    {m.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const { data: modules } = useQuery({ queryKey: ["modules"], queryFn: () => adminApi.modules({ sort: "sort_order" }) });
  const { data } = useQuery({
    queryKey: ["subs", statusFilter, moduleFilter],
    queryFn: () =>
      adminApi.subscriptions({
        limit: 80,
        offset: 0,
        sort: "-created_at",
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(moduleFilter ? { module: moduleFilter } : {}),
      }),
  });

  return (
    <div className="card">
      <h3>Abonnements (org ↔ module)</h3>
      <p className="muted">
        Modèle <code>licensing.Subscription</code> : une ligne par couple (organisation, module), statut et facturation.
      </p>
      <div className="filters">
        <label>
          Statut{" "}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="expired">expired</option>
            <option value="cancelled">cancelled</option>
            <option value="suspended">suspended</option>
            <option value="past_due">past_due</option>
          </select>
        </label>
        <label>
          Module (code){" "}
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">Tous</option>
            {(modules ?? []).map((m) => (
              <option key={m.id} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Module</th>
              <th>Statut</th>
              <th>Cycle</th>
              <th>Début</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.org.name}</td>
                <td>
                  <span title={s.module.name}>
                    <code>{s.module.code}</code> {s.module.name ? <span className="muted">({s.module.name})</span> : null}
                  </span>
                </td>
                <td>{s.status}</td>
                <td>{s.billing_cycle}</td>
                <td>{formatIsoDate(s.starts_at)}</td>
                <td>{formatIsoDate(s.ends_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Total : {data?.count ?? 0} (affichage limité à 80 par requête)</p>
    </div>
  );
}

function Organizations() {
  const { data } = useQuery({ queryKey: ["orgs"], queryFn: () => adminApi.organizations({ limit: 80, offset: 0 }) });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: adminApi.updateOrganization,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["orgs"] }),
  });

  return (
    <div className="card">
      <h3>Organisations</h3>
      <p className="muted">
        <code>core.Organization</code> — comptage des membres via la relation <code>members</code> (UserOrganization).
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Pays</th>
              <th>Devise</th>
              <th>Membres</th>
              <th>Créée</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>
                  <code>{o.slug}</code>
                </td>
                <td>{o.country}</td>
                <td>{o.currency}</td>
                <td>{o.members_count}</td>
                <td>{formatIsoDate(o.created_at)}</td>
                <td>
                  <button type="button" onClick={() => mut.mutate({ id: o.id, is_active: !o.is_active })}>
                    {o.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Users() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: () => adminApi.users({ limit: 80, offset: 0 }) });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="card">
      <h3>Utilisateurs</h3>
      <p className="muted">
        <code>core.User</code> — rattachement à une <code>Organization</code> (org primaire). Drapeaux Django{" "}
        <code>is_staff</code> / <code>is_superuser</code>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nom</th>
              <th>Organisation</th>
              <th>Rôles</th>
              <th>Créé</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.full_name}</td>
                <td>{u.org?.name ?? "—"}</td>
                <td>
                  {u.is_superuser ? (
                    <span className="badge badge-danger">superuser</span>
                  ) : u.is_staff ? (
                    <span className="badge badge-warn">staff</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{formatIsoDate(u.created_at)}</td>
                <td>
                  <button type="button" onClick={() => mut.mutate({ id: u.id, is_active: !u.is_active })}>
                    {u.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(Boolean(localStorage.getItem("sa_access")));
  return ready ? <AppShell /> : <LoginPage onLogged={() => setReady(true)} />;
}
