// ========== 模拟钱包连接 ==========
function generateRandomAddress() {
  const bytes = new Uint8Array(20); // 20 bytes = 40 hex characters
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

let currentUserAddress = null;
let viewStack = [];

function getLocalUser() {
  return currentUserAddress;
}

function setLocalUser(addr) {
  currentUserAddress = addr;

  document.getElementById("walletAddress").style.display = "inline";
  document.getElementById("walletAddress").innerText = "Address: " + addr;
  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("connectBtnMagic").style.display = "none";

  document.getElementById("myRolesLink").style.display = "inline";
  document.getElementById("myCellarLink").style.display = "inline";
  document.getElementById("myOrderLink").style.display = "inline";
  document.getElementById("clearDataLink").style.display = "inline";

  // ✅ 登录后重新渲染 PayPal（如果当前处于 DID 详情页）
  // if (currentViewId === "didDetailView" && window._pendingRoleDetail) {
  //   renderPaypalButton("paypal-did-container", window._pendingRoleDetail.price, () => {
  //     purchaseNFT(window._pendingRoleDetail.roleId);
  //     showPaymentSuccess("did");
  //   });
  // }
}

function connectWallet() {
  const cached = localStorage.getItem("userAddress");
  if (cached) return setLocalUser(cached);
  const addr = generateRandomAddress();
  localStorage.setItem("userAddress", addr);
  setLocalUser(addr);
}

function connectWithMagic() {
  const input = prompt("📧 Please enter your email", localStorage.getItem("userEmail") || "");
  if (!input || !input.includes("@")) return alert("Please enter a valid email address");

  localStorage.setItem("userEmail", input);
  let addr = localStorage.getItem("walletFor_" + input);
  if (!addr) {
    addr = generateRandomAddress();
    localStorage.setItem("walletFor_" + input, addr);
  }
  setLocalUser(addr);
}

// ========== 身份 NFT 列表 ==========
const IDENTITY_NFTS = [
  {
    roleId: "winery001",
    name: "🍇 Winery",
    desc: "Can publish wine listings",
    address: "0xABC123...",
    price: 99
  },
  {
    roleId: "dao001",
    name: "🧠 DAO Member",
    desc: "Vote on proposals",
    address: "0xDEF456...",
    price: 29
  },
  {
    roleId: "investor001",
    name: "💰 Investor",
    desc: "Receive platform dividends",
    address: "0xINV789...",
    price: 199
  },
  {
    roleId: "founder001",
    name: "🧑‍💼 Founder",
    desc: "Platform governance control",
    address: "0xFND999...",
    price: 299
  },
  {
    roleId: "promoter001",
    name: "📣 Promoter",
    desc: "Invite users and earn rewards",
    address: "0xPROMO88...",
    price: 49
  },
  {
    roleId: "writer001",
    name: "✍️ Writer",
    desc: "Publish articles and reviews",
    address: "0xWRITE55...",
    price: 39
  }
];

function switchToTab(tab) {
  // 切换内容区域视图
  if (tab === "identity") {
    animateSwitchTo("identityNFTView");
  } else {
    animateSwitchTo("wineNFTView");
  }

  // 切换标签颜色
  const tabIdentity = document.getElementById("tab-identity");
  const tabWine = document.getElementById("tab-wine");

  if (!tabIdentity || !tabWine) return;

  tabIdentity.style.color = tab === "identity" ? "#8B0000" : "#000";
  tabWine.style.color = tab === "wine" ? "#8B0000" : "#000";

  currentTab = tab;

  // ✅ 设置 hash（用于刷新或回退）
  if (tab === "identity") {
    location.hash = "#identity";
  } else if (tab === "wine") {
    location.hash = "#nft";
  }
}

// 展示身份 NFT 卡片
function showIdentityNFTs() {
  const container = document.getElementById("identityNFTGrid");
  container.innerHTML = "";

  IDENTITY_NFTS.forEach(nft => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = function () {
      enterDidDetail(nft.roleId);
    };
    card.innerHTML = `
      <h3>${nft.name}</h3>
      <p style="font-size:0.9rem; color:#666;">${nft.desc}</p>
      <p style="font-size:0.85rem; color:#999;">
        Contract Address: <code>${nft.address}</code><br>
      </p>
      <button class="primary-button ">➡️ Detail</button>
    `;
    container.appendChild(card);
  });

  // backToList();
  // animateSwitchTo("identityNFTView");
}

