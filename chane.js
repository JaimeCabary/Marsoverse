function createHistoryPanel() {
  if (document.getElementById('historyPanel')) return;
  
  const historyPanel = document.createElement('div');
  historyPanel.id = 'historyPanel';
  historyPanel.className = 'history-panel';
  historyPanel.innerHTML = `
    <div class="history-header">
      <h3><i class="fas fa-history"></i> Conversation History</h3>
      <button class="close-history-btn" onclick="toggleHistoryPanel(false)">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="history-content">
      <div class="history-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="system">System</button>
        <button class="filter-btn" data-filter="user">User</button>
        <button class="filter-btn" data-filter="zepta">ZEPTA</button>
      </div>
      <div class="history-search">
        <input type="text" id="historySearch" placeholder="Search messages..." />
      </div>
      <div class="history-sessions" id="historySessions"></div>
    </div>
  `;
  
  document.body.appendChild(historyPanel);
  
  // Add history toggle button to header
  const headerControls = document.querySelector('.header-controls');
  if (headerControls && !document.getElementById('historyToggleBtn')) {
    const historyBtn = document.createElement('button');
    historyBtn.id = 'historyToggleBtn';
    historyBtn.className = 'nav-btn';
    historyBtn.innerHTML = '<i class="fas fa-history"></i><span>History</span>';
    historyBtn.onclick = () => toggleHistoryPanel();
    headerControls.insertBefore(historyBtn, headerControls.lastElementChild);
  }
  
  setupHistoryFilters();
  loadHistoryIntoPanel();
}

function loadHistoryIntoPanel(filter = 'all', search = '') {
  const container = document.getElementById('historySessions');
  if (!container) return;
  
  // Get all sessions from localStorage
  const sessions = JSON.parse(localStorage.getItem('zepta_conversation_sessions') || '{}');
  const sessionIds = Object.keys(sessions).sort((a, b) => b - a); // Sort newest first
  
  container.innerHTML = '';
  
  if (sessionIds.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; text-align: center; color: #888;">No conversation history found.</div>';
    return;
  }
  
  sessionIds.forEach(sessionId => {
    // Get messages for this session
    const sessionMessages = gameState.chatHistory.filter(msg => msg.session == sessionId);
    
    // Apply filters
    const filteredMessages = sessionMessages.filter(entry => {
      const typeMatch = filter === 'all' || 
                       (filter === 'system' && entry.type === 'system') ||
                       (filter === 'user' && entry.isUser) ||
                       (filter === 'zepta' && !entry.isUser && entry.type !== 'system');
      
      const searchMatch = !search || entry.text.toLowerCase().includes(search.toLowerCase());
      
      return typeMatch && searchMatch;
    });
    
    if (filteredMessages.length === 0) return;
    
    const session = sessions[sessionId];
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'history-session';
    sessionDiv.dataset.sessionId = sessionId;
    
    const sessionHeader = document.createElement('div');
    sessionHeader.className = 'session-header';
    sessionHeader.innerHTML = `
      <strong>${session.title || 'Untitled Session'}</strong>
      <span>${filteredMessages.length} messages • ${new Date(parseInt(sessionId)).toLocaleDateString()}</span>
    `;
    sessionHeader.onclick = () => {
      sessionDiv.classList.toggle('expanded');
      if (sessionDiv.classList.contains('expanded')) {
        loadSessionMessages(sessionDiv, filteredMessages);
      }
    };
    
    const messagesDiv = document.createElement('div');
    messagesDiv.className = 'session-messages';
    
    sessionDiv.appendChild(sessionHeader);
    sessionDiv.appendChild(messagesDiv);
    container.appendChild(sessionDiv);
  });
}

function loadSessionMessages(sessionDiv, messages) {
  const messagesDiv = sessionDiv.querySelector('.session-messages');
  messagesDiv.innerHTML = '';
  
  messages.forEach(entry => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `history-message ${entry.isUser ? 'user' : 'zepta'} ${entry.type || ''}`;
    messageDiv.innerHTML = `
      <div class="message-time">${new Date(entry.timestamp).toLocaleTimeString()}</div>
      <div class="message-text">${entry.text}</div>
    `;
    
    // Click to restore message
    messageDiv.onclick = () => {
      const input = isTerminalMode ? 
        document.getElementById('terminalCommandInput') : 
        document.getElementById('terminalInput');
      if (input && entry.isUser) {
        input.value = entry.text;
        input.focus();
      }
    };
    
    messagesDiv.appendChild(messageDiv);
  });
}

