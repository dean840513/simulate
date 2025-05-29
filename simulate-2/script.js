// ========== 模拟钱包系统 ==========
function generateRandomAddress() {
    const chars = 'abcdef0123456789';
    let address = '0x';
    for (let i = 0; i < 40; i++) address += chars[Math.floor(Math.random() * chars.length)];
    return address;
}

let currentUserAddress = null;

function getLocalUser() {
    return currentUserAddress;
}

function setLocalUser(addr) {
    currentUserAddress = addr;
    localStorage.setItem("userAddress", addr);
    document.getElementById("walletAddress").style.display = "inline";
    document.getElementById("walletAddress").innerText = "地址：" + addr;
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("connectBtnMagic").style.display = "none";

    document.getElementById("walletAddress").style.display = "inline";
    document.getElementById("walletAddress").innerText = "地址：" + addr;

    document.getElementById("myNFTLink").style.display = "inline";
    document.getElementById("myNFTLink").onclick = showMyNFTs;

    const orderLink = document.getElementById("myOrdersLink");
    orderLink.style.display = "inline";
    orderLink.onclick = showOrders;


    // ✅ 自动刷新详情页
    const hash = location.hash;
    if (hash.startsWith("#nft/")) {
        const match = hash.match(/^#nft\/(\d+)/);
        if (match) showDetail(match[1]);
    }
}

function connectWallet() {
    const cached = localStorage.getItem("userAddress");
    if (cached) return setLocalUser(cached);
    const addr = generateRandomAddress();
    localStorage.setItem("userAddress", addr); // ✅ 只在首次写入
    setLocalUser(addr);
}

function connectWithMagic() {
    const input = prompt("📧 请输入你的邮箱登录", localStorage.getItem("userEmail") || "");
    if (!input || !input.includes("@")) return alert("请输入合法邮箱地址");

    localStorage.setItem("userEmail", input);
    let addr = localStorage.getItem("walletFor_" + input);
    if (!addr) {
        addr = generateRandomAddress();
        localStorage.setItem("walletFor_" + input, addr);
    }
    localStorage.setItem("userAddress", addr);
    setLocalUser(addr);
}

// ========== 商品加载 & 渲染 ==========
let listings = [];

function resolveImageUrl(url) {
    if (url.startsWith("http")) return url;
    return `${location.origin}/${url}`;
}

async function renderNFTs() {
    // const loading = document.getElementById("nftLoading");
    const container = document.getElementById("nftGrid");
    // loading.style.display = "block";
    container.innerHTML = "";

    try {
        const res = await fetch("listings.json");
        listings = await res.json();

        listings.filter(n => n.status === 1).forEach(item => {
            const card = document.createElement("div");
            card.className = "card view-container active";
            card.innerHTML = `
        <img src="${(item.image)}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>价格：${item.price} USD</p>
        <p>库存：${item.stock}</p>
        <button class="primary-button">🛒 购买</button>
      `;
            card.onclick = () => onNFTClick(item.tokenId);
            container.appendChild(card);
        });
    } catch (err) {
        alert("加载商品失败: " + err.message);
    } finally {
        // loading.style.display = "none";
    }
}

// ========== 详情页 ==========
async function showDetail(tokenId) {
    if (listings.length === 0) {
        try {
            const res = await fetch("listings.json");
            listings = await res.json();
        } catch (err) {
            return alert("加载商品失败，请稍后再试");
        }
    }

    animateSwitch(["nftListView", "title"], ["nftOverlay"]);
    const item = listings.find(x => x.tokenId == tokenId);
    if (!item) return alert("商品不存在");

    document.getElementById("nftName").innerText = item.name;
    document.getElementById("nftDescription").innerText = item.description;
    document.getElementById("nftImage").src = item.image;
    document.getElementById("nftPrice").innerText = `价格：${item.price} USD`;
    document.getElementById("nftAttributes").innerHTML = `
    <p>库存：${item.stock}</p>
    <p>上架时间：${new Date(item.createdAt * 1000).toLocaleString()}</p>
    ${(item.attributes || []).map(a => `<p>${a.trait_type}: ${a.value}</p>`).join('')}
  `;

    document.getElementById("buyButton").setAttribute("data-token-id", tokenId);
    setTimeout(() => renderPayPalButton(tokenId), 0);
}

function backToList() {
    history.pushState({}, "", "#");
    animateSwitch(["nftOverlay", "ordersView", "myNFTView", "paymentResult"], ["title", "nftListView"]);
    renderNFTs();
}

function onNFTClick(tokenid) {
    history.pushState({ tokenid }, "", "#nft/" + tokenid);
    showDetail(tokenid);
}

function buyNFT() {
    const btn = document.getElementById("buyButton");
    const tokenid = btn.getAttribute("data-token-id");
    renderPayPalButton(tokenid);
}

function renderPayPalButton(tokenId) {
    const container = document.getElementById("paypal-button-container");
    container.innerHTML = "";

    const item = listings.find(x => x.tokenId == tokenId);
    const user = getLocalUser(); // 🟢 使用运行时变量，而不是 localStorage
    if (!user) {
        container.innerHTML = `<p style='color:red;'>⚠️ 请先登录</p>`;
        return;
    }

    paypal.Buttons({
        createOrder: function (data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: { value: item.price.toString() },
                    description: item.name
                }]
            });
        },
        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                const orders = JSON.parse(localStorage.getItem("orders") || "[]");
                orders.push({ user, tokenId, orderID: data.orderID, name: item.name, time: Date.now() });
                localStorage.setItem("orders", JSON.stringify(orders));

                animateSwitch(["nftOverlay", "nftListView", "title"], ["paymentResult"]);
                document.getElementById("paymentResult").innerHTML = `
          <div class="modal" style="text-align:center;">
            <h2>🎉 购买成功！</h2>
            <p>订单号：${data.orderID}</p>
            <p>商品：${item.name}</p>
            <button onclick="backToList()" class="primary-button">返回主页</button>
          </div>
        `;
            });
        }
    }).render("#paypal-button-container");
}

// ========== 通用 UI ==========
function animateSwitch(hideIds = [], showIds = []) {
    hideIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove("active");
        el.classList.add("fade-out");
    });

    setTimeout(() => {
        hideIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.display = "none";
            el.classList.remove("fade-out");
        });

        showIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // ✅ 第一步：先让它显示出来
            el.style.display = "block";
            el.classList.remove("active");

            // ✅ 第二步：在下一帧，触发动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.classList.add("view-container", "active");
                });
            });
        });
    }, 250);
}


function closeMobileAlert() {
    document.getElementById("mobileAlert").style.display = "none";
}

function copyLink() {
    const input = document.getElementById("siteLink");
    input.select();
    document.execCommand("copy");
    alert("✅ 已复制链接");
}

// ========== 初始化 ==========
document.getElementById("connectBtn").onclick = connectWallet;
document.getElementById("connectBtnMagic").onclick = connectWithMagic;
window.addEventListener("DOMContentLoaded", () => {
    const match = location.hash.match(/^#nft\/(\d+)/);
    if (match) showDetail(match[1]);
    else renderNFTs();
});

window.addEventListener("popstate", () => {
    const match = location.hash.match(/^#nft\/(\d+)/);
    if (match) showDetail(match[1]);
    else backToList();
});

function showOrders() {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]").filter(o => o.user === getLocalUser());
    const list = document.getElementById("ordersList");

    list.innerHTML = orders.length === 0
        ? `<li>暂无订单记录</li>`
        : orders.sort((a, b) => b.time - a.time).map(o => `
        <li style="margin-bottom:0.75rem;">
          🛍️ <strong>${o.name}</strong><br/>
          🧾 订单号：${o.orderID}<br/>
          ⏰ 时间：${new Date(o.time).toLocaleString()}
        </li>
      `).join('');

    animateSwitch(["nftOverlay", "paymentResult", "nftListView", "title"], ["ordersView"]);
}



function closeOrders() {
    backToList();  // ✅ 触发统一页面切换（支持动画）
}

function clearOrders() {
    if (confirm("确定要清空所有订单记录吗？")) {
        const current = getLocalUser();
        const all = JSON.parse(localStorage.getItem("orders") || "[]");
        const kept = all.filter(o => o.user !== current);
        localStorage.setItem("orders", JSON.stringify(kept));
        showOrders();
    }
}

async function showMyNFTs() {
    const user = getLocalUser();
    if (!user) return alert("请先连接钱包");

    if (listings.length === 0) {
        try {
            const res = await fetch("listings.json");
            listings = await res.json();
        } catch (e) {
            return alert("加载商品失败");
        }
    }

    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
        .filter(o => o.user === user);

    const container = document.getElementById("myNFTGrid");
    container.innerHTML = "";

    const uniqueTokenIds = [...new Set(orders.map(o => o.tokenId))];

    if (uniqueTokenIds.length === 0) {
        container.innerHTML = `<p>你尚未拥有任何 NFT</p>`;
    } else {
        uniqueTokenIds.forEach(id => {
            const item = listings.find(x => x.tokenId == id);
            if (!item) return;

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
        <img src="${(item.image)}" />
        <h3>${item.name}</h3>
        <p>${item.description}</p>
            <p style="font-size:0.85rem; color:#666;">
            🧾 合约地址：<code>0xABCDEF12....CDEF12</code><br>
            🆔 Token ID：${item.tokenId}
            </p>
      `;
            container.appendChild(card);
        });
    }

    animateSwitch(["title", "nftListView", "nftOverlay", "ordersView", "paymentResult"], ["myNFTView"]);
}
