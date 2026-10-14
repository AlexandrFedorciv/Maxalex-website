/* =========================================================
   MAXALEX REALITY – skripty
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Hlavička při scrollu + tlačítko nahoru ---------- */
const header = $("#header");
const toTop = $("#toTop");
const fabCall = $(".fab-call");

function onScroll() {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 40);
    toTop?.classList.toggle("is-visible", y > 700);
    fabCall?.classList.toggle("is-visible", y > 500);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

/* ---------- Mobilní menu ---------- */
const menuBtn = $("#menuBtn");
const nav = $("#nav");

function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
}

menuBtn?.addEventListener("click", () => {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
});

nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav?.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
    }
});

window.matchMedia("(min-width: 921px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
});

/* ---------- Zvýraznění aktivní sekce v menu ---------- */
const navLinks = $$(".nav-links a");
const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

let activeId = null;
let navTicking = false;

function updateActiveLink() {
    navTicking = false;
    const line = window.innerHeight * 0.45;
    const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
    });
    const id = current ? current.id : null;
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach((a) => {
        const active = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("is-active", active);
        if (active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
    });
}

window.addEventListener("scroll", () => {
    if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(updateActiveLink);
    }
}, { passive: true });
updateActiveLink();

/* ---------- Animace prvků při scrollu ---------- */
const revealEls = $$(".reveal");

if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                // lehké odstupňování prvků v jedné mřížce
                const siblings = $$(".reveal", entry.target.parentElement);
                const index = Math.max(0, siblings.indexOf(entry.target));
                entry.target.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- Filtr služeb ---------- */
const filterBtns = $$(".filter-btn");
const serviceCards = $$(".service-card");

filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach((b) => {
            const active = b === btn;
            b.classList.toggle("is-active", active);
            b.setAttribute("aria-pressed", String(active));
        });
        serviceCards.forEach((card) => {
            const show = filter === "vse" || card.dataset.category === filter;
            card.classList.toggle("is-hidden", !show);
            if (show) card.classList.add("is-visible");
        });
    });
});

/* ---------- Kontaktní formulář ----------
   Momentálně na webu není (záloha HTML: _zaloha-puvodni/kontaktni-formular.html).
   Kód se spustí jen tehdy, pokud je formulář #contactForm na stránce. */
const form = $("#contactForm");
const statusEl = $("#formStatus");

const validators = {
    jmeno: (v) => (v.trim().length >= 2 ? "" : "Vyplňte prosím své jméno."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Zadejte platnou e-mailovou adresu."),
    telefon: (v) => (!v.trim() || /^[+\d][\d\s()-]{7,}$/.test(v.trim()) ? "" : "Zadejte platné telefonní číslo."),
    zprava: (v) => (v.trim().length >= 10 ? "" : "Napište nám prosím alespoň krátkou zprávu (min. 10 znaků)."),
    souhlas: (_, el) => (el.checked ? "" : "Pro odeslání je potřeba souhlas se zpracováním údajů."),
};

function validateField(el) {
    const check = validators[el.name];
    if (!check) return true;
    const message = check(el.value, el);
    const field = el.closest(".field");
    const errorEl = $(`#${el.id}-err`);
    field?.classList.toggle("has-error", Boolean(message));
    el.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) {
        errorEl.textContent = message;
        if (message) el.setAttribute("aria-describedby", errorEl.id);
        else el.removeAttribute("aria-describedby");
    }
    return !message;
}

function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `form-status${type ? ` is-${type}` : ""}`;
}

