// Load HTML into index.html
fetch("tarotrequest.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("tarotrequest-root").innerHTML = html;
  });

function sendTarotRequest() {
  const gender = document.querySelector('input[name="tr-gender"]:checked');

  const data = {
    name: document.getElementById("tr-name").value,
    day: document.getElementById("tr-day").value,
    month: document.getElementById("tr-month").value,
    year: document.getElementById("tr-year").value,
    gender: gender ? gender.value : "",
    category: document.getElementById("tr-category").value
  };

  SendTarotUserData(JSON.stringify(data)); // jslib → Unity
}
