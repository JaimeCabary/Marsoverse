const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { createEdgeClient, sendClientTransactions } = require('@honeycomb-protocol/edge-client');

const app = express();
app.use(cors({ origin: ['https://marsoverse.netlify.app', 'http://localhost:3000'] }));
app.use(express.json());

const connection = new Connection('https://rpc.main.honeycombprotocol.com', 'confirmed');
const client = createEdgeClient('https://edge.main.honeycombprotocol.com/', true);

let projectAddress = null;

// In-memory storage for backups (replace with database in production)
const backups = new Map();

// Backup endpoint
app.post('/api/backup', (req, res) => {
  const { playerId, data } = req.body;
  if (!playerId || !data) {
    return res.status(400).json({ error: 'Missing playerId or data' });
  }
  backups.set(playerId, data);
  res.json({ success: true });
});

// Restore endpoint
app.get('/api/backup/:playerId', (req, res) => {
  const { playerId } = req.params;
  const data = backups.get(playerId);
  if (!data) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  res.json(data);
});

// Delete backup endpoint
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
    res.json({ transaction: Buffer.from(tx.serialize()).toString('base64'), profile });
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

app.get('/api/profiles', async (req, res) => {
  try {
    if (!projectAddress) {
      return res.status(400).json({ error: 'Project not created' });
    }
    // Placeholder: Fetch real profiles from Honeycomb in production
    res.json({
      profiles: JSON.parse(localStorage.getItem('marsoverse_players') || '[]').map(player => ({
        name: player.name,
        xp: player.xp,
        address: player.id,
        age: player.age,
        gender: player.gender,
        companion: player.companion,
        cyborg: player.cyborg,
        balance: player.wallet
      }))
    });
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
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