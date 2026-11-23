export function mountDocs(root = document) {
  const tabs = [...root.querySelectorAll(".docs-tab")];
  const panels = [...root.querySelectorAll(".docs-panels [data-doc]")];

  function select(name) {
    for (const tab of tabs) {
      const active = tab.dataset.doc === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.doc !== name;
    }
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      select(tab.dataset.doc);
      const view = root.defaultView ?? root.ownerDocument?.defaultView;
      view?.history?.replaceState(null, "", `#${tab.dataset.doc}`);
    });
  }

  if (tabs.length) {
    const view = root.defaultView ?? root.ownerDocument?.defaultView;
    const requested = (view?.location?.hash || "").slice(1);
    const known = tabs.some((tab) => tab.dataset.doc === requested);
    select(known ? requested : tabs[0].dataset.doc);
  }

  return select;
}
