import { api, tokens } from "./api.js";
import { ASCII } from "./ascii.js";
import { API_BASE } from "./config.js";
import { $, $$, toast } from "./ui.js";
import { startScene } from "./scene.js";
import { refreshOverview } from "./views/overview.js";
import { mountFlows, refreshFlows } from "./views/flows.js";
import { mountAdmin } from "./views/admin.js";
import { mountLive, refreshLive, refreshLiveBadge } from "./views/live.js";
import { mountDocs } from "./docs.js";

const state = {
  identity: null,
  view: "overview",
  mounted: new Set(),
};

const SCREENS = ["home", "login", "app"];
const POLL_MS = 3000;
let pollTimer = null;

for (const node of $$("[data-ascii]")) {
  node.textContent = ASCII[node.dataset.ascii] ?? "";
}

startScene();

function showScreen(name) {
  for (const screen of SCREENS) {
    const node = document.getElementById(screen);
    if (node) node.hidden = screen !== name;
  }
  if (name !== "app") stopPolling();
  window.scrollTo(0, 0);
}

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(async () => {
    if (!state.identity) return;
    try {
      if (state.view === "overview") await refreshOverview();
      if (state.view === "live") await refreshLive();
      await refreshLiveBadge();
    } catch (error) {
      if (error?.status === 401) handleError(error);
    }
  }, POLL_MS);
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleError(error) {
  if (error?.status === 401) {
    tokens.clear();
    state.identity = null;
    showScreen("login");
    toast("Session expired. Sign in again.", "error");
    return;
  }
  toast(error?.message ?? "Unexpected error", "error");
}

async function enterApp() {
  showScreen("app");
  $("#user-label").textContent = `${state.identity.username} · ${state.identity.role}`;
  $("#tab-admin").hidden = state.identity.role !== "admin";

  api
    .metadata()
    .then((metadata) => {
      const badge = $("#engine-badge");
      badge.textContent = metadata
        ? `${metadata.architecture} · tau ${metadata.tau.toFixed(3)}`
        : "engine unavailable";
    })
    .catch(() => {
      $("#engine-badge").textContent = "engine unavailable";
    });

  await showView("overview");
  await refreshLiveBadge();
  startPolling();
}

async function showView(view) {
  state.view = view;

  for (const tab of $$(".nav-item")) {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  }

  for (const section of $$(".view")) {
    const active = section.id === `view-${view}`;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  }

  try {
    if (view === "overview") {
      await refreshOverview();
    }

    if (view === "flows") {
      if (!state.mounted.has("flows")) {
        mountFlows();
        state.mounted.add("flows");
      }
      await refreshFlows();
    }

    if (view === "live") {
      if (!state.mounted.has("live")) {
        mountLive();
        state.mounted.add("live");
      }
      await refreshLive();
    }

    if (view === "admin" && !state.mounted.has("admin")) {
      mountAdmin();
      state.mounted.add("admin");
    }
  } catch (error) {
    handleError(error);
  }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const button = $("#login-submit");
  const username = form.username.value.trim();
  const password = form.password.value;

  $("#login-error").textContent = "";
  button.disabled = true;
  button.textContent = "Signing in…";

  try {
    const payload = await api.login(username, password);
    tokens.set(payload);
    state.identity = { username, role: payload.role };
    await enterApp();
  } catch (error) {
    $("#login-error").textContent =
      error.status === 401
        ? "Invalid username or password."
        : error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});

for (const trigger of $$("[data-goto]")) {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(trigger.dataset.goto === "login" ? "login" : "home");
  });
}

$("#logout").addEventListener("click", async () => {
  try {
    await api.logout();
  } catch {
    // The session may already be gone; clearing locally is enough.
  }
  tokens.clear();
  state.identity = null;
  state.mounted.clear();
  showScreen("home");
});

$("#back-home").addEventListener("click", () => showScreen("home"));

for (const tab of $$(".nav-item")) {
  tab.addEventListener("click", () => showView(tab.dataset.view));
}

const apiLabel = $("#api-label");
if (apiLabel) apiLabel.textContent = API_BASE || "same origin";

const siteNav = document.querySelector(".site-nav");
const navRule = document.querySelector(".nav-rule");

if (navRule) {
  navRule.textContent = "~~~.~~~*~~~+~~~.~~~*~~~[~~+~~]~~~.~~~*~~~+".repeat(60);
}

function updateSiteNav() {
  if (!siteNav) return;
  siteNav.classList.toggle("is-scrolled", window.scrollY > 48);
}

window.addEventListener("scroll", updateSiteNav, { passive: true });
updateSiteNav();

mountDocs();

(async function boot() {
  if (!tokens.access && !tokens.refresh) {
    showScreen("home");
    return;
  }

  try {
    state.identity = await api.me();
    await enterApp();
  } catch {
    tokens.clear();
    showScreen("home");
  }
})();
