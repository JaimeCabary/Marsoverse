// // HoneycombWallet.jsx - Single component to replace your existing wallet JS
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   ConnectionProvider,
//   WalletProvider,
//   useWallet,
//   useConnection
// } from '@solana/wallet-adapter-react';
// import {
//   PhantomWalletAdapter,
//   SolflareWalletAdapter,
//   BackpackWalletAdapter
// } from '@solana/wallet-adapter-wallets';
// import {
//   WalletModalProvider,
//   WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import createEdgeClient from '@honeycomb-protocol/edge-client';
// import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';

// // Honeycomb setup
// const honeycombClient = createEdgeClient("https://edge.main.honeycombprotocol.com/", true);

// // Main Honeycomb Manager Component
// const HoneycombManager = () => {
//   const { publicKey, signTransaction } = useWallet();
//   const [player, setPlayer] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // Initialize player in Honeycomb
//   const initializePlayer = useCallback(async () => {
//     if (!publicKey) return;
    
//     setIsLoading(true);
//     try {
//       // Check if player exists
//       const playerData = await honeycombClient.findUsers({
//         wallets: [publicKey.toBase58()]
//       });

//       if (playerData.users.length === 0) {
//         // Create new player
//         const { createCreateUserTransaction: { tx: txResponse } } = 
//           await honeycombClient.createCreateUserTransaction({
//             wallet: publicKey.toBase58(),
//             name: localStorage.getItem('playerName') || 'Martian Explorer',
//             bio: 'MarsoVerse Explorer'
//           });

//         await sendClientTransactions(
//           honeycombClient,
//           { publicKey, signTransaction },
//           txResponse
//         );
//       }

//       // Get player data
//       const updatedPlayer = await honeycombClient.findUsers({
//         wallets: [publicKey.toBase58()]
//       });

//       if (updatedPlayer.users.length > 0) {
//         const honeycombUser = updatedPlayer.users[0];
//         setPlayer({
//           id: honeycombUser.id,
//           name: honeycombUser.name,
//           wallet: publicKey.toBase58()
//         });
//       }

//     } catch (error) {
//       console.error('Failed to initialize player:', error);
//     }
//     setIsLoading(false);
//   }, [publicKey, signTransaction]);

//   // Create Mission
//   const createMission = useCallback(async (title, xpReward) => {
//     if (!publicKey || !player) return;

//     try {
//       const { createCreateMissionTransaction: { tx: txResponse } } = 
//         await honeycombClient.createCreateMissionTransaction({
//           name: title,
//           minXp: 0,
//           cost: { amount: 0, mint: 'native' },
//           requirement: { kind: 'simple', params: {} },
//           rewards: [{
//             kind: 'xp',
//             max: xpReward,
//             min: xpReward
//           }],
//           authority: publicKey.toBase58()
//         });

//       await sendClientTransactions(
//         honeycombClient,
//         { publicKey, signTransaction },
//         txResponse
//       );

//       console.log('Mission created:', title);
//     } catch (error) {
//       console.error('Failed to create mission:', error);
//     }
//   }, [publicKey, signTransaction, player]);

//   // Complete Mission
//   const completeMission = useCallback(async (missionId, xpReward, usdReward = 0) => {
//     if (!publicKey || !player) return;

//     try {
//       // Complete in Honeycomb
//       const { createParticipateTransaction: { tx: txResponse } } = 
//         await honeycombClient.createParticipateTransaction({
//           missionId,
//           userWallet: publicKey.toBase58()
//         });

//       await sendClientTransactions(
//         honeycombClient,
//         { publicKey, signTransaction },
//         txResponse
//       );

//       // Update local game data
//       const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
//       const currentUSD = parseFloat(localStorage.getItem('walletBalance') || '0');
      
//       localStorage.setItem('playerXP', (currentXP + xpReward).toString());
//       localStorage.setItem('walletBalance', (currentUSD + usdReward).toString());

//       // Update UI elements
//       document.getElementById('playerXP').textContent = `XP: ${currentXP + xpReward}`;
//       document.getElementById('youXP').textContent = (currentXP + xpReward).toString();
//       document.getElementById('walleta').textContent = (currentUSD + usdReward).toFixed(2);

//       console.log('Mission completed:', missionId);
//     } catch (error) {
//       console.error('Failed to complete mission:', error);
//     }
//   }, [publicKey, signTransaction, player]);

