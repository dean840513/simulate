// ========== 加载 Wine NFTs ==========
async function loadWineNFTs() {
    const res = await fetch("listings.json");
    const data = await res.json();

    const grid = document.getElementById("nftGrid");
    grid.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = function () {
            showDetail(item.tokenId);
        };
        card.innerHTML = `
      <img src="${item.image}" style="height: 220px; object-fit: contain; display: block; margin: 0 auto; border-radius:8px;" />
      <h3>${item.name}</h3>
      <p style="font-size:0.9rem; color:#666;">${item.description}</p>
      <p style="font-weight:bold;">Price: $${item.price}</p>
      <button class="primary-button" onclick="showDetail(${item.tokenId})">🔍 View</button>
    `;
        grid.appendChild(card);
    });
}

// ========== 显示详情页 ==========
function showDetail(id) {
    fetch("listings.json")
        .then(res => res.json())
        .then(data => {
            const item = data.find(i => i.tokenId == id);
            console.log(item);
            if (!item) return;

            document.getElementById("nftName").innerText = item.name;
            document.getElementById("nftDescription").innerText = item.description;
            document.getElementById("nftImage").src = item.image;
            document.getElementById("nftAttributes").innerHTML =
                item.attributes.map(attr => `${attr.trait_type}: ${attr.value}`).join("<br>");
            document.getElementById("nftPrice").innerText = `Price: $${item.price}`;

            document.getElementById("buyButton").style.display = "inline";
            document.getElementById("paypal-button-container").innerHTML = ""; // Reset PayPal

            animateSwitchTo("nftOverlay");
            location.hash = "#nft/" + id;
        });
}

