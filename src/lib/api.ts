import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

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
      original._retry = true;
      const refresh = localStorage.getItem("sa_refresh");
      if (refresh) {
        try {
          const refreshUrl = API_BASE ? `${API_BASE}/api/token/refresh/` : "/api/token/refresh/";
          const { data } = await axios.post(refreshUrl, { refresh });
          localStorage.setItem("sa_access", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("sa_access");
          localStorage.removeItem("sa_refresh");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string }>("/api/token/", { email, password }),
  me: () =>
    api.get<{ user: { id: string; email: string; full_name: string; is_superuser?: boolean } }>("/api/me/"),
};