//   // Initialize on wallet connect
//   useEffect(() => {
//     if (publicKey) {
//       initializePlayer();
//       document.getElementById('phasetwo')?.classList.add('hidden');
//     document.getElementById('genderSection')?.classList.remove('hidden');

//     }
//   }, [publicKey, initializePlayer]);

//   // Expose methods to window for your existing game code
//   useEffect(() => {
//     window.honeycombManager = {
//       createMission,
//       completeMission,
//       player,
//       isLoading,
//       isConnected: !!publicKey
//     };
//   }, [createMission, completeMission, player, isLoading, publicKey]);

//   return (
//     <div style={{ position: 'relative' }}>
//       {isLoading && (
//         <div style={{ 
//           position: 'fixed', 
//           top: '10px', 
//           right: '10px', 
//           background: 'rgba(0,255,255,0.1)', 
//           padding: '10px', 
//           borderRadius: '5px',
//           color: '#00ffff',
//           fontSize: '12px'
//         }}>
//           Connecting to Honeycomb...
//         </div>
//       )}
      
//       {player && (
//         <div style={{ 
//           position: 'fixed', 
//           top: '10px', 
//           left: '10px', 
//           background: 'rgba(0,255,255,0.1)', 
//           padding: '10px', 
//           borderRadius: '5px',
//           color: '#00ffff',
//           fontSize: '12px'
//         }}>
//           Honeycomb: {player.name}
//         </div>
//       )}
//     </div>
//   );
// };

// // Wallet Modal Component
// const WalletModal = ({ isVisible, onClose }) => {
//   if (!isVisible) return null;

//   return (
//     <div 
//       style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         background: 'rgba(0,0,0,0.8)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 1000
//       }}
//       onClick={onClose}
//     >
//       <div 
//         style={{
//           background: 'rgba(20,20,20,0.95)',
//           border: '2px solid #00ffff',
//           borderRadius: '12px',
//           padding: '2rem',
//           maxWidth: '400px',
//           width: '90%'
//         }}
//         onClick={e => e.stopPropagation()}
//       >
//         <button 
//           onClick={onClose}
//           style={{
//             position: 'absolute',
//             top: '10px',
//             right: '10px',
//             background: 'none',
//             border: 'none',
//             color: '#00ffff',
//             fontSize: '20px',
//             cursor: 'pointer'
//           }}
//         >
//           ×
//         </button>
        
//         <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '1rem' }}>
//           Connect Wallet
//         </h2>
        
//         <WalletMultiButton style={{ width: '100%' }} />
//       </div>
//     </div>
//   );
// };

// // Main App Component
// const MarsoVerseWallet = () => {
//   const [walletModalVisible, setWalletModalVisible] = useState(false);
//   const { connected, disconnect } = useWallet();

//   // Handle existing wallet button clicks
//   useEffect(() => {
//     const connectBtn = document.getElementById('connectWalletBtn');
//     const walletIcon = document.getElementById('walletIcon');
    
//     const handleWalletClick = () => {
//       if (connected) {
//         if (confirm('Disconnect wallet?')) {
//           disconnect();
//         }
//       } else {
//         setWalletModalVisible(true);
//       }
//     };

//     if (connectBtn) {
//       connectBtn.addEventListener('click', handleWalletClick);
//       connectBtn.textContent = connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet';
//     }
    
//     if (walletIcon) {
//       walletIcon.addEventListener('click', () => setWalletModalVisible(true));
//     }

//     return () => {
//       if (connectBtn) connectBtn.removeEventListener('click', handleWalletClick);
//     };
//   }, [connected, disconnect]);

//   return (
//     <>
//       <HoneycombManager />
//       <WalletModal 
//         isVisible={walletModalVisible} 
//         onClose={() => setWalletModalVisible(false)} 
//       />
//     </>
//   );
// };

// // Root Component with Providers
// const App = () => {
//   const wallets = [
//     new PhantomWalletAdapter(),
//     new SolflareWalletAdapter(),
//     new BackpackWalletAdapter()
//   ];

//   return (
//     <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">
//       <WalletProvider wallets={wallets} autoConnect>
//         <WalletModalProvider>
//           <MarsoVerseWallet />
//         </WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// };

// export default App;
import React, { useState, useEffect, useCallback } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import createEdgeClient from '@honeycomb-protocol/edge-client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';

