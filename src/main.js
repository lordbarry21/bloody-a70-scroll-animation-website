import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

// ----------------------------------------------------
// 1. REAL DATA ASSET PRELOADER (100% ACCURATE 299 FRAMES)
// ----------------------------------------------------
const TOTAL_FRAMES = 299;
const CONCURRENT_DOWNLOADS = 12; // 12 parallel HTTP connections for fast loading

const images = new Array(TOTAL_FRAMES);
const frameObj = { frame: 0 };

const loaderBar = document.getElementById('loader-bar');
const loaderPercent = document.getElementById('loader-percent');
const loaderStatus = document.getElementById('loader-status');
const preloader = document.getElementById('preloader');

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

function currentFrameUrl(index) {
  const paddedNum = String(index + 1).padStart(4, '0');
  return `/bloody_mouse_30fps_4k_ultra_sharp/frame_${paddedNum}.jpg`;
}

// Fallback safety to ensure canvas NEVER goes blank
function getBestLoadedImage(targetIndex) {
  if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
    return images[targetIndex];
  }
  for (let offset = 0; offset < TOTAL_FRAMES; offset++) {
    const left = targetIndex - offset;
    const right = targetIndex + offset;
    if (left >= 0 && images[left] && images[left].complete && images[left].naturalWidth > 0) return images[left];
    if (right < TOTAL_FRAMES && images[right] && images[right].complete && images[right].naturalWidth > 0) return images[right];
  }
  return null;
}

// Set up Fullscreen Canvas resolution
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  
  renderFrame(Math.floor(frameObj.frame));
}

// Draw 4K frame (3840x2160) perfectly centered & balanced scale
function renderFrame(index) {
  const img = getBestLoadedImage(index);
  if (!img) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Fit 16:9 4K frame to screen perfectly
  const scaleX = canvasWidth / imgWidth;
  const scaleY = canvasHeight / imgHeight;
  
  const scale = Math.min(scaleX, scaleY) * 1.15;

  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;

  // Perfectly centered on canvas
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

let loadedCount = 0;

function preloadImagesReal() {
  return new Promise((resolve) => {
    // 1. Load Frame 0 FIRST so mouse is rendered immediately on screen
    const frame0 = new Image();
    frame0.src = currentFrameUrl(0);

    const onFrame0Done = (imgObj) => {
      if (imgObj) images[0] = imgObj;
      loadedCount = 1;
      resizeCanvas(); // Render initial mouse frame immediately!

      let queueIndex = 1;

      function updateProgress() {
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderBar) loaderBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.innerText = `${percent}%`;
        if (loaderStatus) loaderStatus.innerText = `Loading frames (${loadedCount}/${TOTAL_FRAMES})...`;

        if (loadedCount >= TOTAL_FRAMES) {
          if (loaderStatus) loaderStatus.innerText = 'System Ready!';
          setTimeout(() => {
            if (preloader) {
              preloader.style.opacity = '0';
              setTimeout(() => preloader.style.display = 'none', 600);
            }
            resolve();
          }, 300);
        }
      }

      function fetchNext() {
        if (queueIndex >= TOTAL_FRAMES) return;
        const idx = queueIndex++;

        const img = new Image();
        img.src = currentFrameUrl(idx);

        img.onload = () => {
          images[idx] = img;
          loadedCount++;
          updateProgress();
          fetchNext();
        };

        img.onerror = () => {
          loadedCount++;
          updateProgress();
          fetchNext();
        };
      }

      // Initial progress update
      updateProgress();

      // Launch 12 parallel HTTP stream workers
      for (let w = 0; w < CONCURRENT_DOWNLOADS; w++) {
        fetchNext();
      }
    };

    frame0.onload = () => onFrame0Done(frame0);
    frame0.onerror = () => onFrame0Done(null);
  });
}

