// Cursor-chasing cat. Sprite sheet and behaviour adapted from oneko.js
// (https://github.com/adryd325/oneko.js), MIT License, Copyright (c) 2022 adryd.
(function () {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduceMotion) return;

  const SIZE = 32;
  const SPEED = 220;
  const FRAME_MS = 100;
  const TRAIL_COLORS = ["#ff6b5b", "#ffb703", "#2ec4b6", "#4cc9f0", "#9b5de5", "#f15bb5"];
  const TRAIL_GAP = 4;

  const sprites = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function makeLayer(className) {
    const el = document.createElement("div");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
  }

  const ghosts = TRAIL_COLORS.map((color, i) => {
    const el = makeLayer("cat-ghost");
    el.style.backgroundColor = color;
    el.style.zIndex = String(998 - i);
    return el;
  }).reverse();
  const cat = makeLayer("cat");

  let catX = window.innerWidth - 48;
  let catY = window.innerHeight - 48;
  let mouseX = catX;
  let mouseY = catY;
  let spritePos = "0px 0px";
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleFrame = 0;
  let lastFrame = 0;
  let lastTick = 0;
  const history = [];

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function setSprite(name, frame) {
    const set = sprites[name];
    const [x, y] = set[frame % set.length];
    spritePos = `${x * SIZE}px ${y * SIZE}px`;
  }

  function idle() {
    idleTime++;
    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && !idleAnimation) {
      const options = ["sleeping", "scratchSelf"];
      if (catX < 32) options.push("scratchWallW");
      if (catY < 32) options.push("scratchWallN");
      if (catX > window.innerWidth - 32) options.push("scratchWallE");
      if (catY > window.innerHeight - 32) options.push("scratchWallS");
      idleAnimation = options[Math.floor(Math.random() * options.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleFrame / 4));
        if (idleFrame > 192) resetIdle();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleFrame);
        if (idleFrame > 9) resetIdle();
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleFrame++;
  }

  function resetIdle() {
    idleAnimation = null;
    idleFrame = 0;
  }

  let moving = false;

  function animationStep() {
    frameCount++;
    const dx = catX - mouseX;
    const dy = catY - mouseY;
    const dist = Math.hypot(dx, dy);

    if (dist < 48) {
      moving = false;
      idle();
      return;
    }

    resetIdle();
    if (idleTime > 1) {
      moving = false;
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7) - 1;
      return;
    }

    let dir = "";
    dir += dy / dist > 0.5 ? "N" : "";
    dir += dy / dist < -0.5 ? "S" : "";
    dir += dx / dist > 0.5 ? "W" : "";
    dir += dx / dist < -0.5 ? "E" : "";
    setSprite(dir, frameCount);
    moving = true;
  }

  function render() {
    cat.style.transform = `translate(${catX - 16}px, ${catY - 16}px)`;
    cat.style.backgroundPosition = spritePos;

    ghosts.forEach((ghost, i) => {
      const idx = Math.min((ghosts.length - i) * TRAIL_GAP, history.length - 1);
      const p = history[idx] || { x: catX, y: catY, sprite: spritePos };
      const offset = Math.hypot(p.x - catX, p.y - catY);
      const fade = (i + 1) / (ghosts.length + 1);
      ghost.style.transform = `translate(${p.x - 16}px, ${p.y - 16}px)`;
      ghost.style.webkitMaskPosition = p.sprite;
      ghost.style.maskPosition = p.sprite;
      ghost.style.opacity = String(Math.min(1, offset / 24) * (0.25 + fade * 0.55));
    });
  }

  function loop(now) {
    if (!lastTick) lastTick = now;
    const dt = Math.min((now - lastTick) / 1000, 0.05);
    lastTick = now;

    if (now - lastFrame >= FRAME_MS) {
      lastFrame = now;
      animationStep();
    }

    if (moving) {
      const dx = mouseX - catX;
      const dy = mouseY - catY;
      const dist = Math.hypot(dx, dy);
      const step = Math.min(SPEED * dt, Math.max(dist - 40, 0));
      if (dist > 0) {
        catX += (dx / dist) * step;
        catY += (dy / dist) * step;
      }
      catX = Math.min(Math.max(16, catX), window.innerWidth - 16);
      catY = Math.min(Math.max(16, catY), window.innerHeight - 16);
    }

    history.unshift({ x: catX, y: catY, sprite: spritePos });
    if (history.length > TRAIL_COLORS.length * TRAIL_GAP + 1) history.pop();

    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