if (form) {
    const fields = $$("input, textarea", form).filter((el) => validators[el.name]);

    fields.forEach((el) => {
        el.addEventListener("blur", () => {
            if (el.value || el.type === "checkbox") validateField(el);
        });
        el.addEventListener("input", () => {
            if (el.closest(".field")?.classList.contains("has-error")) validateField(el);
        });
        el.addEventListener("change", () => {
            if (el.type === "checkbox") validateField(el);
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setStatus("", "");

        const results = fields.map(validateField);
        if (results.includes(false)) {
            fields.find((el) => el.getAttribute("aria-invalid") === "true")?.focus();
            return;
        }

        // spamový bot vyplnil skryté pole – tváříme se, že je vše v pořádku
        if (form.elements.web.value) {
            form.reset();
            setStatus("Děkujeme, vaše poptávka byla odeslána.", "success");
            return;
        }

        const data = {
            jmeno: form.elements.jmeno.value.trim(),
            email: form.elements.email.value.trim(),
            telefon: form.elements.telefon.value.trim(),
            sluzba: form.elements.sluzba.value || "Neuvedeno",
            zprava: form.elements.zprava.value.trim(),
        };

        const endpoint = form.dataset.endpoint;
        const submitBtn = $("button[type=submit]", form);

        if (endpoint) {
            // Odeslání přes formulářovou službu (Web3Forms, Formspree…)
            submitBtn.disabled = true;
            setStatus("Odesílám…", "");
            try {
                const payload = { ...data, subject: `Poptávka z webu – ${data.sluzba}`, from_name: "Web MAXALEX REALITY" };
                const accessKey = form.dataset.accessKey;
                if (accessKey) payload.access_key = accessKey;

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                form.reset();
                fields.forEach((el) => el.closest(".field")?.classList.remove("has-error"));
                setStatus("Děkujeme! Vaši poptávku jsme přijali a brzy se vám ozveme.", "success");
            } catch (err) {
                setStatus(`Odeslání se nezdařilo. Zavolejte nám prosím na +420 774 256 329 nebo napište na ${form.dataset.email}.`, "error");
            } finally {
                submitBtn.disabled = false;
            }
            return;
        }

        // Bez backendu: otevře se e-mailový klient s předvyplněnou zprávou
        const subject = `Poptávka z webu – ${data.sluzba}`;
        const body = [
            `Jméno: ${data.jmeno}`,
            `E-mail: ${data.email}`,
            `Telefon: ${data.telefon || "neuvedeno"}`,
            `Služba: ${data.sluzba}`,
            "",
            data.zprava,
        ].join("\n");

        window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus("Otevřeli jsme váš e-mailový program s připravenou zprávou – stačí ji odeslat. Pokud se neotevřel, napište nám přímo na " + form.dataset.email + ".", "success");
    });
}

/* ---------- Realizace: detail projektu (fotky + informace o stavbě) ---------- */
const postModal = $("#postModal");
const postTrack = $("#postTrack");
const postDots = $("#postDots");
const postCounter = $("#postCounter");
const projects = $$(".project");
const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);

const post = { project: null, media: [], index: 0, lastFocused: null };

function projectData(project) {
    const button = $(".project-media", project);
    const media = (button.dataset.media || "").split(",").map((x) => x.trim()).filter(Boolean);
    // dvojice <dt>/<dd> z <dl class="project-info">; prázdné hodnoty se vynechají
    const details = $$(".project-info dt", project)
        .map((dt) => [dt.textContent.trim(), dt.nextElementSibling?.textContent.trim() ?? ""])
        .filter(([, value]) => value);
    return {
        id: project.id,
        title: $("h3", project)?.textContent.trim() ?? "",
        text: $(".project-text", project)?.textContent.trim() ?? "",
        place: $(".project-place", project)?.textContent.trim() ?? "",
        status: $(".project-status", project)?.textContent.trim() ?? "",
        statusProgress: Boolean($(".project-status--progress", project)),
        details,
        media: media.length ? media : [$("img", button).src],
    };
}

function renderPost(data) {
    // záhlaví
    $("#postTitle").textContent = data.title;
    const placeLink = $("#postLocation");
    $("span", placeLink).textContent = data.place;
    placeLink.href = `https://mapy.cz/zakladni?q=${encodeURIComponent(data.place)}`;
    const status = $("#postStatus");
    status.textContent = data.status;
    status.hidden = !data.status;
    status.classList.toggle("is-progress", data.statusProgress);

    // popis a informace o stavbě
    $("#postText").textContent = data.text;
    const dl = $("#postDetails");
    dl.replaceChildren();
    data.details.forEach(([label, value]) => {
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        row.append(dt, dd);
        dl.appendChild(row);
    });
    $(".post-subtitle").hidden = data.details.length === 0;

    // e-mail s předvyplněným předmětem podle projektu
    const subject = `Dotaz k projektu: ${data.title} (${data.place})`;
    $("#postMail").href = `mailto:maxalexreality@seznam.cz?subject=${encodeURIComponent(subject)}`;
    $(".post-body").scrollTop = 0;

    // fotky
    post.media = data.media;
    postTrack.replaceChildren();
    postDots.replaceChildren();
    data.media.forEach((src, i) => {
        const slide = document.createElement("div");
        slide.className = "post-slide";
        const item = document.createElement(isVideo(src) ? "video" : "img");
        item.dataset.src = src;
        if (isVideo(src)) {
            item.controls = true;
            item.playsInline = true;
        } else {
            item.alt = `${data.title} – fotka ${i + 1} z ${data.media.length}`;
            item.decoding = "async";
            item.draggable = false;
        }
        slide.appendChild(item);
        postTrack.appendChild(slide);
        postDots.appendChild(document.createElement("span"));
    });
    goToSlide(0, false);
}

function loadSlide(i) {
    const item = postTrack.children[i]?.firstElementChild;
    if (item && !item.src && item.dataset.src) item.src = item.dataset.src;
}

function goToSlide(i, animate = true) {
    const count = post.media.length;
    post.index = Math.max(0, Math.min(count - 1, i));
    postTrack.style.transition = animate && !prefersReducedMotion ? "" : "none";
    postTrack.style.transform = `translateX(${-100 * post.index}%)`;
    [post.index, post.index + 1, post.index - 1].forEach(loadSlide);

    // pozastavit video na skrytých snímcích
    $$("video", postTrack).forEach((v, vi) => { if (vi !== post.index) v.pause(); });

    [...postDots.children].forEach((d, di) => d.classList.toggle("is-active", di === post.index));
    postCounter.textContent = count > 1 ? `${post.index + 1} / ${count}` : "";
    $("#postPrev").hidden = post.index === 0;
    $("#postNext").hidden = post.index >= count - 1;
    postDots.hidden = count < 2;
}

function openPost(project, { updateUrl = true } = {}) {
    if (!postModal || !project) return;
    post.project = project;
    renderPost(projectData(project));

    const i = projects.indexOf(project);
    $("#postPrevProject").hidden = i <= 0;
    $("#postNextProject").hidden = i >= projects.length - 1;

    if (updateUrl) history.replaceState(null, "", `#${project.id}`);
    if (postModal.hidden) {
        post.lastFocused = document.activeElement;
        postModal.hidden = false;
        document.body.classList.add("menu-open");
        requestAnimationFrame(() => postModal.classList.add("is-open"));
    }
    $("#postClose").focus({ preventScroll: true });
}

function closePost({ restoreFocus = true } = {}) {
    if (!postModal || postModal.hidden) return;
    postModal.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    history.replaceState(null, "", location.pathname + location.search);
    setTimeout(() => {
        postModal.hidden = true;
        postTrack.replaceChildren();
    }, prefersReducedMotion ? 0 : 250);
    if (restoreFocus) post.lastFocused?.focus({ preventScroll: true });
}

function stepProject(dir) {
    const next = projects[projects.indexOf(post.project) + dir];
    if (next) openPost(next);
}

// otevření z karty / z fotky v úvodu
projects.forEach((project) => {
    $(".project-media", project)?.addEventListener("click", () => openPost(project));
});
$(".hero-photo")?.addEventListener("click", (e) => {
    const featured = $(".project--featured");
    if (!featured) return;
    e.preventDefault();
    openPost(featured);
});

$("#postClose")?.addEventListener("click", () => closePost());
$("#postPrev")?.addEventListener("click", () => goToSlide(post.index - 1));
$("#postNext")?.addEventListener("click", () => goToSlide(post.index + 1));
$("#postPrevProject")?.addEventListener("click", () => stepProject(-1));
$("#postNextProject")?.addEventListener("click", () => stepProject(1));
postDots?.addEventListener("click", (e) => {
    const i = [...postDots.children].indexOf(e.target);
    if (i >= 0) goToSlide(i);
});

// klik mimo detail zavře
postModal?.addEventListener("click", (e) => {
    if (e.target === postModal) closePost();
});

// klávesnice
document.addEventListener("keydown", (e) => {
    if (!postModal || postModal.hidden) return;
    if (e.key === "Escape") closePost();
    if (e.key === "ArrowLeft") goToSlide(post.index - 1);
    if (e.key === "ArrowRight") goToSlide(post.index + 1);
    if (e.key === "Tab") {
        const focusable = $$("button, a[href]", postModal).filter((x) => !x.hidden && x.offsetParent !== null);
        const i = focusable.indexOf(document.activeElement);
        e.preventDefault();
        focusable[(i + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
    }
});

// přejetí prstem – fotka se posouvá spolu s prstem
let drag = null;
const postMedia = $("#postMedia");
postMedia?.addEventListener("touchstart", (e) => {
    if (post.media.length < 2) return;
    drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, horizontal: null };
}, { passive: true });
postMedia?.addEventListener("touchmove", (e) => {
    if (!drag) return;
    const dx = e.touches[0].clientX - drag.x;
    const dy = e.touches[0].clientY - drag.y;
    if (drag.horizontal === null) drag.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!drag.horizontal) return;
    drag.dx = dx;
    postTrack.style.transition = "none";
    postTrack.style.transform = `translateX(calc(${-100 * post.index}% + ${dx}px))`;
}, { passive: true });
postMedia?.addEventListener("touchend", () => {
    if (!drag) return;
    const { dx, horizontal } = drag;
    drag = null;
    if (!horizontal) return;
    const threshold = postMedia.clientWidth * 0.18;
    goToSlide(post.index + (dx < -threshold ? 1 : dx > threshold ? -1 : 0));
});

// odkaz přímo na projekt (např. …/#projekt-hulicka) otevře jeho detail
function openFromHash() {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target?.classList.contains("project")) {
        target.scrollIntoView({ block: "center" });
        openPost(target, { updateUrl: false });
    }
}
window.addEventListener("hashchange", openFromHash);
openFromHash();

/* ---------- Mapa až po kliknutí ---------- */
$("#mapLoad")?.addEventListener("click", () => {
    const map = $("#map");
    const iframe = document.createElement("iframe");
    iframe.src = "https://maps.google.com/maps?q=" + encodeURIComponent("Hulická 1158, 190 16 Praha 9") + "&z=15&output=embed";
    iframe.title = "Mapa – MAXALEX REALITY, Hulická 1158, Praha 9";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    map.replaceChildren(iframe);
});

/* ---------- Aktuální rok v patičce ---------- */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
