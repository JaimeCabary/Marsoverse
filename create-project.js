import createEdgeClient from "@honeycomb-protocol/edge-client";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers.js";

// Load wallet from Solana CLI keypair file
const secretKey = JSON.parse(
  fs.readFileSync(`${process.env.HOME || process.env.USERPROFILE}\\.config\\solana\\id.json`, "utf8")
);
const authority = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Create client for Honeycomb test network
const client = createEdgeClient("https://edge.test.honeycombprotocol.com", true);

async function main() {
  console.log("🚀 Creating Honeycomb Project...");

  const {
    createCreateProjectTransaction: { tx: txResponse }
  } = await client.createCreateProjectTransaction({
    name: "Marsoverse Test Project",
    authority: authority.publicKey.toBase58(),
    profileDataConfig: {
      achievements: ["Pioneer"],
      customDataFields: ["NFTs owned"]
    }
  });

  console.log("📤 Sending transaction...");
  const res = await sendClientTransactions(client, authority, txResponse);

  console.log("✅ Project created successfully!");
  console.log("Transaction result:", res);
}

main().catch((err) => {
  console.error("❌ Error creating project:", err);
});
