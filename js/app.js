const SITES = [
  {
    id: "ratings",
    label: "ratings.promedia.report",
    repo: "Ianitskyi/Journalism2026",
    branch: "main",
    liveUrl: "https://ratings.promedia.report",
    files: [
      { id: "site", label: "Тексти і SEO", path: "content/site.json", type: "json" },
    ],
  },
  {
    id: "communities",
    label: "communities.promedia.report",
    repo: "Ianitskyi/promedia-communities",
    branch: "main",
    liveUrl: "https://communities.promedia.report",
    files: [
      { id: "site", label: "Тексти і SEO", path: "content/site.json", type: "json" },
      { id: "catalog", label: "Каталог медіаспільнот", path: "data/communities.json", type: "json" },
    ],
  },
  {
    id: "jobs",
    label: "jobs.promedia.report",
    repo: "Ianitskyi/promedia-jobs",
    branch: "main",
    liveUrl: "http://jobs.promedia.report",
    files: [
      { id: "vacancies", label: "Вакансії та довідники", path: "js/data.js", type: "javascript" },
    ],
  },
];

const $ = (id) => document.getElementById(id);

const els = {
  tokenInput: $("token-input"),
  rememberToken: $("remember-token"),
  tokenSaveBtn: $("token-save-btn"),
  tokenClearBtn: $("token-clear-btn"),
  logoutBtn: $("logout-btn"),
  siteList: $("site-list"),
  siteCount: $("site-count"),
  fileSelect: $("file-select"),
  loadBtn: $("load-btn"),
  formatBtn: $("format-btn"),
  saveBtn: $("save-btn"),
  editor: $("editor"),
  commitMessage: $("commit-message"),
  resultBox: $("result-box"),
  connectionStatus: $("connection-status"),
  fileStatus: $("file-status"),
  dirtyStatus: $("dirty-status"),
  currentRepo: $("current-repo"),
  currentTitle: $("current-title"),
  liveLink: $("live-link"),
  githubLink: $("github-link"),
};

let selectedSite = SITES[0];
let selectedFile = selectedSite.files[0];
let currentFile = null;
let originalContent = "";
let isDirty = false;

function getToken() {
  return sessionStorage.getItem("pm_subdomains_admin_token") || localStorage.getItem("pm_subdomains_admin_token") || "";
}

