import { useEffect } from "react";
import { AppRouter } from "@/routes/AppRouter";
import { applyTheme, getInitialTheme } from "@/lib/theme";

export default function App() {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return <AppRouter />;
}
