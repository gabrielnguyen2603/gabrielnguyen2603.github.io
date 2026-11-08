(function () {
  const banner = document.querySelector(".banner");
  if (!banner) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = banner.querySelector(".mascot");
  const head = svg.querySelector(".m-head");
  const face = svg.querySelector(".m-face");
  const eyesGroup = svg.querySelector(".m-eyes");
  const eyes = [...svg.querySelectorAll(".m-eye")];
  const shines = [...svg.querySelectorAll(".m-shine")];
  const pixels = banner.querySelector(".pixels");

  const LEFT_COLORS = ["#5fed83", "#5fed83", "#ffffff"];
  const RIGHT_COLORS = ["#5fed83", "#5a3ff5", "#f43f7a", "#b08cff", "#bf5600", "#ffffff", "#f5f0eb", "#1c1428"];
  const CELL = 64;

  function buildPixels() {
    const cols = Math.ceil(banner.clientWidth / CELL);
    const rows = Math.ceil(banner.clientHeight / CELL);
    pixels.style.gridTemplateColumns = `repeat(${cols}, ${CELL}px)`;
    pixels.innerHTML = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("span");
        const t = c / Math.max(cols - 1, 1);
        if (Math.random() < 0.12 + 0.82 * Math.pow(t, 1.4)) {
          const palette = t < 0.5 ? LEFT_COLORS : RIGHT_COLORS;
          cell.style.background = palette[Math.floor(Math.random() * palette.length)];
          cell.style.animationDelay = `${(Math.random() * 6).toFixed(2)}s`;
          cell.style.animationDuration = `${(4 + Math.random() * 4).toFixed(2)}s`;
          if (!reduceMotion && Math.random() < 0.35) cell.className = "twinkle";
        }
        pixels.appendChild(cell);
      }
    }
  }
  buildPixels();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildPixels, 200);
  });

  let targetX = 0;
  let targetY = 0;
  let lookX = 0;
  let lookY = 0;
  let blink = 1;

  window.addEventListener(
    "pointermove",
    (e) => {
      const r = svg.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.55;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(window.innerWidth, window.innerHeight) * 0.5;
      targetX = Math.max(-1, Math.min(1, dx / reach));
      targetY = Math.max(-1, Math.min(1, dy / reach));
    },
    { passive: true }
  );

  function scheduleBlink() {
    setTimeout(() => {
      blink = 0.08;
      setTimeout(() => {
        blink = 1;
        scheduleBlink();
      }, 140);
    }, 2500 + Math.random() * 3500);
  }
  if (!reduceMotion) scheduleBlink();

  function frame() {
    const ease = reduceMotion ? 1 : 0.12;
    lookX += (targetX - lookX) * ease;
    lookY += (targetY - lookY) * ease;

    head.setAttribute("transform", `rotate(${lookX * 8} 200 260) translate(${lookX * 10} ${lookY * 6})`);
    face.setAttribute("transform", `translate(${lookX * 14} ${lookY * 10})`);
    eyesGroup.setAttribute("transform", `translate(${lookX * 6} ${lookY * 5})`);
    eyes.forEach((eye) => {
      eye.setAttribute("transform", `translate(0 158) scale(1 ${blink}) translate(0 -158)`);
    });
    shines.forEach((s) => s.setAttribute("transform", `translate(${lookX * 9} ${lookY * 8})`));

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