// ----------------------------------------------------
// 2. GSAP SCROLLTRIGGER MASTER SCRUB TIMELINE
// ----------------------------------------------------
function initGSAPAnimation() {
  const hud1 = document.getElementById('hud-1');
  const hud2 = document.getElementById('hud-2');
  const hud3 = document.getElementById('hud-3');
  const hud4 = document.getElementById('hud-4');

  // Initial state setup for HUD elements
  gsap.set(hud1, { autoAlpha: 1, scale: 1, y: 0 });
  gsap.set([hud2, hud3, hud4], { autoAlpha: 0, scale: 0.92, y: 0 });

  // Master GSAP Scrub Timeline tied to ScrollTrigger
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero-pin",
      pin: true,
      start: "top top",
      end: "+=3500",
      scrub: 0.5,
      onUpdate: (self) => {
        renderFrame(Math.floor(frameObj.frame));
      }
    }
  });

  // 1. Scrub 299 image frames across 0 to 1 duration
  tl.to(frameObj, {
    frame: TOTAL_FRAMES - 1,
    snap: "frame",
    ease: "none",
    duration: 1
  }, 0);

  // 2. HUD 1: Active initially, fades & scales out from 0.18 to 0.25
  tl.to(hud1, { autoAlpha: 0, scale: 0.92, ease: "power2.inOut", duration: 0.07 }, 0.18);

  // 3. HUD 2: Fades in at 0.25, holds to 0.43, fades out by 0.50
  tl.to(hud2, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.07 }, 0.25);
  tl.to(hud2, { autoAlpha: 0, scale: 0.92, ease: "power2.in", duration: 0.07 }, 0.43);

  // 4. HUD 3: Fades in at 0.50, holds to 0.68, fades out by 0.75
  tl.to(hud3, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.07 }, 0.50);
  tl.to(hud3, { autoAlpha: 0, scale: 0.92, ease: "power2.in", duration: 0.07 }, 0.68);

  // 5. HUD 4: Fades in at 0.75, holds through 1.0
  tl.to(hud4, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.07 }, 0.75);

  // Reveal animations for body sections using GSAP Core
  const sections = document.querySelectorAll('.reveal-section');
  sections.forEach((section) => {
    gsap.from(section.children, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

// ----------------------------------------------------
// 3. INTERACTIVE 4-CORE SYSTEM MATRIX
// ----------------------------------------------------
const coreData = {
  "1": {
    badge: "MODE CORE 1 ACTIVATED",
    title: "CORE 1: NON-FPS & RPG SYSTEM",
    desc: "Dikonfigurasi untuk game MMORPG, RTS, MOBA, serta pekerjaan produktivitas sehari-hari dengan respon presisi tinggi.",
    target: "MMORPG / RTS / Work",
    profile: "Standard Precision",
    status: "HARDWARE READY"
  },
  "2": {
    badge: "MODE CORE 2 ACTIVATED",
    title: "CORE 2: GUN3 FPS SYSTEM",
    desc: "3 Mode tembakan sakelar instan (1, N, 3) pada tombol scroll untuk menembak burst dan aksi tembak beruntun cepat dalam FPS.",
    target: "FPS / Shooter Games",
    profile: "Triple Burst Mode",
    status: "BURST ACTIVE"
  },
  "3": {
    badge: "MODE CORE 3 ACTIVATED (ULTRA)",
    title: "CORE 3: AUTO RECOIL SUPPRESSION",
    desc: "Sistem kompensasi recoil peluru otomatis tingkat hardware. Menjaga lintasan tembakan tetap lurus dan stabil tanpa drift.",
    target: "Tactical FPS / CS2 / Valorant",
    profile: "Auto Recoil Compensator",
    status: "RECOIL SUPPRESSED"
  },
  "4": {
    badge: "MODE CORE 4 ACTIVATED (ADVANCED)",
    title: "CORE 4: MACRO & DRAG CLICK",
    desc: "Kombinasi makro kompleks dan pengalibrasian debounce time untuk merekam pulsa klik beruntun super tinggi saat Drag Click.",
    target: "Minecraft PvP / God-Bridge",
    profile: "Drag Click Debounce 1ms",
    status: "DRAG CLICK GOD"
  }
};

function initCoreSwitcher() {
  const tabs = document.querySelectorAll('.core-tab');
  const badge = document.getElementById('core-badge');
  const title = document.getElementById('core-title');
  const desc = document.getElementById('core-desc');
  const target = document.getElementById('core-target');
  const profile = document.getElementById('core-profile');
  const status = document.getElementById('core-status');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const coreId = tab.getAttribute('data-core');
      const data = coreData[coreId];
      if (!data) return;

      // Update active tab button styles
      tabs.forEach((t) => {
        t.className = 'core-tab px-6 py-3 rounded-xl bg-obsidian-light text-slate-400 border border-white/10 hover:border-slate-500 transition-all';
      });
      tab.className = 'core-tab px-6 py-3 rounded-xl bg-crimson text-white font-bold border border-crimson shadow-[0_0_20px_rgba(255,15,57,0.4)] transition-all';

      // GSAP transition effect for core panel text
      gsap.fromTo([title, desc, badge], 
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );

      if (badge) badge.innerText = data.badge;
      if (title) title.innerText = data.title;
      if (desc) desc.innerText = data.desc;
      if (target) target.innerText = data.target;
      if (profile) profile.innerText = data.profile;
      if (status) status.innerText = data.status;
    });
  });
}

