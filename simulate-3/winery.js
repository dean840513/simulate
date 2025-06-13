export async function showWineryDashboard() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet");

  const roles = JSON.parse(localStorage.getItem(`roles_${user}`) || "[]");
  const hasWinery = roles.some(r => r.roleId === "winery001");
  if (!hasWinery) return alert("You don’t have Winery DID NFT");

  // 显示 wineryView 页面
  animateSwitchTo("wineryView");
  renderWineForm();
  renderWineListings();
}

function renderWineForm() {
  const container = document.getElementById("wineryForm");
  container.innerHTML = `
    <h3>🍇 Add New Wine Listing</h3>
    <label>Name: <input id="wineName" /></label><br>
    <label>Description: <input id="wineDesc" /></label><br>
    <label>Price (USD): <input id="winePrice" type="number" /></label><br>
    <label>Image URL: <input id="wineImage" /></label><br>
    <button class="primary-button" onclick="addWine()">📤 Submit</button>
    <hr>
  `;
}

window.addWine = function () {
  const name = document.getElementById("wineName").value.trim();
  const desc = document.getElementById("wineDesc").value.trim();
  const price = parseFloat(document.getElementById("winePrice").value);
  const image = document.getElementById("wineImage").value.trim();

  if (!name || !desc || !price || !image) {
    return alert("Please fill all fields");
  }

  const user = getLocalUser();
  const key = `winesBy_${user}`;
  const wines = JSON.parse(localStorage.getItem(key) || "[]");

  wines.push({ name, desc, price, image, id: Date.now() });
  localStorage.setItem(key, JSON.stringify(wines));
  renderWineListings();
};

function renderWineListings() {
  const user = getLocalUser();
  const key = `winesBy_${user}`;
  const wines = JSON.parse(localStorage.getItem(key) || "[]");

  const container = document.getElementById("wineryList");
  container.innerHTML = wines.length === 0
    ? "<p>No wines listed yet.</p>"
    : wines.map(w => `
      <div class="card">
        <img src="${w.image}" style="height:100px;" />
        <h4>${w.name}</h4>
        <p>${w.desc}</p>
        <p><strong>$${w.price}</strong></p>
      </div>
    `).join("");
}
