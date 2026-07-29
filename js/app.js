const SITES = [
  {
    id: "ratings",
    label: "ratings.promedia.report",
    title: "Рейтинг журфаків",
    description: "Тексти, SEO та beta-повідомлення для рейтингу журналістських програм.",
    repo: "Ianitskyi/Journalism2026",
    branch: "main",
    liveUrl: "https://ratings.promedia.report",
    files: [
      { id: "site", label: "Тексти і SEO", path: "content/site.json", type: "json", help: "Заголовки, описи, перший екран і службові повідомлення українською та англійською." },
    ],
  },
  {
    id: "communities",
    label: "communities.promedia.report",
    title: "Медійні спільноти",
    description: "Тексти сторінки та каталог медіаспільнот України.",
    repo: "Ianitskyi/promedia-communities",
    branch: "main",
    liveUrl: "https://communities.promedia.report",
    files: [
      { id: "site", label: "Тексти і SEO", path: "content/site.json", type: "json", help: "Заголовки, SEO-описи, перший екран і текст блоку додавання медіа." },
      { id: "catalog", label: "Каталог медіаспільнот", path: "data/communities.json", type: "json", help: "Список медіа на карті: назва, регіон, сайт, опис, статус і позначки." },
    ],
  },
  {
    id: "jobs",
    label: "jobs.promedia.report",
    title: "Вакансії",
    description: "Вакансії, компанії, довідники форматів і умов роботи.",
    repo: "Ianitskyi/promedia-jobs",
    branch: "main",
    liveUrl: "http://jobs.promedia.report",
    files: [
      { id: "vacancies", label: "Вакансії та довідники", path: "js/data.js", type: "javascript", help: "Технічний файл із вакансіями. Поки редагується у режимі коду." },
    ],
  },
];

const FIELD_LABELS = {
  schemaVersion: "Версія схеми",
  admin: "Службова інформація",
  label: "Назва",
  repository: "GitHub репозиторій",
  editableFile: "Редагований файл",
  description: "Опис",
  i18n: "Мовні версії",
  uk: "Українська версія",
  en: "Англійська версія",
  meta: "SEO",
  title: "Заголовок",
  indexTitle: "SEO-заголовок головної",
  desc: "SEO-опис",
  indexDesc: "SEO-опис головної",
  hero: "Перший екран",
  eyebrow: "Надзаголовок",
  lede: "Короткий опис",
  beta: "Beta-повідомлення",
  noticeHtml: "Текст повідомлення",
  addSection: "Блок додавання",
  text: "Текст",
  id: "ID",
  name: "Назва",
  region: "Область",
  regionSlug: "Код області",
  city: "Місто",
  website: "Сайт",
  communityIdea: "Ідея спільноти",
  communityUrl: "Посилання на спільноту",
  platform: "Платформа",
  badges: "Позначки",
  recommended: "Рекомендоване",
  whitelist: "Білий список",
  jti: "JTI",
  status: "Статус",
  example: "Приклад",
};

const FIELD_HELP = {
  noticeHtml: "Можна залишати HTML-посилання, наприклад <a href=\"mailto:...\">...</a>.",
  regionSlug: "Технічний код області для карти. Краще не змінювати без потреби.",
  id: "Технічний ID. Краще не змінювати після публікації.",
  status: "Зазвичай approved для опублікованих записів.",
  repository: "Службове поле, не текст сайту.",
  editableFile: "Службове поле, не текст сайту.",
};

const ADMIN_USERNAME = "subdomain";
const ADMIN_PASSWORD_HASH = "50e0c84fda2c03731cb20e8c080acb11ac6eb2ba79254a1ee7aa00f0dfbd6661";
const ADMIN_AUTH_KEY = "pm_subdomains_admin_auth";
const memoryStorage = {};

const $ = (id) => document.getElementById(id);

const els = {
  loginScreen: $("login-screen"),
  loginForm: $("login-form"),
  adminLogin: $("admin-login"),
  adminPassword: $("admin-password"),
  showAdminPassword: $("show-admin-password"),
  rememberAdminLogin: $("remember-admin-login"),
  loginError: $("login-error"),
  appRoot: $("app-root"),
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
  currentHelp: $("current-help"),
  liveLink: $("live-link"),
  githubLink: $("github-link"),
  modeSwitch: $("mode-switch"),
  formEditor: $("form-editor"),
  rawEditorWrap: $("raw-editor-wrap"),
  rawWarning: $("raw-warning"),
  emptyState: $("empty-state"),
};

