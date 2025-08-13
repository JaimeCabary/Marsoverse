// Enhanced Backup System with Honeycomb Integration
class BackupManager {
  constructor() {
    this.backendUrl = window.location.origin; // Use current domain
    this.LOCAL_STORAGE_KEYS = [
      'marsoverse_players',
      'marsoverse_missions',
      'playerName',
      'playerAge',
      'playerXP',
      'companionName',
      'cyborgName',
      'walletBalance',
      'walletAddress',
      'walletName',
      'playerAvatar',
      'playerEmail',
      'rewardUSD',
      'lastSolUsd',
      'rewardSOL',
      'honeycomb_events',
      'checkInProgress',
      'taskProgress',
      'lastCheckIn',
      'adminMissionProgress',
      'marsoverse_game',
      'marsoverse_zepta_game',
      'currentPlayerId',
      'marsoverse_purchases',
      'marsoverse_admin_log',
      'zeptaGame',
      'theme',
      'marsVolume',
      'highscore',
      'marsXP',
      'marsUSDT',
      'marsHighXP',
      'marsHighScore',
      'rewardShown',
      'playerFirstName',
      'gender',
      'marsoverseState'
    ];
    this.init();
  }

  init() {
    // Make functions globally available
    window.backupGameData = () => this.backupGameData();
    window.restoreGameData = () => this.restoreGameData();
    window.deleteBackup = () => this.deleteBackup();
  }

  getPlayerId() {
    return localStorage.getItem('currentPlayerId') || 
           localStorage.getItem('walletAddress') || 
           localStorage.getItem('playerName') || 
           `anonymous_${Date.now()}`;
  }

  collectPlayerData() {
    const data = {};
    
    // Collect all relevant localStorage data
    this.LOCAL_STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          // Try to parse as JSON first
          data[key] = JSON.parse(value);
        } catch {
          // If not JSON, store as string
          data[key] = value;
        }
      }
    });

    return {
      ...data,
      backupTimestamp: new Date().toISOString(),
      gameVersion: '1.0.0'
    };
  }

  async backupGameData() {
    try {
      const playerData = this.collectPlayerData();
      const playerId = this.getPlayerId();

      // Try to backup to server first
      try {
        const response = await fetch(`${this.backendUrl}/api/backup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: playerId,
            data: playerData
          })
        });

        if (!response.ok) {
          throw new Error(`Server backup failed: ${response.statusText}`);
        }

        console.log('✅ Backup saved to server');
        
        // Also backup to localStorage as fallback
        localStorage.setItem('marsoverse_backup', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: playerData
        }));

        // Log to Honeycomb if available
        if (window.honeycomb) {
          window.honeycomb.sendEvent('data_backup', {
            playerId,
            dataSize: JSON.stringify(playerData).length,
            timestamp: new Date().toISOString(),
            method: 'server'
          });
        }

        alert('✅ Game data backed up successfully to server!');
        return true;

      } catch (serverError) {
        console.warn('Server backup failed, offering file download:', serverError);
        
        // Fallback to file download
        const blob = new Blob([JSON.stringify(playerData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marsoverse_backup_${playerId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Also save to localStorage
        localStorage.setItem('marsoverse_backup', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: playerData
        }));

        if (window.honeycomb) {
          window.honeycomb.sendEvent('data_backup', {
            playerId,
            dataSize: JSON.stringify(playerData).length,
            timestamp: new Date().toISOString(),
            method: 'file_download'
          });
        }

        alert('✅ Game data backed up as file download!');
        return false; // Server failed but file backup succeeded
      }

    } catch (error) {
      console.error('Backup failed completely:', error);
      alert('❌ Backup failed. Please try again.');
      return false;
    }
  }

  async restoreGameData() {
    if (!confirm('⚠️ This will overwrite your current progress. Continue?')) {
      return false;
    }

    try {
      const playerId = this.getPlayerId();
      let backupData = null;

      // Try to restore from server first
      try {
        const response = await fetch(`${this.backendUrl}/api/backup/${playerId}`);
        
        if (response.ok) {
          backupData = await response.json();
          console.log('✅ Restored from server backup');
        } else {
          throw new Error('Server restore failed');
        }
      } catch (serverError) {
        console.warn('Server restore failed, trying fallback methods:', serverError);
        
        // Try localStorage backup
        const localBackup = localStorage.getItem('marsoverse_backup');
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          backupData = parsed.data;
          console.log('✅ Restored from local backup');
        } else {
          // Prompt for file upload
          await this.promptFileRestore();
          return true; // File restore handles its own flow
        }
      }

      if (!backupData) {
        alert('❌ No backup found for this player.');
        return false;
      }

      // Restore all data
      this.restorePlayerData(backupData);

      // Log to Honeycomb
      if (window.honeycomb) {
        window.honeycomb.sendEvent('data_restore', {
          playerId,
          timestamp: new Date().toISOString()
        });
      }

      alert('✅ Game data restored successfully!');
      
      // Refresh the page to apply changes
      setTimeout(() => {
        location.reload();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      alert('❌ Restore failed. Please try again.');
      return false;
    }
  }

  async promptFileRestore() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const backupData = JSON.parse(e.target.result);
              this.restorePlayerData(backupData);
              
              if (window.honeycomb) {
                window.honeycomb.sendEvent('data_restore', {
                  playerId: this.getPlayerId(),
                  timestamp: new Date().toISOString(),
                  method: 'file_upload'
                });
              }

              alert('✅ Game data restored from file successfully!');
              setTimeout(() => location.reload(), 1000);
              resolve(true);
            } catch (error) {
              console.error('File restore failed:', error);
              alert('❌ Failed to restore game data from file. Please check the file format.');
              resolve(false);
            }
          };
          reader.readAsText(file);
        } else {
          resolve(false);
        }
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(false);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }

  restorePlayerData(data) {
    // Skip metadata fields
    Object.keys(data).forEach(key => {
      if (key === 'backupTimestamp' || key === 'gameVersion') return;
      
      const value = data[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, value.toString());
        }
      }
    });

    // Update UI elements immediately
    this.updateUIFromRestore(data);
  }

  updateUIFromRestore(data) {
    // Update player info displays
    if (data.playerName) {
      const nameEls = document.querySelectorAll('#youName, #playerNameHUD');
      nameEls.forEach(el => el.textContent = data.playerName);
    }
    
    if (data.playerXP) {
      const xpEls = document.querySelectorAll('#playerXP, #youXP');
      xpEls.forEach(el => {
        if (el.id === 'playerXP') {
          el.textContent = `XP: ${data.playerXP}`;
        } else {
          el.textContent = data.playerXP;
        }
      });
    }
    
    if (data.walletBalance) {
      const balanceEls = document.querySelectorAll('#walleta, #walletAmount');
      balanceEls.forEach(el => {
        const balance = parseFloat(data.walletBalance);
        if (el.id === 'walletAmount') {
          el.textContent = `${balance.toFixed(2)} USDT`;
        } else {
          el.textContent = `${balance.toFixed(2)}`;
        }
      });
    }

    if (data.playerAvatar) {
      const avatarEl = document.getElementById('playerAvatar');
      if (avatarEl) avatarEl.src = data.playerAvatar;
    }

    if (data.playerEmail) {
      const emailEl = document.getElementById('youEmail');
      if (emailEl) emailEl.textContent = data.playerEmail;
    }
  }

  async deleteBackup() {
    if (!confirm('⚠️ This will permanently delete your backup. Continue?')) {
      return false;
    }

    try {
      const playerId = this.getPlayerId();

      // Delete from server
      try {
        const response = await fetch(`${this.backendUrl}/api/backup/${playerId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('✅ Server backup deleted');
        }
      } catch (error) {
        console.warn('Server backup deletion failed:', error);
      }

      // Delete local backup
      localStorage.removeItem('marsoverse_backup');

      // Log to Honeycomb
      if (window.honeycomb) {
        window.honeycomb.sendEvent('data_delete', {
          playerId,
          timestamp: new Date().toISOString()
        });
      }

      alert('✅ Backup deleted successfully!');
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ Delete failed. Please try again.');
      return false;
    }
  }
}

