import { createEdgeClient } from "@honeycomb-protocol/edge-client";

export class HoneycombProfile {
  constructor(wallet) {
    this.wallet = wallet; // full wallet adapter
    this.client = createEdgeClient("https://edge.main.honeycombprotocol.com/", true);
  }

  async getOrCreateUser() {
    const { user } = await this.client.findUsers({
      wallets: [this.wallet.publicKey.toString()]
    });

    if (user.length) return user[0];

    const { tx } = await this.client.createNewUserTransaction({
      wallet: this.wallet.publicKey.toString(),
      info: {
        name: localStorage.getItem("playerName") || "Marsoverse Player",
        pfp: localStorage.getItem("playerAvatar") || "default-avatar-url"
      }
    });

    const signedTx = await this.wallet.signTransaction(tx);
    await this.client.sendTransaction(signedTx);

    return this.client.findUsers({ wallets: [this.wallet.publicKey.toString()] });
  }

  async getOrCreateProfile(projectId) {
    const user = await this.getOrCreateUser();
    const { profile } = await this.client.findProfiles({
      userIds: [user.id],
      projects: [projectId]
    });

    if (profile.length) return profile[0];

    const { tx } = await this.client.createNewProfileTransaction({
      project: projectId,
      wallet: this.wallet.publicKey.toString(), // ✅ FIXED
      identity: "main",
      info: {
        name: localStorage.getItem("playerName") || "Player",
        bio: "Marsoverse Adventurer"
      }
    });

    const signedTx = await this.wallet.signTransaction(tx);
    await this.client.sendTransaction(signedTx);

    return this.client.findProfiles({ userIds: [user.id], projects: [projectId] });
  }

  async updateProfile(projectId, updates) {
    const profile = await this.getOrCreateProfile(projectId);

    const { tx } = await this.client.createUpdateProfileTransaction({
      profile: profile.address.toString(),
      info: updates.info || {},
      customData: updates.customData || {}
    });

    const signedTx = await this.wallet.signTransaction(tx);
    return this.client.sendTransaction(signedTx);
  }
}