// 模拟购买身份 NFT
function purchaseNFT() {
  const user = getLocalUser();
  const role = window._pendingRoleDetail;
  if (!user) return alert("Please connect your wallet first");

  // const alreadyOwned = roles.some(r => r.roleId === roleId);
  // if (alreadyOwned) {
  //   alert("You already own this role NFT.");
  //   return;
  // }  

  const container = document.getElementById("paypal-did-container");
  container.innerHTML = "<p>Loading PayPal...</p>";
  setTimeout(() => {
    renderPaypalButton("paypal-did-container", role.price, () => {
      const key = `roles_${user}`;
      let roles = JSON.parse(localStorage.getItem(key) || "[]");
      // ✅ 生成模拟 tokenId（示例规则：地址后4位 + 时间戳末4位）
      const tokenId = `${user.slice(-4)}${Date.now() % 10000}`;

      roles.push({ roleId: role.roleId, tokenId });
      localStorage.setItem(key, JSON.stringify(roles));

      showPaymentSuccess("did");
    });
  }, 200);
}

// ========== 展示用户已拥有身份 ==========
function showMyRoles() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");

  const container = document.getElementById("myRoleGrid");
  container.innerHTML = "";

  const key = `roles_${user}`;
  const roles = JSON.parse(localStorage.getItem(key) || "[]");

  let hasAny = false;

  roles.forEach(entry => {
    const role = IDENTITY_NFTS.find(r => r.roleId === entry.roleId);
    if (!role) return;

    hasAny = true;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h3>${role.name}</h3>
        <p style="font-size:0.9rem; color:#666;">${role.desc}</p>
        <p style="font-size:0.85rem; color:#999;">
          Contract Address: <code>${role.address}</code><br>
          Token ID: ${entry.tokenId}
        </p>
        <button class="primary-button" onclick="enterRole('${role.roleId}')">➡️ Enter</button>
      `;
    container.appendChild(card);
  });

  if (!hasAny) {
    container.innerHTML = "<p style='color:#666;'>🪪 You don't own any WineDIDs yet.</p>";
  }

  hideMainPage();
  animateSwitchTo("myRolesView");
}


// 进入具体身份功能（待扩展）
function enterRole(roleKey) {
  if (roleKey === "winery001") {
    location.hash = "#identity/" + roleKey;
    import('./winery.js').then(m => m.showWineryDashboard());
  } else if (roleKey === "dao001") {
    location.hash = "#identity/" + roleKey;
    import('./dao.js').then(m => m.showDAODashboard());
  } else {
    alert(`🔐 Entering ${roleKey} dashboard (coming soon)`);
  }
}

// 返回主视图
function backToList() {
  animateSwitchTo("mainPage");

  const hash = location.hash;
  if (hash.startsWith("#nft")) {
    history.replaceState(null, null, "#nft");
    animateSwitchTo("wineNFTView");
  } else {
    history.replaceState(null, null, "#identity");
    animateSwitchTo("identityNFTView");
  }
}

function hideMainPage() {
  const mainPage = document.getElementById("mainPage");
  mainPage.classList.remove("active");
  mainPage.classList.add("fade-out");
  setTimeout(() => {
    mainPage.style.display = "none";
    mainPage.classList.remove("fade-out");
  }, 250); // 动画持续时间需与 CSS transition 匹配
}

// ========== 页面切换动画 ==========
let currentViewId = null; // 默认首页视图

function animateSwitchTo(targetId) {
  if (targetId === currentViewId) return; // 已经是当前视图

  // console.log("currentid： " + currentViewId);
  // console.log("targetid： " + targetId);

  const fromEl = document.getElementById(currentViewId);
  const toEl = document.getElementById(targetId);

  if (!toEl) return;

  // ✅ 记录栈：仅记录非 null 的当前视图
  if (currentViewId) viewStack.push(currentViewId);

  // 渐隐当前视图
  if (fromEl) {
    fromEl.classList.remove("active");
    fromEl.classList.add("fade-out");
  }

  setTimeout(() => {
    if (fromEl) {
      fromEl.style.display = "none";
      fromEl.classList.remove("fade-out");
    }

    toEl.style.display = "block";
    toEl.classList.remove("active");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toEl.classList.add("view-container", "active");
      });
    });

    currentViewId = targetId;
  }, 250);
}

function goBack() {
  if (viewStack.length === 0) {
    animateSwitchTo("mainPage");
    return;
  }

  const lastView = viewStack.pop();
  animateSwitchTo(lastView);
}


function renderPaypalButton(containerId, price, onSuccess) {
  const user = getLocalUser();
  const container = document.getElementById(containerId);

  // if (!user) {
  //   container.innerHTML = "<p style='color:red;'>⚠️ Please connect your wallet first</p>";
  //   return;
  // }

  if (!container) return console.error("PayPal container not found");
  container.innerHTML = ""; // 清空旧按钮

  console.log("paypal");
  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{ amount: { value: price.toString() } }]
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(details => {
        onSuccess();
      });
    },
    onError: (err) => {
      alert("PayPal Error: " + err);
    }
  }).render("#" + containerId);
}

function enterDidDetail(roleKey) {
  const role = IDENTITY_NFTS.find(r => r.roleId === roleKey);
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");
  if (!role) return alert("Role not found");

  document.getElementById("didTitle").innerText = role.name;
  document.getElementById("didDesc").innerText = role.desc;

  // 显示完整合约地址和价格
  document.getElementById("didInfo").innerHTML = `
    Contract Address: <code>${role.address}</code><br>
    Price: <strong>$${role.price}</strong>
  `;

  let extraHTML = "";
  if (role.roleId === "winery001") {
    extraHTML = "🍷 Wineries can publish wine listings on-chain.";
  } else if (role.roleId === "dao001") {
    extraHTML = "🧠 DAO Members can vote and create proposals.";
  } else if (role.roleId === "investor001") {
    extraHTML = "💰 Investors share revenue based on NFT holdings.";
  } else if (role.roleId === "founder001") {
    extraHTML = "🧑‍💼 Founders can manage platform governance.";
  } else if (role.roleId === "promoter001") {
    extraHTML = "📣 Promoters earn rewards by inviting users.";
  } else if (role.roleId === "writer001") {
    extraHTML = "✍️ Writers publish reviews and wine stories.";
  }

  window._pendingRoleDetail = role;

  document.getElementById("paypal-did-container").innerHTML = `
      <button class="primary-button" onclick="purchaseNFT()">🛒 Purchase for $${role.price}</button>
    `;

  const hasOwned = user && JSON.parse(localStorage.getItem(`roles_${user}`) || "[]").some(r => r.roleId === role.roleId);
  if (hasOwned) {
    document.getElementById("paypal-did-container").innerHTML = `<p style="color:#666;">✅ You already own this DID.</p>`;
  }

  animateSwitchTo("didDetailView");

  // ✅ 保存当前 role 用于全局引用（推荐）
}

// 显示我的酒架
function showMyCellar() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");

  const txKey = `cellar_tx_${user}`;
  const records = JSON.parse(localStorage.getItem(txKey) || "[]");

  const container = document.getElementById("cellarGrid");
  container.innerHTML = "";

  if (records.length === 0) {
    container.innerHTML = "<p style='color:#666;'>🕳️ Your wine cellar is empty.</p>";
    hideMainPage();
    animateSwitchTo("myCellarView");
    return;
  }

  // 聚合每个 productId 的总数量
  const summary = {};
  records.forEach(tx => {
    if (tx.txType !== "BUY") return; // 可拓展处理其他类型
    summary[tx.productId] = (summary[tx.productId] || 0) + tx.quantity;
  });

  fetch("listings.json").then(res => res.json()).then(data => {
    Object.keys(summary).forEach(pid => {
      const wine = data.find(w => w.productId == pid);
      if (!wine) return;

      const quantity = summary[pid];
      const lastPurchase = records.filter(r => r.productId == pid).slice(-1)[0];
      const dateStr = new Date(lastPurchase.timestamp).toLocaleString();

      const card = document.createElement("div");
      card.className = "card";
      card.onclick = () => showDetail(wine.productId);
      card.innerHTML = `
        <img src="${wine.image}" style="height: 200px; object-fit: contain; display: block; margin: 0 auto; border-radius:8px;" />
        <h3>${wine.name}</h3>
        <p style="font-size:0.9rem; color:#666;">${wine.description}</p>
        <p style="font-size:0.85rem; color:#999;">🕒 Last purchase: ${dateStr}</p>
        <p style="font-size:0.85rem; color:#999;">
          Contract: <code>${wine.contract}</code><br>
          Token ID: ${wine.tokenId}<br>
          Quantity: ${quantity}
        </p>
        <p style="font-weight:bold;">Price: $${wine.price}</p>
      `;
      container.appendChild(card);
    });

    hideMainPage();
    animateSwitchTo("myCellarView");
  });
}

document.getElementById("clearDataLink").onclick = function () {
  if (confirm("Are you sure you want to clear all test data?")) {
    localStorage.clear();
    alert("✅ All local test data cleared.\nPlease refresh the page.");
  }
};

// 显示我的订单
function showMyOrders() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");

  const key = `cellar_tx_${user}`;
  const orders = JSON.parse(localStorage.getItem(key) || "[]").filter(o => o.txType === "BUY");

  const container = document.getElementById("ordersGrid");
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p style='color:#666;'>📭 You have no orders yet.</p>";
    hideMainPage();
    animateSwitchTo("myOrdersView");
    return;
  }

  fetch("listings.json").then(res => res.json()).then(data => {
    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

    orders.reverse().forEach(order => {
      const wine = data.find(w => w.productId == order.productId);
      if (!wine) return;

      const dateStr = new Date(order.timestamp).toLocaleString();

      const li = document.createElement("li");
      li.style.borderBottom = "1px solid #eee";
      li.style.padding = "0.5rem 0";

      li.innerHTML = `
        <strong>${wine.name}</strong> × ${order.quantity}  
        <span style="color:#666; font-size: 0.9rem;"> | 🕒 ${dateStr}</span>  
        <span style="float:right; color:#999;">$${(wine.price * order.quantity).toFixed(2)}</span>
      `;

      list.appendChild(li);
    });

    container.appendChild(list);
    hideMainPage();
    animateSwitchTo("myOrdersView");
  });
}


function showPaymentSuccess(type) {
  hideMainPage();
  const msg = document.getElementById("successMessage");
  if (type === "wine") {
    msg.innerText = "🍷 You have successfully purchased a wine NFT!";
  } else if (type === "did") {
    msg.innerText = "🪪 You have successfully purchased a Wine DID!";
  } else {
    msg.innerText = "🎉 Purchase completed!";
  }

  // 控制按钮显示
  document.getElementById("cellarBtn").style.display = type === "wine" ? "inline-block" : "none";
  document.getElementById("didBtn").style.display = type === "did" ? "inline-block" : "none";

  animateSwitchTo("paymentResult");
}

// ========== 初始化 ==========
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = connectWallet;
  document.getElementById("connectBtnMagic").onclick = connectWithMagic;
  document.getElementById("myCellarLink").onclick = showMyCellar;
  document.getElementById("myRolesLink").onclick = showMyRoles;
  document.getElementById("myOrderLink").onclick = showMyOrders;

  animateSwitchTo("mainPage");
  showIdentityNFTs();
  loadWineNFTs();

  // 若URL带 hash 自动打开详情
  const hash = location.hash;

  if (hash.startsWith("#nft")) {
    switchToTab("wine"); // ✅ 设置标签高亮
    const match = hash.match(/^#nft\/(\d+)/);
    if (match) {
      // ✅ 等待列表加载完成后再展示详情，避免冲突
      setTimeout(() => showDetail(match[1]), 300);
    }
  } else {
    switchToTab("identity");
  }
});
