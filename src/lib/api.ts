import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const SESSION_SUPERSEDED_CODE = "SESSION_SUPERSEDED";
const LOGIN_NOTICE_KEY = "sa_login_notice";

function readAuthErrorCode(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { code?: string } } })?.response?.data;
  return typeof data?.code === "string" ? data.code : undefined;
}

function readAuthErrorDetail(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { detail?: string } } })?.response?.data;
  return typeof data?.detail === "string" ? data.detail : undefined;
}

function redirectToLogin(notice?: string) {
  if (notice) sessionStorage.setItem(LOGIN_NOTICE_KEY, notice);
  localStorage.removeItem("sa_access");
  localStorage.removeItem("sa_refresh");
  window.location.href = "/login";
}

export function consumeSaLoginNotice(): string | null {
  const notice = sessionStorage.getItem(LOGIN_NOTICE_KEY);
  if (notice) sessionStorage.removeItem(LOGIN_NOTICE_KEY);
  return notice;
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sa_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original?._retry) {
      const reqUrl = String(original?.url ?? "");
      if (reqUrl.includes("/api/token/")) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      original._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem("sa_refresh");
      if (refresh) {
        try {
          const refreshUrl = API_BASE ? `${API_BASE}api/token/refresh/` : "api/token/refresh/";
          const { data } = await axios.post(refreshUrl, { refresh }, { timeout: 15000 });
          localStorage.setItem("sa_access", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          processQueue(null, data.access);
          return api(original);
        } catch (refreshError) {
          processQueue(refreshError, null);
          const notice =
            readAuthErrorCode(refreshError) === SESSION_SUPERSEDED_CODE
              ? readAuthErrorDetail(refreshError)
              : readAuthErrorCode(err) === SESSION_SUPERSEDED_CODE
                ? readAuthErrorDetail(err)
                : undefined;
          redirectToLogin(notice);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        const notice =
          readAuthErrorCode(err) === SESSION_SUPERSEDED_CODE ? readAuthErrorDetail(err) : undefined;
        redirectToLogin(notice);
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      access?: string;
      refresh?: string;
      otp_required?: boolean;
      challenge_id?: string;
      email_hint?: string;
      expires_in?: number;
      detail?: string;
    }>("/api/token/", {
      email,
      password,
      client: "superadmin",
    }),
  verifyOtp: (challengeId: string, code: string) =>
    api.post<{ access: string; refresh: string; otp_required?: boolean }>(
      "/api/auth/login/verify-otp/",
      { challenge_id: challengeId, code, client: "superadmin" },
    ),
  resendOtp: (challengeId: string) =>
    api.post<{ challenge_id: string; email_hint?: string; expires_in?: number }>(
      "/api/auth/login/resend-otp/",
      { challenge_id: challengeId },
    ),
  me: () =>
    api.get<{
      user: {
        id: string;
        email: string;
        full_name: string;
        is_superuser?: boolean;
        platform_role?: string | null;
        platform_permissions?: string[];
        can_access_console?: boolean;
        console_idle_timeout_seconds?: number;
        email_otp_enabled?: boolean;
      };
    }>("/api/me/"),
  patchConsolePreferences: (payload: { console_idle_timeout_seconds: number }) =>
    api.patch<{ console_idle_timeout_seconds: number; allowed: number[] }>(
      "/api/me/console-preferences/",
      payload,
    ),
  getSecurityOtp: () =>
    api.get<{ enabled: boolean; reauth_period_seconds: number; last_verified_at?: string | null }>(
      "/api/me/security-otp/",
    ),
  patchSecurityOtp: (payload: { enabled?: boolean; reauth_period_seconds?: number }) =>
    api.patch<{ enabled: boolean; reauth_period_seconds: number }>("/api/me/security-otp/", payload),
  requestPasswordReset: (email: string) =>
    api.post<{ detail: string }>("/api/auth/request-password-reset/", {
      email,
      client: "superadmin",
    }),
  validatePasswordResetToken: (token: string) =>
    api.get<{ valid: boolean; email_hint?: string; detail?: string }>(
      "/api/auth/reset-password/validate/",
      { params: { token, client: "superadmin" } },
    ),
  setPasswordFromToken: (token: string, password: string) =>
    api.post<{ detail: string }>("/api/auth/set-password/", {
      token,
      password,
      client: "superadmin",
    }),
  changePassword: (payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => api.post<{ detail: string }>("/api/me/change-password/", payload),
};
