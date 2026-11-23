const params = new URLSearchParams(window.location.search);

const stored = localStorage.getItem("vortemis.api");

export const API_BASE = (
  params.get("api") ||
  stored ||
  ""
).replace(/\/+$/, "");

export const PAGE_SIZE_DEFAULT = 50;
