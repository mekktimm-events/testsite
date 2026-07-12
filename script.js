const STATUS_URL = "https://drimont.com/bbq/status.json";
const EVENT_DATE = new Date("2026-08-21T11:00:00+02:00");

let displayedTotal = 0;
let displayedPercent = 0;
let previousTotal = null;

function formatEuro(value) {
  return Number(value || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function animateCounter(targetTotal, goal) {
  const startTotal = displayedTotal;
  const startPercent = displayedPercent;
  const targetPercent = goal > 0 ? Math.min((targetTotal / goal) * 100, 100) : 100;
  const duration = 1000;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentTotal = startTotal + (targetTotal - startTotal) * eased;
    const currentPercent = startPercent + (targetPercent - startPercent) * eased;
    document.getElementById("amount").innerText = formatEuro(currentTotal);
    document.getElementById("fill").style.width = currentPercent + "%";

    if (progress < 1) requestAnimationFrame(step);
    else {
      displayedTotal = targetTotal;
      displayedPercent = targetPercent;
      document.getElementById("amount").innerText = formatEuro(targetTotal);
      document.getElementById("fill").style.width = targetPercent + "%";
    }
  }
  requestAnimationFrame(step);
}

function flashBar() {
  const fill = document.getElementById("fill");
  fill.classList.add("glow");
  setTimeout(() => fill.classList.remove("glow"), 850);
}

async function loadStatus() {
  try {
    const res = await fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" });
    const data = await res.json();
    const total = Number(data.total || 0);
    const goal = Number(data.goal || 500);

    document.getElementById("goal").innerText = "Ziel: " + formatEuro(goal);
    document.getElementById("supportText").innerText = `${Number(data.supportCount || 0)} Community-Beiträge`;

    if (data.lastSupporter && Number(data.lastAmount || 0) > 0) {
      document.getElementById("lastSupport").innerHTML =
          `Letzte Unterstützung:
          <span class="supporter-name">${data.lastSupporter}</span>
          (+${formatEuro(data.lastAmount)})`;
    } else {
      document.getElementById("lastSupport").innerText = "Letzte Unterstützung: —";
    }

    animateCounter(total, goal);
    if (previousTotal !== null && total > previousTotal) flashBar();
    previousTotal = total;
  } catch (error) {
    document.getElementById("supportText").innerText = "Counter wird geladen ...";
  }
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(EVENT_DATE - now, 0);
  const minutesTotal = Math.floor(diff / 1000 / 60);
  document.getElementById("days").innerText = Math.floor(minutesTotal / 60 / 24);
  document.getElementById("hours").innerText = Math.floor((minutesTotal / 60) % 24);
  document.getElementById("minutes").innerText = minutesTotal % 60;
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

loadStatus();
updateCountdown();
setInterval(loadStatus, 10000);
setInterval(updateCountdown, 30000);
