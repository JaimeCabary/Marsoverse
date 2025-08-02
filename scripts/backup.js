const BACKUP_ENDPOINT = '/api/backup';
const PLAYER_ID_KEY = 'currentPlayerId';
const WALLET_ADDRESS_KEY = 'walletAddress';

// List of all localStorage keys used in your project
const LOCAL_STORAGE_KEYS = [
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

// Backup all localStorage data
async function backupGameData() {
  try {
    const playerId = localStorage.getItem(PLAYER_ID_KEY) || localStorage.getItem(WALLET_ADDRESS_KEY) || `anonymous_${Date.now()}`;
    const backupData = {};

    // Collect all relevant localStorage data
    LOCAL_STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        backupData[key] = value;
      }
    });

    // Try to send to server
    try {
      const response = await fetch(BACKUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, data: backupData })
      });

      if (!response.ok) throw new Error('Server backup failed');
      console.log('Backup saved to server');
      return true;
    } catch (serverError) {
      console.warn('Server backup failed, offering file download:', serverError);
      // Fallback to file download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marsoverse_backup_${playerId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return false;
    }
  } catch (error) {
    console.error('Backup failed:', error);
    return false;
  }
}

// Restore game data from server or file
async function restoreGameData() {
  try {
    const playerId = localStorage.getItem(PLAYER_ID_KEY) || localStorage.getItem(WALLET_ADDRESS_KEY) || prompt('Enter your player ID or wallet address:');
    if (!playerId) throw new Error('No player ID provided');

    // Try to fetch from server
    try {
      const response = await fetch(`${BACKUP_ENDPOINT}/${playerId}`);
      if (!response.ok) throw new Error('Server restore failed');
      const backupData = await response.json();

      // Restore to localStorage
      Object.entries(backupData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      console.log('Game data restored from server');
      alert('Game data restored successfully!');
      return true;
    } catch (serverError) {
      console.warn('Server restore failed, prompting file upload:', serverError);
      // Fallback to file upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const backupData = JSON.parse(e.target.result);
              Object.entries(backupData).forEach(([key, value]) => {
                localStorage.setItem(key, value);
              });
              console.log('Game data restored from file');
              alert('Game data restored successfully!');
            } catch (error) {
              console.error('File restore failed:', error);
              alert('Failed to restore game data from file.');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
      return false;
    }
  } catch (error) {
    console.error('Restore failed:', error);
    alert('Failed to restore game data.');
    return false;
  }
}

// Delete backup when resetting
async function deleteBackup() {
  try {
    const playerId = localStorage.getItem(PLAYER_ID_KEY) || localStorage.getItem(WALLET_ADDRESS_KEY);
    if (playerId) {
      const response = await fetch(`${BACKUP_ENDPOINT}/${playerId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Server backup deletion failed');
      console.log('Server backup deleted');
    }
  } catch (error) {
    console.warn('Server backup deletion failed:', error);
    // No action needed for file-based backup as it’s user-managed
  }
}

// Expose functions to global scope for use in other scripts
window.backupGameData = backupGameData;
window.restoreGameData = restoreGameData;
window.deleteBackup = deleteBackup;