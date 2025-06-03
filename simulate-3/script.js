// ========== 模拟钱包连接 ==========
function generateRandomAddress() {
  const chars = 'abcdef0123456789';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
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
  document.getElementById("walletAddress").innerText = "Address: " + addr;
  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("connectBtnMagic").style.display = "none";

  document.getElementById("myRolesLink").style.display = "inline";
  document.getElementById("myRolesLink").onclick = showMyRoles;
}

function connectWallet() {
  const cached = localStorage.getItem("userAddress");
  if (cached) return setLocalUser(cached);
  const addr = generateRandomAddress();
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
  { key: "winery", name: "🍇 Winery", desc: "Can publish wine listings", address: "0xABC123...", tokenId: 1, price: 49.99 },
  { key: "dao", name: "🧠 DAO Member", desc: "Vote on proposals", address: "0xDEF456...", tokenId: 2, price: 39.99 },
  { key: "investor", name: "💰 Investor", desc: "Receive platform dividends", address: "0xINV789...", tokenId: 3, price: 59.99 },
  { key: "founder", name: "🧑‍💼 Founder", desc: "Platform governance control", address: "0xFND999...", tokenId: 4, price: 99.99 },
  { key: "promoter", name: "📣 Promoter", desc: "Invite users and earn rewards", address: "0xPROMO88...", tokenId: 5, price: 29.99 },
  { key: "writer", name: "✍️ Writer", desc: "Publish articles and reviews", address: "0xWRITE55...", tokenId: 6, price: 24.99 }
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
      enterDidDetail(nft.key);
    };
    card.innerHTML = `
      <h3>${nft.name}</h3>
      <p style="font-size:0.9rem; color:#666;">${nft.desc}</p>
      <p style="font-size:0.85rem; color:#999;">
        Contract Address: <code>${nft.address}</code><br>
        Token ID: ${nft.tokenId}
      </p>
      <button class="primary-button" onclick="enterDidDetail('${nft.key}')">➡️ Detail</button>
    `;
    container.appendChild(card);
  });

  backToList();
}

// 模拟购买身份 NFT
function purchaseNFT(roleKey) {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");

  const key = `roles_${user}`;
  let roles = JSON.parse(localStorage.getItem(key) || "[]");

  if (roles.includes(roleKey)) {
    alert("You already own this role NFT.");
    return;
  }

  roles.push(roleKey);
  localStorage.setItem(key, JSON.stringify(roles));

  alert("✅ Purchase successful! Role NFT added.");
  showIdentityNFTs();
}

// ========== 展示用户已拥有身份 ==========
function showMyRoles() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet first");

  const container = document.getElementById("myRoleGrid");
  container.innerHTML = "";

  const key = `roles_${user}`;
  const roles = JSON.parse(localStorage.getItem(key) || "[]");

  IDENTITY_NFTS.forEach(role => {
    if (!roles.includes(role.key)) return;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${role.name}</h3>
      <p style="font-size:0.9rem; color:#666;">${role.desc}</p>
      <p style="font-size:0.85rem; color:#999;">
        Contract Address: <code>${role.address}</code><br>
        Token ID: ${role.tokenId}
      </p>
      <button class="primary-button" onclick="enterRole('${role.key}')">➡️ Enter</button>
    `;
    container.appendChild(card);
  });

  hideMainPage();
  animateSwitchTo("myRolesView");
}

// 进入具体身份功能（待扩展）
function enterRole(roleKey) {
  const role = IDENTITY_NFTS.find(r => r.key === roleKey);
  alert(`🔐 Entering ${role.name} dashboard (coming soon)`);
}

// 返回主视图
function backToList() {
  animateSwitchTo("mainPage");

  const hash = location.hash;
  if (hash.startsWith("#nft")) {
    history.replaceState(null, null, "#");
    animateSwitchTo("wineNFTView");
  } else {
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


  console.log("currentid： " + currentViewId);
  console.log("targetid： " + targetId);


  const fromEl = document.getElementById(currentViewId);
  const toEl = document.getElementById(targetId);

  if (!toEl) return;

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

function enterDidDetail(roleKey) {
  const role = IDENTITY_NFTS.find(r => r.key === roleKey);
  if (!role) return alert("Role not found");

  document.getElementById("didTitle").innerText = role.name;
  document.getElementById("didDesc").innerText = role.desc;

  // 显示完整合约地址和价格
  document.getElementById("didInfo").innerHTML = `
    Contract Address: <code>${role.address}</code><br>
    Token ID: ${role.tokenId}<br>
    Price: <strong>$${role.price}</strong>
  `;

  let extraHTML = "";
  if (role.key === "winery") {
    extraHTML = "🍷 Wineries can publish wine listings on-chain.";
  } else if (role.key === "dao") {
    extraHTML = "🧠 DAO Members can vote and create proposals.";
  } else if (role.key === "investor") {
    extraHTML = "💰 Investors share revenue based on NFT holdings.";
  } else if (role.key === "founder") {
    extraHTML = "🧑‍💼 Founders can manage platform governance.";
  } else if (role.key === "promoter") {
    extraHTML = "📣 Promoters earn rewards by inviting users.";
  } else if (role.key === "writer") {
    extraHTML = "✍️ Writers publish reviews and wine stories.";
  }

  document.getElementById("didExtra").innerHTML = `
    <p>${extraHTML}</p>
    <button class="primary-button" onclick="purchaseNFT('${role.key}')">🛒 Purchase for $${role.price}</button>
  `;

  animateSwitchTo("didDetailView");
}




// ========== 初始化 ==========
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = connectWallet;
  document.getElementById("connectBtnMagic").onclick = connectWithMagic;

  showIdentityNFTs();
  loadWineNFTs();



  // 若URL带 hash 自动打开详情
  const hash = location.hash;
  if (hash.startsWith("#nft")) {
    const match = hash.match(/^#nft\/(\d+)/);
    if (match) showDetail(match[1]);
  }
});
