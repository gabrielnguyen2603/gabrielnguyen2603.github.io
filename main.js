document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
const progress = document.querySelector(".progress");

function onScroll() {
  nav.classList.toggle("scrolled", window.scrollY > 10);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

function closeMenu() {
  links.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open menu");
}

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

links.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});

document.querySelectorAll('a[href="#top"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", location.pathname + location.search);
  });
});

document.querySelectorAll(".stagger").forEach((group) => {
  [...group.children].forEach((el, i) => el.style.setProperty("--d", `${i * 0.1}s`));
});
document.querySelectorAll(".chips").forEach((group) => {
  [...group.children].forEach((el, i) => (el.style.transitionDelay = `${0.2 + i * 0.05}s`));
});

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("js");

  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

  const navLinks = [...links.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));
}

const rotator = document.querySelector(".rotator");
if (rotator && !reduceMotion) {
  const words = rotator.dataset.words.split("|");
  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true;
  rotator.classList.add("typing");

  function tick() {
    const word = words[wordIndex];
    if (deleting) {
      charIndex--;
      rotator.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
      setTimeout(tick, 40);
    } else {
      const next = words[wordIndex];
      charIndex++;
      rotator.textContent = next.slice(0, charIndex);
      if (charIndex === next.length) {
        deleting = true;
        setTimeout(tick, 2200);
      } else {
        setTimeout(tick, 75);
      }
    }
  }
  setTimeout(tick, 2600);
}

if (finePointer && !reduceMotion) {
  const card = document.querySelector(".hero-card");
  card.addEventListener("transitionend", () => card.classList.add("settled"), { once: true });
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", `${x * 10}deg`);
    card.style.setProperty("--rx", `${-y * 10}deg`);
  });
  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });

  document.querySelectorAll(".project").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
    el.addEventListener("mouseleave", () => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  });
}
