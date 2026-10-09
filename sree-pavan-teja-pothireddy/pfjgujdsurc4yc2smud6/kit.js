// Helpers shared by the designs: the standard pieces of the page as HTML, and
// the scroll animations. A design decides how the pieces look; where it needs
// its own layout it builds its own HTML from the resume data instead.
//
// The resume (data.js) is written by the app, prod/utils/web_designs.py -> data().
// Any part of it can be empty: the person may have hidden it, or the resume may
// not have it. Every helper here returns "" for an empty part, and mount()
// takes away the sections and menu links that would be left with nothing in them.

export const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ENTITIES[c]);
export const pad = (n) => String(n).padStart(2, "0");

// The employers behind a list of job numbers, for "used at ..." lines.
export const companies = (r, jobNumbers) => jobNumbers.map((n) => r.jobs[n].company).join(", ");

// A link that opens outside this page gets the attributes that keep it apart.
const out = (href) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "");

export const chips = (list) =>
  (list && list.length ? `<ul class="chips">${list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "");

// The person's email as a link, or nothing when the page does not show it.
export const mail = (r, cls = "", label = "") =>
  (r.email ? `<a class="${cls}" href="mailto:${esc(r.email)}">${label || esc(r.email)}</a>` : "");

// "Title at Company" for one job, with whichever halves the resume has.
export const role = (j, joiner = " at ") => [j.title, j.company].filter(Boolean).map(esc).join(joiner);

export const stats = (r) => r.stats.map((s) => `
  <div class="stat rv">
    <p class="stat__n">${s.pre}<span data-count="${s.n}">${s.n}</span><span class="suf">${esc(s.suf)}</span></p>
    <p class="stat__l">${esc(s.label)}</p>
  </div>`).join("");

export const about = (r) => r.about.map((p) => `<p>${esc(p)}</p>`).join("");

export const facts = (r) => r.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

export const jobs = (r) => r.jobs.map((j) => `
  <article class="job rv">
    <header class="job__head">
      <p class="job__when">${esc(j.when)}</p>
      <p class="job__place">${esc(j.place)}</p>
    </header>
    <div class="job__body">
      <h3><span class="job__title">${esc(j.title || j.company)}</span>${j.title ? ` <span class="job__co">${esc(j.company)}</span>` : ""}</h3>
      ${j.summary ? `<p class="job__sum">${esc(j.summary)}</p>` : ""}
      ${j.points.length ? `<ul class="job__pts">${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${chips(j.tools)}
    </div>
  </article>`).join("");

export const projects = (r) => r.projects.map((p, i) => `
  <article class="proj rv">
    <p class="proj__no">${pad(i + 1)}</p>
    <h3>${p.url ? `<a href="${esc(p.url)}"${out(p.url)}>${esc(p.name)}</a>` : esc(p.name)}</h3>
    ${p.about ? `<p class="proj__about">${esc(p.about)}</p>` : ""}
    ${p.outcome ? `<p class="proj__out">${esc(p.outcome)}</p>` : ""}
    ${chips(p.tools)}
  </article>`).join("");

export const skills = (r) => r.skills.map((g) => `
  <div class="sk rv">
    <h3>${esc(g.group)}</h3>
    <ul class="chips">${g.items.map(([name, core]) => `<li${core ? ' class="core"' : ""}>${esc(name)}</li>`).join("")}</ul>
  </div>`).join("");

export const credentials = (r) => r.credentials.map((c) => `
  <article class="cred rv">
    <p class="cred__tag">${esc(c.tag)}</p>
    <h3>${c.url ? `<a href="${esc(c.url)}"${out(c.url)}>${esc(c.name)}</a>` : esc(c.name)}</h3>
    ${c.org ? `<p class="cred__org">${esc(c.org)}</p>` : ""}
    ${c.note ? `<p class="cred__note">${esc(c.note)}</p>` : ""}
  </article>`).join("");

// One card per contact detail the page shows; a detail without an address (the location) is not a link.
export const contact = (r) => r.contacts.map((c) => (c.href
  ? `<a class="ct" href="${esc(c.href)}"${out(c.href)}><span>${esc(c.label)}</span><strong>${esc(c.text)}${out(c.href) ? " ↗" : ""}</strong></a>`
  : `<div class="ct"><span>${esc(c.label)}</span><strong>${esc(c.text)}</strong></div>`)).join("");

const footer = (r) => `
  <footer class="foot">
    <span>© ${r.year} ${esc(r.name)}</span>
    <span>Updated ${esc(r.updated)}</span>
  </footer>`;

// Count a number up from zero the first time it is seen.
function countUp(el) {
  const end = Number(el.dataset.count);
  if (calm || !end) return;
  const started = performance.now();
  (function step(now) {
    const t = Math.min((now - started) / 1400, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  })(started);
}

// Blocks with class "rv" play their entrance when scrolled to ("in"), and keep
// "seen" afterwards for charts that grow once. Brothers follow one another.
export function animate(root = document) {
  const blocks = root.querySelectorAll(".rv");
  const show = (el) => {
    el.classList.add("in", "seen");
    el.querySelectorAll("[data-count]").forEach(countUp);
  };
  if (!("IntersectionObserver" in window)) return blocks.forEach(show);
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      seen.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -7% 0px", threshold: 0.05 });
  blocks.forEach((el) => {
    const brothers = [...el.parentElement.children].filter((c) => c.classList.contains("rv"));
    el.style.setProperty("--i", Math.min(brothers.indexOf(el), 6));
    seen.observe(el);
  });
  // What is already on screen when the page opens is shown on the first frame,
  // without waiting for the observer's first report (an idle tab can delay it).
  requestAnimationFrame(() => blocks.forEach((el) => {
    const box = el.getBoundingClientRect();
    if (el.classList.contains("in") || box.top > innerHeight * 0.93 || box.bottom < 0) return;
    show(el);
    seen.unobserve(el);
  }));
}

// The section a menu link points at, and the part of the resume it shows.
const SECTIONS = { about: "about", summary: "about", work: "jobs", experience: "jobs", projects: "projects",
                   skills: "skills", credentials: "credentials", contact: "contacts" };
const empty = (value) => !value || (Array.isArray(value) && !value.length);

// Take away what has nothing to show: a section whose part of the resume is
// empty (with the links to it), and any block marked data-if="<part>" likewise.
export function prune(app, r) {
  for (const [id, part] of Object.entries(SECTIONS)) {
    if (!empty(r[part])) continue;
    app.querySelector(`#${id}`)?.remove();
    app.querySelectorAll(`a[href="#${id}"]`).forEach((a) => a.remove());
  }
  app.querySelectorAll("[data-if]").forEach((el) => { if (empty(r[el.dataset.if])) el.remove(); });
}

// Put a design's HTML on the page, add the shared footer, drop what is empty
// and start the animations.
export function mount(r, html) {
  const app = document.getElementById("app");
  app.innerHTML = html + footer(r);
  prune(app, r);
  animate(app);
  return app;
}

// Call fn(scrollY) at most once a frame while the page scrolls, and once now.
export function onScroll(fn) {
  let waiting = false;
  const run = () => { waiting = false; fn(window.scrollY); };
  window.addEventListener("scroll", () => {
    if (!waiting) { waiting = true; requestAnimationFrame(run); }
  }, { passive: true });
  window.addEventListener("resize", run);
  run();
}
