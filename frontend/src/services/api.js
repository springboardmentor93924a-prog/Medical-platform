/**
 * MediStock API Service
 *
 * Centralised HTTP client for all backend communication with Spring Boot APIs.
 * Enforces JWT authentication, role permission verification, and real-time database queries.
 */

import { wsService } from './websocket';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

/* ------------------------------------------------------------------ */
/*  Low-level HTTP Request Engine                                     */
/* ------------------------------------------------------------------ */

function authHeaders() {
  const token = localStorage.getItem('medistock_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutMs = options.timeout || 6000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let headers = authHeaders();
    if (options.isFormData) {
      delete headers['Content-Type'];
    }
    if (options.headers) {
      headers = { ...headers, ...options.headers };
    }
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });
    clearTimeout(timeoutId);

    // Surface login, register, and password-reset error responses directly to the auth forms
    if (path.startsWith('/auth/')) {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Authentication request failed');
      }
      return await res.json();
    }

    if (res.status === 401) {
      const token = localStorage.getItem('medistock_token');
      if (token) {
        localStorage.removeItem('medistock_token');
        localStorage.removeItem('medistock_user');
        window.location.href = '/login';
      }
      return null;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }

    if (res.status === 204) return null;
    const json = await res.json();
    // Automatically unwrap standard ApiResponse { success, message, data }
    if (json && Object.prototype.hasOwnProperty.call(json, 'data') && Object.prototype.hasOwnProperty.call(json, 'success')) {
      return json.data;
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[MediStock API] Request to ${url} timed out after ${timeoutMs}ms`);
      return null;
    }
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[MediStock API] Cannot reach ${url} — backend offline`);
      return null;
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  Authentication                                                    */
/* ------------------------------------------------------------------ */

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

export async function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function sendEmailOtp(email) {
  return request('/auth/otp/send-email', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function verifyEmailOtp(email, otp) {
  return request('/auth/otp/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
  });
}

export async function sendPhoneOtp(phone, email) {
  return request('/auth/otp/send-phone', {
    method: 'POST',
    body: JSON.stringify({ phone: phone.trim(), email: email ? email.trim() : undefined }),
  });
}

export async function verifyPhoneOtp(phone, otp) {
  return request('/auth/otp/verify-phone', {
    method: 'POST',
    body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
  });
}

export async function resendOtp(email, channel = 'email') {
  return request('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), channel }),
  });
}

export async function getVerificationStatus(email) {
  return request(`/auth/verification-status?email=${encodeURIComponent(email.trim())}`);
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function resetPassword(token, newPassword) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: token.trim(), newPassword }),
  });
}

export async function fetchRoles() {
  return request('/auth/roles');
}

export async function getCurrentUser() {
  return request('/auth/me');
}

export async function updateUserProfile(data) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function logoutUser() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (_e) {
    // Ignore network error on logout
  } finally {
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('medistock_user');
    wsService.disconnect();
  }
}

/* ------------------------------------------------------------------ */
/*  Dashboard Summary Statistics & Charts                             */
/* ------------------------------------------------------------------ */

export async function fetchDashboardStats() {
  return request('/dashboard/stats');
}

/* ------------------------------------------------------------------ */
/*  Medicines & Categories                                            */
/* ------------------------------------------------------------------ */

export async function fetchMedicines(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  const qStr = query.toString();
  return request(`/medicines${qStr ? `?${qStr}` : ''}`);
}

export async function fetchMedicineById(id) {
  return request(`/medicines/${id}`);
}