// Enhanced session management
class ConversationSessionManager {
  constructor() {
    this.currentSession = gameState.gameSession;
    this.sessions = this.loadSessions();
  }
  
  loadSessions() {
    return JSON.parse(localStorage.getItem('zepta_conversation_sessions') || '{}');
  }
  
  saveSession() {
    if (!this.sessions[this.currentSession]) {
      this.sessions[this.currentSession] = {
        id: this.currentSession,
        created: Date.now(),
        lastActive: Date.now(),
        messageCount: 0,
        title: this.generateSessionTitle()
      };
    }
    
    this.sessions[this.currentSession].lastActive = Date.now();
    this.sessions[this.currentSession].messageCount = gameState.chatHistory.filter(
      msg => msg.session === this.currentSession
    ).length;
    
    localStorage.setItem('zepta_conversation_sessions', JSON.stringify(this.sessions));
  }
  
  generateSessionTitle() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr} at ${timeStr}`;
  }
  
  createNewSession() {
    // Save current session first
    this.saveSession();
    
    // Create new session
    this.currentSession = Date.now();
    gameState.gameSession = this.currentSession;
    
    // Clear current chat but keep in history
    const terminalLog = document.getElementById('terminalLog');
    const consoleOutput = document.getElementById('consoleOutput');
    
    if (terminalLog) terminalLog.innerHTML = '';
    if (consoleOutput) consoleOutput.innerHTML = '';
    
    // Add welcome message to new session
    enhancedAddToHistory('🆕 New conversation session started!', false, 'system');
    
    // Update session list
    this.loadHistoryIntoPanel();
    
    return this.currentSession;
  }
  
  loadSession(sessionId) {
    this.saveSession(); // Save current first
    
    // Clear current display
    const terminalLog = document.getElementById('terminalLog');
    const consoleOutput = document.getElementById('consoleOutput');
    
    if (terminalLog) terminalLog.innerHTML = '';
    if (consoleOutput) consoleOutput.innerHTML = '';
    
    // Load session messages
    const sessionMessages = gameState.chatHistory.filter(msg => msg.session == sessionId);
    sessionMessages.forEach(entry => {
      enhancedDisplayMessage(entry.text, entry.isUser, entry.type, false);
    });
    
    this.currentSession = sessionId;
    gameState.gameSession = sessionId;
    
    enhancedAddToHistory(`📂 Loaded conversation session from ${new Date(parseInt(sessionId)).toLocaleString()}`, false, 'system');
    scrollToBottom();
  }
  
  deleteSession(sessionId) {
    if (confirm('Delete this conversation session?')) {
      // Remove from sessions
      delete this.sessions[sessionId];
      
      // Remove messages from game history
      gameState.chatHistory = gameState.chatHistory.filter(msg => msg.session != sessionId);
      
      localStorage.setItem('zepta_conversation_sessions', JSON.stringify(this.sessions));
      saveGame();
      
      loadHistoryIntoPanel();
      enhancedAddToHistory('🗑️ Conversation session deleted.', false, 'system');
    }
  }
}

// Update the enhancedAddToHistory function to include session tracking
function enhancedAddToHistory(text, isUser = true, type = 'normal') {
  const timestamp = Date.now();
  const historyEntry = {
    text,
    isUser,
    type,
    timestamp,
    session: gameState.gameSession, // This is the key change
    id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  gameState.chatHistory.push(historyEntry);
  
  // Keep only last 1000 messages to prevent storage overflow
  if (gameState.chatHistory.length > 1000) {
    gameState.chatHistory = gameState.chatHistory.slice(-1000);
  }
  
  // Use enhanced display function
  enhancedDisplayMessage(text, isUser, type);
  
  // Update session
  conversationManager.saveSession();
  
  saveGame();
}

// Initialize conversation manager
const conversationManager = new ConversationSessionManager();

// Update the clearChat function to properly start a new session
function clearChat() {
  conversationManager.createNewSession();
  saveGame();
}