// ----------------------------------------------------
// 4. INTERACTIVE CPS / DRAG CLICK TESTER WIDGET
// ----------------------------------------------------
let cpsClicks = 0;
let cpsTimer = 5.0;
let isTesting = false;
let cpsInterval = null;
let cpsStartTime = null;

const targetBtn = document.getElementById('cps-target-btn');
const timerEl = document.getElementById('cps-timer');
const clicksEl = document.getElementById('cps-clicks');
const scoreEl = document.getElementById('cps-score');
const rankBadge = document.getElementById('cps-rank-badge');
const resetBtn = document.getElementById('cps-reset-btn');
const btnText = document.getElementById('cps-btn-text');

// Web Audio API Click Sound Synthesizer
function playClickAudio() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

function handleCPSTap(e) {
  if (e) e.preventDefault();
  
  playClickAudio();

  // Pulse animation on tap using GSAP
  gsap.fromTo(targetBtn, { scale: 0.96 }, { scale: 1, duration: 0.15, ease: "back.out(2)" });

  if (!isTesting) {
    startCPSTest();
  }

  if (cpsTimer > 0) {
    cpsClicks++;
    clicksEl.innerText = cpsClicks;

    const elapsed = Math.max(0.1, (Date.now() - cpsStartTime) / 1000);
    const currentCPS = (cpsClicks / elapsed).toFixed(1);
    scoreEl.innerText = currentCPS;

    updateRankBadge(parseFloat(currentCPS));
  }
}

function startCPSTest() {
  isTesting = true;
  cpsClicks = 0;
  cpsTimer = 5.0;
  cpsStartTime = Date.now();
  btnText.innerText = 'KLIK TERUS! (5s)';
  
  if (cpsInterval) clearInterval(cpsInterval);

  cpsInterval = setInterval(() => {
    const elapsed = (Date.now() - cpsStartTime) / 1000;
    const remaining = Math.max(0, 5.0 - elapsed);
    timerEl.innerText = `${remaining.toFixed(1)}s`;

    if (remaining <= 0) {
      endCPSTest();
    }
  }, 50);
}

function endCPSTest() {
  clearInterval(cpsInterval);
  isTesting = false;
  timerEl.innerText = '0.0s';
  btnText.innerText = 'TES SELESAI!';
  
  const finalCPS = (cpsClicks / 5.0).toFixed(1);
  scoreEl.innerText = finalCPS;
  updateRankBadge(parseFloat(finalCPS), true);
}

function updateRankBadge(cps, isFinished = false) {
  if (!rankBadge) return;

  if (cps < 7) {
    rankBadge.innerText = 'RANK: CASUAL CLICKER';
    rankBadge.className = 'px-4 py-2 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase border border-slate-700';
  } else if (cps >= 7 && cps < 16) {
    rankBadge.innerText = 'RANK: BUTTERFLY / JITTER PRO';
    rankBadge.className = 'px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold uppercase border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
  } else {
    rankBadge.innerText = isFinished ? '👑 DRAG CLICK GOD!' : '⚡ DRAG CLICKING WARRIOR';
    rankBadge.className = 'px-4 py-2 rounded-full bg-crimson/30 text-crimson font-mono text-xs font-bold uppercase border border-crimson shadow-[0_0_20px_rgba(255,15,57,0.5)] animate-pulse';
  }
}

function resetCPSTest() {
  if (cpsInterval) clearInterval(cpsInterval);
  isTesting = false;
  cpsClicks = 0;
  cpsTimer = 5.0;
  timerEl.innerText = '5.0s';
  clicksEl.innerText = '0';
  scoreEl.innerText = '0.0';
  btnText.innerText = 'KLIK DI SINI UNTUK MULAI!';
  rankBadge.innerText = 'STATUS: READY';
  rankBadge.className = 'px-4 py-2 rounded-full bg-slate-800 text-slate-400 font-mono text-xs font-bold uppercase border border-slate-700';
}

if (targetBtn) {
  targetBtn.addEventListener('mousedown', handleCPSTap);
  targetBtn.addEventListener('touchstart', handleCPSTap, { passive: false });
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetCPSTest);
}

// ----------------------------------------------------
// INIT APP (REAL DATA 299 FRAMES PRELOADER)
// ----------------------------------------------------
preloadImagesReal().then(() => {
  initGSAPAnimation();
  initCoreSwitcher();
});
