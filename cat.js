// Cursor-chasing cat. Sprite sheet and behaviour adapted from oneko.js
// (https://github.com/adryd325/oneko.js), MIT License, Copyright (c) 2022 adryd.
(function () {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduceMotion) return;

  const SIZE = 32;
  const BASE_SPEED = 240;
  const CATCH_UP = 1.5;
  const STOP_DISTANCE = 30;
  const FRAME_MS = 90;
  const HEART_EVERY_MS = 2600;
  const TRAIL_COLORS = ["#ff6b5b", "#ffb703", "#2ec4b6", "#4cc9f0", "#9b5de5", "#f15bb5"];
  const TRAIL_SPACING = 18;

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
    const wrap = document.createElement("div");
    wrap.className = className;
    wrap.setAttribute("aria-hidden", "true");
    const body = document.createElement("div");
    body.className = "cat-body";
    wrap.appendChild(body);
    document.body.appendChild(wrap);
    return { wrap, body };
  }

  const ghosts = TRAIL_COLORS.map((color, i) => {
    const layer = makeLayer("cat-ghost");
    layer.body.style.backgroundColor = color;
    layer.wrap.style.zIndex = String(998 - i);
    return layer;
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
  let lastHeart = 0;
  let moving = false;
  let state = "";
  const trail = TRAIL_COLORS.map(() => ({ x: catX, y: catY, sprite: spritePos }));

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function setSprite(name, frame) {
    const set = sprites[name];
    const [x, y] = set[frame % set.length];
    spritePos = `${x * SIZE}px ${y * SIZE}px`;
  }

  function setState(next) {
    if (next === state) return;
    cat.wrap.classList.remove(`is-${state}`);
    state = next;
    cat.wrap.classList.add(`is-${state}`);
  }

  function resetIdle() {
    idleAnimation = null;
    idleFrame = 0;
  }

  function idle() {
    idleTime++;
    if (idleTime > 40 && Math.floor(Math.random() * 300) === 0 && !idleAnimation) {
      const options = ["sleeping", "scratchSelf"];
      if (catX < 32) options.push("scratchWallW");
      if (catY < 32) options.push("scratchWallN");
      if (catX > window.innerWidth - 32) options.push("scratchWallE");
      if (catY > window.innerHeight - 32) options.push("scratchWallS");
      idleAnimation = options[Math.floor(Math.random() * options.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        setState("sleeping");
        if (idleFrame < 12) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleFrame / 6));
        if (idleFrame > 280) resetIdle();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setState("busy");
        setSprite(idleAnimation, Math.floor(idleFrame / 1.5));
        if (idleFrame > 14) resetIdle();
        break;
      default:
        setState("idle");
        setSprite("idle", 0);
        return;
    }
    idleFrame++;
  }

  function animationStep() {
    frameCount++;
    const dx = catX - mouseX;
    const dy = catY - mouseY;
    const dist = Math.hypot(dx, dy);

    if (dist < STOP_DISTANCE + 12) {
      moving = false;
      idle();
      return;
    }

    resetIdle();
    if (idleTime > 1) {
      moving = false;
      setState("alert");
      setSprite("alert", 0);
      idleTime = idleTime > 40 ? 2 : 0;
      return;
    }

    let dir = "";
    dir += dy / dist > 0.5 ? "N" : "";
    dir += dy / dist < -0.5 ? "S" : "";
    dir += dx / dist > 0.5 ? "W" : "";
    dir += dx / dist < -0.5 ? "E" : "";
    setSprite(dir, frameCount);
    setState("running");
    moving = true;
  }

  function spawnHeart() {
    const heart = document.createElement("span");
    heart.className = "cat-heart";
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = "♥";
    heart.style.left = `${catX + 6}px`;
    heart.style.top = `${catY - 30}px`;
    heart.style.setProperty("--drift", `${Math.random() * 24 - 12}px`);
    document.body.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }

  function updateTrail() {
    if (moving) {
      let ax = catX;
      let ay = catY;
      let sprite = spritePos;
      for (const p of trail) {
        const d = Math.hypot(p.x - ax, p.y - ay);
        if (d > TRAIL_SPACING) {
          const k = TRAIL_SPACING / d;
          p.x = ax + (p.x - ax) * k;
          p.y = ay + (p.y - ay) * k;
          p.sprite = sprite;
        }
        ax = p.x;
        ay = p.y;
        sprite = p.sprite;
      }
    } else {
      trail.forEach((p) => {
        p.x += (catX - p.x) * 0.12;
        p.y += (catY - p.y) * 0.12;
      });
    }
  }

  function render() {
    cat.wrap.style.transform = `translate(${catX - 16}px, ${catY - 16}px)`;
    cat.body.style.backgroundPosition = spritePos;

    ghosts.forEach((ghost, i) => {
      const p = trail[ghosts.length - 1 - i];
      const offset = Math.hypot(p.x - catX, p.y - catY);
      const fade = (i + 1) / (ghosts.length + 1);
      ghost.wrap.style.transform = `translate(${p.x - 16}px, ${p.y - 16}px)`;
      ghost.body.style.webkitMaskPosition = p.sprite;
      ghost.body.style.maskPosition = p.sprite;
      ghost.wrap.style.opacity = String(Math.min(1, offset / 12) * (0.25 + fade * 0.55));
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
      const speed = BASE_SPEED + dist * CATCH_UP;
      const step = Math.min(speed * dt, Math.max(dist - STOP_DISTANCE, 0));
      if (dist > 0) {
        catX += (dx / dist) * step;
        catY += (dy / dist) * step;
      }
      catX = Math.min(Math.max(16, catX), window.innerWidth - 16);
      catY = Math.min(Math.max(16, catY), window.innerHeight - 16);
    }

    if (state === "idle" && now - lastHeart > HEART_EVERY_MS) {
      lastHeart = now;
      spawnHeart();
    } else if (state !== "idle") {
      lastHeart = now - HEART_EVERY_MS + 900;
    }

    updateTrail();

    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