export async function createMedicine(data) {
  return request('/medicines', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMedicine(id, data) {
  return request(`/medicines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMedicine(id) {
  return request(`/medicines/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchCategories() {
  return request('/categories');
}

export async function fetchCategoryById(id) {
  return request(`/categories/${id}`);
}

export async function createCategory(data) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id, data) {
  return request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id) {
  return request(`/categories/${id}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/*  Inventory Batches, Expiry Tracking & Stock Operations             */
/* ------------------------------------------------------------------ */

export async function fetchBatches(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.medicineId) query.set('medicineId', params.medicineId);
  const qStr = query.toString();
  return request(`/inventory/batches${qStr ? `?${qStr}` : ''}`);
}

export async function fetchInventory() {
  return request('/inventory/batches');
}

export async function fetchLowStock(threshold = 50) {
  return request(`/inventory/low-stock?threshold=${threshold}`);
}

export async function fetchExpiringBatches(days = 60) {
  return request(`/inventory/expiring?days=${days}`);
}

export async function fetchExpiryTracking(filter = 'ALL') {
  const query = filter && filter !== 'ALL' ? `?filter=${filter}` : '';
  return request(`/inventory/expiry-tracking${query}`);
}

export async function adjustStock(data) {
  return request('/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchStockAdjustments() {
  return request('/inventory/adjustments');
}

export async function receiveStock(data) {
  return request('/inventory/receive', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function dispenseStock(data) {
  return request('/inventory/dispense', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitStockRequest(data) {
  return request('/inventory/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reportDiscrepancy(data) {
  return request('/inventory/discrepancies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchDiscrepancies(status = null) {
  const query = status ? `?status=${status}` : '';
  return request(`/inventory/discrepancies${query}`);
}

export async function resolveDiscrepancy(id, data) {
  return request(`/inventory/discrepancies/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchTransactions(type = null) {
  const path = type ? `/inventory/transactions?type=${type}` : '/inventory/transactions';
  return request(path);
}

/* ------------------------------------------------------------------ */
/*  FEFO (First Expiry, First Out) Inventory & Allocation APIs        */
/* ------------------------------------------------------------------ */

export async function fetchFefoBatches(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.medicineId) query.set('medicineId', params.medicineId);
  if (params.filter) query.set('filter', params.filter);
  const qStr = query.toString();
  return request(`/fefo/batches${qStr ? `?${qStr}` : ''}`);
}

export async function fetchFefoRecommendation(medicineId, quantity = 1, selectedBatchId = null) {
  const query = new URLSearchParams();
  query.set('medicineId', medicineId);
  query.set('quantity', quantity);
  if (selectedBatchId) query.set('selectedBatchId', selectedBatchId);
  return request(`/fefo/recommendation?${query.toString()}`);
}

export async function allocateFefoStock(data) {
  return request('/fefo/allocate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchFefoComplianceReport() {
  return request('/fefo/compliance-report');
}

export async function fetchFefoAllocations(params = {}) {
  const query = new URLSearchParams();
  if (params.medicineId) query.set('medicineId', params.medicineId);
  if (params.compliantOnly !== undefined && params.compliantOnly !== null) {
    query.set('compliantOnly', params.compliantOnly);
  }
  if (params.limit) query.set('limit', params.limit);
  const qStr = query.toString();
  return request(`/fefo/allocations${qStr ? `?${qStr}` : ''}`);
}

export async function fetchFefoStats() {
  return request('/fefo/stats');
}

export async function updateBatchStatus(batchId, status, reason = '') {
  return request(`/fefo/batches/${batchId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
}

/* ------------------------------------------------------------------ */
/*  Suppliers & Purchase Orders                                       */
/* ------------------------------------------------------------------ */

export async function fetchSuppliers(activeOnly = false) {
  return request(`/suppliers?activeOnly=${activeOnly}`);
}

export async function fetchSupplierById(id) {
  return request(`/suppliers/${id}`);
}

export async function createSupplier(data) {
  return request('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSupplier(id, data) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleSupplierStatus(id, active) {
  return request(`/suppliers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function deleteSupplier(id) {
  return request(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.supplierId) query.set('supplierId', params.supplierId);
  const qStr = query.toString();
  return request(`/orders${qStr ? `?${qStr}` : ''}`);
}

export const fetchPurchaseOrders = fetchOrders;

export async function fetchOrderById(id) {
  return request(`/orders/${id}`);
}

export async function createPurchaseOrder(data) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePurchaseOrder(id, data) {
  return request(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitPurchaseOrder(id) {
  return request(`/orders/${id}/submit`, {
    method: 'PATCH',
  });
}

export async function updateOrderStatus(id, data) {
  return request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function approvePurchaseOrder(id, notes = '') {
  return request(`/orders/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function rejectPurchaseOrder(id, reason) {
  return request(`/orders/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function cancelPurchaseOrder(id) {
  return request(`/orders/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function receiveGoodsFromOrder(id, data = {}) {
  return request(`/orders/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchOrderReceipts(orderId) {
  return request(`/orders/${orderId}/receipts`);
}

export async function fetchOrderHistory(orderId) {
  return request(`/orders/${orderId}/history`);
}

export async function fetchMyOrders(status = null) {
  const query = new URLSearchParams({ scope: 'mine' });
  if (status) query.set('status', status);
  return request(`/orders?${query.toString()}`);
}

/* ------------------------------------------------------------------ */
/*  Reports & Document Generation                                     */
/* ------------------------------------------------------------------ */

export async function generateReport(params) {
  return request('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fetchReportHistory() {
  return request('/reports/history');
}

/* ------------------------------------------------------------------ */
/*  Tasks & Clinical Checklists                                       */
/* ------------------------------------------------------------------ */

export async function fetchTasks(status = null) {
  const path = status ? `/tasks?status=${status}` : '/tasks';
  return request(path);
}

export async function updateTaskStatus(id, status) {
  return request(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                     */
/* ------------------------------------------------------------------ */

export async function fetchNotifications() {
  return request('/notifications');
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id) {
  return request(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/*  Admin User Management & Audit Logs                                */
/* ------------------------------------------------------------------ */

export async function fetchAdminUsers() {
  return request('/admin/users');
}

export async function createAdminUser(data) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUser(id, data) {
  return request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUserRole(id, roleId) {
  return request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ roleId }),
  });
}

export async function toggleAdminUserStatus(id, active) {
  return request(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function resetAdminUserPassword(id, newPassword) {
  return request(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

export async function fetchAdminAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.module) query.set('module', params.module);
  if (params.action) query.set('action', params.action);
  if (params.status) query.set('status', params.status);
  if (params.userId) query.set('userId', params.userId);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.page !== undefined) query.set('page', params.page);
  if (params.size !== undefined) query.set('size', params.size);
  const qStr = query.toString();
  return request(`/admin/audit-logs${qStr ? `?${qStr}` : ''}`);
}

export async function fetchAuditLogByEventId(eventId) {
  return request(`/admin/audit-logs/${encodeURIComponent(eventId)}`);
}

export async function fetchUserAuditTimeline(userId, params = {}) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', params.page);
  if (params.size !== undefined) query.set('size', params.size);
  const qStr = query.toString();
  return request(`/admin/audit-logs/user/${userId}${qStr ? `?${qStr}` : ''}`);
}

export async function fetchAuditSummary() {
  return request('/admin/audit-logs/summary');
}

export async function fetchAuditIntegrity() {
  return request('/admin/audit-logs/integrity');
}

export async function rebuildAuditChain() {
  return request('/admin/audit-logs/rebuild-chain', {
    method: 'POST',
  });
}

export async function fetchAuditAlerts() {
  return request('/admin/audit-alerts');
}

export async function acknowledgeAuditAlert(alertId) {
  return request(`/admin/audit-alerts/${alertId}/acknowledge`, {
    method: 'PATCH',
  });
}

export async function fetchMyActivity(params = {}) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', params.page);
  if (params.size !== undefined) query.set('size', params.size);
  const qStr = query.toString();
  return request(`/my-activity${qStr ? `?${qStr}` : ''}`);
}

// Module convenience aliases
export const receiveGoods = receiveStock;
export const fetchStockLevels = fetchInventory;

/* ------------------------------------------------------------------ */
/*  AI-Based Inventory Recommendations & Demand Forecasting           */
/* ------------------------------------------------------------------ */

export async function fetchAiRecommendations(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString();
  return request(`/ai-forecast/recommendations${qStr ? `?${qStr}` : ''}`);
}

export async function fetchAiRecommendationForMedicine(medicineId) {
  return request(`/ai-forecast/medicine/${medicineId}`);
}

export async function fetchAiForecastSummary() {
  return request('/ai-forecast/summary');
}

export async function fetchDemandForecastChart(medicineId = 1, days = 30) {
  return request(`/ai-forecast/chart?medicineId=${medicineId}&days=${days}`);
}

export async function refreshAiForecast() {
  return request('/ai-forecast/refresh', {
    method: 'POST',
  });
}

export async function createAiRequisition(requisitionData) {
  return request('/ai-forecast/requisition', {
    method: 'POST',
    body: JSON.stringify(requisitionData),
  });
}

/* ------------------------------------------------------------------ */
/*  AI Conversational Chatbot & Multi-Model Intelligence APIs        */
/* ------------------------------------------------------------------ */

export async function sendChatMessage(sessionId, message) {
  return request('/ai/chat/message', {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  });
}

export async function fetchChatSessions() {
  return request('/ai/chat/sessions');
}

export async function fetchChatSessionMessages(sessionId) {
  return request(`/ai/chat/sessions/${sessionId}/messages`);
}

export async function deleteChatSession(sessionId) {
  return request(`/ai/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function fetchChatSuggestions() {
  return request('/ai/chat/suggestions');
}

export async function fetchAiModelEvaluation(medicineId) {
  return request(`/ai/forecast/evaluate/${medicineId}`);
}

export async function fetchAiReorderPlan(medicineId) {
  return request(`/ai/forecast/reorder/${medicineId}`);
}

export async function fetchAiExpiryRisk(medicineId) {
  return request(`/ai/forecast/expiry-risk/${medicineId}`);
}

export async function fetchAiOverstockAnalysis(medicineId) {
  return request(`/ai/forecast/overstock/${medicineId}`);
}

/* ------------------------------------------------------------------ */
/*  AI Voice Assistant (Voice Note & Live Voice Integration)         */
/* ------------------------------------------------------------------ */

export async function uploadVoiceRecordingForTranscription(audioBlob, filename = 'voice_note.webm', language = null) {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);
  if (language) formData.append('language', language);

  return request('/ai/voice/transcribe', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function sendVoiceChatMessage(sessionId, message, language = 'en', autoSpeak = false) {
  return request('/ai/voice/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      message,
      language,
      autoSpeak,
    }),
  });
}

export async function fetchVoiceEngineStatus() {
  return request('/ai/voice/status');
}

export async function synthesizeSpeechAudio(text, voice = 'alloy', speed = 1.0) {
  const token = localStorage.getItem('medistock_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/ai/voice/speak`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, voice, speed }),
    });

    if (!res.ok) {
      return null;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (_e) {
    return null;
  }
}

export async function createLiveVoiceSession(mode = 'LIVE_VOICE') {
  return request(`/ai/voice/session?mode=${encodeURIComponent(mode)}`, {
    method: 'POST',
  });
}

export async function fetchLiveVoiceSession(sessionId) {
  return request(`/ai/voice/session/${sessionId}`);
}

export async function closeLiveVoiceSession(sessionId) {
  return request(`/ai/voice/session/${sessionId}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/*  Advanced Wastage Management                                       */
/* ------------------------------------------------------------------ */

export async function fetchWastageRecords() {
  return request('/wastage/records');
}

export async function fetchPendingWastageApprovals() {
  return request('/wastage/pending');
}

export async function fetchMyWastageReports() {
  return request('/wastage/my-reports');
}

export async function createWastageReport(payload) {
  return request('/wastage/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyWastageReport(id, payload) {
  return request(`/wastage/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function approveWastageReport(id, payload) {
  return request(`/wastage/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchWastageAnalytics() {
  return request('/wastage/analytics');
}

/* ------------------------------------------------------------------ */
/*  Database Backup & Disaster Recovery APIs (Admin Only)             */
/* ------------------------------------------------------------------ */

export async function fetchBackupSummary() {
  return request('/admin/backups/summary');
}

export async function fetchBackups() {
  return request('/admin/backups');
}

export async function fetchBackupById(id) {
  return request(`/admin/backups/${id}`);
}

export async function createBackup(data = {}) {
  return request('/admin/backups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyBackup(id) {
  return request(`/admin/backups/${id}/verify`, {
    method: 'POST',
  });
}

export async function deleteBackup(id) {
  return request(`/admin/backups/${id}`, {
    method: 'DELETE',
  });
}

export async function downloadBackupBlob(id, filename) {
  const token = localStorage.getItem('medistock_token');
  const res = await fetch(`${API_BASE}/admin/backups/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `backup_${id}.sql.gz.enc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchBackupSchedules() {
  return request('/admin/backups/schedules');
}

export async function updateBackupSchedule(id, data) {
  return request(`/admin/backups/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function previewRestore(backupId) {
  return request(`/admin/restores/preview/${backupId}`, {
    method: 'POST',
  });
}

export async function confirmRestore(backupId, data) {
  return request(`/admin/restores/confirm/${backupId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchRestoreHistory() {
  return request('/admin/restores/history');
}

// ─── FEEDBACK MANAGEMENT API ─────────────────────────────────────────────────

export async function createFeedbackTicketJson(data) {
  return request('/feedback/json', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createFeedbackTicketMultipart(formData) {
  return request('/feedback', {
    method: 'POST',
    isFormData: true,
    body: formData,
  });
}

export async function fetchMyFeedbackTickets() {
  return request('/feedback/my');
}

export async function fetchFeedbackTicketById(ticketId) {
  return request(`/feedback/${ticketId}`);
}

export async function sendFeedbackMessage(ticketId, data) {
  return request(`/feedback/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadFeedbackAttachment(ticketId, file) {
  const fd = new FormData();
  fd.append('file', file);
  return request(`/feedback/${ticketId}/attachments`, {
    method: 'POST',
    isFormData: true,
    body: fd,
  });
}

export async function rateFeedbackResolution(ticketId, data) {
  return request(`/feedback/${ticketId}/rating`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reopenFeedbackTicket(ticketId, data) {
  return request(`/feedback/${ticketId}/reopen`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function analyzeDraftFeedback(draft) {
  return request('/feedback/ai/analyze-draft', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

// ─── ADMIN FEEDBACK ENDPOINTS ────────────────────────────────────────────────

export async function fetchAllFeedbackTickets(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const qs = query.toString();
  return request(`/admin/feedback${qs ? `?${qs}` : ''}`);
}

export async function fetchFeedbackAnalytics() {
  return request('/admin/feedback/analytics');
}

export async function updateFeedbackTicketStatus(ticketId, data) {
  return request(`/admin/feedback/${ticketId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateFeedbackTicketPriority(ticketId, data) {
  return request(`/admin/feedback/${ticketId}/priority`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function assignFeedbackTicket(ticketId, data) {
  return request(`/admin/feedback/${ticketId}/assign`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function resolveFeedbackTicket(ticketId, data) {
  return request(`/admin/feedback/${ticketId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addFeedbackInternalNote(ticketId, data) {
  return request(`/admin/feedback/${ticketId}/internal-notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchFeedbackInternalNotes(ticketId) {
  return request(`/admin/feedback/${ticketId}/internal-notes`);
}

export async function fetchFeedbackAiInsights(ticketId) {
  return request(`/admin/feedback/${ticketId}/ai-insights`);
}

/* ============================================================================
 *  SMTP EMAIL NOTIFICATION & MONITORING API
 * ============================================================================ */

export async function fetchEmailMonitoringStats() {
  return request('/admin/email-monitoring/stats');
}

export async function fetchEmailOutbox(page = 0, size = 50, status = '') {
  const query = new URLSearchParams();
  if (page) query.append('page', page);
  if (size) query.append('size', size);
  if (status && status !== 'ALL') query.append('status', status);
  return request(`/admin/email-monitoring/outbox?${query.toString()}`);
}

export async function fetchEmailLogs(page = 0, size = 50) {
  return request(`/admin/email-monitoring/logs?page=${page}&size=${size}`);
}

export async function retryEmailOutbox(outboxId) {
  return request(`/admin/email-monitoring/retry/${outboxId}`, {
    method: 'POST',
  });
}

export async function testSmtpConnection() {
  return request('/admin/email-monitoring/test-connection', {
    method: 'POST',
  });
}

export async function sendTestEmail(data) {
  return request('/admin/email-monitoring/send-test', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchEmailPreferences() {
  return request('/notifications/preferences');
}

export async function updateEmailPreferences(preferencesMap) {
  return request('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences: preferencesMap }),
  });
}

/* ============================================================================
 *  MEDICINE RETURN TRACKING & QUARANTINE INSPECTION API
 * ============================================================================ */

export async function fetchReturns() {
  return request('/returns');
}

export async function fetchReturnById(id) {
  return request(`/returns/${id}`);
}

export async function fetchReturnInspections(id) {
  return request(`/returns/${id}/inspections`);
}

export async function createMedicineReturn(data) {
  return request('/returns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitReturnInspection(id, data) {
  return request(`/returns/${id}/inspections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resolveMedicineReturn(id, data) {
  return request(`/returns/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchReturnAnalytics() {
  return request('/returns/analytics');
}









