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
            showDetail(item.productId);
        };
        card.innerHTML = `
            <img src="${item.image}" style="height: 200px; object-fit: contain; display: block; margin: 0 auto; border-radius:8px;" />
            <h3>${item.name}</h3>
            <p style="font-size:0.9rem; color:#666;">${item.description}</p>
            <p style="font-size:0.85rem; color:#999;">
                📜 Token ID: ${item.tokenId}<br>
                📍 Contract: <code>${item.address}</code>
            </p>
            <p style="font-weight:bold;">Price: $${item.price}</p>
            <button class="primary-button" onclick="showDetail('${item.productId}')">➡️ Detail</button>
            `;
        grid.appendChild(card);
    });
}

// ========== 显示详情页 ==========
async function showDetail(id) {
    const res = await fetch("listings.json");
    const listings = await res.json();
    const item = listings.find(i => i.productId == id);
    if (!item) return alert("NFT not found");

    document.getElementById("nftName").innerText = item.name;
    document.getElementById("nftDescription").innerText = item.description;
    document.getElementById("nftImage").src = item.image;

    // 显示属性
    document.getElementById("nftAttributes").innerHTML =
        item.attributes.map(attr => `${attr.trait_type}: ${attr.value}`).join("<br>");

    // 显示价格 + tokenId + contract address
    document.getElementById("nftPrice").innerHTML = `
        💰 Price: $${item.price}<br>
        📜 Token ID: ${item.tokenId || "N/A"}<br>
        📍 Contract: <code>${item.address || "N/A"}</code>
      `;

    // 显示购买按钮
    document.getElementById("buyQuantity").value = 1;  // 重置默认数量
    updateBuyButtonText(item.price); // 设置按钮文字
    document.getElementById("buyButton").style.display = "inline";
    document.getElementById("buyButton").setAttribute("data-id", id);

    document.getElementById("paypal-button-container").innerHTML = ""; // Reset PayPal
    document.getElementById("buyQuantity").disabled = false; // ✅ 恢复数量输入框
    document.getElementById("buyQuantity").style.opacity = 1;

    // 👇 挂载监听器，每次修改数量就更新按钮文字
    document.getElementById("buyQuantity").oninput = function () {
        const qty = parseInt(this.value || "1");
        updateBuyButtonText(item.price, qty);
    };

    animateSwitchTo("nftDetailView");
    location.hash = "#nft/" + id;
};

function updateBuyButtonText(unitPrice, quantity = 1) {
    const total = (unitPrice * quantity).toFixed(2);
    const btn = document.getElementById("buyButton");
    btn.innerText = `🛒 Purchase for $${total}`;
}

document.getElementById("buyButton").onclick = function () {
    const user = getLocalUser();
    if (!user) return alert("Please connect your wallet first");

    const hash = location.hash;
    const match = hash.match(/^#nft\/(\d+)/);
    if (!match) return alert("Product ID not found in URL");

    const productId = parseInt(match[1]);
    const quantity = parseInt(document.getElementById("buyQuantity")?.value || "1");
    if (quantity <= 0) return alert("Please enter a valid quantity");

    // 👉 隐藏购买按钮
    document.getElementById("buyButton").style.display = "none";
    document.getElementById("buyQuantity").disabled = true;
    document.getElementById("buyQuantity").style.opacity = 0.6;

    // 显示 PayPal 按钮
    const paypalContainer = document.getElementById("paypal-button-container");
    paypalContainer.innerHTML = "<p>Loading PayPal...</p>";

    fetch("listings.json")
        .then(res => res.json())
        .then(data => {
            const item = data.find(i => i.productId === productId);
            if (!item) return alert("NFT not found");

            paypalContainer.innerHTML = ""; // 清空提示文字

            // ✅ 原始 PayPal 渲染代码（不封装）
            paypal.Buttons({
                createOrder: function (data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: (item.price * quantity).toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function (details) {
                        console.log("✅ PayPal details:", details);

                        const txKey = `cellar_tx_${user}`;
                        const records = JSON.parse(localStorage.getItem(txKey) || "[]");

                        const captureId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
                        const txHash = captureId || details.id || data.orderID || "N/A";

                        records.push({
                            user,
                            productId,
                            quantity,
                            timestamp: Date.now(),
                            txType: "BUY",
                            source: "paypal",
                            txHash
                        });

                        localStorage.setItem(txKey, JSON.stringify(records));
                        showPaymentSuccess("wine");
                    });
                },
                onError: function (err) {
                    console.error("❌ PayPal error:", err);
                    alert("PayPal Error: " + err);
                }
            }).render("#paypal-button-container");
        });
};


