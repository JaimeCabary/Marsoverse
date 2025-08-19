// app-integration.js - Add this to your main HTML files
class MarsoversePWA {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    console.log("🚀 Initializing Marsoverse PWA...");
    
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
      await this.setupPushNotifications();
      this.setupNetworkListeners();
      this.setupAppListeners();
      this.setupPeriodicSync();
      
      // Show installation prompt after service worker is ready
      this.setupInstallPrompt();
    }
    
    console.log("✅ Marsoverse PWA initialized!");
  }

  // Service Worker Registration
  async registerServiceWorker() {
    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log("✅ Service Worker registered:", this.swRegistration);
      
      // Handle updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateAvailable();
          }
        });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
      
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case "SW_ACTIVATED":
        console.log("🎮 App ready for offline use!");
        this.showOfflineReady();
        break;
        
      case "CONNECTION_RESTORED":
        console.log("🌐 Connection restored");
        this.showConnectionRestored();
        break;
        
      case "NETWORK_LOST":
        console.log("📱 Gone offline");
        this.showOfflineMode();
        break;
        
      case "SYNC_GAME_DATA":
        this.syncGameData();
        break;
        
      default:
        console.log("📨 SW Message:", event.data);
    }
  }

  // Push Notifications Setup
  async setupPushNotifications() {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('PushManager' in window)) {
        console.warn("⚠️  Push notifications not supported");
        return;
      }

      // Request notification permission
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        console.log("✅ Notification permission granted");
        await this.subscribeToPushNotifications();
        this.setupLocalNotifications();
      } else {
        console.log("❌ Notification permission denied");
      }
      
    } catch (error) {
      console.error("❌ Push notification setup failed:", error);
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    try {
      if (!this.swRegistration) return;
      
      // VAPID keys - you'll need to generate these for your server
      const vapidPublicKey = 'BPeEnwKdvgPtRmdbldFTNPOE2QTH-r9jLRHjb2CprP3MnI6bIbg7BNT1mgIOQV0gnkyXlQX-ag7uYfH0k8s3ZaI'; // Replace with your VAPID public key
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log("🔔 Push subscription:", subscription);
      
      // Send subscription to your server
      await this.sendSubscriptionToServer(subscription);
      
    } catch (error) {
      console.error("❌ Push subscription failed:", error);
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to your server
  async sendSubscriptionToServer(subscription) {
    try {
      // Replace with your server endpoint
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: this.getUserId(), // Implement user identification
          gamePreferences: this.getGamePreferences()
        })
      });
      
      if (response.ok) {
        console.log("✅ Subscription sent to server");
      }
    } catch (error) {
      console.warn("⚠️  Could not send subscription to server:", error);
      // App still works offline, just no server-side push notifications
    }
  }

  // Setup local notifications for standalone app behavior
  setupLocalNotifications() {
    // Welcome back notification (after 1 hour of inactivity)
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.sendLocalNotification({
          title: "Missing Mars already? 🚀",
          body: "Your Mars colonies need attention!",
          tag: "welcome-back"
        });
      }, 60 * 60 * 1000); // 1 hour
    };
    
    // Reset timer on user activity
    ['click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    
    resetInactivityTimer();
    
    // Daily reminder notification
    this.scheduleDailyReminder();
  }

  // Send local notification
  async sendLocalNotification(options) {
    if ('serviceWorker' in navigator && this.swRegistration) {
      navigator.serviceWorker.controller?.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        options: options
      });
    }
  }

  // Schedule daily reminder
  scheduleDailyReminder() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 7 PM daily reminder
    
    const msUntilReminder = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendLocalNotification({
        title: "Mars Exploration Time! 🪐",
        body: "Ready for another adventure on Mars?",
        tag: "daily-reminder",
        url: "/mars.html"
      });
      
      // Schedule next day's reminder
      setInterval(() => {
        this.sendLocalNotification({
          title: "Mars Exploration Time! 🪐", 
          body: "Ready for another adventure on Mars?",
          tag: "daily-reminder"
        });
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
    }, msUntilReminder);
  }

  // Network status monitoring
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log("🌐 Back online");
      this.hideOfflineIndicator();
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log("📱 Gone offline");
      this.showOfflineIndicator();
    });
  }

  // App-specific listeners
  setupAppListeners() {
    // Listen for app installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e;
      this.showInstallButton();
    });

    // Listen for app installation completion
    window.addEventListener('appinstalled', () => {
      console.log("📱 App installed successfully!");
      this.hideInstallButton();
      this.trackAppInstall();
    });

    // Visibility change - for background sync
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppResume();
      } else {
        this.handleAppPause();
      }
    });
  }

  // Setup background sync
  setupPeriodicSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register sync events
      this.swRegistration?.sync.register('game-data-sync').catch(() => {
        console.log("Background sync not available");
      });
    }
  }

  // Install prompt handling
  showInstallButton() {
    // Create install button if it doesn't exist
    let installBtn = document.getElementById('install-app-btn');
    
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'install-app-btn';
      installBtn.innerHTML = '📱 Install App';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
        color: white;
        border: none;
        border-radius: 25px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        animation: pulse 2s infinite;
      `;
      
      installBtn.onclick = () => this.promptInstall();
      document.body.appendChild(installBtn);
    }
    
    installBtn.style.display = 'block';
  }

  hideInstallButton() {
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  async promptInstall() {
    if (this.installPromptEvent) {
      this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;
      
      if (outcome === 'accepted') {
        console.log("✅ User accepted install prompt");
      } else {
        console.log("❌ User dismissed install prompt");
      }
      
      this.installPromptEvent = null;
      this.hideInstallButton();
    }
  }

  // UI Feedback Methods
  showOfflineReady() {
    this.showToast("🎮 App ready for offline play!", "success");
  }

  showConnectionRestored() {
    this.showToast("🌐 Connection restored!", "success");
  }

  showOfflineMode() {
    this.showToast("📱 Playing offline - all features available!", "info");
  }

  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = '📱 Offline Mode';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: #34495e;
        color: white;
        border-radius: 20px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(indicator);
    }
    
    indicator.style.display = 'block';
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
      color: white;
      border-radius: 25px;
      font-weight: bold;
      z-index: 10001;
      animation: slideUp 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Game data synchronization
  async syncGameData() {
    try {
      // Sync game state, scores, progress, etc.
      const gameData = this.getGameData();
      
      if (this.isOnline && gameData) {
        // Send to server when online
        await fetch('/api/sync-game-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
        
        console.log("🎮 Game data synced");
      }
    } catch (error) {
      console.warn("⚠️  Game data sync failed:", error);
    }
  }

  // Sync when coming online
  async syncWhenOnline() {
    if (this.swRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.swRegistration.sync.register('game-data-sync');
        await this.swRegistration.sync.register('asset-prefetch');
      } catch (err) {
        // Fallback to immediate sync
        this.syncGameData();
      }
    }
  }

  // App lifecycle handling
  handleAppResume() {
    console.log("👁️  App resumed");
    
    // Check for updates
    if (this.swRegistration) {
      this.swRegistration.update();
    }
    
    // Sync data if needed
    if (this.isOnline) {
      this.syncGameData();
    }
  }

  handleAppPause() {
    console.log("😴 App paused");
    
    // Save current game state
    this.saveGameState();
  }

  // Cache management methods
  async getCacheStatus() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve(null);
        return;
      }
      
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: "GET_CACHE_STATUS"
      }, [messageChannel.port2]);
    });
  }

  async clearCache() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve();
        return;
      }
      
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_CACHE"
      }, [messageChannel.port2]);
    });
  }

  async forceUpdate() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "FORCE_CACHE_UPDATE"
      });
      
      this.showToast("🔄 Updating app...", "info");
    }
  }

  // Utility methods for game integration
  getGameData() {
    // Implement based on your game's data structure
    return {
      scores: JSON.parse(localStorage.getItem('marsoverse-scores') || '{}'),
      progress: JSON.parse(localStorage.getItem('marsoverse-progress') || '{}'),
      settings: JSON.parse(localStorage.getItem('marsoverse-settings') || '{}'),
      timestamp: Date.now()
    };
  }

  saveGameState() {
    // Implement game state saving logic
    const gameState = {
      currentGame: window.location.pathname,
      timestamp: Date.now(),
      // Add other relevant state data
    };
    
    localStorage.setItem('marsoverse-current-state', JSON.stringify(gameState));
  }

  getUserId() {
    // Implement user identification (could be device ID, etc.)
    let userId = localStorage.getItem('marsoverse-user-id');
    if (!userId) {
      userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('marsoverse-user-id', userId);
    }
    return userId;
  }

  getGamePreferences() {
    return JSON.parse(localStorage.getItem('marsoverse-preferences') || '{}');
  }

  // Update available notification
  showUpdateAvailable() {
    const updateDiv = document.createElement('div');
    updateDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 24px;
        background: #f39c12;
        color: white;
        border-radius: 25px;
        font-weight: bold;
        z-index: 10002;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        text-align: center;
      ">
        🎮 New version available!
        <button onclick="window.marsoversePWA.applyUpdate()" style="
          margin-left: 10px;
          padding: 8px 16px;
          background: white;
          color: #f39c12;
          border: none;
          border-radius: 15px;
          font-weight: bold;
          cursor: pointer;
        ">Update Now</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: 8px;
          padding: 8px 12px;
          background: transparent;
          color: white;
          border: 1px solid white;
          border-radius: 15px;
          font-weight: bold;
          cursor: pointer;
        ">Later</button>
      </div>
    `;
    
    document.body.appendChild(updateDiv);
  }

  // Apply service worker update
  async applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      
      // Reload page after update
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  // Installation prompt setup
  setupInstallPrompt() {
    // Auto-show install prompt after user has interacted with the app
    let interactionCount = 0;
    
    const trackInteraction = () => {
      interactionCount++;
      
      if (interactionCount >= 3 && this.installPromptEvent) {
        setTimeout(() => {
          this.showInstallPromo();
        }, 2000);
        
        // Remove listeners after showing promo
        ['click', 'keypress', 'touchstart'].forEach(event => {
          document.removeEventListener(event, trackInteraction);
        });
      }
    };
    
    ['click', 'keypress', 'touchstart'].forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });
  }

  showInstallPromo() {
    const promoDiv = document.createElement('div');
    promoDiv.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 15px;
        font-weight: bold;
        z-index: 10003;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 400px;
        margin: 0 auto;
      ">
        <div style="font-size: 18px; margin-bottom: 10px;">🚀 Install Marsoverse</div>
        <div style="font-size: 14px; margin-bottom: 15px; opacity: 0.9;">
          Get the full Mars experience! Works offline, faster loading, and push notifications.
        </div>
        <button onclick="window.marsoversePWA.promptInstall()" style="
          padding: 12px 24px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 10px;
        ">Install Now</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          padding: 12px 24px;
          background: transparent;
          color: white;
          border: 1px solid white;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
        ">Maybe Later</button>
      </div>
    `;
    
    document.body.appendChild(promoDiv);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (promoDiv.parentNode) {
        promoDiv.parentNode.removeChild(promoDiv);
      }
    }, 10000);
  }

  // Analytics and tracking
  trackAppInstall() {
    // Track installation for analytics
    console.log("📊 App installation tracked");
    localStorage.setItem('marsoverse-installed', 'true');
    localStorage.setItem('marsoverse-install-date', Date.now().toString());
  }

  // Public API methods for your games to use
  async getAppStatus() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve({ status: 'no-sw' });
        return;
      }
      
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: "GET_APP_STATUS"
      }, [messageChannel.port2]);
    });
  }

  // Send custom push notification (for game events)
  async sendGameNotification(title, body, gameUrl = null) {
    if (Notification.permission === 'granted') {
      await this.sendLocalNotification({
        title: title,
        body: body,
        url: gameUrl || window.location.pathname,
        tag: 'game-event'
      });
    }
  }

  // Check if app is running in standalone mode
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Initialize app for standalone experience
  setupStandaloneMode() {
    if (this.isStandalone()) {
      console.log("📱 Running in standalone app mode");
      
      // Hide browser UI elements, enhance app-like feel
      document.body.classList.add('standalone-mode');
      
      // Prevent zoom and selection for app-like feel
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault(); // Prevent pinch zoom
        }
      }, { passive: false });
      
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault(); // Prevent double-tap zoom
        }
        lastTouchEnd = now;
      }, { passive: false });
    }
  }
}

// Initialize PWA when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.marsoversePWA = new MarsoversePWA();
  });
} else {
  window.marsoversePWA = new MarsoversePWA();
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .standalone-mode {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
`;
document.head.appendChild(style);