// Honeycomb setup
const honeycombClient = createEdgeClient("https://edge.main.honeycombprotocol.com/", true);

// Main Honeycomb Manager Component
const HoneycombManager = () => {
  const { publicKey, signTransaction } = useWallet();
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize player in Honeycomb
  const initializePlayer = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      // Check if player exists
      const playerData = await honeycombClient.findUsers({
        wallets: [publicKey.toBase58()]
      });

      if (playerData.users.length === 0) {
        // Create new player
        const { createCreateUserTransaction: { tx: txResponse } } = 
          await honeycombClient.createCreateUserTransaction({
            wallet: publicKey.toBase58(),
            name: localStorage.getItem('playerName') || 'Martian Explorer',
            bio: 'MarsoVerse Explorer'
          });

        await sendClientTransactions(
          honeycombClient,
          { publicKey, signTransaction },
          txResponse
        );
      }

      // Get player data
      const updatedPlayer = await honeycombClient.findUsers({
        wallets: [publicKey.toBase58()]
      });

      if (updatedPlayer.users.length > 0) {
        const honeycombUser = updatedPlayer.users[0];
        setPlayer({
          id: honeycombUser.id,
          name: honeycombUser.name,
          wallet: publicKey.toBase58()
        });
      }

      // Update wallet status display
      const walletInfo = document.getElementById('walletInfo');
      if (walletInfo) {
        walletInfo.style.display = 'block';
        document.getElementById('connectedWalletName').textContent = honeycombUser.name || 'Connected';
        document.getElementById('connectedWalletAddress').textContent = publicKey.toBase58().slice(0, 8) + '...';
      }

    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
    setIsLoading(false);
  }, [publicKey, signTransaction]);

  // Create Mission
  const createMission = useCallback(async (title, xpReward) => {
    if (!publicKey || !player) return;

    try {
      const { createCreateMissionTransaction: { tx: txResponse } } = 
        await honeycombClient.createCreateMissionTransaction({
          name: title,
          minXp: 0,
          cost: { amount: 0, mint: 'native' },
          requirement: { kind: 'simple', params: {} },
          rewards: [{
            kind: 'xp',
            max: xpReward,
            min: xpReward
          }],
          authority: publicKey.toBase58()
        });

      await sendClientTransactions(
        honeycombClient,
        { publicKey, signTransaction },
        txResponse
      );

      console.log('Mission created:', title);
    } catch (error) {
      console.error('Failed to create mission:', error);
    }
  }, [publicKey, signTransaction, player]);

  // Complete Mission
  const completeMission = useCallback(async (missionId, xpReward, usdReward = 0) => {
    if (!publicKey || !player) return;

    try {
      // Complete in Honeycomb
      const { createParticipateTransaction: { tx: txResponse } } = 
        await honeycombClient.createParticipateTransaction({
          missionId,
          userWallet: publicKey.toBase58()
        });

      await sendClientTransactions(
        honeycombClient,
        { publicKey, signTransaction },
        txResponse
      );

      // Update local game data
      const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
      const currentUSD = parseFloat(localStorage.getItem('walletBalance') || '0');
      
      localStorage.setItem('playerXP', (currentXP + xpReward).toString());
      localStorage.setItem('walletBalance', (currentUSD + usdReward).toString());

      // Update UI elements
      document.getElementById('playerXP').textContent = `XP: ${currentXP + xpReward}`;
      document.getElementById('youXP').textContent = (currentXP + xpReward).toString();
      document.getElementById('walleta').textContent = (currentUSD + usdReward).toFixed(2);
      document.getElementById('walletAmount').textContent = (currentUSD + usdReward).toFixed(2);
      document.getElementById('rewardUsd').textContent = (currentUSD + usdReward).toFixed(2);

      console.log('Mission completed:', missionId);
    } catch (error) {
      console.error('Failed to complete mission:', error);
    }
  }, [publicKey, signTransaction, player]);

  // Send Event (for NFTs and staking)
  const sendEvent = useCallback(async (eventType, data) => {
    if (!publicKey || !player) return;

    try {
      await honeycombClient.sendEvent({
        type: eventType,
        userWallet: publicKey.toBase58(),
        data
      });
      console.log(`Event sent: ${eventType}`, data);
    } catch (error) {
      console.error(`Failed to send event ${eventType}:`, error);
    }
  }, [publicKey, player]);

  // Initialize on wallet connect
  useEffect(() => {
    if (publicKey) {
      initializePlayer();
      document.getElementById('phasetwo')?.classList.add('hidden');
      document.getElementById('genderSection')?.classList.remove('hidden');
    } else {
      // Reset wallet status display when disconnected
      const walletInfo = document.getElementById('walletInfo');
      if (walletInfo) {
        walletInfo.style.display = 'none';
        document.getElementById('connectedWalletName').textContent = 'None';
        document.getElementById('connectedWalletAddress').textContent = 'None';
        document.getElementById('solBalance').textContent = '0';
        document.getElementById('rewardUsd').textContent = '0.00';
        document.getElementById('rewardSol').textContent = '0';
      }
    }
  }, [publicKey, initializePlayer]);

  // Expose methods to window for MissionsManager
  useEffect(() => {
    window.honeycombManager = {
      createMission,
      completeMission,
      sendEvent,
      player,
      isLoading,
      isConnected: !!publicKey,
      connectedWallet: publicKey ? { publicKey: publicKey.toBase58() } : null
    };
  }, [createMission, completeMission, sendEvent, player, isLoading, publicKey]);

  return (
    <div style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: 'rgba(0,255,255,0.1)', 
          padding: '10px', 
          borderRadius: '5px',
          color: '#00ffff',
          fontSize: '12px'
        }}>
          Connecting to Honeycomb...
        </div>
      )}
      
      {player && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          left: '10px', 
          background: 'rgba(0,255,255,0.1)', 
          padding: '10px', 
          borderRadius: '5px',
          color: '#00ffff',
          fontSize: '12px'
        }}>
          Honeycomb: {player.name}
        </div>
      )}
    </div>
  );
};

