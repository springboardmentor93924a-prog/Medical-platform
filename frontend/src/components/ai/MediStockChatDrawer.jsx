import React, { useState, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  fetchChatSuggestions,
  fetchChatSessions,
  fetchChatSessionMessages,
  deleteChatSession,
} from '../../services/api';
import {
  IconSparkles,
  IconX,
  IconSend,
  IconClock,
  IconAlertTriangle,
  IconBox,
  IconChartTrend,
  IconPill,
  IconCheck,
  IconRefresh,
  IconMicrophone,
  IconVolume,
  IconClipboard,
  IconOrders,
  IconSuppliers,
  IconCheckCircle,
  IconTruck,
  IconPackage,
} from '../icons/Icons';
import VoiceNoteRecorder from './voice/VoiceNoteRecorder';
import SpeechAudioPlayer from './voice/SpeechAudioPlayer';
import LiveVoiceModal from './voice/LiveVoiceModal';
import './MediStockChatDrawer.css';

export default function MediStockChatDrawer({ isOpen, onClose }) {
  // Extract user role for role-scoped knowledge experience
  const storedUser = localStorage.getItem('medistock_user');
  let userRole = 'ADMIN';
  let userName = 'User';
  try {
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role) userRole = String(parsed.role).toUpperCase();
      if (parsed?.fullName) userName = parsed.fullName;
    }
  } catch (_e) {}

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeProvider, setActiveProvider] = useState('INTERNAL_PHARMACY_ENGINE');
  const [isVoiceNoteOpen, setIsVoiceNoteOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const getWelcomeText = (role) => {
    switch (role) {
      case 'STAFF':
        return 'Hello! I am **MediStock AI**, your pharmacy floor and inventory assistant. I can help you check shelf stock levels, verify batch expiry dates, locate medicine bins, and view your assigned tasks.';
      case 'SUPPLIER':
        return 'Hello! I am **MediStock AI**, your dedicated wholesale supplier portal assistant. I can help you track your purchase orders, confirm delivery statuses, and review your contracted medicine items.';
      default:
        return 'Hello! I am **MediStock AI**, your pharmacy demand forecasting and inventory intelligence assistant. How can I help you today?';
    }
  };

  const getDefaultSuggestions = (role) => {
    switch (role) {
      case 'STAFF':
        return [
          'What is the available stock of Paracetamol?',
          'Which medicine batches expire in the next 7 days?',
          'What operational tasks are assigned to me today?',
          'Check usable stock levels for Amoxicillin',
        ];
      case 'SUPPLIER':
        return [
          'List my active purchase orders',
          'What orders are currently pending delivery?',
          'Show my supplier company summary',
          'Check delivery receipts for my shipments',
        ];
      default:
        return [
          'Which medicine batches expire in the next 30 days?',
          'Show all medicines with critical low stock shortages',
          'Forecast demand and consumption velocity for Paracetamol',
          'What is our total expired stock financial loss?',
        ];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            sender: 'ASSISTANT',
            text: getWelcomeText(userRole),
            toolUsed: null,
            toolData: null,
            provider: 'INTERNAL_PHARMACY_ENGINE',
          },
        ]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenAi = (e) => {
      if (e.detail?.query) {
        handleSend(e.detail.query);
      }
    };
    window.addEventListener('open-medistock-ai', handleOpenAi);
    return () => window.removeEventListener('open-medistock-ai', handleOpenAi);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadSuggestions = async () => {
    try {
      const data = await fetchChatSuggestions();
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
      } else {
        setSuggestions(getDefaultSuggestions(userRole));
      }
    } catch (_e) {
      setSuggestions(getDefaultSuggestions(userRole));
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'USER',
      text: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text);
      if (res && res.reply) {
        if (res.sessionId) setSessionId(res.sessionId);
        if (res.provider) setActiveProvider(res.provider);

        const assistantMsg = {
          id: 'asst_' + Date.now(),
          sender: 'ASSISTANT',
          text: res.reply,
          toolUsed: res.toolUsed,
          toolData: res.toolData,
          provider: res.provider,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'ASSISTANT',
            text: 'Sorry, I encountered an issue processing your query. Please try again.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'ASSISTANT',
          text: 'Error connecting to MediStock AI engine: ' + (err.message || 'Please check backend status.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSend = async ({ text, audioBlob, audioUrl }) => {
    setIsVoiceNoteOpen(false);
    const query = (text || '').trim();
    if (!query || loading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'USER',
      text: query,
      isVoice: true,
      audioUrl: audioUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, query);
      if (res && res.reply) {
        if (res.sessionId) setSessionId(res.sessionId);
        if (res.provider) setActiveProvider(res.provider);

        const assistantMsg = {
          id: 'asst_' + Date.now(),
          sender: 'ASSISTANT',
          text: res.reply,
          toolUsed: res.toolUsed,
          toolData: res.toolData,
          provider: res.provider,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'ASSISTANT',
            text: 'Sorry, I encountered an issue processing your voice query. Please try again.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'ASSISTANT',
          text: 'Error connecting to MediStock AI engine: ' + (err.message || 'Please check backend status.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakText = (msgId, text) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = (text || '')
      .replace(/[*_#`]/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\|\s*[^|]+\s*\|/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderToolData = (toolUsed, data) => {
    if (!data) return null;

    if (toolUsed === 'query_expiring_batches' && Array.isArray(data)) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconClock size={15} color="#e11d48" />
            <span>Expiring Batches ({data.length} lots)</span>
          </div>
          <div className="msc-tool-table-wrapper">
            <table className="msc-tool-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Days Left</th>
                  <th>FEFO Priority</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.batchNumber}</strong></td>
                    <td>{b.medicineName}</td>
                    <td>{b.quantityAvailable}</td>
                    <td style={{ color: b.daysUntilExpiry <= 7 ? '#e11d48' : '#f59e0b', fontWeight: 700 }}>
                      {b.daysUntilExpiry}d
                    </td>
                    <td>
                      <span className={`msc-badge msc-badge--${b.fefoRecommendation === 'Use first' ? 'primary' : 'muted'}`}>
                        {b.fefoRecommendation || 'Eligible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_low_stock_medicines' && Array.isArray(data)) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconAlertTriangle size={15} color="#d97706" />
            <span>Low Stock Shortage Warnings ({data.length} medicines)</span>
          </div>
          <div className="msc-tool-chips">
            {data.slice(0, 6).map((m, i) => (
              <div key={i} className="msc-tool-chip">
                <span>{m.medicineName}</span>
                <span className="msc-tool-chip__qty">{m.usableStock} left</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_demand_forecast' && data.medicineName) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconChartTrend size={15} color="#0d9488" />
            <span>Demand Forecast: {data.medicineName}</span>
          </div>
          <div className="msc-tool-stats-grid">
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Daily Consumption</span>
              <span className="msc-tool-stat__val">{data.averageDailyUsage} units/day</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">30-Day Demand</span>
              <span className="msc-tool-stat__val">{data.projectedDemandUnits} units</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Usable Stock</span>
              <span className="msc-tool-stat__val">{data.usableBatchStock} units</span>
            </div>
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_wastage_loss' && data.totalExpiredUnitsOnHand !== undefined) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconBox size={15} color="#e11d48" />
            <span>Expired Inventory Wastage</span>
          </div>
          <div className="msc-tool-stats-grid">
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Expired Batches</span>
              <span className="msc-tool-stat__val">{data.totalExpiredBatchesWithStock}</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Expired Units</span>
              <span className="msc-tool-stat__val">{data.totalExpiredUnitsOnHand}</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Estimated Loss</span>
              <span className="msc-tool-stat__val" style={{ color: '#e11d48' }}>${data.estimatedFinancialLoss}</span>
            </div>
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_assigned_tasks' && Array.isArray(data)) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconClipboard size={15} color="#059669" />
            <span>Assigned Floor Tasks ({data.length})</span>
          </div>
          <div className="msc-tool-chips" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No pending tasks assigned.</span>
            ) : (
              data.slice(0, 5).map((t, i) => (
                <div key={i} className="msc-tool-chip" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{t.title}</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: t.priority === 'HIGH' || t.priority === 'URGENT' ? '#fee2e2' : '#f1f5f9', color: t.priority === 'HIGH' || t.priority === 'URGENT' ? '#dc2626' : '#475569', fontWeight: 700 }}>
                      {t.priority}
                    </span>
                  </div>
                  <span className="msc-tool-chip__qty">{t.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_purchase_orders' && Array.isArray(data)) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconOrders size={15} color="#2563eb" />
            <span>Active Purchase Orders ({data.length})</span>
          </div>
          <div className="msc-tool-chips" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No active purchase orders found.</span>
            ) : (
              data.slice(0, 5).map((po, i) => (
                <div key={i} className="msc-tool-chip" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#1e40af' }}>{po.poNumber || `PO #${po.id}`}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>{po.orderDate || po.createdAt || ''}</span>
                  </div>
                  <span className={`msc-badge msc-badge--${po.status === 'DELIVERED' ? 'primary' : 'muted'}`}>
                    {po.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_supplier_summary' && (Array.isArray(data) || data.supplierName || data.name)) {
      const supp = Array.isArray(data) ? data[0] : data;
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconSuppliers size={15} color="#2563eb" />
            <span>Supplier Profile: {supp?.supplierName || supp?.name || 'Registered Vendor'}</span>
          </div>
          <div className="msc-tool-stats-grid">
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Status</span>
              <span className="msc-tool-stat__val" style={{ color: '#16a34a' }}>{supp?.status || 'Active'}</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Active Orders</span>
              <span className="msc-tool-stat__val">{supp?.activeOrdersCount || supp?.pendingOrdersCount || 0}</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Contact</span>
              <span className="msc-tool-stat__val">{supp?.contactPerson || supp?.phone || 'Primary'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (toolUsed === 'query_medicine_stock' && data.found) {
      return (
        <div className="msc-tool-card">
          <div className="msc-tool-card__header">
            <IconPill size={15} color="#0d9488" />
            <span>Medicine Stock: {data.medicineName || `Medicine #${data.medicineId}`}</span>
          </div>
          <div className="msc-tool-stats-grid">
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Usable Units</span>
              <span className="msc-tool-stat__val" style={{ color: data.isLowStock ? '#dc2626' : '#0d9488' }}>
                {data.usableUnitsOnHand}
              </span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Reorder Level</span>
              <span className="msc-tool-stat__val">{data.reorderThreshold}</span>
            </div>
            <div className="msc-tool-stat">
              <span className="msc-tool-stat__label">Stock Status</span>
              <span className="msc-tool-stat__val" style={{ color: data.isLowStock ? '#dc2626' : '#16a34a' }}>
                {data.stockStatus || (data.isLowStock ? 'Low Stock' : 'Optimal')}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="msc-drawer-overlay" onClick={onClose}>
      <div className="msc-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="msc-drawer__header">
          <div className="msc-drawer__brand">
            <div className="msc-drawer__icon">
              <IconSparkles size={20} color="#008c8c" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h3 className="msc-drawer__title">MediStock AI</h3>
                <span className={`msc-role-badge msc-role-badge--${userRole.toLowerCase()}`}>
                  {userRole === 'STAFF' ? 'Staff Portal' : userRole === 'SUPPLIER' ? 'Supplier Portal' : userRole === 'PHARMACIST' ? 'Clinical' : 'Admin'}
                </span>
              </div>
              <span className="msc-drawer__subtitle">
                Powered by {activeProvider.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="msc-drawer__actions">
            <button
              className="msc-live-voice-launch-btn"
              onClick={() => setIsLiveVoiceOpen(true)}
              title="Start hands-free Live Voice mode"
              aria-label="Start hands-free Live Voice mode"
            >
              <span className="msc-live-orb-icon" />
              <span>Live Voice</span>
            </button>
            <button className="msc-drawer__close" onClick={onClose} aria-label="Close assistant">
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="msc-drawer__body">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msc-msg ${m.sender === 'USER' ? 'msc-msg--user' : 'msc-msg--assistant'}`}
            >
              {m.sender === 'ASSISTANT' && (
                <div className="msc-msg__avatar">
                  <IconSparkles size={14} color="#FFFFFF" />
                </div>
              )}
              <div className="msc-msg__bubble">
                {m.isVoice && (
                  <div className="msc-msg__voice-badge">
                    <IconMicrophone size={12} />
                    <span>Voice Note</span>
                  </div>
                )}
                <p className="msc-msg__text" dangerouslySetInnerHTML={{ __html: formatMarkdown(m.text) }} />
                {m.audioUrl && (
                  <audio controls src={m.audioUrl} className="msc-msg__voice-audio" />
                )}
                {m.toolUsed && renderToolData(m.toolUsed, m.toolData)}
                {m.sender === 'ASSISTANT' && m.id !== 'welcome' && (
                  <SpeechAudioPlayer
                    text={m.text}
                    messageId={m.id}
                  />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msc-msg msc-msg--assistant">
              <div className="msc-msg__avatar">
                <IconSparkles size={14} color="#FFFFFF" />
              </div>
              <div className="msc-msg__bubble msc-msg__bubble--loading">
                <span className="msc-dot"></span>
                <span className="msc-dot"></span>
                <span className="msc-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        {suggestions.length > 0 && messages.length <= 3 && !isVoiceNoteOpen && (
          <div className="msc-drawer__suggestions">
            <span className="msc-drawer__suggestions-label">Suggested Inquiries:</span>
            <div className="msc-drawer__chips">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  className="msc-chip-btn"
                  onClick={() => handleSend(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar or Voice Note Dock */}
        {isVoiceNoteOpen ? (
          <VoiceNoteRecorder
            onSendVoice={handleVoiceSend}
            onCancel={() => setIsVoiceNoteOpen(false)}
          />
        ) : (
          <div className="msc-drawer__footer">
            <div className="msc-input-box">
              <button
                className="msc-mic-btn"
                onClick={() => setIsVoiceNoteOpen(true)}
                disabled={loading}
                title="Record voice note"
                aria-label="Record voice note"
              >
                <IconMicrophone size={18} />
              </button>
              <input
                type="text"
                placeholder="Ask about batches, expiries, demand, stock..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="msc-send-btn"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || loading}
                aria-label="Send message"
              >
                <IconSend size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Live Voice Hands-Free Modal */}
        <LiveVoiceModal
          isOpen={isLiveVoiceOpen}
          onClose={() => setIsLiveVoiceOpen(false)}
          sessionId={sessionId}
          onSessionMessage={(msg, newSessId) => {
            setMessages((prev) => [...prev, msg]);
            if (newSessId) setSessionId(newSessId);
          }}
        />
      </div>
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

