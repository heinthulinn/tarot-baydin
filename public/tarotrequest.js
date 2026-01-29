// Load HTML UI
fetch("tarotrequest.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("tarotrequest-root").innerHTML = html;
  })
  .catch(err => console.error("Failed to load tarotrequest.html", err));


// Send data to Unity
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

  console.log("Tarot Request → Unity", data);

  if (typeof SendTarotUserData === "function") {
    SendTarotUserData(JSON.stringify(data));
  }
}

function showTarotUI() {
  const ui = document.getElementById("tarotrequest-ui");
  if (ui) ui.style.display = "flex";
}

function hideTarotUI() {
  const ui = document.getElementById("tarotrequest-ui");
  if (ui) ui.style.display = "none";
}