let selectedSite = SITES[0];
let selectedFile = selectedSite.files[0];
let currentFile = null;
let originalContent = "";
let isDirty = false;
let editorMode = "form";
let structuredData = null;

async function sha256Hex(value) {
  if (!window.crypto?.subtle) {
    throw new Error("Цей браузер не підтримує безпечну перевірку пароля. Відкрийте адмінку через HTTPS.");
  }

  const bytes = new TextEncoder().encode(value);
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isAdminAuthed() {
  return storageGet("sessionStorage", ADMIN_AUTH_KEY) === "1" || storageGet("localStorage", ADMIN_AUTH_KEY) === "1";
}

function showLogin(message = "") {
  document.body.classList.add("locked");
  els.appRoot.hidden = true;
  els.loginScreen.hidden = false;
  els.loginError.hidden = !message;
  els.loginError.textContent = message;
  els.adminPassword.value = "";
  els.adminLogin.focus();
}

function showApp() {
  document.body.classList.remove("locked");
  els.loginScreen.hidden = true;
  els.appRoot.hidden = false;
  render();
}

async function handleLogin(event) {
  event.preventDefault();

  const username = els.adminLogin.value.trim();
  const password = els.adminPassword.value.trim();

  try {
    const passwordHash = await sha256Hex(password);
    if (username !== ADMIN_USERNAME || passwordHash !== ADMIN_PASSWORD_HASH) {
      showLogin("Неправильний логін або пароль. Перевірте розкладку, регістр і зайві пробіли.");
      return;
    }

    storageRemove("sessionStorage", ADMIN_AUTH_KEY);
    storageRemove("localStorage", ADMIN_AUTH_KEY);
    storageSet(els.rememberAdminLogin.checked ? "localStorage" : "sessionStorage", ADMIN_AUTH_KEY, "1");
    els.adminPassword.value = "";
    showApp();
  } catch (error) {
    showLogin(error.message);
  }
}

function getToken() {
  return storageGet("sessionStorage", "pm_subdomains_admin_token") || storageGet("localStorage", "pm_subdomains_admin_token") || "";
}

function setToken(token, remember) {
  storageRemove("sessionStorage", "pm_subdomains_admin_token");
  storageRemove("localStorage", "pm_subdomains_admin_token");
  if (!token) return;
  if (remember) storageSet("localStorage", "pm_subdomains_admin_token", token);
  else storageSet("sessionStorage", "pm_subdomains_admin_token", token);
}

function storageGet(storageName, key) {
  try {
    const store = window[storageName];
    if (store) return store.getItem(key) || "";
  } catch (error) {
    // Some embedded browsers block Web Storage. Fall back to this tab only.
  }

  return memoryStorage[`${storageName}:${key}`] || "";
}

function storageSet(storageName, key, value) {
  try {
    const store = window[storageName];
    if (store) {
      store.setItem(key, value);
      return;
    }
  } catch (error) {
    // Some embedded browsers block Web Storage. Fall back to this tab only.
  }

  memoryStorage[`${storageName}:${key}`] = value;
}

function storageRemove(storageName, key) {
  try {
    const store = window[storageName];
    if (store) store.removeItem(key);
  } catch (error) {
    // Some embedded browsers block Web Storage. Fall back to this tab only.
  }

  delete memoryStorage[`${storageName}:${key}`];
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

function humanLabel(key, path = []) {
  if (key === undefined || key === null || key === "") return "Група";
  if (typeof key === "number" || /^\d+$/.test(String(key))) return `Запис ${Number(key) + 1}`;
  return FIELD_LABELS[key] || String(key).replace(/([A-Z])/g, " $1").replace(/^./, (ch) => ch.toUpperCase());
}

function pathTitle(path) {
  return path.map((part) => humanLabel(part)).join(" / ");
}

function shouldUseTextarea(key, value) {
  const longKeys = ["description", "communityIdea", "noticeHtml", "indexDesc", "desc", "lede", "text"];
  return longKeys.includes(String(key)) || String(value).length > 90 || String(value).includes("<");
}

function pathToAttr(path) {
  return escapeHtml(JSON.stringify(path));
}

function valueAtPath(source, path) {
  return path.reduce((acc, part) => acc?.[part], source);
}

function setValueAtPath(source, path, value) {
  const last = path[path.length - 1];
  const parent = valueAtPath(source, path.slice(0, -1));
  const previous = parent[last];

  if (typeof previous === "number") {
    parent[last] = Number(value);
    return;
  }

  if (typeof previous === "boolean") {
    parent[last] = value === "true";
    return;
  }

  parent[last] = value;
}

function renderPrimitiveField(key, value, path) {
  const label = humanLabel(key, path);
  const help = FIELD_HELP[key] || "";
  const wide = shouldUseTextarea(key, value) ? " wide" : "";
  const pathAttr = pathToAttr(path);
  const helpHtml = help ? `<small>${escapeHtml(help)}</small>` : "";

  if (typeof value === "boolean") {
    return `
      <div class="smart-field">
        <label>${escapeHtml(label)}</label>
        <select data-json-path="${pathAttr}">
          <option value="true" ${value ? "selected" : ""}>Так</option>
          <option value="false" ${!value ? "selected" : ""}>Ні</option>
        </select>
        ${helpHtml}
      </div>
    `;
  }

  if (shouldUseTextarea(key, value)) {
    return `
      <div class="smart-field${wide}">
        <label>${escapeHtml(label)}</label>
        <textarea data-json-path="${pathAttr}">${escapeHtml(value)}</textarea>
        ${helpHtml}
      </div>
    `;
  }

  const type = typeof value === "number" ? "number" : "text";
  return `
    <div class="smart-field${wide}">
      <label>${escapeHtml(label)}</label>
      <input type="${type}" value="${escapeHtml(value)}" data-json-path="${pathAttr}" />
      ${helpHtml}
    </div>
  `;
}

function renderJsonNode(value, path = [], key = "root") {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return renderPrimitiveField(key, value ?? "", path);
  }

  if (Array.isArray(value)) {
    const title = path.length ? humanLabel(key, path) : "Список";
    const items = value.map((item, index) => renderJsonNode(item, path.concat(index), index)).join("");
    return `
      <details class="form-section" open>
        <summary>${escapeHtml(title)} (${value.length})</summary>
        <div class="form-section-body">${items}</div>
      </details>
    `;
  }

  const entries = Object.entries(value);
  const simpleEntries = entries.filter(([, child]) => child === null || ["string", "number", "boolean"].includes(typeof child));
  const complexEntries = entries.filter(([, child]) => child !== null && !["string", "number", "boolean"].includes(typeof child));
  const simpleHtml = simpleEntries.map(([childKey, child]) => renderPrimitiveField(childKey, child ?? "", path.concat(childKey))).join("");
  const complexHtml = complexEntries.map(([childKey, child]) => renderJsonNode(child, path.concat(childKey), childKey)).join("");
  const title = path.length ? humanLabel(key, path) : "Вміст";
  const open = path.length <= 2 ? " open" : "";

  return `
    <details class="form-section"${open}>
      <summary>${escapeHtml(title)}</summary>
      <div class="form-section-body">
        ${simpleHtml ? `<div class="form-grid">${simpleHtml}</div>` : ""}
        ${complexHtml}
      </div>
    </details>
  `;
}

function renderFormEditor() {
  if (!structuredData || selectedFile.type !== "json") {
    els.formEditor.hidden = true;
    els.formEditor.innerHTML = "";
    return;
  }

  els.formEditor.innerHTML = renderJsonNode(structuredData);
  els.formEditor.hidden = false;

  els.formEditor.querySelectorAll("[data-json-path]").forEach((field) => {
    field.addEventListener("input", onFormFieldChange);
    field.addEventListener("change", onFormFieldChange);
  });
}

function onFormFieldChange(event) {
  const path = JSON.parse(event.currentTarget.dataset.jsonPath);
  setValueAtPath(structuredData, path, event.currentTarget.value);
  els.editor.value = JSON.stringify(structuredData, null, 2) + "\n";
  updateDirtyState();
}

function showEditorForCurrentFile() {
  const hasFile = !!currentFile;
  els.emptyState.hidden = hasFile;
  els.modeSwitch.hidden = !hasFile || selectedFile.type !== "json";
  els.rawWarning.hidden = selectedFile.type === "json";

  if (!hasFile) {
    els.formEditor.hidden = true;
    els.rawEditorWrap.hidden = true;
    return;
  }

  if (selectedFile.type === "json" && editorMode === "form") {
    els.formEditor.hidden = false;
    els.rawEditorWrap.hidden = true;
  } else {
    els.formEditor.hidden = true;
    els.rawEditorWrap.hidden = false;
  }

  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === editorMode);
  });
}

