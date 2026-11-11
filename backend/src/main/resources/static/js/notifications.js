(() => {
  const apiBase = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/admin`
    : 'http://localhost:8080/api/admin';
  let notifications = [];
  let activeFilter = 'all';
  let requestNumber = 0;
  let savingReadState = false;

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('notificationsSearch')?.addEventListener('input', renderNotifications);
    document.querySelectorAll('[data-notification-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.notificationFilter;
        document.querySelectorAll('[data-notification-filter]').forEach((filter) => {
          filter.classList.toggle('active', filter === button);
        });
        renderNotifications();
      });
    });
    document.getElementById('notificationsList')?.addEventListener('click', handleNotificationAction);
    document.getElementById('markAllNotificationsReadBtn')?.addEventListener('click', markAllRead);
    document.getElementById('refreshNotificationsBtn')?.addEventListener('click', loadNotifications);
  });

  window.loadNotifications = loadNotifications;

  async function loadNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    const requestId = ++requestNumber;
    setError('');
    list.innerHTML = '<div class="notifications-empty">Loading pharmacy notifications...</div>';

    try {
      const response = await fetch(`${apiBase}/notifications`, { headers: { Accept: 'application/json' } });
      const data = await readResponse(response);
      if (requestId !== requestNumber) return;
      if (!Array.isArray(data)) throw new Error('The notifications API returned an unexpected response.');
      notifications = data.map((notification) => ({
        ...notification,
        severity: getSeverity(notification)
      }));
      updateBadges();
      renderNotifications();
    } catch (error) {
      if (requestId !== requestNumber) return;
      notifications = [];
      updateBadges();
      list.innerHTML = '<div class="notifications-empty">Notifications could not be loaded.</div>';
      setError(error.message || 'Unable to load notifications. Please try again.');
    }
  }

  function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    const query = document.getElementById('notificationsSearch')?.value.trim().toLocaleLowerCase() || '';
    const filtered = notifications.filter((notification) => {
      const matchesSeverity = activeFilter === 'all' || notification.severity === activeFilter;
      const searchable = [
        notification.notificationType,
        notification.message,
        notification.medicineName,
        notification.batchNumber,
        notification.supplierName,
        notification.medicineId == null ? '' : `MED-${String(notification.medicineId).padStart(4, '0')}`
      ].join(' ').toLocaleLowerCase();
      return matchesSeverity && searchable.includes(query);
    });

    list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'notifications-empty';
      empty.textContent = notifications.length
        ? 'No notifications match your search or selected filter.'
        : 'No pharmacy notifications are recorded in the database.';
      list.append(empty);
      return;
    }

    filtered.forEach((notification) => list.append(createNotificationCard(notification)));
  }

  function createNotificationCard(notification) {
    const card = document.createElement('article');
    card.className = `notification-card notification-${notification.severity}${notification.isRead ? ' notification-read' : ''}`;
    const icon = document.createElement('span');
    icon.className = 'notification-card-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = notification.severity === 'critical'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

    const content = document.createElement('div');
    content.className = 'notification-card-content';
    const titleRow = document.createElement('div');
    titleRow.className = 'notification-card-title';
    const title = document.createElement('h3');
    title.textContent = getTitle(notification);
    titleRow.append(title);
    if (!notification.isRead) {
      const unread = document.createElement('span');
      unread.className = 'notification-item-unread';
      unread.textContent = 'UNREAD';
      titleRow.append(unread);
    }

    const message = document.createElement('p');
    message.className = 'notification-message';
    message.textContent = buildMessage(notification);
    content.append(titleRow, message);

    const verify = document.createElement('button');
    verify.type = 'button';
    verify.className = 'notification-verify-btn';
    verify.dataset.verifyInventory = '';
    verify.setAttribute('aria-label', `Verify inventory${notification.medicineName ? ` for ${notification.medicineName}` : ''}`);
    verify.innerHTML = 'Verify Inventory <span aria-hidden="true">→</span>';

    card.append(icon, content, verify);
    return card;
  }

  async function markAllRead() {
    const button = document.getElementById('markAllNotificationsReadBtn');
    if (savingReadState || !notifications.some((notification) => !notification.isRead)) return;
    savingReadState = true;
    button.disabled = true;
    setError('');
    try {
      const response = await fetch(`${apiBase}/notifications/read`, {
        method: 'PUT',
        headers: { Accept: 'application/json' }
      });
      await readResponse(response);
      notifications = notifications.map((notification) => ({ ...notification, isRead: true }));
      updateBadges();
      renderNotifications();
    } catch (error) {
      setError(error.message || 'Could not mark notifications as read.');
    } finally {
      savingReadState = false;
      button.disabled = false;
    }
  }

  function handleNotificationAction(event) {
    if (!event.target.closest('[data-verify-inventory]')) return;
    switchView('medicines');
    if (typeof loadMedicinesData === 'function') loadMedicinesData(true);
  }

  function updateBadges() {
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
    const criticalCount = notifications.filter((notification) => notification.severity === 'critical').length;
    const warningCount = notifications.length - criticalCount;
    setText('notificationsAllCount', notifications.length);
    setText('notificationsCriticalCount', criticalCount);
    setText('notificationsWarningCount', warningCount);
    setText('notificationsUnreadBadge', `${unreadCount} Unread`);
    setBadge('notificationsUnreadBadge', unreadCount);
    setBadge('menuNotificationBadge', unreadCount);
    setBadge('topAlertBadge', unreadCount);
    const markAllButton = document.getElementById('markAllNotificationsReadBtn');
    if (markAllButton) markAllButton.disabled = savingReadState || unreadCount === 0;
  }

  function setBadge(id, count) {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.textContent = id === 'topAlertBadge' && count > 99 ? '99+' : id === 'notificationsUnreadBadge' ? `${count} Unread` : String(count);
    badge.hidden = count === 0;
  }

  function getSeverity(notification) {
    const value = `${notification.notificationType || ''} ${notification.message || ''}`.toLocaleLowerCase();
    return /critical|expired|out.of.stock|stock.out|urgent/.test(value) ? 'critical' : 'warning';
  }

  function getTitle(notification) {
    const type = String(notification.notificationType || '').toLocaleLowerCase();
    if (/expir/.test(type) && /critical|expired/.test(type)) return 'Critical Expiry Alert';
    if (/expir/.test(type)) return 'Near Expiry Warning';
    if (/out.of.stock|stock.out/.test(type)) return 'Out of Stock Alert';
    if (/low.stock|reorder/.test(type)) return 'Low Stock Warning';
    return notification.notificationType || (notification.severity === 'critical' ? 'Critical Inventory Alert' : 'Inventory Warning');
  }

  function buildMessage(notification) {
    const details = [];
    const medicineName = notification.medicineName || 'Medicine';
    const medicineCode = notification.medicineId == null
      ? ''
      : ` (Code: MED-${String(notification.medicineId).padStart(4, '0')})`;
    details.push(`"${medicineName}"${medicineCode}`);
    if (notification.batchNumber) details.push(`Batch ${notification.batchNumber}`);
    if (notification.supplierName) details.push(`from ${notification.supplierName}`);
    if (notification.message) details.push(notification.message);
    if (notification.expiryDate && !/expir/i.test(notification.message || '')) {
      details.push(`Expiry date: ${notification.expiryDate}`);
    }
    if (notification.quantity != null && /stock|reorder|quantity/i.test(notification.notificationType || '')) {
      details.push(`Quantity: ${notification.quantity}`);
    }
    return details.join(' · ');
  }

  async function readResponse(response) {
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `Request failed (HTTP ${response.status}).`);
    }
    return data;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  function setError(message) {
    const error = document.getElementById('notificationsError');
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  }
})();
