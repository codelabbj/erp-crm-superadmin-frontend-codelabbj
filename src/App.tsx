import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./lib/adminApi";
import { authApi } from "./lib/api";

type Tab = "dashboard" | "modules" | "subscriptions" | "organizations" | "users";

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
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
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
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Vue globale</button>
        <button className={tab === "modules" ? "active" : ""} onClick={() => setTab("modules")}>Modules</button>
        <button className={tab === "subscriptions" ? "active" : ""} onClick={() => setTab("subscriptions")}>Abonnements</button>
        <button className={tab === "organizations" ? "active" : ""} onClick={() => setTab("organizations")}>Organisations</button>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>Utilisateurs</button>
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
      <div className="card"><h3>Organisations</h3><strong>{data?.organizations ?? 0}</strong></div>
      <div className="card"><h3>Utilisateurs</h3><strong>{data?.users ?? 0}</strong></div>
      <div className="card"><h3>Modules actifs</h3><strong>{data?.active_modules ?? 0}</strong></div>
      <div className="card"><h3>Abonnements actifs</h3><strong>{data?.active_subscriptions ?? 0}</strong></div>
    </div>
  );
}

function Modules() {
  const { data } = useQuery({ queryKey: ["modules"], queryFn: () => adminApi.modules({ sort: "sort_order" }) });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: adminApi.updateModule,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
  return (
    <div className="card">
      <h3>Modules & tarifs</h3>
      <table><thead><tr><th>Code</th><th>Mensuel</th><th>Annuel</th><th>Essai</th><th>Actif</th></tr></thead>
        <tbody>{(data ?? []).map((m) => (
          <tr key={m.id}>
            <td>{m.code}</td>
            <td><input defaultValue={m.price_monthly} onBlur={(e) => mut.mutate({ id: m.id, price_monthly: e.target.value })} /></td>
            <td><input defaultValue={m.price_yearly} onBlur={(e) => mut.mutate({ id: m.id, price_yearly: e.target.value })} /></td>
            <td><input defaultValue={m.trial_days} onBlur={(e) => mut.mutate({ id: m.id, trial_days: Number(e.target.value) })} /></td>
            <td><button onClick={() => mut.mutate({ id: m.id, is_active: !m.is_active })}>{m.is_active ? "Oui" : "Non"}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Subscriptions() {
  const { data } = useQuery({
    queryKey: ["subs"],
    queryFn: () => adminApi.subscriptions({ limit: 50, offset: 0, sort: "-created_at" }),
  });
  return (
    <div className="card">
      <h3>Abonnements</h3>
      <table><thead><tr><th>Org</th><th>Module</th><th>Statut</th><th>Cycle</th><th>Fin</th></tr></thead>
        <tbody>{(data?.results ?? []).map((s) => (
          <tr key={s.id}><td>{s.org.name}</td><td>{s.module.code}</td><td>{s.status}</td><td>{s.billing_cycle}</td><td>{new Date(s.ends_at).toLocaleDateString("fr-FR")}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Organizations() {
  const { data } = useQuery({ queryKey: ["orgs"], queryFn: () => adminApi.organizations({ limit: 50, offset: 0 }) });
  const qc = useQueryClient();
  const mut = useMutation({ mutationFn: adminApi.updateOrganization, onSuccess: async () => qc.invalidateQueries({ queryKey: ["orgs"] }) });
  return (
    <div className="card">
      <h3>Organisations</h3>
      <table><thead><tr><th>Nom</th><th>Pays</th><th>Membres</th><th>Actif</th></tr></thead>
        <tbody>{(data?.results ?? []).map((o) => (
          <tr key={o.id}><td>{o.name}</td><td>{o.country}</td><td>{o.members_count}</td><td><button onClick={() => mut.mutate({ id: o.id, is_active: !o.is_active })}>{o.is_active ? "Oui" : "Non"}</button></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Users() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: () => adminApi.users({ limit: 50, offset: 0 }) });
  const qc = useQueryClient();
  const mut = useMutation({ mutationFn: adminApi.updateUser, onSuccess: async () => qc.invalidateQueries({ queryKey: ["users"] }) });
  return (
    <div className="card">
      <h3>Utilisateurs</h3>
      <table><thead><tr><th>Email</th><th>Nom</th><th>Org</th><th>Actif</th></tr></thead>
        <tbody>{(data?.results ?? []).map((u) => (
          <tr key={u.id}><td>{u.email}</td><td>{u.full_name}</td><td>{u.org?.name ?? "-"}</td><td><button onClick={() => mut.mutate({ id: u.id, is_active: !u.is_active })}>{u.is_active ? "Oui" : "Non"}</button></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(Boolean(localStorage.getItem("sa_access")));
  return ready ? <AppShell /> : <LoginPage onLogged={() => setReady(true)} />;
}