function switchEditorMode(mode) {
  if (!currentFile || selectedFile.type !== "json") return;

  if (mode === "form") {
    try {
      structuredData = JSON.parse(els.editor.value);
      renderFormEditor();
    } catch (error) {
      showResult(`Не можу перейти у зручні поля, бо JSON має помилку: ${escapeHtml(error.message)}`, "bad");
      return;
    }
  }

  editorMode = mode;
  showEditorForCurrentFile();
}

function prettyJson() {
  if (!selectedFile || selectedFile.type !== "json") return;
  try {
    const parsed = JSON.parse(els.editor.value);
    els.editor.value = JSON.stringify(parsed, null, 2) + "\n";
    structuredData = parsed;
    renderFormEditor();
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
      <strong>${escapeHtml(site.title || site.label)}</strong>
      <span>${escapeHtml(site.label)}</span>
      <em>${escapeHtml(site.description || site.repo)}</em>
    </button>
  `).join("");

  els.siteList.querySelectorAll(".site-btn").forEach((button) => {
    button.addEventListener("click", () => selectSite(button.dataset.site));
  });
}

function renderFileSelect() {
  els.fileSelect.innerHTML = selectedSite.files.map((file) => `
    <option value="${file.id}">${escapeHtml(file.label)}</option>
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
  structuredData = null;
  editorMode = "form";
  els.editor.value = "";
  els.formEditor.innerHTML = "";
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
  structuredData = null;
  editorMode = "form";
  els.editor.value = "";
  els.formEditor.innerHTML = "";
  clearResult();
  render();
}

function updateDirtyState() {
  isDirty = els.editor.value !== originalContent;
  setStatus(els.dirtyStatus, isDirty ? "Є незбережені зміни" : "Без змін", isDirty ? "warn" : "ok");
}

function renderHeader() {
  els.currentRepo.textContent = `${selectedSite.label}`;
  els.currentTitle.textContent = selectedFile.label;
  els.currentHelp.textContent = selectedFile.help || selectedSite.description || "";
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
  showEditorForCurrentFile();
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
    structuredData = null;
    editorMode = selectedFile.type === "json" ? "form" : "code";
    if (selectedFile.type === "json") {
      structuredData = JSON.parse(originalContent);
      els.editor.value = JSON.stringify(structuredData, null, 2) + "\n";
      originalContent = els.editor.value;
      renderFormEditor();
    }
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

function logoutAdmin() {
  storageRemove("sessionStorage", ADMIN_AUTH_KEY);
  storageRemove("localStorage", ADMIN_AUTH_KEY);
  setToken("", false);
  currentFile = null;
  originalContent = "";
  els.editor.value = "";
  clearResult();
  showLogin();
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.showAdminPassword.addEventListener("change", () => {
    els.adminPassword.type = els.showAdminPassword.checked ? "text" : "password";
  });
  els.tokenSaveBtn.addEventListener("click", testToken);
  els.tokenClearBtn.addEventListener("click", clearToken);
  els.logoutBtn.addEventListener("click", logoutAdmin);
  els.fileSelect.addEventListener("change", () => selectFile(els.fileSelect.value));
  els.loadBtn.addEventListener("click", loadSelectedFile);
  els.formatBtn.addEventListener("click", prettyJson);
  els.saveBtn.addEventListener("click", saveSelectedFile);
  els.editor.addEventListener("input", updateDirtyState);
  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => switchEditorMode(button.dataset.mode));
  });

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

bindEvents();
if (isAdminAuthed()) showApp();
else showLogin();
