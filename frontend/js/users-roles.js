(() => {
  const apiBase = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/admin`
    : 'http://localhost:8080/api/admin';
  let users = [];
  let roles = [];
  let pendingDeleteId = null;
  let requestNumber = 0;
  let saving = false;

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('usersRolesTableBody');
    const search = document.getElementById('usersRolesSearch');
    const createButton = document.getElementById('createUserAccountBtn');
    const form = document.getElementById('userAccountForm');
    if (!body || !search || !createButton || !form) return;

    search.addEventListener('input', renderUsers);
    createButton.addEventListener('click', () => openUserForm());
    form.addEventListener('submit', saveUser);
    body.addEventListener('click', handleTableAction);
    document.querySelectorAll('[data-close-user-modal]').forEach((button) => button.addEventListener('click', closeUserForm));
    document.querySelectorAll('[data-close-delete-user]').forEach((button) => button.addEventListener('click', closeDeleteModal));
    document.getElementById('confirmDeleteUserBtn')?.addEventListener('click', deleteUser);
    document.getElementById('userAccountModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'userAccountModal') closeUserForm();
    });
    document.getElementById('deleteUserModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'deleteUserModal') closeDeleteModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeUserForm();
        closeDeleteModal();
      }
    });
    loadUsersRoles();
  });

  window.loadUsersRoles = loadUsersRoles;

  async function loadUsersRoles() {
    const body = document.getElementById('usersRolesTableBody');
    const error = document.getElementById('usersRolesError');
    if (!body || !error) return;
    const requestId = ++requestNumber;
    error.hidden = true;
    error.textContent = '';
    body.innerHTML = '<tr><td colspan="7" class="users-roles-empty">Loading accounts from the database...</td></tr>';

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${apiBase}/users`, { headers: { Accept: 'application/json' } }),
        fetch(`${apiBase}/roles`, { headers: { Accept: 'application/json' } })
      ]);
      const [userData, roleData] = await Promise.all([readResponse(usersResponse), readResponse(rolesResponse)]);
      if (requestId !== requestNumber) return;
      if (!Array.isArray(userData) || !Array.isArray(roleData)) {
        throw new Error('The users or roles API returned an unexpected response.');
      }
      users = userData;
      roles = roleData;
      renderRoleOptions();
      renderUsers();
    } catch (loadError) {
      if (requestId !== requestNumber) return;
      users = [];
      body.innerHTML = '<tr><td colspan="7" class="users-roles-empty">Accounts could not be loaded from the database.</td></tr>';
      error.textContent = loadError.message || 'Unable to load user accounts. Please try again.';
      error.hidden = false;
      updateFooter(0, 0);
    }
  }

  function renderRoleOptions(selectedRoleId) {
    const container = document.getElementById('userRoleOptions');
    if (!container) return;
    container.replaceChildren();
    if (!roles.length) {
      container.innerHTML = '<span class="users-role-loading">No roles are configured in the database.</span>';
      return;
    }
    const desiredOrder = ['admin', 'pharmacist', 'supplier', 'staff'];
    const sortedRoles = [...roles].sort((a, b) => {
      const indexA = desiredOrder.indexOf(String(a.roleName || '').toLowerCase());
      const indexB = desiredOrder.indexOf(String(b.roleName || '').toLowerCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return String(a.roleName || '').localeCompare(String(b.roleName || ''));
    });
    sortedRoles.forEach((role) => {
      const label = document.createElement('label');
      label.className = 'users-role-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'userRoleId';
      input.value = role.roleId;
      input.required = true;
      if (selectedRoleId != null) {
        input.checked = Number(selectedRoleId) === Number(role.roleId);
      } else {
        input.checked = String(role.roleName || '').toLowerCase() === 'staff' || Number(role.roleId) === 3;
      }
      const text = document.createElement('span');
      text.className = 'users-role-name';
      text.textContent = role.roleName;
      label.append(input, text);
      container.append(label);
    });
  }

  function renderUsers() {
    const body = document.getElementById('usersRolesTableBody');
    if (!body) return;
    const query = document.getElementById('usersRolesSearch')?.value.trim().toLocaleLowerCase() || '';
    const visibleUsers = users.filter((user) => [
      user.username, user.name, user.email
    ].some((value) => String(value || '').toLocaleLowerCase().includes(query)));

    body.replaceChildren();
    if (!visibleUsers.length) {
      body.innerHTML = `<tr><td colspan="7" class="users-roles-empty">${users.length ? 'No accounts match your search.' : 'No user accounts are recorded in the database.'}</td></tr>`;
      updateFooter(0, users.length);
      return;
    }
    visibleUsers.forEach((user, index) => {
      const row = document.createElement('tr');
      const roleClass = String(user.roleName || '').toLocaleLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const userPayload = escapeHtml(JSON.stringify(user));
      row.innerHTML = `
        <td class="users-id-cell">#${index + 1}</td>
        <td class="users-username-cell">${escapeHtml(user.username || usernameFromEmail(user.email))}</td>
        <td class="users-name-cell">${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="users-status-badge ${user.active ? 'status-active' : 'status-inactive'}">${user.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
        <td><span class="users-role-badge role-${roleClass}">${escapeHtml((user.roleName || 'UNASSIGNED').toUpperCase())}</span></td>
        <td class="users-actions-cell">
          <button class="users-action-btn users-action-edit" type="button" data-edit-user="${userPayload}" aria-label="Edit ${escapeHtml(user.username || user.name)}" title="Edit account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>
          </button>
          <button class="users-action-btn users-action-delete" type="button" data-delete-user="${user.userId}" data-user-name="${escapeHtml(user.username || user.name)}" aria-label="Delete ${escapeHtml(user.username || user.name)}" title="Delete account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5M14 11v5"></path></svg>
          </button>
        </td>`;
      row.dataset.userId = user.userId;
      body.append(row);
    });
    updateFooter(visibleUsers.length, users.length);
  }

  function handleTableAction(event) {
    const editButton = event.target.closest('[data-edit-user]');
    if (editButton) {
      try {
        openUserForm(JSON.parse(editButton.dataset.editUser));
      } catch {
        showPageError('Could not open this account for editing. Refresh the database list and try again.');
      }
      return;
    }
    const deleteButton = event.target.closest('[data-delete-user]');
    if (deleteButton && !deleteButton.disabled) {
      openDeleteModal(Number(deleteButton.dataset.deleteUser), deleteButton.dataset.userName);
    }
  }

  function openUserForm(user) {
    const form = document.getElementById('userAccountForm');
    const modal = document.getElementById('userAccountModal');
    if (!form || !modal) return;
    form.reset();
    clearFormError();
    const editing = Boolean(user);
    document.getElementById('userAccountModalTitle').textContent = editing ? 'Edit User Account' : 'Create User Account';
    document.getElementById('saveUserAccountBtn').textContent = editing ? 'Save Changes' : 'Save User Account';
    document.getElementById('userAccountId').value = editing ? user.userId : '';
    document.getElementById('userAccountUsername').value = editing ? (user.username || usernameFromEmail(user.email)) : '';
    document.getElementById('userAccountEmail').value = editing ? user.email : '';
    document.getElementById('userAccountName').value = editing ? user.name : '';
    document.getElementById('userAccountPhone').value = editing ? (user.phone || '') : '';
    const password = document.getElementById('userAccountPassword');
    password.value = '';
    password.required = !editing;
    document.getElementById('userPasswordHelp').hidden = !editing;
    const active = document.getElementById('userAccountActive');
    active.checked = editing ? Boolean(user.active) : true;
    active.disabled = editing && Number(user.userId) === 1;
    renderRoleOptions(editing ? user.roleId : null);
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('users-modal-open');
    document.getElementById('userAccountUsername').focus();
  }

  function closeUserForm() {
    const modal = document.getElementById('userAccountModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('users-modal-open');
  }

  async function saveUser(event) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const id = document.getElementById('userAccountId').value;
    const selectedRole = form.querySelector('input[name="userRoleId"]:checked');
    if (!selectedRole) {
      showFormError('Select one role for this account.');
      return;
    }
    const usernameVal = document.getElementById('userAccountUsername').value.trim();
    const request = {
      username: usernameVal,
      name: document.getElementById('userAccountName').value.trim() || usernameVal,
      email: document.getElementById('userAccountEmail').value.trim(),
      phone: document.getElementById('userAccountPhone').value.trim() || null,
      password: document.getElementById('userAccountPassword').value || null,
      roleId: Number(selectedRole.value),
      active: document.getElementById('userAccountActive').checked
    };
    const button = document.getElementById('saveUserAccountBtn');
    saving = true;
    button.disabled = true;
    clearFormError();
    try {
      const response = await fetch(id ? `${apiBase}/users/${encodeURIComponent(id)}` : `${apiBase}/users`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request)
      });
      await readResponse(response);
      closeUserForm();
      await loadUsersRoles();
    } catch (error) {
      showFormError(error.message || 'Could not save the account.');
    } finally {
      saving = false;
      button.disabled = false;
    }
  }

  function openDeleteModal(id, username) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteUserModal');
    const message = document.getElementById('deleteUserMessage');
    const error = document.getElementById('deleteUserError');
    if (!modal || !message || !error) return;
    message.textContent = `Delete the account "${username}"? This cannot be undone.`;
    error.hidden = true;
    error.textContent = '';
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('users-modal-open');
  }

  function closeDeleteModal() {
    const modal = document.getElementById('deleteUserModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('users-modal-open');
    pendingDeleteId = null;
  }

  async function deleteUser() {
    if (!pendingDeleteId) return;
    const button = document.getElementById('confirmDeleteUserBtn');
    const error = document.getElementById('deleteUserError');
    button.disabled = true;
    error.hidden = true;
    try {
      const response = await fetch(`${apiBase}/users/${encodeURIComponent(pendingDeleteId)}`, { method: 'DELETE' });
      await readResponse(response);
      closeDeleteModal();
      await loadUsersRoles();
    } catch (deleteError) {
      error.textContent = deleteError.message || 'Could not delete this account.';
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  }

  async function readResponse(response) {
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || data?.message || data?.error || `Request failed (HTTP ${response.status}).`);
    return data;
  }

  function updateFooter(visible, total) {
    const footer = document.getElementById('usersRolesFooter');
    if (footer) footer.textContent = `Showing ${visible} of ${total} ${total === 1 ? 'account' : 'accounts'}`;
  }

  function usernameFromEmail(email) {
    return String(email || '').split('@')[0];
  }

  function showFormError(message) {
    const error = document.getElementById('userFormError');
    error.textContent = message;
    error.hidden = false;
  }

  function clearFormError() {
    const error = document.getElementById('userFormError');
    error.textContent = '';
    error.hidden = true;
  }

  function showPageError(message) {
    const error = document.getElementById('usersRolesError');
    error.textContent = message;
    error.hidden = false;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }
})();