function setToken(token, remember) {
  sessionStorage.removeItem("pm_subdomains_admin_token");
  localStorage.removeItem("pm_subdomains_admin_token");
  if (!token) return;
  if (remember) localStorage.setItem("pm_subdomains_admin_token", token);
  else sessionStorage.setItem("pm_subdomains_admin_token", token);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function setStatus(el, text, tone) {
  el.textContent = text;
  el.className = tone || "";
}

function showResult(message, tone = "") {
  els.resultBox.hidden = false;
  els.resultBox.className = `result-box ${tone}`;
  els.resultBox.innerHTML = message;
}

function clearResult() {
  els.resultBox.hidden = true;
  els.resultBox.textContent = "";
  els.resultBox.className = "result-box";
}

function decodeBase64(content) {
  const clean = String(content || "").replace(/\n/g, "");
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function github(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Спочатку підключіть GitHub token.");

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `GitHub API error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function githubFileUrl(site, file) {
  return `https://github.com/${site.repo}/blob/${site.branch}/${file.path}`;
}

function repoApiPath(site, file) {
  return `/repos/${site.repo}/contents/${encodeURIComponent(file.path).replace(/%2F/g, "/")}`;
}

function validateContent(content, file) {
  if (file.type === "json") {
    JSON.parse(content);
    return;
  }

  if (file.type === "javascript") {
    if (!content.includes("const VACANCIES = [")) {
      throw new Error("У JS-файлі не знайдено const VACANCIES = [. Перевірте, чи відкритий правильний файл.");
    }
    if (!content.includes("foundBy: \"promedia\"")) {
      throw new Error("У JS-файлі не знайдено типових вакансій ПроМедіа. Збереження зупинено для безпеки.");
    }
  }
}

function prettyJson() {
  if (!selectedFile || selectedFile.type !== "json") return;
  try {
    const parsed = JSON.parse(els.editor.value);
    els.editor.value = JSON.stringify(parsed, null, 2) + "\n";
    updateDirtyState();
    showResult("JSON відформатовано.", "good");
  } catch (error) {
    showResult(`JSON помилка: ${escapeHtml(error.message)}`, "bad");
  }
}

function renderSites() {
  els.siteCount.textContent = `${SITES.length}`;
  els.siteList.innerHTML = SITES.map((site) => `
    <button class="site-btn ${site.id === selectedSite.id ? "active" : ""}" type="button" data-site="${site.id}">
      <strong>${escapeHtml(site.label)}</strong>
      <span>${escapeHtml(site.repo)}</span>
    </button>
  `).join("");

  els.siteList.querySelectorAll(".site-btn").forEach((button) => {
    button.addEventListener("click", () => selectSite(button.dataset.site));
  });
}

function renderFileSelect() {
  els.fileSelect.innerHTML = selectedSite.files.map((file) => `
    <option value="${file.id}">${escapeHtml(file.label)} - ${escapeHtml(file.path)}</option>
  `).join("");
  els.fileSelect.value = selectedFile.id;
  els.formatBtn.disabled = selectedFile.type !== "json";
}

function selectSite(siteId) {
  if (isDirty && !confirm("Є незбережені зміни. Перейти до іншого субдомену?")) return;
  selectedSite = SITES.find((site) => site.id === siteId) || SITES[0];
  selectedFile = selectedSite.files[0];
  currentFile = null;
  originalContent = "";
  els.editor.value = "";
  clearResult();
  render();
}

function selectFile(fileId) {
  if (isDirty && !confirm("Є незбережені зміни. Перейти до іншого файлу?")) {
    els.fileSelect.value = selectedFile.id;
    return;
  }
  selectedFile = selectedSite.files.find((file) => file.id === fileId) || selectedSite.files[0];
  currentFile = null;
  originalContent = "";
  els.editor.value = "";
  clearResult();
  render();
}

function updateDirtyState() {
  isDirty = els.editor.value !== originalContent;
  setStatus(els.dirtyStatus, isDirty ? "Є незбережені зміни" : "Без змін", isDirty ? "warn" : "ok");
}

function renderHeader() {
  els.currentRepo.textContent = `${selectedSite.repo} / ${selectedSite.branch}`;
  els.currentTitle.textContent = `${selectedSite.label}: ${selectedFile.label}`;
  els.liveLink.href = selectedSite.liveUrl;
  els.liveLink.hidden = false;
  els.githubLink.href = githubFileUrl(selectedSite, selectedFile);
  els.githubLink.hidden = false;
}

function updateAuthStatus() {
  const token = getToken();
  els.tokenInput.value = token ? "token is saved in this browser" : "";
  setStatus(els.connectionStatus, token ? "GitHub token підключений" : "Token не підключений", token ? "ok" : "bad");
  els.saveBtn.disabled = !token || !currentFile;
  els.loadBtn.disabled = !token;
}

function updateFileStatus() {
  if (!currentFile) {
    setStatus(els.fileStatus, "Файл не завантажено", "");
    return;
  }
  setStatus(els.fileStatus, `SHA ${currentFile.sha.slice(0, 7)}`, "ok");
}

function render() {
  renderSites();
  renderFileSelect();
  renderHeader();
  updateAuthStatus();
  updateFileStatus();
  updateDirtyState();
}

async function testToken() {
  const token = els.tokenInput.value.trim();
  if (!token || token === "token is saved in this browser") {
    showResult("Вставте GitHub token.", "bad");
    return;
  }

  setToken(token, els.rememberToken.checked);
  try {
    const user = await github("/user");
    showResult(`Підключено GitHub account: <strong>${escapeHtml(user.login)}</strong>.`, "good");
  } catch (error) {
    setToken("", false);
    showResult(`Не вдалося підключити token: ${escapeHtml(error.message)}`, "bad");
  }
  render();
}

async function loadSelectedFile() {
  clearResult();
  try {
    const data = await github(`${repoApiPath(selectedSite, selectedFile)}?ref=${encodeURIComponent(selectedSite.branch)}`);
    if (data.type !== "file") throw new Error("GitHub повернув не файл.");
    currentFile = data;
    originalContent = decodeBase64(data.content);
    els.editor.value = originalContent;
    els.commitMessage.value = `Update ${selectedFile.path} via ProMedia subdomains admin`;
    showResult(`Завантажено <strong>${escapeHtml(selectedFile.path)}</strong> з ${escapeHtml(selectedSite.repo)}.`, "good");
  } catch (error) {
    showResult(`Не вдалося завантажити файл: ${escapeHtml(error.message)}`, "bad");
  }
  render();
}

async function saveSelectedFile() {
  clearResult();
  if (!currentFile) {
    showResult("Спочатку завантажте файл.", "bad");
    return;
  }

  try {
    const content = els.editor.value;
    validateContent(content, selectedFile);

    const message = els.commitMessage.value.trim() || `Update ${selectedFile.path} via ProMedia subdomains admin`;
    const payload = {
      message,
      content: encodeBase64(content.endsWith("\n") ? content : `${content}\n`),
      sha: currentFile.sha,
      branch: selectedSite.branch,
    };

    const result = await github(repoApiPath(selectedSite, selectedFile), {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    currentFile = {
      ...currentFile,
      sha: result.content.sha,
      html_url: result.content.html_url,
    };
    originalContent = content.endsWith("\n") ? content : `${content}\n`;
    els.editor.value = originalContent;
    showResult(`Збережено в GitHub. Commit: <a href="${escapeHtml(result.commit.html_url)}" target="_blank" rel="noopener">${escapeHtml(result.commit.sha.slice(0, 7))}</a>. GitHub Pages оновить сайт автоматично.`, "good");
  } catch (error) {
    showResult(`Не вдалося зберегти: ${escapeHtml(error.message)}`, "bad");
  }
  render();
}

function clearToken() {
  setToken("", false);
  els.tokenInput.value = "";
  currentFile = null;
  originalContent = "";
  els.editor.value = "";
  clearResult();
  render();
}

function bindEvents() {
  els.tokenSaveBtn.addEventListener("click", testToken);
  els.tokenClearBtn.addEventListener("click", clearToken);
  els.logoutBtn.addEventListener("click", clearToken);
  els.fileSelect.addEventListener("change", () => selectFile(els.fileSelect.value));
  els.loadBtn.addEventListener("click", loadSelectedFile);
  els.formatBtn.addEventListener("click", prettyJson);
  els.saveBtn.addEventListener("click", saveSelectedFile);
  els.editor.addEventListener("input", updateDirtyState);

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

bindEvents();
render();
