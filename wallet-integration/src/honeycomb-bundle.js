// src/honeycomb-bundle.js
// This creates a bundle that can be used in vanilla HTML

import createEdgeClient from '@honeycomb-protocol/edge-client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';

// Export to window for vanilla JS usage
window.createEdgeClient = createEdgeClient;
window.sendClientTransactions = sendClientTransactions;

// Export the functions
export { createEdgeClient, sendClientTransactions };