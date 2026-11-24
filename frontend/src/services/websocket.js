/**
 * MediStock Real-Time WebSocket Connection Service
 * 
 * Powered by STOMP over native WebSocket with automatic reconnect,
 * JWT authentication, state-recovery upon reconnection, and role-based topics.
 */

import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionState = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
    this.connectionListeners = new Set();
    this.reconnectListeners = new Set();
    this.subscriptions = new Map(); // id -> { topic, callback }
    this.activeStompSubscriptions = new Map(); // id -> StompSubscription
    this.hasConnectedOnce = false;
  }

  /**
   * Connect to the Spring Boot STOMP broker using raw WebSocket with JWT header
   */
  connect() {
    const token = localStorage.getItem('medistock_token');
    if (!token) {
      this.connectionState = 'DISCONNECTED';
      this.notifyStatus(false);
      return;
    }

    if (this.client && (this.isConnected || this.connectionState === 'CONNECTING')) {
      return;
    }

    // Clean up any stale client
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (_e) {
        // ignore
      }
    }

    this.connectionState = 'CONNECTING';
    this.notifyStatus(false);

    const host = window.location.hostname || 'localhost';
    const brokerURL = `ws://${host}:8080/ws-raw`;

    this.client = new Client({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if (str.includes('ERROR') || str.includes('DISCONNECT')) {
          console.debug('[WS Debug]', str);
        }
      },
      onConnect: (frame) => {
        const wasReconnect = this.hasConnectedOnce;
        this.isConnected = true;
        this.connectionState = 'CONNECTED';
        this.hasConnectedOnce = true;
        this.notifyStatus(true);
        console.log('[WS] Connected to MediStock STOMP broker', frame.headers);

        // Re-subscribe all registered active subscriptions
        this.subscriptions.forEach(({ topic, callback }, id) => {
          this._doSubscribe(topic, callback, id);
        });

        // If client reconnected after a previous connection, trigger REST re-fetch
        if (wasReconnect) {
          console.log('[WS] Reconnected! Triggering state recovery for all subscribers');
          this.reconnectListeners.forEach((fn) => {
            try {
              fn();
            } catch (err) {
              console.error('[WS] Error in reconnect listener', err);
            }
          });
        }
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.connectionState = 'DISCONNECTED';
        this.activeStompSubscriptions.clear();
        this.notifyStatus(false);
        console.log('[WS] Disconnected from STOMP broker');
      },
      onStompError: (frame) => {
        console.error('[WS STOMP Error]', frame.headers?.message, frame.body);
      },
      onWebSocketClose: () => {
        this.isConnected = false;
        this.connectionState = 'DISCONNECTED';
        this.activeStompSubscriptions.clear();
        this.notifyStatus(false);
      },
      onWebSocketError: (event) => {
        console.warn('[WS Network Error]', event);
      },
    });

    this.client.activate();
  }

  /**
   * Disconnect STOMP broker on logout
   */
  disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (_e) {
        // ignore
      }
      this.client = null;
    }
    this.isConnected = false;
    this.connectionState = 'DISCONNECTED';
    this.hasConnectedOnce = false;
    this.subscriptions.clear();
    this.activeStompSubscriptions.clear();
    this.notifyStatus(false);
  }

  notifyStatus(connected) {
    this.connectionListeners.forEach((fn) => {
      try {
        fn(connected, this.connectionState);
      } catch (e) {
        console.error('[WS] Error in status listener', e);
      }
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(listener) {
    this.connectionListeners.add(listener);
    listener(this.isConnected, this.connectionState);
    return () => this.connectionListeners.delete(listener);
  }

  /**
   * Register a callback to recover database state after reconnection
   */
  onReconnect(listener) {
    this.reconnectListeners.add(listener);
    return () => this.reconnectListeners.delete(listener);
  }

  _doSubscribe(topic, callback, id) {
    if (!this.client || !this.isConnected) return;

    // Avoid duplicate subscriptions
    const existing = this.activeStompSubscriptions.get(id);
    if (existing) {
      try {
        existing.unsubscribe();
      } catch (_e) {
        // ignore
      }
    }

    try {
      const sub = this.client.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (_err) {
          callback(message.body);
        }
      });
      this.activeStompSubscriptions.set(id, sub);
    } catch (err) {
      console.error(`[WS] Failed to subscribe to ${topic}`, err);
    }
  }

  /**
   * Subscribe to a destination topic or queue. Returns cleanup function.
   */
  subscribe(topic, callback) {
    const id = `${topic}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.subscriptions.set(id, { topic, callback });

    if (this.isConnected) {
      this._doSubscribe(topic, callback, id);
    } else {
      this.connect();
    }

    return () => {
      this.subscriptions.delete(id);
      const active = this.activeStompSubscriptions.get(id);
      if (active) {
        try {
          active.unsubscribe();
        } catch (_e) {
          // ignore
        }
        this.activeStompSubscriptions.delete(id);
      }
    };
  }

  // Domain-specific subscription helpers
  subscribeOrders(callback) {
    return this.subscribe('/topic/orders', callback);
  }

  subscribeInventory(callback) {
    return this.subscribe('/topic/inventory', callback);
  }

  subscribeDeliveries(callback) {
    return this.subscribe('/topic/deliveries', callback);
  }

  subscribeDiscrepancies(callback) {
    return this.subscribe('/topic/discrepancies', callback);
  }

  subscribeNotifications(callback) {
    const unsubPublic = this.subscribe('/topic/notifications', callback);
    const unsubUser = this.subscribe('/user/queue/notifications', callback);
    return () => {
      unsubPublic();
      unsubUser();
    };
  }

  subscribeUserNotifications(userId, callback) {
    const unsubs = [];
    if (userId) {
      unsubs.push(this.subscribe(`/topic/notifications/${userId}`, callback));
    }
    unsubs.push(this.subscribe('/user/queue/notifications', callback));
    unsubs.push(this.subscribe('/topic/notifications', callback));
    return () => unsubs.forEach((fn) => fn());
  }
}

export const wsService = new WebSocketService();
export default wsService;
