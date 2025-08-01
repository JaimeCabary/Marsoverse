const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { createEdgeClient, sendClientTransactions } = require('@honeycomb-protocol/edge-client');

const app = express();
app.use(cors()); // Allow requests from Netlify/localhost
app.use(express.json()); // Parse JSON bodies

// Honeycomb setup
const connection = new Connection('https://rpc.test.honeycombprotocol.com', 'confirmed');
const client = createEdgeClient('https://edge.test.honeycombprotocol.com/', true);

// Store project address (use a DB in production)
let projectAddress = null;

// Create project
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

// Create player profile
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

// Send signed transaction
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

// List player profiles (placeholder)
app.get('/api/profiles', async (req, res) => {
  try {
    if (!projectAddress) {
      return res.status(400).json({ error: 'Project not created' });
    }
    // Mock data for hackathon
    res.json({
      profiles: [
        { name: 'TestPlayer', xp: 5, address: '3KbAKcvoX91kBL59LUBxRq2chapuWhd1KfV86N5zxU5q' },
      ],
    });
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});