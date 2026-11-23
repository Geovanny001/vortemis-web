import { beforeEach, describe, expect, it } from "vitest";

import { mountDocs } from "../../js/docs.js";

function fixture() {
  document.body.innerHTML = `
    <div id="root">
      <div class="docs-tabs">
        <button class="docs-tab" data-doc="a" aria-selected="true">A</button>
        <button class="docs-tab" data-doc="b" aria-selected="false">B</button>
      </div>
      <div class="docs-panels">
        <section data-doc="a">A</section>
        <section data-doc="b" hidden>B</section>
      </div>
    </div>`;
  return document.getElementById("root");
}

describe("manual tabs", () => {
  beforeEach(() => window.history.replaceState({}, "", "/"));

  it("selects the first tab by default", () => {
    const root = fixture();
    mountDocs(root);

    expect(root.querySelector('section[data-doc="a"]').hidden).toBe(false);
    expect(root.querySelector('section[data-doc="b"]').hidden).toBe(true);
  });

  it("switches the visible panel on click", () => {
    const root = fixture();
    mountDocs(root);

    root.querySelector('.docs-tab[data-doc="b"]').click();

    expect(root.querySelector('section[data-doc="a"]').hidden).toBe(true);
    expect(root.querySelector('section[data-doc="b"]').hidden).toBe(false);
    expect(
      root
        .querySelector('.docs-tab[data-doc="b"]')
        .getAttribute("aria-selected"),
    ).toBe("true");
  });
});
