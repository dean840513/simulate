export async function showDAODashboard() {
  const user = getLocalUser();
  if (!user) return alert("Please connect your wallet");

  const roles = JSON.parse(localStorage.getItem(`roles_${user}`) || "[]");
  const hasDAO = roles.some(r => r.roleId === "dao001");
  if (!hasDAO) return alert("You don't have DAO Member NFT");

  animateSwitchTo("daoView");
  renderProposalForm();
  renderProposalList();
}

function renderProposalForm() {
  const form = document.getElementById("daoForm");
  form.innerHTML = `
    <h3>📢 Submit Proposal</h3>
    <label>Title: <input id="proposalTitle" /></label><br>
    <label>Details: <input id="proposalDesc" /></label><br>
    <button class="primary-button" onclick="submitProposal()">📝 Submit</button>
    <hr>
  `;
}

window.submitProposal = function () {
  const title = document.getElementById("proposalTitle").value.trim();
  const desc = document.getElementById("proposalDesc").value.trim();
  if (!title || !desc) return alert("Fill all fields");

  const proposals = JSON.parse(localStorage.getItem("daoProposals") || "[]");
  proposals.push({
    id: Date.now(),
    title,
    desc,
    votes: 0,
    voters: []
  });
  localStorage.setItem("daoProposals", JSON.stringify(proposals));
  renderProposalList();
};

function renderProposalList() {
  const container = document.getElementById("daoList");
  const proposals = JSON.parse(localStorage.getItem("daoProposals") || "[]");
  const user = getLocalUser();

  if (proposals.length === 0) {
    container.innerHTML = "<p>No proposals yet.</p>";
    return;
  }

  container.innerHTML = proposals.map(p => {
    const voted = p.voters.includes(user);
    return `
      <div class="card">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <p>🗳️ Votes: ${p.votes}</p>
        ${voted ? `<p style="color:green;">✅ You voted</p>` : `<button class="primary-button" onclick="voteProposal(${p.id})">👍 Vote</button>`}
      </div>
    `;
  }).join("");
}

window.voteProposal = function (id) {
  const proposals = JSON.parse(localStorage.getItem("daoProposals") || "[]");
  const user = getLocalUser();
  const index = proposals.findIndex(p => p.id === id);
  if (index === -1) return;

  const proposal = proposals[index];
  if (proposal.voters.includes(user)) return alert("You already voted");

  proposal.votes += 1;
  proposal.voters.push(user);
  localStorage.setItem("daoProposals", JSON.stringify(proposals));
  renderProposalList();
};
