// ==============================
// Load HTML UI into index.html
// ==============================
fetch("tarotrequest.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("tarotrequest-root").innerHTML = html;

    // After HTML is injected, fix positioning
    attachUIToUnityCanvas();
  })
  .catch(err => {
    console.error("Failed to load tarotrequest.html", err);
  });


// ==============================
// Attach UI to Unity Canvas
// ==============================
function attachUIToUnityCanvas() {
  const canvas = document.getElementById("unity-canvas");
  const ui = document.getElementById("tarotrequest-ui");

  if (!canvas || !ui) {
    console.warn("Canvas or Tarot UI not found");
    return;
  }

  // Make canvas parent the positioning reference
  canvas.parentElement.style.position = "relative";

  // Force UI to overlay canvas exactly
  ui.style.position = "absolute";
  ui.style.top = "0";
  ui.style.left = "0";
  ui.style.width = canvas.offsetWidth + "px";
  ui.style.height = canvas.offsetHeight + "px";
  ui.style.zIndex = "9999";

  // Update size on resize / fullscreen
  window.addEventListener("resize", () => {
    ui.style.width = canvas.offsetWidth + "px";
    ui.style.height = canvas.offsetHeight + "px";
  });
}


// ==============================
// Send Data to Unity (jslib hook)
// ==============================
function sendTarotRequest() {
  const gender = document.querySelector('input[name="tr-gender"]:checked');

  const data = {
    name: document.getElementById("tr-name")?.value || "",
    day: document.getElementById("tr-day")?.value || "",
    month: document.getElementById("tr-month")?.value || "",
    year: document.getElementById("tr-year")?.value || "",
    gender: gender ? gender.value : "",
    category: document.getElementById("tr-category")?.value || ""
  };

  console.log("Tarot Request → Unity:", data);

  // This will work once jslib is added
  if (typeof SendTarotUserData === "function") {
    SendTarotUserData(JSON.stringify(data));
  } else {
    console.warn("SendTarotUserData not found (jslib not wired yet)");
  }
}


// ==============================
// Optional helpers (Unity control)
// ==============================
function showTarotUI() {
  const ui = document.getElementById("tarotrequest-ui");
  if (ui) ui.style.display = "flex";
}

function hideTarotUI() {
  const ui = document.getElementById("tarotrequest-ui");
  if (ui) ui.style.display = "none";
}
