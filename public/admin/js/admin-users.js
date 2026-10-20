import { auth } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("admin-users-table-body");
  if (!tableBody) return;

  const pageSize = 8;
  const form = document.getElementById("admin-users-create-form");
  const search = document.getElementById("admin-users-search");
  const status = document.getElementById("admin-users-status");
  const previous = document.getElementById("admin-users-previous");
  const next = document.getElementById("admin-users-next");
  const linkResult = document.getElementById("admin-users-link-result");
  let users = [];
  let filteredUsers = [];
  let page = 1;

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
  }

  async function api(path = "", options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error("A sessão terminou. Inicie sessão novamente.");
    const token = await user.getIdToken();
    const response = await fetch(`/api/admin/users${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível concluir a operação.");
    return result;
  }

  function displayLink(title, link) {
    document.getElementById("admin-users-link-title").textContent = title;
    document.getElementById("admin-users-link").value = link;
    linkResult.hidden = false;
    linkResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function createCell(text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function render() {
    filteredUsers = users.filter((user) => {
      const query = search.value.trim().toLocaleLowerCase();
      return !query || `${user.displayName} ${user.email}`.toLocaleLowerCase().includes(query);
    });
    const pages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    page = Math.min(page, pages);
    const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
    tableBody.replaceChildren();

    if (!visibleUsers.length) {
      const row = document.createElement("tr");
      const cell = createCell(search.value.trim() ? "Não foram encontrados utilizadores para esta pesquisa." : "Ainda não existem outras contas administrativas.");
      cell.colSpan = 4;
      row.append(cell);
      tableBody.append(row);
    }

    visibleUsers.forEach((user) => {
      const row = document.createElement("tr");
      const identity = document.createElement("td");
      const name = document.createElement("strong");
      name.className = "admin-users-name";
      name.textContent = user.displayName || "Sem nome";
      const email = document.createElement("small");
      email.className = "admin-users-email";
      email.textContent = user.email;
      identity.append(name, email);
      row.append(identity);

      const access = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `admin-user-status${user.disabled ? " is-disabled" : ""}`;
      badge.textContent = user.disabled ? "Desativado" : "Administrador ativo";
      access.append(badge);
      row.append(access);

      const lastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString("pt-PT") : "Nunca iniciou sessão";
      row.append(createCell(lastSignIn));

      const actions = document.createElement("td");
      actions.className = "admin-table-actions admin-users-actions";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "admin-users-action";
      reset.textContent = "Recuperar acesso";
      reset.addEventListener("click", () => resetPassword(user, reset));
      actions.append(reset);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "admin-users-action";
      toggle.textContent = user.disabled ? "Ativar" : "Desativar";
      toggle.addEventListener("click", () => toggleUser(user, toggle));
      actions.append(toggle);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-users-action is-danger";
      remove.textContent = "Remover";
      remove.addEventListener("click", () => deleteUser(user, remove));
      actions.append(remove);
      row.append(actions);
      tableBody.append(row);
    });

    document.getElementById("admin-users-page-count").textContent = filteredUsers.length
      ? `${filteredUsers.length} conta${filteredUsers.length === 1 ? "" : "s"}${search.value.trim() ? " encontradas" : " registadas"}`
      : "0 contas";
    document.getElementById("admin-users-page-label").textContent = `Página ${page} de ${pages}`;
    previous.disabled = page <= 1;
    next.disabled = page >= pages;
  }

  async function loadUsers(message = "") {
    tableBody.innerHTML = '<tr><td colspan="4">A carregar contas…</td></tr>';
    try {
      const result = await api();
      users = result.users || [];
      page = 1;
      render();
      if (message) setStatus(message);
    } catch (error) {
      setStatus(error.message, true);
      tableBody.replaceChildren();
      const row = document.createElement("tr");
      const cell = createCell("Não foi possível carregar as contas administrativas.");
      cell.colSpan = 4;
      row.append(cell);
      tableBody.append(row);
    }
  }

  async function resetPassword(user, button) {
    button.disabled = true;
    try {
      const result = await api("", { method: "POST", body: JSON.stringify({ action: "reset-password", uid: user.uid }) });
      displayLink(`Ligação de recuperação para ${user.email}`, result.resetLink);
      setStatus("Ligação criada. Copie-a e envie-a ao utilizador.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  async function toggleUser(user, button) {
    const disabled = !user.disabled;
    if (disabled && !window.confirm(`Desativar o acesso de ${user.email}?`)) return;
    button.disabled = true;
    try {
      await api("", { method: "PATCH", body: JSON.stringify({ uid: user.uid, disabled }) });
      await loadUsers(disabled ? "Conta desativada." : "Conta ativada.");
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  }

  async function deleteUser(user, button) {
    if (!window.confirm(`Remover a conta ${user.email}? Esta ação não pode ser anulada.`)) return;
    button.disabled = true;
    try {
      await api("", { method: "DELETE", body: JSON.stringify({ uid: user.uid }) });
      await loadUsers("Conta removida.");
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  }

  document.getElementById("admin-users-open-form").addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById("admin-users-name").focus();
  });
  document.getElementById("admin-users-cancel-form").addEventListener("click", () => {
    form.reset();
    form.hidden = true;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "A criar conta…";
    try {
      const result = await api("", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      form.hidden = true;
      displayLink(`Ligação de recuperação para ${result.user.email}`, result.resetLink);
      await loadUsers("Conta administrativa criada. Envie a ligação para definir a palavra-passe.");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Criar conta";
    }
  });
  document.getElementById("admin-users-copy-link").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(document.getElementById("admin-users-link").value);
      button.textContent = "Ligação copiada";
      window.setTimeout(() => { button.textContent = "Copiar ligação"; }, 1800);
    } catch {
      document.getElementById("admin-users-link").select();
      setStatus("Selecione e copie a ligação apresentada.", true);
    }
  });
  search.addEventListener("input", () => { page = 1; render(); });
  previous.addEventListener("click", () => { page -= 1; render(); });
  next.addEventListener("click", () => { page += 1; render(); });

  auth.onAuthStateChanged((user) => {
    if (user) loadUsers();
  });
});
