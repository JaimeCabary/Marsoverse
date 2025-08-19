const express = require('express');
const cors = require('cors');
const path = require('path');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { createEdgeClient } = require('@honeycomb-protocol/edge-client');

const app = express();

// Enable CORS
app.use(cors({ 
  origin: ['https://marsoverse.netlify.app', 'https://marsoverse.onrender.com', 'http://localhost:3000'] 
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve marzo.html
app.get('/marzo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'marzo.html'));
});

// NEW: Serve admin.html
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const connection = new Connection('https://rpc.main.honeycombprotocol.com', 'confirmed');
const client = createEdgeClient('https://edge.main.honeycombprotocol.com/', true);

let projectAddress = null;

// In-memory storage for backups (replace with database in production)
const backups = new Map();
// NEW: In-memory storage for players and missions
const players = [];
const missions = [];
const events = [];

const pushSubscriptions = new Map();
const gameDataStore = new Map();

app.post('/api/backup', (req, res) => {
  const { playerId, data } = req.body;
  if (!playerId || !data) {
    return res.status(400).json({ error: 'Missing playerId or data' });
  }
  backups.set(playerId, data);
  res.json({ success: true });
});

app.get('/api/backup/:playerId', (req, res) => {
  const { playerId } = req.params;
  const data = backups.get(playerId);
  if (!data) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  res.json(data);
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    // Get all players sorted by XP in descending order
    const leaderboard = players
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 100) // Top 100 players
      .map(player => ({
        name: player.name,
        xp: player.xp,
        wallet: player.wallet,
        companion: player.companion,
        cyborg: player.cyborg,
        lastActive: player.lastActive
      }));
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});


app.delete('/api/backup/:playerId', (req, res) => {
  const { playerId } = req.params;
  backups.delete(playerId);
  res.json({ success: true });
});

app.post('/api/create-project', async (req, res) => {
  try {
    const { authority } = req.body;
    if (!authority) {
      return res.status(400).json({ error: 'Authority public key required' });
    }

    const response = await client.createCreateProjectTransaction({
      name: 'MarsoVerse',
      authority,
      payer: authority,
      profileDataConfig: {
        achievements: ['First Steps', 'Mission Master'],
        customDataFields: ['Level', 'Friends', 'Age', 'Gender', 'Companion', 'Cyborg', 'XP', 'Balance'],
      },
    });

    const { project, tx } = response.createCreateProjectTransaction;
    projectAddress = project;
    res.json({ transaction: Buffer.from(tx.serialize()).toString('base64'), project });
  } catch (error) {
    console.error('Project creation failed:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.post('/api/create-profile', async (req, res) => {
  try {
    const { authority, playerData } = req.body;
    if (!authority || !playerData || !projectAddress) {
      return res.status(400).json({ error: 'Missing required fields or project not created' });
    }

    const response = await client.createCreateProfileTransaction({
      project: projectAddress,
      authority,
      payer: authority,
      profileData: {
        name: playerData.name,
        customData: [
          { key: 'Age', value: playerData.age.toString() },
          { key: 'Gender', value: playerData.gender },
          { key: 'Companion', value: playerData.companion },
          { key: 'Cyborg', value: playerData.cyborg },
          { key: 'XP', value: playerData.xp.toString() },
          { key: 'Balance', value: playerData.balance.toString() },
        ],
      },
    });

    const { profile, tx } = response.createCreateProfileTransaction;

    // NEW: Add to global players array for sync and leaderboard
    players.push({
      id: profile.toString(),
      address: authority,
      name: playerData.name,
      age: playerData.age,
      gender: playerData.gender || 'Unknown',
      companion: playerData.companion,
      cyborg: playerData.cyborg,
      xp: playerData.xp || 0,
      balance: playerData.balance || 0,
      lastActive: new Date().toISOString()
    });

    res.json({ transaction: Buffer.from(tx.serialize()).toString('base64'), profile: profile.toString() });
  } catch (error) {
    console.error('Profile creation failed:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

app.post('/api/send-transaction', async (req, res) => {
  try {
    const { transaction } = req.body;
    const tx = Transaction.from(Buffer.from(transaction, 'base64'));
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature);
    res.json({ success: true, signature });
  } catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).json({ error: 'Failed to send transaction' });
  }
});

// Add this to your existing /api/profiles endpoint
app.get('/api/profiles', async (req, res) => {
  try {
    if (!projectAddress) {
      return res.status(400).json({ error: 'Project not created' });
    }
    
    // Return both profiles and leaderboard data
    res.json({
      profiles: players.map(player => ({
        name: player.name,
        xp: player.xp,
        address: player.address,
        age: player.age,
        gender: player.gender,
        companion: player.companion,
        cyborg: player.cyborg,
        balance: player.balance,
        lastActive: player.lastActive
      })),
      leaderboard: players
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 100)
    });
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});


app.post('/api/update-profile', async (req, res) => {
  try {
    const { authority, profile, updates } = req.body;
    if (!authority || !profile || !updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Missing authority, profile, or updates array' });
    }

    const response = await client.createUpdatePlatformDataTransaction({
      profile,
      authority,
      payer: authority,
      customData: updates,
    });

    const tx = response.createUpdatePlatformDataTransaction;

    // NEW: Update in-memory player
    const player = players.find(p => p.id === profile);
    if (player) {
      updates.forEach(u => {
        switch (u.key) {
          case 'XP': player.xp = parseInt(u.value, 10); break;
          case 'Balance': player.balance = parseFloat(u.value); break;
          case 'Age': player.age = u.value; break;
          case 'Gender': player.gender = u.value; break;
          case 'Companion': player.companion = u.value; break;
          case 'Cyborg': player.cyborg = u.value; break;
        }
      });
      player.lastActive = new Date().toISOString();
    }

    res.json({ transaction: Buffer.from(tx.serialize()).toString('base64') });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/events', (req, res) => {
  const { type, data, game, playerId, walletAddress } = req.body;
  if (!type || !game || !playerId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const event = {
    timestamp: new Date().toISOString(),
    type,
    data,
    game,
    playerId,
    walletAddress
  };
  events.push(event);
  console.log('Event logged:', event);

  // NEW: Global player logging/sync
  if (type === 'player_login' && walletAddress) {
    const player = players.find(p => p.address === walletAddress);
    if (player) player.lastActive = event.timestamp;
  }

  res.json({ success: true });
});

// NEW: Admin endpoints
// Get players for admin table
app.get('/api/players', (req, res) => {
  res.json({
    players: players.map(player => ({
      status: 'Active',
      name: player.name,
      age: player.age,
      xp: player.xp,
      companion: player.companion,
      cyborg: player.cyborg,
      wallet: player.address,
      lastActive: player.lastActive,
      actions: ''
    }))
  });
});

// Get stats for admin dashboard
app.get('/api/stats', (req, res) => {
  const totalPlayers = players.length;
  const totalXP = players.reduce((sum, p) => sum + p.xp, 0);
  const missionsCompleted = events.filter(e => e.type === 'mission_completed').length;
  const onlinePlayers = players.filter(p => Date.parse(p.lastActive) > Date.now() - 5 * 60 * 1000).length;
  res.json({ totalPlayers, totalXP, missionsCompleted, onlinePlayers });
});

// Add player (fake/off-chain for admin)
app.post('/api/add-player', (req, res) => {
  const { name, age, companion, cyborg } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const xp = 0;
  const balance = 0;
  const gender = 'Unknown';
  const authority = `FakeWallet_${Math.random().toString(36).substring(7)}`;
  const profile = `FakeProfile_${Math.random().toString(36).substring(7)}`;

  players.push({
    id: profile,
    address: authority,
    name,
    age,
    gender,
    companion,
    cyborg,
    xp,
    balance,
    lastActive: new Date().toISOString()
  });

  res.json({ success: true });
});

// Get missions
app.get('/api/missions', (req, res) => res.json({ missions }));

// Create mission
app.post('/api/create-mission', (req, res) => {
  const { title, description, xpReward, usdReward, type } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });

  missions.push({ title, description, xpReward, usdReward, type, status: 'Active' });

  res.json({ success: true });
});

// Push Notification Subscription Endpoint
app.post('/api/push-subscribe', express.json(), async (req, res) => {
  try {
    const { subscription, userId, gamePreferences } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Subscription and userId are required' });
    }
    
    // Store subscription
    pushSubscriptions.set(userId, {
      subscription,
      gamePreferences,
      timestamp: Date.now()
    });
    
    console.log(`✅ Push subscription stored for user: ${userId}`);
    res.status(200).json({ success: true, message: 'Subscription stored' });
    
  } catch (error) {
    console.error('❌ Push subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Game Data Sync Endpoint
app.post('/api/sync-game-data', express.json(), async (req, res) => {
  try {
    const gameData = req.body;
    
    if (!gameData || typeof gameData !== 'object') {
      return res.status(400).json({ error: 'Invalid game data' });
    }
    
    const userId = gameData.userId || 'anonymous';
    
    // Store or update game data
    const existingData = gameDataStore.get(userId) || {};
    const mergedData = {
      ...existingData,
      ...gameData,
      lastSync: Date.now()
    };
    
    gameDataStore.set(userId, mergedData);
    
    console.log(`✅ Game data synced for user: ${userId}`);
    res.status(200).json({ 
      success: true, 
      message: 'Game data synced',
      timestamp: Date.now() 
    });
    
  } catch (error) {
    console.error('❌ Game data sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Game Data Endpoint (optional - for retrieving saved data)
app.get('/api/game-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const gameData = gameDataStore.get(userId);
    
    if (!gameData) {
      return res.status(404).json({ error: 'No game data found' });
    }
    
    res.status(200).json({ success: true, data: gameData });
    
  } catch (error) {
    console.error('❌ Get game data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send Push Notification Endpoint (mobile-optimized)
// app.post('/api/send-notification', express.json(), async (req, res) => {
//   try {
//     const { userId, title, body, icon, badge, image } = req.body;
    
//     if (!userId || !title) {
//       return res.status(400).json({ error: 'userId and title are required' });
//     }
    
//     const subscription = pushSubscriptions.get(userId);
    
//     if (!subscription) {
//       return res.status(404).json({ error: 'No subscription found for user' });
//     }
    
//     // Mobile-optimized notification payload
//     const payload = {
//       title: title,
//       body: body || 'Marsoverse Notification',
//       icon: icon || '/images/icon-192.png',
//       badge: badge || '/images/icon-192.png',
//       image: image || '/images/mars-bg.jpg',
//       vibrate: [200, 100, 200],
//       timestamp: Date.now(),
//       data: {
//         url: '/index.html',
//         gameId: 'marsoverse-main'
//       },
//       actions: [
//         { action: 'play', title: 'Play Now' },
//         { action: 'explore', title: 'Explore Mars' }
//       ]
//     };
    
//     // Send push notification
//     await sendPushNotification(subscription.subscription, payload);
    
//     res.status(200).json({ success: true, message: 'Notification sent' });
    
//   } catch (error) {
//     console.error('❌ Send notification error:', error);
    
//     // Remove invalid subscriptions (GONE status)
//     if (error.statusCode === 410) {
//       pushSubscriptions.delete(userId);
//       console.log('🧹 Removed expired subscription for user:', userId);
//     }
    
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// Enhanced mobile push notification endpoint
app.post('/api/send-notification', express.json(), async (req, res) => {
  try {
    const { userId, title, body, icon, badge, image, data } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required' });
    }
    
    const subscription = pushSubscriptions.get(userId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found for user' });
    }

    // Get user's platform for optimization
    const userAgent = subscription.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);

    // Platform-optimized payload
    const payload = {
      title: title,
      body: body || 'Marsoverse Notification',
      icon: icon || '/images/icon-192.png',
      badge: badge || '/images/icon-192.png',
      timestamp: Date.now(),
      data: {
        url: data?.url || '/index.html',
        gameId: data?.gameId || 'marsoverse-main',
        deepLink: data?.deepLink || '/game'
      }
    };

    // Platform-specific enhancements
    if (isAndroid && !isIOS) {
      // Android-specific features
      payload.image = image || '/images/mars-bg.jpg';
      payload.vibrate = [200, 100, 200];
      payload.actions = [
        { action: 'play', title: '🎮 Play Now' },
        { action: 'explore', title: '🔴 Explore Mars' }
      ];
    } else if (isIOS) {
      // iOS-specific adjustments
      payload.sound = 'default';
      // iOS doesn't support image/vibrate in same way
    }

    // Add category for iOS grouping
    payload.category = 'GAME_UPDATES';

    // Send push notification
    await sendPushNotification(subscription.subscription, payload);
    
    res.status(200).json({ 
      success: true, 
      message: 'Notification sent',
      platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
    });
    
  } catch (error) {
    console.error('❌ Send notification error:', error);
    
    if (error.statusCode === 410) {
      pushSubscriptions.delete(userId);
      console.log('🧹 Removed expired subscription for user:', userId);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Push Notification Sending Function (updated)
async function sendPushNotification(subscription, payload) {
  try {
    const webpush = require('web-push');
    
    // Use your hardcoded VAPID details
    const vapidDetails = {
      publicKey: 'BPeEnwKdvgPtRmdbldFTNPOE2QTH-r9jLRHjb2CprP3MnI6bIbg7BNT1mgIOQV0gnkyXlQX-ag7uYfH0k8s3ZaI',
      privateKey: '5hx5caXgSIvH_J5s6Q4l7oLlyGAWlMKCLktcM8aeXgc',
      subject: 'mailto:shazzyazuwike@gmail.com' // Fixed the format
    };
    
    webpush.setVapidDetails(
      vapidDetails.subject,
      vapidDetails.publicKey,
      vapidDetails.privateKey
    );
    
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    
    console.log('✅ Push notification sent');
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
}

// Add a cleanup function for old data (optional)
function cleanupOldData() {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  // Clean up old subscriptions
  for (const [userId, data] of pushSubscriptions.entries()) {
    if (data.timestamp < thirtyDaysAgo) {
      pushSubscriptions.delete(userId);
      console.log(`🧹 Removed old subscription for user: ${userId}`);
    }
  }
  
  // Clean up old game data
  for (const [userId, data] of gameDataStore.entries()) {
    if (data.lastSync < thirtyDaysAgo) {
      gameDataStore.delete(userId);
      console.log(`🧹 Removed old game data for user: ${userId}`);
    }
  }
}

// Run cleanup every 24 hours
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MarsoVerse Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
  console.log(`🏠 Main page: http://localhost:${PORT}/`);
  console.log(`🎮 Game page: http://localhost:${PORT}/marzo.html`);
  console.log(`🔧 Admin page: http://localhost:${PORT}/admin.html`);
});

// const express = require('express');
// const cors = require('cors');
// const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
// const { createEdgeClient, sendClientTransactions } = require('@honeycomb-protocol/edge-client');

// const app = express();
// app.use(cors({ origin: ['https://marsoverse.netlify.app', 'http://localhost:3000'] }));
// app.use(express.json());

// const connection = new Connection('https://rpc.main.honeycombprotocol.com', 'confirmed');
// const client = createEdgeClient('https://edge.main.honeycombprotocol.com/', true);

// let projectAddress = null;

// app.post('/api/create-project', async (req, res) => {
//   try {
//     const { authority } = req.body;
//     if (!authority) {
//       return res.status(400).json({ error: 'Authority public key required' });
//     }

//     const response = await client.createCreateProjectTransaction({
//       name: 'MarsoVerse',
//       authority,
//       payer: authority,
//       profileDataConfig: {
//         achievements: ['First Steps', 'Mission Master'],
//         customDataFields: ['Level', 'Friends', 'Age', 'Gender', 'Companion', 'Cyborg', 'XP', 'Balance'],
//       },
//     });

//     const { project, tx } = response.createCreateProjectTransaction;
//     projectAddress = project;
//     res.json({ transaction: Buffer.from(tx.serialize()).toString('base64'), project });
//   } catch (error) {
//     console.error('Project creation failed:', error);
//     res.status(500).json({ error: 'Failed to create project' });
//   }
// });

// app.post('/api/create-profile', async (req, res) => {
//   try {
//     const { authority, playerData } = req.body;
//     if (!authority || !playerData || !projectAddress) {
//       return res.status(400).json({ error: 'Missing required fields or project not created' });
//     }

//     const response = await client.createCreateProfileTransaction({
//       project: projectAddress,
//       authority,
//       payer: authority,
//       profileData: {
//         name: playerData.name,
//         customData: [
//           { key: 'Age', value: playerData.age.toString() },
//           { key: 'Gender', value: playerData.gender },
//           { key: 'Companion', value: playerData.companion },
//           { key: 'Cyborg', value: playerData.cyborg },
//           { key: 'XP', value: playerData.xp.toString() },
//           { key: 'Balance', value: playerData.balance.toString() },
//         ],
//       },
//     });

//     const { profile, tx } = response.createCreateProfileTransaction;
//     res.json({ transaction: Buffer.from(tx.serialize()).toString('base64'), profile });
//   } catch (error) {
//     console.error('Profile creation failed:', error);
//     res.status(500).json({ error: 'Failed to create profile' });
//   }
// });

// app.post('/api/send-transaction', async (req, res) => {
//   try {
//     const { transaction } = req.body;
//     const tx = Transaction.from(Buffer.from(transaction, 'base64'));
//     const signature = await connection.sendRawTransaction(tx.serialize());
//     await connection.confirmTransaction(signature);
//     res.json({ success: true, signature });
//   } catch (error) {
//     console.error('Transaction failed:', error);
//     res.status(500).json({ error: 'Failed to send transaction' });
//   }
// });

// app.get('/api/profiles', async (req, res) => {
//   try {
//     if (!projectAddress) {
//       return res.status(400).json({ error: 'Project not created' });
//     }
//     // Placeholder: Fetch real profiles from Honeycomb in production
//     res.json({
//       profiles: JSON.parse(localStorage.getItem('marsoverse_players') || '[]').map(player => ({
//         name: player.name,
//         xp: player.xp,
//         address: player.id,
//         age: player.age,
//         gender: player.gender,
//         companion: player.companion,
//         cyborg: player.cyborg,
//         balance: player.wallet
//       }))
//     });
//   } catch (error) {
//     console.error('Failed to fetch profiles:', error);
//     res.status(500).json({ error: 'Failed to fetch profiles' });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });