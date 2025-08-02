// scripts/honeycomb-bundle.js
import * as solanaWeb3 from '@solana/web3.js';
import * as walletAdapterBase from '@solana/wallet-adapter-base';
import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
import * as bs58 from 'bs58';

window.solanaWeb3 = solanaWeb3;
window.SolanaWalletAdapterBase = walletAdapterBase;
window.SolanaWalletAdapterWallets = walletAdapterWallets;
window.bs58 = bs58;