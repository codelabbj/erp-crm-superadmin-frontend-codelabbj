import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_IDLE_MS = 60 * 60 * 1000;

/**
 * Déconnecte après inactivité (mouvement / clavier / clic / scroll).
 */
export function useConsoleIdleTimeout(timeoutSeconds?: number | null) {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const ms = Math.max(300, Number(timeoutSeconds) || 3600) * 1000 || DEFAULT_IDLE_MS;

    const logout = () => {
      localStorage.removeItem("sa_access");
      localStorage.removeItem("sa_refresh");
      navigate("/login", { replace: true });
    };

    const reset = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(logout, ms);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    reset();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
  }, [timeoutSeconds, navigate]);
}
