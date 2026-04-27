import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { applyTheme, getInitialTheme } from "./lib/theme";

function replacePathIfLoggedIn() {
  const hasToken = Boolean(localStorage.getItem("sa_access"));
  if (!hasToken) return;
  const path = window.location.pathname;
  if (path === "/login" || path.endsWith("/login")) {
    window.history.replaceState(null, "", "/");
  }
}

export default function App() {
  const [ready, setReady] = useState(Boolean(localStorage.getItem("sa_access")));

  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    if (ready) replacePathIfLoggedIn();
  }, [ready]);

  return ready ? <AppShell /> : <LoginPage onLogged={() => setReady(true)} />;
}
