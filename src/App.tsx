import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { applyTheme, getInitialTheme } from "./lib/theme";

export default function App() {
  const [ready, setReady] = useState(Boolean(localStorage.getItem("sa_access")));

  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return ready ? <AppShell /> : <LoginPage onLogged={() => setReady(true)} />;
}
