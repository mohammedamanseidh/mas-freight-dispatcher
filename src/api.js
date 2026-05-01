// dispatcher-app/src/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("mas_dispatcher_token");
const setToken = (t) => localStorage.setItem("mas_dispatcher_token", t);
const clearToken = () => localStorage.removeItem("mas_dispatcher_token");

async function req(method, path, body = null) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const Auth = {
  login: async (email, password) => {
    const data = await req("POST", "/dispatcher/login", { email, password });
    if (data.token) setToken(data.token);
    return data;
  },
  me: () => req("GET", "/dispatcher/me"),
  logout: () => clearToken(),
  isLoggedIn: () => !!getToken(),
  changePassword: (current_password, new_password) =>
    req("PATCH", "/dispatcher/password", { current_password, new_password }),
  changeEmail: (new_email, password) =>
    req("PATCH", "/dispatcher/email", { new_email, password }),
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADS
// ─────────────────────────────────────────────────────────────────────────────
export const Loads = {
  all: () => req("GET", "/loads/dispatcher/all"),
  post: (body) => req("POST", "/loads", body),
  update: (id, body) => req("PATCH", `/loads/${id}`, body),
  close: (id) => req("PATCH", `/loads/${id}/close`),
  delete: (id) => req("DELETE", `/loads/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRUCKS
// ─────────────────────────────────────────────────────────────────────────────
export const Trucks = {
  all: (status) => req("GET", `/trucks${status ? `?status=${status}` : ""}`),
  pendingReview: () => req("GET", "/trucks/pending-review"),
  get: (id) => req("GET", `/trucks/${id}`),
  approve: (id) => req("PATCH", `/trucks/${id}/approve`),
  reject: (id, reason) => req("PATCH", `/trucks/${id}/reject`, { reason }),
};

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const Applications = {
  forLoad: (loadId) => req("GET", `/applications/load/${loadId}`),
  accept: (appId) => req("PATCH", `/applications/${appId}/accept`),
  reject: (appId) => req("PATCH", `/applications/${appId}/reject`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────────────────────────────────────
export const Trips = {
  all: () => req("GET", "/trips"),
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
export const Stats = {
  public: () => req("GET", "/stats/public"),
  dispatcher: () => req("GET", "/stats/dispatcher"),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const Notifications = {
  list: () => req("GET", "/notifications"),
  markRead: (id) => req("PATCH", `/notifications/${id}/read`),
  markAllRead: () => req("PATCH", "/notifications/mark-all-read"),
};

export { getToken, clearToken };
