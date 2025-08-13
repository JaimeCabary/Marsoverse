import React from 'react';
import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  SlopeWalletAdapter,
  TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { HoneycombProfile } from "./honeycomb-profile";


// Default styles
import "@solana/wallet-adapter-react-ui/styles.css";

const client = createEdgeClient("https://edge.main.honeycombprotocol.com/", true);

export const HoneycombWalletIntegration = () => {
  const network = "https://rpc.main.honeycombprotocol.com";
  const endpoint = network

  const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    new GlowWalletAdapter(),
    new SlopeWalletAdapter(),
    new TorusWalletAdapter()
  ],
  []  // <-- empty deps, because network is constant and not used inside
);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletButtonWithLogic />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const WalletButtonWithLogic = () => {
  const wallet = useWallet();

  // Custom event to communicate with vanilla JS
  const dispatchWalletEvent = (type, detail) => {
    window.dispatchEvent(new CustomEvent(`wallet:${type}`, { detail }));
  };

//   useEffect(() => {
//     if (wallet.connected && wallet.publicKey) {
//       const walletData = {
//         publicKey: wallet.publicKey.toString(),
//         walletName: wallet.wallet?.adapter?.name || 'Unknown'
//       };
      
//       // Update localStorage
//       localStorage.setItem('walletAddress', walletData.publicKey);
//       localStorage.setItem('walletName', walletData.walletName);
      
//       // Dispatch connected event
//       dispatchWalletEvent('connected', walletData);
      
//       // Update UI elements directly
//       updateVanillaUI(walletData);
//     } else if (!wallet.connecting) {
//       // Wallet disconnected
//       localStorage.removeItem('walletAddress');
//       localStorage.removeItem('walletName');
//       dispatchWalletEvent('disconnected', null);
//       resetVanillaUI();
//     }
//   }, [wallet.connected, wallet.publicKey, wallet.connecting]);

useEffect(() => {
  if (wallet.connected && wallet.publicKey) {
    const walletData = {
      publicKey: wallet.publicKey.toString(),
      walletName: wallet.wallet?.adapter?.name || 'Unknown'
    };

    // Update localStorage for wallet info
    localStorage.setItem('walletAddress', walletData.publicKey);
    localStorage.setItem('walletName', walletData.walletName);

    // Dispatch connected event
    dispatchWalletEvent('connected', walletData);

    // Update UI elements directly
    updateVanillaUI(walletData);

    const initHoneycombAndProfile = async () => {
      try {
        // 1. Find or create Honeycomb project
        let project = await client.findProjects({ authorities: [walletData.publicKey] });

        if (project.length === 0) {
          const { tx } = await client.createCreateProjectTransaction({
            name: "Marsoverse Game",
            authority: wallet.publicKey,
            profileDataConfig: {
              achievements: ["Pioneer", "Explorer", "Veteran"],
              customDataFields: ["Companion", "Cyborg", "Avatar"]
            }
          });
          const signedTx = await wallet.signTransaction(tx);
          const txId = await client.sendTransaction(signedTx);
          console.log("Project created:", txId);

          // Refresh project list after creation
          project = await client.findProjects({ authorities: [walletData.publicKey] });

          dispatchWalletEvent('projectReady', { new: true, txId });
        } else {
          dispatchWalletEvent('projectReady', project[0]);
        }

        // 2. Initialize player profile using new HoneycombProfile (assumes import & setup)
        const honeycomb = new HoneycombProfile(wallet.publicKey.toString());


        // Assume you get project address from project[0]
        const projectAddress = project[0].address.toString();

        const profile = await honeycomb.getOrCreateProfile(projectAddress);

        // 3. Sync localStorage with profile data (XP, walletBalance)
        const playerXP = profile.xp || parseInt(localStorage.getItem("playerXP")) || 0;
        const walletBalance = profile.customData?.walletBalance || parseInt(localStorage.getItem("walletBalance")) || 0;

        localStorage.setItem("playerXP", playerXP);
        localStorage.setItem("walletBalance", walletBalance);

        // Dispatch gameReady event with profile info
        dispatchWalletEvent('gameReady', {
          xp: playerXP,
          balance: walletBalance,
          profileAddress: profile.address.toString()
        });

      } catch (error) {
        console.error("Honeycomb/game profile init error:", error);
      }
    };

    initHoneycombAndProfile();

  } else if (!wallet.connecting) {
    // Wallet disconnected cleanup
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletName');
    localStorage.removeItem('playerXP');
    localStorage.removeItem('walletBalance');
    dispatchWalletEvent('disconnected', null);
    resetVanillaUI();
  }
}, [wallet, wallet.connected, wallet.publicKey, wallet.connecting]);


  const updateVanillaUI = (walletData) => {
    // Update wallet preview
    const shortAddress = `${walletData.publicKey.slice(0, 4)}...${walletData.publicKey.slice(-4)}`;
    const walletPreview = document.getElementById('walletPreview');
    if (walletPreview) {
      walletPreview.textContent = `${walletData.walletName}: ${shortAddress}`;
      walletPreview.style.display = 'inline-block';
    }
    
    // Hide skip link
    const skipLink = document.getElementById('firstLink');
    if (skipLink) skipLink.style.display = 'none';
    
    // Update wallet icon in HUD
    const walletIcon = document.getElementById('walletIcon');
    if (walletIcon) {
      walletIcon.classList.add('connected');
      walletIcon.classList.remove('disconnected');
    }
    
    // Update wallet amount in HUD
    const walletAmount = document.getElementById('walletAmount');
    if (walletAmount) {
      walletAmount.textContent = 'Connected';
    }
  };

  const resetVanillaUI = () => {
    const walletPreview = document.getElementById('walletPreview');
    if (walletPreview) {
      walletPreview.style.display = 'none';
    }
    
    const skipLink = document.getElementById('firstLink');
    if (skipLink) skipLink.style.display = 'inline-block';
    
    const walletIcon = document.getElementById('walletIcon');
    if (walletIcon) {
      walletIcon.classList.remove('connected');
      walletIcon.classList.add('disconnected');
    }
    
    const walletAmount = document.getElementById('walletAmount');
    if (walletAmount) {
      walletAmount.textContent = '0 SOL';
    }
  };

  return (
    <div className="wallet-integration" style={{ display: 'none' }}>
      <WalletMultiButton />
    </div>
  );
};