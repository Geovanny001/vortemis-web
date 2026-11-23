import { API_BASE } from "./config.js";

const ACCESS_KEY = "vortemis.access";
const REFRESH_KEY = "vortemis.refresh";

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export const tokens = {
  get access() {
    return sessionStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return sessionStorage.getItem(REFRESH_KEY);
  },
  set(payload) {
    sessionStorage.setItem(ACCESS_KEY, payload.access_token);
    sessionStorage.setItem(REFRESH_KEY, payload.refresh_token);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

let refreshing = null;

async function raw(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    auth = true,
    headers = {},
  } = options;

  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const request = { method, headers: { ...headers } };
  if (body !== undefined) {
    request.body = JSON.stringify(body);
    request.headers["Content-Type"] = "application/json";
  }
  if (auth && tokens.access) {
    request.headers.Authorization = `Bearer ${tokens.access}`;
  }

  const response = await fetch(url, request);
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, payload.detail || response.statusText);
  }
  return payload;
}

async function rotateSession() {
  if (!tokens.refresh) throw new ApiError(401, "Session expired");

  refreshing ??= raw("/v1/auth/refresh", {
    method: "POST",
    body: { refresh_token: tokens.refresh },
    auth: false,
  })
    .then((payload) => {
      tokens.set(payload);
      return payload;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function request(path, options = {}) {
  try {
    return await raw(path, options);
  } catch (error) {
    if (
      error.status === 401 &&
      options.auth !== false &&
      tokens.refresh &&
      !options.retried
    ) {
      await rotateSession();
      return raw(path, { ...options, retried: true });
    }
    throw error;
  }
}

export const api = {
  login: (username, password) =>
    raw("/v1/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),
  me: () => request("/v1/auth/me"),
  logout: () => request("/v1/auth/logout", { method: "POST" }),
  summary: (params) => request("/v1/stats/summary", { params }),
  flows: (params) => request("/v1/flows", { params }),
  sources: (params) => request("/v1/stats/top-sources", { params }),
  timeline: (params) => request("/v1/stats/timeline", { params }),
  metadata: () => request("/v1/engine/metadata"),
  purge: () => request("/v1/admin/purge", { method: "POST" }),
  rotatePassword: (username, payload) =>
    request(`/v1/admin/operators/${encodeURIComponent(username)}/password`, {
      method: "PUT",
      body: payload,
    }),
};