// Global Player Sync System for Admin Dashboard
class GlobalPlayerSync {
  constructor() {
    this.backendUrl = window.location.origin;
    this.syncInterval = 30000; // 30 seconds
    this.startSync();
  }

  async syncAllPlayers() {
    try {
      // Get all players from server events
      const response = await fetch(`${this.backendUrl}/api/events`);
      if (!response.ok) return;

      const events = await response.json();
      const playersMap = new Map();

      // Process events to build player profiles
      events.forEach(event => {
        if (event.playerId && event.playerId !== 'anonymous') {
          const playerId = event.playerId;
          
          if (!playersMap.has(playerId)) {
            playersMap.set(playerId, {
              id: playerId,
              name: playerId,
              xp: 0,
              wallet: 0,
              lastActive: event.timestamp,
              status: 'offline',
              events: []
            });
          }

          const player = playersMap.get(playerId);
          player.events.push(event);
          player.lastActive = event.timestamp;

          // Update player stats based on events
          if (event.type === 'xp_updated' && event.data.newXP) {
            player.xp = Math.max(player.xp, event.data.newXP);
          }
          if (event.type === 'daily_checkin' && event.data.xp) {
            player.xp += event.data.xp;
          }
          if (event.data.walletAddress) {
            player.walletAddress = event.data.walletAddress;
          }
        }
      });

      // Merge with existing local players
      const existingPlayers = JSON.parse(localStorage.getItem('marsoverse_players') || '[]');
      const allPlayers = [...existingPlayers];

      // Add new players from events
      playersMap.forEach(eventPlayer => {
        const exists = allPlayers.find(p => p.name === eventPlayer.name || p.id === eventPlayer.id);
        if (!exists) {
          allPlayers.push({
            ...eventPlayer,
            age: 25, // Default
            companion: 'Elena',
            cyborg: 'Jeremy',
            createdAt: new Date().toISOString()
          });
        } else {
          // Update existing player
          exists.xp = Math.max(exists.xp || 0, eventPlayer.xp);
          exists.lastActive = eventPlayer.lastActive;
          exists.walletAddress = eventPlayer.walletAddress || exists.walletAddress;
        }
      });

      // Save updated players list
      localStorage.setItem('marsoverse_players', JSON.stringify(allPlayers));
      
      // Trigger custom event for admin dashboard
      window.dispatchEvent(new CustomEvent('playersUpdated', { 
        detail: { players: allPlayers } 
      }));

      return allPlayers;
    } catch (error) {
      console.error('Global player sync failed:', error);
      return [];
    }
  }

  startSync() {
    // Initial sync
    this.syncAllPlayers();
    
    // Periodic sync
    setInterval(() => {
      this.syncAllPlayers();
    }, this.syncInterval);
  }
}

// Initialize systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.backupManager = new BackupManager();
  window.globalPlayerSync = new GlobalPlayerSync();
  
  console.log('✅ Backup system initialized');
});

// Export for use in other scripts
window.BackupManager = BackupManager;
window.GlobalPlayerSync = GlobalPlayerSync;