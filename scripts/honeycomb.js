// scripts/honeycomb.js

const HONEYCOMB_API_URL = "https://edge.main.honeycombprotocol.com/";
const honeycombClient = HoneycombProtocol.createEdgeClient(HONEYCOMB_API_URL, true);

// Helper function to send transactions
async function sendHoneycombTransaction(wallet, transactionResponse) {
  try {
    if (!wallet || !wallet.signTransaction) {
      throw new Error("Wallet not connected or doesn't support signing");
    }

    const response = await HoneycombProtocol.sendClientTransactions(
      honeycombClient,
      wallet,
      transactionResponse
    );

    return response;
  } catch (error) {
    console.error("Honeycomb transaction failed:", error);
    throw error;
  }
}

// Player data management
class HoneycombPlayerManager {
  constructor(walletManager) {
    this.walletManager = walletManager;
    this.playerCache = {};
  }

  async getPlayerData() {
    const wallet = this.walletManager.connectedWallet;
    if (!wallet) return null;

    try {
      const response = await honeycombClient.getPlayer({
        wallet: wallet.publicKey
      });

      if (response.player) {
        this.playerCache = response.player;
        return response.player;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch player data:", error);
      return null;
    }
  }

  async createPlayer(playerData) {
    const wallet = this.walletManager.connectedWallet;
    if (!wallet) throw new Error("Wallet not connected");

    try {
      const { tx: txResponse } = await honeycombClient.createCreatePlayerTransaction({
        wallet: wallet.publicKey,
        name: playerData.name,
        initialXp: playerData.xp || 0,
        initialBalance: playerData.balance || 0
      });

      const result = await sendHoneycombTransaction(wallet, txResponse);
      return result;
    } catch (error) {
      console.error("Failed to create player:", error);
      throw error;
    }
  }

  async updatePlayer(updates) {
    const wallet = this.walletManager.connectedWallet;
    if (!wallet) throw new Error("Wallet not connected");

    try {
      const { tx: txResponse } = await honeycombClient.createUpdatePlayerTransaction({
        wallet: wallet.publicKey,
        updates: updates
      });

      const result = await sendHoneycombTransaction(wallet, txResponse);
      return result;
    } catch (error) {
      console.error("Failed to update player:", error);
      throw error;
    }
  }

  async logEvent(eventType, eventData) {
    const wallet = this.walletManager.connectedWallet;
    if (!wallet) throw new Error("Wallet not connected");

    try {
      const { tx: txResponse } = await honeycombClient.createLogEventTransaction({
        wallet: wallet.publicKey,
        eventType: eventType,
        eventData: eventData
      });

      const result = await sendHoneycombTransaction(wallet, txResponse);
      return result;
    } catch (error) {
      console.error("Failed to log event:", error);
      throw error;
    }
  }
}

// 🔥 Project management
class HoneycombProjectManager {
  constructor(walletManager) {
    this.walletManager = walletManager;
  }

  async createProject({ name, achievements = [], customDataFields = [] }) {
    const wallet = this.walletManager.connectedWallet;
    if (!wallet) throw new Error("Wallet not connected");

    try {
      const {
        createCreateProjectTransaction: {
          project: projectAddress,
          tx: txResponse
        }
      } = await honeycombClient.createCreateProjectTransaction({
        name,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        profileDataConfig: {
          achievements,
          customDataFields
        }
      });

      const result = await sendHoneycombTransaction(wallet, txResponse);
      return { projectAddress, result };
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  }
}

// Initialize all Honeycomb managers when wallet is connected
function initializeHoneycomb(walletManager) {
  window.honeycombPlayerManager = new HoneycombPlayerManager(walletManager);
  window.honeycombProjectManager = new HoneycombProjectManager(walletManager);
}