// Wallet Modal Component
const WalletModal = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '2px solid #00ffff',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            color: '#00ffff',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        
        <h2 style={{ color: '#00ffff', textAlign: 'center', marginBottom: '1rem' }}>
          Connect Wallet
        </h2>
        
        <WalletMultiButton style={{ width: '100%' }} />
      </div>
    </div>
  );
};

// Main App Component
const MarsoVerseWallet = () => {
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const { connected, disconnect } = useWallet();

  useEffect(() => {
    const handleWalletClick = (e) => {
      e.preventDefault();
      if (connected) {
        if (confirm('Disconnect wallet?')) {
          disconnect();
          // Hide existing wallet modal
          document.querySelectorAll('#walletModal').forEach(modal => {
            modal.classList.add('hidden');
          });
        }
      } else {
        setWalletModalVisible(true);
        // Hide existing wallet modal
        document.querySelectorAll('#walletModal').forEach(modal => {
          modal.classList.add('hidden');
        });
      }
    };

    const updateButtonText = () => {
      document.querySelectorAll('#connectWalletBtn').forEach(btn => {
        btn.textContent = connected ? 'Disconnect Wallet' : 'Connect Wallet';
      });
    };

    // Initial setup
    const walletElements = document.querySelectorAll(
      '#connectWalletBtn, #walletIcon, .wallet-icon, [data-wallet-connect]'
    );
    walletElements.forEach(element => {
      element.addEventListener('click', handleWalletClick);
      element.dataset.listenerAdded = 'true';
    });
    updateButtonText();

    // Observe DOM changes for new wallet elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newWalletElements = document.querySelectorAll(
            '#connectWalletBtn, #walletIcon, .wallet-icon, [data-wallet-connect]'
          );
          newWalletElements.forEach(element => {
            if (!element.dataset.listenerAdded) {
              element.addEventListener('click', handleWalletClick);
              element.dataset.listenerAdded = 'true';
            }
          });
          updateButtonText();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle existing wallet modal close button
    document.querySelectorAll('#closeModal').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        document.querySelectorAll('#walletModal').forEach(modal => {
          modal.classList.add('hidden');
        });
        setWalletModalVisible(false);
      });
    });

    return () => {
      walletElements.forEach(element => {
        element.removeEventListener('click', handleWalletClick);
      });
      observer.disconnect();
    };
  }, [connected, disconnect]);

  return (
    <>
      <HoneycombManager />
      <WalletModal 
        isVisible={walletModalVisible} 
        onClose={() => setWalletModalVisible(false)} 
      />
    </>
  );
};

// Root Component with Providers
const App = () => {
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter()
  ];

  return (
    <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MarsoVerseWallet />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;