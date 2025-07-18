document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const showSection = (id) => {
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  };
  

  const introVideo = document.getElementById('introVideo');
  const explosionSound = document.getElementById('explosionSound');
  const introSound = document.getElementById('introSound');
  const typingSound = document.getElementById('typingSound');
  const tugScroll = document.getElementById('tugScroll');
  const playButton = document.getElementById('playButton');
  const marsostory = document.getElementById('marsostory');

  

  const playerNameInput = document.getElementById('playerName');
  const inputNameDisplay = document.getElementById('inputNameDisplay');
  const playerAgeInput = document.getElementById('playerAge');
  const inputAgeDisplay = document.getElementById('inputAgeDisplay');
  const storyLine = document.getElementById('storyLine');

    let playerName = '';
let playerAge = 0;
let storyIndex = 0;
introSound.currentTime = 0;
explosionSound.currentTime = 0;
let typingInterval;
let isTyping = false;


function getStorySegments() {
  return [
    () => `Hello, ${playerName}, Good ${getTimeGreeting()}. Tap on both sides of the screen to read story. 👆`,
    () => "Over the last decade, the Earth's core has been disintegrating.",
    () => "But luckily, due to scientific breakthroughs by our scientists...",
    () => "Under Astrida Marvella, the zeptahacker herself...",
    () => "We found a way to warm Mars and make it habitable.",
    () => "You are one of the first survivors. Welcome to MarsoVerse."
  ];
}

const storySegments = getStorySegments();

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function typeStory(text, element, callback) {
  if (typeof text !== 'string') {
    console.error("Invalid text passed to typeStory:", text);
    return;
  }

  clearInterval(typingInterval);
  typingSound.pause();
  typingSound.currentTime = 0;

  let i = 0;
  element.textContent = '';
  isTyping = true;

  typingInterval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text[i];
      typingSound.currentTime = 0;
      typingSound.play();
      i++;
    } else {
      clearInterval(typingInterval);
      typingSound.pause();
      typingSound.currentTime = 0;
      isTyping = false;
      if (callback) callback();
    }
  }, 75);
}

function playNextLine(direction = 1) {
  if (isTyping) {
    // If currently typing, finish line immediately on click
    clearInterval(typingInterval);
    typingSound.pause();
    typingSound.currentTime = 0;
    const fullText = storySegments[storyIndex]();
    storyLine.textContent = fullText;
    isTyping = false;
    return;
  }

  // Update index if direction is non-zero
  if (direction !== 0) {
    storyIndex += direction;
  }

  // Clamp index to valid range
  if (storyIndex < 0) {
    storyIndex = 0;
  }

  if (storyIndex >= storySegments.length) {
    // If past last segment and clicking right, go to next section
    if (direction === 1) {
      showSection('phasetwo');
      return;
    } else {
      storyIndex = storySegments.length - 1; // Prevent overflow
    }
  }

  const line = storySegments[storyIndex]();
  typeStory(line, storyLine);
}

function startStory() {
  showSection('storySection');
  storyIndex = 0;
  playNextLine(0); // Show first line without moving index
}

// Screen click handler for navigation
document.addEventListener('click', (e) => {
  if (!document.getElementById('storySection').classList.contains('active')) return;
  const screenWidth = window.innerWidth;
  const leftZone = screenWidth / 3;
  const rightZone = screenWidth * (2 / 3);

  if (e.clientX < leftZone) {
    playNextLine(-1); // far left
  } else if (e.clientX > rightZone) {
    playNextLine(1); // far right
  }
});


  // 🌍 Intro Video Flow
let introSoundPlaying = false;
let userTapped = false;

// 🔉 Fade out any audio
function fadeOutAudio(audio, duration = 1000) {
  if (!audio) return;
  const step = 0.05;
  const interval = duration / (audio.volume / step);
  const fade = setInterval(() => {
    if (audio.volume > step) {
      audio.volume -= step;
    } else {
      audio.pause();
      audio.currentTime = 0;
      clearInterval(fade);
    }
  }, interval);
}

// ❌ Stop introSound on tug
function stopIntroSound() {
  if (introSoundPlaying) {
    fadeOutAudio(introSound, 1200);
    introSoundPlaying = false;
  }
}

// 👇 Tug scroll to stop introSound
tugScroll?.addEventListener('click', () => {
  stopIntroSound();

  const fields = ['playerName', 'playerAge', 'gender', 'companionName', 'cyborgName'];
  const allPresent = fields.every(key => localStorage.getItem(key));

  if (allPresent) {
    // ✅ Skip to launch if user already completed setup
    showSection('launchSection');
    document.getElementById('launchSection')?.scrollIntoView({ behavior: 'smooth' });
  } else {
    // 📝 Continue as usual (start with name input)
    showSection('enterName');
    document.getElementById('enterName')?.scrollIntoView({ behavior: 'smooth' });
  }
});

// 🌍 INTRO VIDEO FLOW
if (introVideo) {
  // 📝 Dynamically render tap-to-unmute instruction
const tapInstruction = document.createElement('div');
tapInstruction.textContent = '👆 Tap to unmute and begin...';
tapInstruction.style.position = 'fixed';
tapInstruction.style.top = '20px';
tapInstruction.style.left = '50%';
tapInstruction.style.transform = 'translateX(-50%)';
tapInstruction.style.zIndex = '9999';
tapInstruction.style.fontFamily = "'Orbitron', sans-serif";
tapInstruction.style.color = '#0ff';
tapInstruction.style.background = 'rgba(0, 0, 0, 0.6)';
tapInstruction.style.padding = '10px 20px';
tapInstruction.style.border = '1px solid #0ff';
tapInstruction.style.borderRadius = '8px';
tapInstruction.style.opacity = '0';
tapInstruction.style.transition = 'opacity 0.4s ease';
tapInstruction.style.pointerEvents = 'none';

document.body.appendChild(tapInstruction);

// 👁️ Reveal for 1.3s
setTimeout(() => {
  tapInstruction.style.opacity = '1';
  setTimeout(() => {
    tapInstruction.style.opacity = '0';
  }, 1300);
}, 100);


  introVideo.muted = true;
  introVideo.play().catch(err => console.warn("Autoplay failed", err));

  // 👆 Show tap-to-unmute text briefly (1.3s)
  setTimeout(() => {
    tapToUnmute.style.opacity = 1;
    setTimeout(() => {
      tapToUnmute.style.opacity = 0;
    }, 1300);
  }, 100); // slight delay for page settle

  // 🖱️ Handle tap
  const handleUserTap = () => {
    if (userTapped) return;
    userTapped = true;

    // 💥 Play explosion
    explosionSound.currentTime = 0;
    explosionSound.play();

    // 🔊 Unmute intro video
    introVideo.muted = false;
  };
  document.addEventListener('click', handleUserTap, { once: true });

  // 🎬 Watch for video end
  introVideo.addEventListener('ended', transitionToWelcome);

  // ⏳ Fallback after 13s
  setTimeout(() => {
    if (!introVideo.classList.contains('fade-out')) {
      transitionToWelcome();
    }
  }, 13000);
}

// ✅ Transition to welcome and play introSound
function transitionToWelcome() {
  if (!introVideo.classList.contains('fade-out')) {
    introVideo.classList.add('fade-out');

    // 🎵 Start introSound AFTER video fades
    setTimeout(() => {
      introSound.volume = 1;
      introSound.currentTime = 0;
      introSound.play().then(() => {
        introSoundPlaying = true;
      }).catch(err => console.warn("Intro sound error:", err));
    }, 200); // slight delay into fade

    // 🎉 Fade out video fully and show welcome
    setTimeout(() => {
      introVideo.remove();
      showSection('welcomeSection');
    }, 1000); // matches CSS fade duration
  }
}


  // 👤 Name input with 2s stability check and focus on age field
  let nameTimeout;

  playerNameInput?.addEventListener('input', () => {
    const name = playerNameInput.value.trim();
    inputNameDisplay.textContent = name;

    clearTimeout(nameTimeout); // cancel previous if user keeps typing

    if (name.length >= 3) {
      nameTimeout = setTimeout(() => {
        // Recheck validity after 2s
        const stableName = playerNameInput.value.trim();
        if (stableName.length >= 3) {
          playerName = stableName;
          localStorage.setItem('playerName', stableName);
          showSection('enterAge');

          // ✅ Focus age input after section loads
          setTimeout(() => playerAgeInput?.focus(), 100);
        }
      }, 1300);
    }
  });

  // 🎂 Age input + move after delay + save
  playerAgeInput?.addEventListener('input', () => {
    const ageVal = parseInt(playerAgeInput.value);
    inputAgeDisplay.textContent = playerAgeInput.value;

    if (ageVal >= 10 && ageVal <= 100) {
      playerAge = ageVal;
      localStorage.setItem('playerAge', ageVal.toString());
      setTimeout(() => showSection('playSection'), 1000);
    }
  });


  // // 👤 Name input
  // playerNameInput?.addEventListener('input', () => {
  //   inputNameDisplay.textContent = playerNameInput.value;
  //   if (playerNameInput.value.trim().length >= 3) {
  //     playerName = playerNameInput.value.trim();
  //     setTimeout(() => showSection('enterAge'), 1000);
  //   }
  // });

  // // 🎂 Age input
  // playerAgeInput?.addEventListener('input', () => {
  //   inputAgeDisplay.textContent = playerAgeInput.value;
  //   const age = parseInt(playerAgeInput.value);
  //   if (age >= 10 && age <= 100) {
  //     playerAge = age;
  //     setTimeout(() => showSection('playSection'), 1000);
  //   }
  // });


  // ▶️ Play story
  playButton?.addEventListener('click', startStory);

   // Launch game to new page
  // document.getElementById('launchBtn')?.addEventListener('click', () => {
  //   window.location.href = 'hash.html';
  // });
  //    // Store companion + bot for later
  // document.querySelectorAll('.choice').forEach(choice => {
  //   choice.addEventListener('click', () => {
  //     document.getElementById('companionName').value = choice.dataset.name;
  //   });
  // });
  const clickSound = document.getElementById('clickSound');
const sparkleSound = document.getElementById('sparkleSound');

// 🔊 Play click sound on all buttons
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    clickSound.currentTime = 0;
    clickSound.play();
  });
});


// 💥 Explosion when story/game begins
playButton.addEventListener('click', () => {
  if (explosionSound.paused) {
    explosionSound.currentTime = 0;
    explosionSound.play();
  }
  startStory();
});

  const genderSelect = document.getElementById('genderSelect');

genderSelect?.addEventListener('change', () => {
  const selectedGender = genderSelect.value;
  if (selectedGender) {
    localStorage.setItem('gender', selectedGender); // Store if needed
    showSection('companionSection'); 
  }
});

const connectWalletBtn = document.getElementById('connectWalletBtn');
const skipLink = document.getElementById('firstLink');
const walletPreview = document.getElementById('walletPreview');

// 📱 Detect Mobile
function isMobile() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function stopSparkleSound() {
  sparkleSound.pause();
  sparkleSound.currentTime = 0;
}

// ✅ Phantom deep link
function redirectToPhantomMobile() {
  const dappURL = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${dappURL}`;
}

// ✅ Connect wallet
connectWalletBtn?.addEventListener('click', async () => {
  if (sparkleSound) {
    try {
      await sparkleSound.play();
    } catch (err) {
      console.warn('Sparkle sound blocked:', err);
    }
  }

  walletPreview.style.display = 'inline-block';
  walletPreview.textContent = "Connecting wallet...";
  skipLink.style.display = 'none';

  if ('solana' in window && window.solana?.isPhantom) {
    try {
      const res = await window.solana.connect();
      const pubKey = res.publicKey.toString();
      localStorage.setItem('walletAddress', pubKey);

      setTimeout(() => {
        walletPreview.textContent = `${pubKey.slice(0, 3)}...`;

        setTimeout(() => {
          stopSparkleSound();
          showSection('genderSection');
        }, 2000);

      }, 2000);

    } catch (err) {
      walletPreview.textContent = "Connection failed";
      skipLink.style.display = 'inline-block';
      console.warn('Wallet connection failed:', err);
    }

  } else if (isMobile()) {
    setTimeout(() => {
      walletPreview.textContent = "Redirecting to Phantom...";
      redirectToPhantomMobile();
    }, 1500);

  } else {
    walletPreview.textContent = "Solana wallet not found";
    alert("No Solana wallet found. Install Phantom from https://phantom.app");
    skipLink.style.display = 'inline-block';
  }
});

// ⛔ Disconnect wallet if preview is clicked
walletPreview?.addEventListener('click', () => {
  if (walletPreview.textContent.includes('...')) {
    const confirmDisconnect = confirm("Do you wish to disconnect your wallet?");
    if (confirmDisconnect) {
      localStorage.removeItem('walletAddress');
      walletPreview.textContent = '';
      skipLink.style.display = 'inline-block';
      alert("Wallet disconnected.");
    }
  }
});

// ⏭️ Skip manually
skipLink?.addEventListener('click', (e) => {
  e.preventDefault();
  stopSparkleSound();
  showSection('genderSection');
});

     // Store companion + bot for later
  // document.querySelectorAll('.choice').forEach(choice => {
  //   choice.addEventListener('click', () => {
  //     document.getElementById('companionName').value = choice.dataset.name;
  //   });
  // });
  // 🧍 Companion Selection Logic
const companionInput = document.getElementById('companionName');
const companionChoices = document.querySelectorAll('.choice');

// Store selected choice in input on click
companionChoices.forEach(choice => {
  choice.addEventListener('click', () => {
    const name = choice.dataset.name;
    companionInput.value = name;

    // Optional: Visual feedback (highlight selected)
    companionChoices.forEach(c => c.classList.remove('selected'));
    choice.classList.add('selected');

    // Move to cyborg section after short delay
    setTimeout(() => {
      localStorage.setItem('companionName', name);
      showSection('cyborg');
    }, 1000);
  });
});

// Allow manual entry as fallback
companionInput.addEventListener('change', () => {
  const name = companionInput.value.trim();
  if (name.length > 1) {
    localStorage.setItem('companionName', name);
    showSection('cyborg');
  }
});
const botNameInput = document.getElementById('botName');

botNameInput?.addEventListener('change', () => {
  const name = botNameInput.value.trim();
  if (name.length > 1) {
    localStorage.setItem('cyborgName', name);
    showSection('launchSection'); // Move to final launch
  }
});
botNameInput?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    botNameInput.dispatchEvent(new Event('change'));
  }
});
// const launchBtn = document.getElementById('launchBtn');

// launchBtn?.addEventListener('click', () => {
//   const requiredFields = [
//     'playerName',
//     'playerAge',
//     'gender',
//     'companionName',
//     'cyborgName'
//   ];

//   const allComplete = requiredFields.every(key => localStorage.getItem(key));

//   if (allComplete) {
//     window.location.href = 'marzo.html'; // 🚀 Load your game
//   } else {
//     alert("Missing: " + requiredFields.filter(k => !localStorage.getItem(k)).join(", "));

//   }
// });

// const launchBtn = document.getElementById('launchBtn');
// const rewardPopup = document.getElementById('rewardPopup');
// const acceptRewardBtn = document.getElementById('acceptReward');

const launchBtn = document.getElementById('launchBtn');
const rewardPopup = document.getElementById('rewardPopup');
const acceptRewardBtn = document.getElementById('acceptReward');

launchBtn?.addEventListener('click', () => {
  const requiredFields = [
    'playerName',
    'playerAge',
    'gender',
    'companionName',
    'cyborgName'
  ];

  const allComplete = requiredFields.every(key => localStorage.getItem(key));

  if (!allComplete) {
    alert("Missing: " + requiredFields.filter(k => !localStorage.getItem(k)).join(", "));
    return;
  }

  // 👇 Check if reward popup has been shown before
  if (localStorage.getItem('rewardShown') === 'true') {
    window.location.href = 'marzo.html';
    return;
  }

  // Show reward popup
  rewardPopup.classList.remove('hidden');

  // Auto-redirect in 3 seconds
  const autoRedirect = setTimeout(() => {
    rewardPopup.classList.add('hidden');
    localStorage.setItem('rewardShown', 'true'); // ✅ Mark as shown
    window.location.href = 'marzo.html';
  }, 3000);

  acceptRewardBtn.addEventListener('click', () => {
    clearTimeout(autoRedirect); // Cancel auto-redirect
    rewardPopup.classList.add('hidden');

    // ✅ Reward logic
    const currentXP = parseInt(localStorage.getItem('playerXP') || '0', 5);
    localStorage.setItem('playerXP', '5');
    localStorage.setItem('walletBalance', '1');
    localStorage.setItem('rewardShown', 'true'); // ✅ Mark as shown

    window.location.href = 'marzo.html';
  }, { once: true });
});



});


  // if (introVideo) {
  //   introVideo.play().catch(err => console.warn("Autoplay failed", err));
  //   setTimeout(() => explosionSound.play(), 1500);


  //   introVideo.addEventListener('ended', transitionToWelcome);
    
  //   // Fallback in case video doesn't trigger 'ended'
  //   setTimeout(transitionToWelcome, 10000);
  // }

  // function transitionToWelcome() {
  //   if (!introVideo.classList.contains('fade-out')) {
  //     introVideo.classList.add('fade-out');
  //     setTimeout(() => {
  //       introVideo.remove();
  //       introSound.play();
  //       }, 1000);
  //       showSection('welcomeSection');
        
      
  //   }
  // }

//  const companionSection = document.getElementById('companionSection');
//   const companionInput = document.getElementById('companionName');
//   const choices = document.querySelectorAll('.choice');
//   const cyborgSection = document.getElementById('cyborg');
//   const botNameInput = document.getElementById('botName');
//   const launchSection = document.getElementById('launchSection');
//   const launchBtn = document.getElementById('launchBtn');

//   let selectedCompanion = '';

//   // STEP 1: Handle companion image click
//   choices.forEach(choice => {
//     choice.addEventListener('click', () => {
//       selectedCompanion = choice.dataset.name;
//       companionInput.value = selectedCompanion;

//       // Highlight selected
//       choices.forEach(c => c.classList.remove('selected'));
//       choice.classList.add('selected');

//       // Move to next section
//       showSection('cyborgSection');
//     });
//   });

//   // STEP 2: If user types companion manually and presses Enter
//   companionInput.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//       const inputName = companionInput.value.trim().toLowerCase();
//       if (inputName === 'errin' || inputName === 'elena') {
//         selectedCompanion = inputName.charAt(0).toUpperCase() + inputName.slice(1);

//         // Move to next section
//         showSection('cyborgSection');
//       } else {
//         companionInput.classList.add('error');
//         companionInput.placeholder = 'Invalid name. Choose Errin or Elena.';
//       }
//     }
//   });

//   // STEP 3: After typing cyborg name, move to launch section
//   botNameInput.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//       const botName = botNameInput.value.trim();
//       if (botName.length >= 2) {
//         // Save both values
//         localStorage.setItem('companion', selectedCompanion);
//         localStorage.setItem('botName', botName);

//         // Route to launch screen
//         cyborgSection.classList.add('hidden');
//         launchSection.classList.remove('hidden');
//       } else {
//         botNameInput.classList.add('error');
//         botNameInput.placeholder = 'Name must be at least 2 characters.';
//       }
//     }
//   });

//   // STEP 4: Launch game
//   launchBtn.addEventListener('click', () => {
//     const botName = botNameInput.value.trim();
//     if (botName.length >= 2) {
//       localStorage.setItem('companion', selectedCompanion);
//       localStorage.setItem('botName', botName);

//       // Redirect to main game (e.g., marzo.html)
//       window.location.href = 'marzo.html';
//     } else {
//       botNameInput.classList.add('error');
//       botNameInput.placeholder = 'Please name your bot first.';
//     }
//   });


// function getStorySegments() {
//   return [
//     () => `Hello, ${playerName}, Good ${getTimeGreeting()}. Tap on the both sides of the screen to read story.👆 `,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];
// }
// const storySegments = getStorySegments();

// function getTimeGreeting() {
//   const h = new Date().getHours();
//   if (h < 12) return 'Morning';
//   if (h < 18) return 'Afternoon';
//   return 'Evening';
// }

// function typeStory(text, element, callback) {
//   if (typeof text !== 'string') {
//     console.error("Invalid text passed to typeStory:", text);
//     return;
//   }

//   clearInterval(typingInterval);
//   typingSound.pause();
//   typingSound.currentTime = 0;

//   let i = 0;
//   element.textContent = '';
//   isTyping = true;

//   typingInterval = setInterval(() => {
//     if (i < text.length) {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//     } else {
//       clearInterval(typingInterval);
//       typingSound.pause();
//       typingSound.currentTime = 0;
//       isTyping = false;
//       if (callback) callback();
//     }
//   }, 75);
// }

// function playNextLine(direction = 1) {
//   if (isTyping) {
//     // Finish current line immediately
//     clearInterval(typingInterval);
//     typingSound.pause();
//     typingSound.currentTime = 0;
//     const fullText = storySegments[storyIndex]();
//     storyLine.textContent = fullText;
//     isTyping = false;
//     return;
//   }

//   // Move storyIndex only if direction is not zero
//   if (direction !== 0) {
//     storyIndex += direction;
//   }

//   // Boundaries check
//   if (storyIndex < 0) {
//     storyIndex = 0;
//   }

//   if (storyIndex >= storySegments.length) {
//     // At or past last segment — move to next section only on right click
//     if (direction === 1) {
//       showSection('phasetwo');
//       return;
//     } else {
//       storyIndex = storySegments.length - 1;
//     }
//   }

//   const line = storySegments[storyIndex]();
//   typeStory(line, storyLine);
// }

// function startStory() {
//   showSection('storySection');
//   storyIndex = 0;
//   playNextLine(0); // Load first line without moving storyIndex
// }

// // Screen click navigation
// document.addEventListener('click', (e) => {
//   if (!document.getElementById('storySection').classList.contains('active')) return;

//   const mid = window.innerWidth / 2;
//   if (e.clientX < mid) {
//     playNextLine(-1);
//   } else {
//     playNextLine(1);
//   }
// });

//   let playerName = '';
//   let playerAge = 0;
//   let storyIndex = 0;
//   introSound.currentTime = 0;
//   explosionSound.currentTime = 0;
//   let typingInterval;

//   function getStorySegments() {
//   return [
//     () => `Hello, ${playerName}, Good ${getTimeGreeting()}. Tap on the both sides of the screen to read story.👆 `,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];
// }
// const storySegments = getStorySegments();

// // 🕒 Time greeting
// function getTimeGreeting() {
//   const h = new Date().getHours();
//   if (h < 12) return 'Morning';
//   if (h < 18) return 'Afternoon';
//   return 'Evening';
// }

// // ✍️ Typing function
// function typeStory(text, element, callback) {
//   if (typeof text !== 'string') {
//     console.error("Invalid text passed to typeStory:", text);
//     return;
//   }

//   clearInterval(typingInterval);
//   typingSound.pause();
//   typingSound.currentTime = 0;

//   let i = 0;
//   element.textContent = '';

//   typingInterval = setInterval(() => {
//     if (i < text.length) {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//     } else {
//       clearInterval(typingInterval);
//       typingSound.pause();
//       typingSound.currentTime = 0;
//       if (callback) callback();
//     }
//   }, 75);
// }

// // ➡️⬅️ Go to next/prev line
// function playNextLine(direction = 1) {
//   clearInterval(typingInterval);
//   typingSound.pause();
//   typingSound.currentTime = 0;

//   storyIndex += direction;
//   if (storyIndex < 0) storyIndex = 0;
//   if (storyIndex >= storySegments.length) storyIndex = storySegments.length - 1;

//   const line = storySegments[storyIndex]();
//   typeStory(line, storyLine);
// }

// // 🚀 Start story
// function startStory() {
//   showSection('storySection');
//   storyIndex = 0;
//   playNextLine(0);
// }

// // ⬅️➡️ Click screen to go back/forward
// document.addEventListener('click', (e) => {
//   if (!document.getElementById('storySection').classList.contains('active')) return;

//   const mid = window.innerWidth / 2;
//   if (e.clientX < mid) {
//     playNextLine(-1);
//   } else {
//     playNextLine(1);
//   }
// });


// function getStorySegments() {
//   return [
//     () => `Hello, ${playerName}, Good ${getTimeGreeting()}.`,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];
// }


//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'Morning';
//     if (h < 18) return 'Mfternoon';
//     return 'evening';
//   }

//   function typeStory(text, element, callback) {
//   if (typeof text !== 'string') {
//     console.error("Invalid text passed to typeStory:", text);
//     return;
//   }

//   let i = 0;
//   element.textContent = '';
//   const interval = setInterval(() => {
//     if (i < text.length) {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//     } else {
//       clearInterval(interval);
//       typingSound.pause();
//       typingSound.currentTime = 0;
//       if (callback) callback();
//     }
//   }, 75);
// }


//   function playNextLine() {
//     if (storyIndex < storySegments.length) {
//       const line = storySegments[storyIndex++]();
//       typeStory(line, storyLine, playNextLine);
//     }
//   }

//   function startStory() {
//     showSection('storySection');
//     playNextLine();
//   }

// // ♀️♂️ Gender select
// const genderSelect = document.getElementById('genderSelect');
// genderSelect?.addEventListener('change', () => {
//   const selectedGender = genderSelect.value;
//   if (selectedGender) {
//     localStorage.setItem('gender', selectedGender);
//     showSection('companionSection');
//   }


  // // const connectWalletBtn = document.getElementById('connectWalletBtn');
  // const skipLink = document.getElementById('firstLink');
  // const walletPreview = document.getElementById('walletPreview');
  // // const sparkleSound = document.getElementById('sparkleSound');

  // // 🔊 Play sparkle on click
  // function playSparkle() {
  //   if (sparkleSound) {
  //     sparkleSound.currentTime = 0;
  //     sparkleSound.play();
  //   }
  // }
  // document.addEventListener('DOMContentLoaded', () => {
  // const connectWalletBtn = document.getElementById('connectWalletBtn');
  // const skipLink = document.getElementById('firstLink');
  // const walletPreview = document.getElementById('walletPreview');
  // const sparkleSound = document.getElementById('sparkleSound');

  // // 🔊 Sound on button click
  // function playSparkle() {
  //   if (sparkleSound) {
  //     sparkleSound.currentTime = 0;
  //     sparkleSound.play();
  //   }
  // }

  // // ✅ Wallet connect flow
  // connectWalletBtn?.addEventListener('click', async () => {
  //   playSparkle();

  //   // Show connecting message
  //   walletPreview.style.display = 'inline-block';
  //   walletPreview.textContent = "Connecting wallet...";
  //   skipLink.style.display = 'none'; // Hide skip during process

  //   // Wallet connection logic
  //   if ('solana' in window) {
  //     const provider = window.solana;

  //     if (provider.isPhantom) {
  //       try {
  //         const res = await provider.connect();
  //         const pubKey = res.publicKey.toString();

  //         // ✅ Store full address in localStorage
  //         localStorage.setItem('walletAddress', pubKey);

  //         // After 2 seconds show first 3 chars
  //         setTimeout(() => {
  //           walletPreview.textContent = `${pubKey.slice(0, 3)}...`;

  //           // After another 2 sec → move to next section
  //           setTimeout(() => {
  //             showSection('genderSection');
  //           }, 2000);

  //         }, 2000); // delay for "Connecting wallet..."

  //       } catch (err) {
  //         walletPreview.textContent = "Connection failed";
  //         console.warn('Wallet connection failed:', err);
  //         skipLink.style.display = 'inline-block'; // allow retry
  //       }
  //     } else {
  //       walletPreview.textContent = "Install Phantom Wallet";
  //       alert("Please install Phantom Wallet from https://phantom.app");
  //       skipLink.style.display = 'inline-block';
  //     }
  //   } else {
  //     walletPreview.textContent = "Solana wallet not found";
  //     alert("No Solana wallet found. Please install Phantom.");
  //     skipLink.style.display = 'inline-block';
  //   }
  // });

  // // ⏭️ Skip to genderSection manually
  // skipLink?.addEventListener('click', (e) => {
  //   e.preventDefault();
  //   showSection('genderSection');
  // });



  // // 👛 Connect to Phantom Wallet
  // connectWalletBtn?.addEventListener('click', async () => {
  //   playSparkle();

  //   if ('solana' in window) {
  //     const provider = window.solana;

  //     if (provider.isPhantom) {
  //       try {
  //         const res = await provider.connect();
  //         const pubKey = res.publicKey.toString();
  //         console.log('Connected:', pubKey);

  //         // 🔁 Hide skip, show short preview
  //         skipLink.style.display = 'none';
  //         walletPreview.textContent = `${pubKey.slice(0, 3)}...`;
  //         walletPreview.style.display = 'inline-block';

  //         // ✅ Move to genderSection
  //         showSection('genderSection');

  //       } catch (err) {
  //         console.warn('Wallet connection failed:', err);
  //         alert("Wallet connection failed. Please try again.");
  //       }
  //     } else {
  //       alert("Phantom Wallet not detected. Install from https://phantom.app");
  //     }
  //   } else {
  //     alert("No Solana wallet found. Please install Phantom Wallet.");
  //   }
  // });

  // // 🧭 Fallback skip (if user doesn't want to connect)
  // skipLink?.addEventListener('click', (e) => {
  //   e.preventDefault();
  //   showSection('genderSection');
  // });




// document.addEventListener('DOMContentLoaded', () => {
//   const sections = document.querySelectorAll('.section');
//   const welcomeSection = document.getElementById('welcomeSection');
//   const enterName = document.getElementById('enterName');
//   const enterAge = document.getElementById('enterAge');
//   const playSection = document.getElementById('playSection');
//   const storySection = document.getElementById('storySection');
//   const tugScroll = document.getElementById('tugScroll');

//   const introVideo = document.getElementById('introVideo');
//   const explosionSound = document.getElementById('explosionSound');
//   const introSound = document.getElementById('introSound');
//   const typingSound = document.getElementById('typingSound');

//   const playerNameInput = document.getElementById('playerName');
//   const inputNameDisplay = document.getElementById('inputNameDisplay');
//   const playerAgeInput = document.getElementById('playerAge');
//   const inputAgeDisplay = document.getElementById('inputAgeDisplay');
//   const playButton = document.getElementById('playButton');
//   const storyLine = document.getElementById('storyLine');

//   let playerName = '';
//   let playerAge = 0;
//   let storyIndex = 0;

//   const storySegments = [
//     () => `Hello, ${playerName}, good ${getTimeGreeting()}.`,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];

//   function showSection(id) {
//     sections.forEach(sec => sec.classList.remove('active'));
//     const next = document.getElementById(id);
//     next.classList.add('active');
//     next.scrollIntoView({ behavior: 'smooth' });
//   }

//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'morning';
//     if (h < 18) return 'afternoon';
//     return 'evening';
//   }

//   function typeStory(text, element, callback) {
//     let i = 0;
//     element.textContent = '';
//     const interval = setInterval(() => {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//       if (i >= text.length) {
//         clearInterval(interval);
//         if (callback) callback();
//       }
//     }, 75);
//   }

//   function startStory() {
//     showSection('storySection');
//     playNextLine();
//   }

//   function playNextLine() {
//     if (storyIndex < storySegments.length) {
//       const line = storySegments[storyIndex++]();
//       typeStory(line, storyLine, playNextLine);
//     }
//   }

//   // 🌍 Intro video start
//   if (introVideo) {
//     introVideo.play().catch(err => console.warn("Autoplay failed", err));
//     setTimeout(() => explosionSound.play(), 1500);
//     introVideo.addEventListener('ended', () => {
//       introVideo.classList.add('fade-out');
//       setTimeout(() => {
//         introVideo.remove();
//         showSection('welcomeSection');
//         introSound.play();
//       }, 1200);
//     });
//   }

//   // 👇 Tug from welcome to enter name
//   tugScroll.addEventListener('click', () => {
//     showSection('enterName');
//   });

//   // 📝 Name input
//   playerNameInput.addEventListener('input', () => {
//     inputNameDisplay.textContent = playerNameInput.value;
//     if (playerNameInput.value.trim().length >= 3) {
//       playerName = playerNameInput.value.trim();
//       setTimeout(() => showSection('enterAge'), 1000);
//     }
//   });

//   // 🎂 Age input
//   playerAgeInput.addEventListener('input', () => {
//     inputAgeDisplay.textContent = playerAgeInput.value;
//     const age = parseInt(playerAgeInput.value);
//     if (age >= 18 && age <= 100) {
//       playerAge = age;
//       setTimeout(() => showSection('playSection'), 1000);
//     }
//   });

//   // ▶️ Play button
//   playButton.addEventListener('click', startStory);
// });

// document.addEventListener('DOMContentLoaded', () => {
//   // Elements
//   const introVideo = document.getElementById('introVideo');
//   const explosionSound = document.getElementById('explosionSound');
//   const introSound = document.getElementById('introSound');
//   const typingSound = document.getElementById('typingSound');

//   const tugScroll = document.getElementById('tugScroll');
//   const playButton = document.getElementById('playButton');
//   const storyLine = document.getElementById('storyLine');

//   const playerNameInput = document.getElementById('playerName');
//   const inputNameDisplay = document.getElementById('inputNameDisplay');
//   const playerAgeInput = document.getElementById('playerAge');
//   const inputAgeDisplay = document.getElementById('inputAgeDisplay');

//   let playerName = '';
//   let playerAge = 0;
//   let storyIndex = 0;

//   // 🧠 Segments for story typing
//   const storySegments = [
//     () => `Hello, ${playerName}, good ${getTimeGreeting()}.`,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];

//   // 🔁 Show only one section at a time
//   function showSection(id) {
//     document.querySelectorAll('.section').forEach(section => {
//       section.classList.remove('active');
//     });
//     document.getElementById(id)?.classList.add('active');
//   }

//   // 🕒 Greeting by time
//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'morning';
//     if (h < 18) return 'afternoon';
//     return 'evening';
//   }

//   // 🖋️ Typewriter animation
//   function typeStory(text, element, callback) {
//     let i = 0;
//     element.textContent = '';
//     const interval = setInterval(() => {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//       if (i >= text.length) {
//         clearInterval(interval);
//         if (callback) callback();
//       }
//     }, 75);
//   }

//   function playNextLine() {
//     if (storyIndex < storySegments.length) {
//       const line = storySegments[storyIndex++]();
//       typeStory(line, storyLine, playNextLine);
//     }
//   }

//   function startStory() {
//     showSection('storySection');
//     playNextLine();
//   }

//   // 🌍 Intro Logic
//   if (introVideo) {
//     introVideo.play().catch(err => console.warn("Autoplay failed", err));
//     setTimeout(() => explosionSound.play(), 1500);
//     setTimeout(() => {
//       introVideo.classList.add('fade-out');
//       setTimeout(() => {
//         introVideo.remove();
//         showSection('welcomeSection');
//         introSound.play();
//       }, 2000);
//     }, 10000); // video lasts 10s max
//   }

//   // 🧲 Tug Button → enterName section
//   tugScroll?.addEventListener('click', () => {
//     showSection('enterName');
//     document.getElementById('enterName')?.scrollIntoView({ behavior: 'smooth' });
//   });

//   // 👤 Name → enterAge
//   playerNameInput?.addEventListener('input', () => {
//     inputNameDisplay.textContent = playerNameInput.value;
//     if (playerNameInput.value.trim().length >= 3) {
//       playerName = playerNameInput.value.trim();
//       setTimeout(() => showSection('enterAge'), 1000);
//     }
//   });

//   // 🎂 Age → playSection
//   playerAgeInput?.addEventListener('input', () => {
//     inputAgeDisplay.textContent = playerAgeInput.value;
//     const age = parseInt(playerAgeInput.value);
//     if (age >= 18 && age <= 100) {
//       playerAge = age;
//       setTimeout(() => showSection('playSection'), 1000);
//     }
//   });

//   // ▶️ Play Button → start story
//   playButton?.addEventListener('click', startStory);
// });

// document.addEventListener('DOMContentLoaded', () => {
//   const introVideo = document.getElementById('introVideo');
//   const explosionSound = document.getElementById('explosionSound');
//   const introSound = document.getElementById('introSound');
//   const typingSound = document.getElementById('typingSound');

//   const tugScroll = document.getElementById('tugScroll');
//   const playerNameInput = document.getElementById('playerName');
//   const inputNameDisplay = document.getElementById('inputNameDisplay');
//   const playerAgeInput = document.getElementById('playerAge');
//   const inputAgeDisplay = document.getElementById('inputAgeDisplay');
//   const playButton = document.getElementById('playButton');
//   const storyLine = document.getElementById('storyLine');

//   let playerName = '';
//   let playerAge = 0;
//   let storyIndex = 0;

//   const storySegments = [
//     () => `Hello, ${playerName}, good ${getTimeGreeting()}.`,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];

//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'morning';
//     if (h < 18) return 'afternoon';
//     return 'evening';
//   }

//   function showSection(id) {
//     document.querySelectorAll('.section').forEach(section => {
//       section.classList.remove('active');
//       section.classList.add('hidden');
//     });
//     const target = document.getElementById(id);
//     target.classList.add('active');
//     target.classList.remove('hidden');
//   }

//   function typeStory(text, element, callback) {
//     let i = 0;
//     element.textContent = '';
//     const interval = setInterval(() => {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//       if (i >= text.length) {
//         clearInterval(interval);
//         if (callback) callback();
//       }
//     }, 70);
//   }

//   function playNextLine() {
//     if (storyIndex < storySegments.length) {
//       const line = storySegments[storyIndex++]();
//       typeStory(line, storyLine, playNextLine);
//     }
//   }

//   function startStory() {
//     showSection('storySection');
//     playNextLine();
//   }

//   // 🎬 INTRO VIDEO
//   if (introVideo) {
//     introVideo.play().catch(() => {});
//     setTimeout(() => explosionSound.play(), 1500);

//     setTimeout(() => {
//       introVideo.classList.add('fade-out');
//       setTimeout(() => {
//         introVideo.remove();
//         showSection('welcomeSection');
//         introSound.play();
//       }, 2000);
//     }, 10000); // play only for 10s
//   }

//   // ⬇️ Tug to name
//   tugScroll?.addEventListener('click', () => {
//     showSection('enterName');
//   });

//   // 👤 Name
//   playerNameInput.addEventListener('input', () => {
//     inputNameDisplay.textContent = playerNameInput.value;
//     if (playerNameInput.value.trim().length >= 3) {
//       playerName = playerNameInput.value.trim();
//       setTimeout(() => showSection('enterAge'), 1000);
//     }
//   });

//   // 🎂 Age
//   playerAgeInput.addEventListener('input', () => {
//     inputAgeDisplay.textContent = playerAgeInput.value;
//     const age = parseInt(playerAgeInput.value);
//     if (age >= 18 && age <= 100) {
//       playerAge = age;
//       setTimeout(() => showSection('playSection'), 1000);
//     }
//   });

//   playButton.addEventListener('click', startStory);
// });


// document.addEventListener('DOMContentLoaded', () => {
//   const sections = document.querySelectorAll('.section');
//   const welcomeSection = document.getElementById('welcomeSection');
//   const enterName = document.getElementById('enterName');
//   const enterAge = document.getElementById('enterAge');
//   const playSection = document.getElementById('playSection');
//   const storySection = document.getElementById('storySection');
//   const tugScroll = document.getElementById('tugScroll');

//   const introVideo = document.getElementById('introVideo');
//   const explosionSound = document.getElementById('explosionSound');
//   const introSound = document.getElementById('introSound');
//   const typingSound = document.getElementById('typingSound');

//   const playerNameInput = document.getElementById('playerName');
//   const inputNameDisplay = document.getElementById('inputNameDisplay');
//   const playerAgeInput = document.getElementById('playerAge');
//   const inputAgeDisplay = document.getElementById('inputAgeDisplay');
//   const playButton = document.getElementById('playButton');
//   const storyLine = document.getElementById('storyLine');

//   let playerName = '';
//   let playerAge = 0;
//   let storyIndex = 0;

//   const storySegments = [
//     () => `Hello, ${playerName}, good ${getTimeGreeting()}.`,
//     () => "Over the last decade, the Earth's core has been disintegrating.",
//     () => "But luckily, due to scientific breakthroughs by our scientists...",
//     () => "Under Astrida Marvella, the zeptahacker herself...",
//     () => "We found a way to warm Mars and make it habitable.",
//     () => "You are one of the first survivors. Welcome to MarsoVerse."
//   ];

//   function showSection(id) {
//   document.querySelectorAll('.section').forEach(section => {
//     section.classList.remove('active');
//     section.classList.add('hidden');
//   });

//   const current = document.getElementById(id);
//   if (current) {
//     current.classList.add('active');
//     current.classList.remove('hidden');
//   }
// }

//   // function showSection(id) {
//   //   sections.forEach(sec => sec.classList.remove('active'));
//   //   const next = document.getElementById(id);
//   //   next.classList.add('active');
//   //   next.scrollIntoView({ behavior: 'smooth' });
//   // }

//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'morning';
//     if (h < 18) return 'afternoon';
//     return 'evening';
//   }

//   function typeStory(text, element, callback) {
//     let i = 0;
//     element.textContent = '';
//     const interval = setInterval(() => {
//       element.textContent += text[i];
//       typingSound.currentTime = 0;
//       typingSound.play();
//       i++;
//       if (i >= text.length) {
//         clearInterval(interval);
//         if (callback) callback();
//       }
//     }, 75);
//   }

//   function startStory() {
//     showSection('storySection');
//     playNextLine();
//   }

//   function playNextLine() {
//     if (storyIndex < storySegments.length) {
//       const line = storySegments[storyIndex++]();
//       typeStory(line, storyLine, playNextLine);
//     }
//   }

//   // 🌍 Intro video start
//   // 🌍 Intro video start
// if (introVideo) {
//   introVideo.play().catch(err => console.warn("Autoplay failed", err));
//   setTimeout(() => explosionSound.play(), 1500);

//   // Force a 10-second transition regardless of video end
//   setTimeout(() => {
//     introVideo.classList.add('fade-out');
//     setTimeout(() => {
//       introVideo.remove();
//       showSection('welcomeSection');
//       introSound.play();
//     }, 2000); // Wait for fade-out to finish
//   }, 10000); // Show video for 10 seconds
// }


//   // 👇 Tug from welcome to enter name
//   tugScroll?.addEventListener('click', () => {
//     document.getElementById('enterName')?.scrollIntoView({ behavior: 'smooth' });
//   });
//   // tugScroll.addEventListener('click', () => {
//   //   document.getElementById('enterName').scrollIntoView({ behavior: 'smooth' });
//   // });
// //   tugScroll.addEventListener('click', () => {
// //   document.getElementById('welcomeSection').classList.remove('active');
// //   document.getElementById('enterName').classList.add('active');
// // });
// //   document.getElementById('tugScroll').addEventListener('click', () => {
// //   document.getElementById('enterName').scrollIntoView({ behavior: 'smooth' });
// // });

//   // 📝 Name input
//   playerNameInput.addEventListener('input', () => {
//     inputNameDisplay.textContent = playerNameInput.value;
//     if (playerNameInput.value.trim().length >= 3) {
//       playerName = playerNameInput.value.trim();
//       setTimeout(() => showSection('enterAge'), 1000);
//     }
//   });

//   // 🎂 Age input
//   playerAgeInput.addEventListener('input', () => {
//     inputAgeDisplay.textContent = playerAgeInput.value;
//     const age = parseInt(playerAgeInput.value);
//     if (age >= 18 && age <= 100) {
//       playerAge = age;
//       setTimeout(() => showSection('playSection'), 1000);
//     }
//   });

//   // ▶️ Play button
//   playButton.addEventListener('click', startStory);
// });


// const introVideo = document.getElementById('introVideo');

// introVideo.addEventListener('ended', () => {
//   introVideo.classList.add('fade-out');
//   setTimeout(() => {
//     introVideo.remove();
//     document.getElementById('welcomeSection').classList.add('active');
//     document.getElementById('introSound').play(); // Optional
//   }, 2000);
// });

// document.addEventListener('DOMContentLoaded', () => {
//   const enterName = document.getElementById('enterName');
//   const enterAge = document.getElementById('enterAge');
//   const welcomeSection = document.getElementById('welcomeSection');
//   const storySection = document.getElementById('storySection');
//   const postStorySection = document.getElementById('postStorySection');
//   const playerNameInput = document.getElementById('playerName');
//   const playerAgeInput = document.getElementById('playerAge');
//   const ageLabel = document.getElementById('ageLabel');
//   const errorMessage = document.getElementById('errorMessage');
//   const storyText = document.getElementById('storyText');
//   const walletBtn = document.getElementById('walletBtn');
//   const gameBtn = document.getElementById('gameBtn');
//   const introVideo = document.getElementById('introVideo');

//   // Sounds
//   const clickSound = document.getElementById('clickSound');
//   const introSound = document.getElementById('introSound');
//   const sparkleSound = document.getElementById('sparkleSound');
//   const levelupSound = document.getElementById('levelupSound');
//   const xpSound = document.getElementById('xpSound');
//   const marsostorySound = document.getElementById('marsostorySound');
//   const afterstorySound = document.getElementById('afterstorySound');
//   const popSound = document.getElementById('popSound');
//   const bondSound = document.getElementById('bondSound');
//   const birthSound = document.getElementById('birthSound');
//   const explosionSound = document.getElementById('explosionSound');

//   let playerName = '';
//   let playerAge = 0;
//   let currentStoryIndex = 0;
//   let isNameEntered = false;

//   // 🎬 Intro Video Fade-Out Logic
//   if (introVideo) {
//     explosionSound.play();
//     setTimeout(() => {
//       introVideo.classList.add('fade-out');
//       setTimeout(() => {
//         introVideo.remove();
//         welcomeSection.classList.add('active');
//         introSound.play();
//       }, 2000);
//     }, 6000); // Change this to match video duration if needed
//   }
  

//   // ⛰️ Story Segments
//   const storySegments = [
//     `Hello, %name%, good ${getTimeGreeting()}.`,
//     "Over the last decade, the Earth's core has been disintegrating.",
//     "But luckily, due to scientific research and breakthroughs by our scientists here on Earth...",
//     "Under the tutelage of Astrida Marvella, the zeptahacker herself...",
//     "We have found a way to warm up Mars' surface and make it habitable for Earth's life.",
//     "And luckily, here you are among one of the first people roaming Mars. You're a survivor. Welcome to MarsoVerse."
//   ];

//   function getTimeGreeting() {
//     const h = new Date().getHours();
//     if (h < 12) return 'morning';
//     if (h < 18) return 'afternoon';
//     return 'evening';
//   }

//   function play(audio, duration = null) {
//     if (!audio) return;
//     try {
//       audio.currentTime = 0;
//       audio.play().catch(e => console.warn(`${audio.id} failed`, e));
//       if (duration) setTimeout(() => audio.pause(), duration);
//     } catch (e) {
//       console.warn(`Audio error on ${audio.id}`, e);
//     }
//   }
//     document.getElementById('tugScroll').addEventListener('click', () => {
//   document.getElementById('enterName').scrollIntoView({ behavior: 'smooth' });
// });

// const typingSound = document.getElementById('typingSound');

// function updateStory() {
//   const text = storySegments[currentStoryIndex].replace('%name%', playerName);
//   storyText.textContent = text;
//   storyText.classList.remove('animate');
//   void storyText.offsetWidth;
//   storyText.classList.add('animate');

//   play(popSound);
//   play(clickSound);
//   play(typingSound);

//   setTimeout(() => {
//     typingSound.pause();
//     currentStoryIndex++;
//     if (currentStoryIndex < storySegments.length) {
//       updateStory();
//     } else {
//       storySection.classList.replace('active', 'hidden');
//       postStorySection.classList.replace('hidden', 'active');
//       postStorySection.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, 4000);
// }


//   // function updateStory() {
//   //   const text = storySegments[currentStoryIndex].replace('%name%', playerName);
//   //   storyText.textContent = text;
//   //   storyText.classList.remove('animate');
//   //   void storyText.offsetWidth;
//   //   storyText.classList.add('animate');
//   //   play(popSound);
//   //   play(clickSound);

//   //   setTimeout(() => {
//   //     currentStoryIndex++;
//   //     if (currentStoryIndex < storySegments.length) {
//   //       updateStory();
//   //     } else {
//   //       storySection.classList.replace('active', 'hidden');
//   //       postStorySection.classList.replace('hidden', 'active');
//   //       postStorySection.scrollIntoView({ behavior: 'smooth' });
//   //     }
//   //   }, 4000);
//   // }

//   welcomeForm.addEventListener('submit', (e) => {
//     e.preventDefault();

//     const name = playerNameInput.value.trim();
//     const age = parseInt(playerAgeInput.value);

//     if (!isNameEntered) {
//       if (!name) {
//         errorMessage.textContent = 'Please enter your name.';
//         errorMessage.classList.add('active');
//         return;
//       }

//       playerName = name;
//       isNameEntered = true;

//       playerNameInput.classList.add('hidden');
//       playerAgeInput.classList.remove('hidden');
//       playerAgeInput.classList.add('active');
//       ageLabel.classList.remove('hidden');
//       ageLabel.classList.add('active');
//       errorMessage.classList.remove('active');

//       play(clickSound);
//       return;
//     }

//     if (!age || age < 18 || age > 100) {
//       errorMessage.textContent = 'Please enter a valid age (18–100).';
//       errorMessage.classList.add('active');
//       return;
//     }

//     playerAge = age;

//     localStorage.setItem('marsoverseState', JSON.stringify({
//       playerName,
//       age: playerAge
//     }));

//     welcomeSection.classList.replace('active', 'hidden');
//     storySection.classList.replace('hidden', 'active');
//     storySection.scrollIntoView({ behavior: 'smooth' });

//     play(introSound);
//     play(marsostorySound);
//     updateStory();
//   });

//   playerNameInput.addEventListener('input', () => {
//     if (playerNameInput.value.trim()) {
//       errorMessage.classList.remove('active');
//     }
//   });

//   playerAgeInput.addEventListener('input', () => {
//     if (playerAgeInput.value.trim()) {
//       errorMessage.classList.remove('active');
//     }
//   });

//   storySection.addEventListener('click', () => {
//     play(clickSound);
//   });

//   walletBtn.addEventListener('click', () => {
//     play(sparkleSound, 3000);
//     walletBtn.classList.add('hidden');
//     gameBtn.classList.remove('hidden');
//     introSound.pause();
//     marsostorySound.pause();
//     play(clickSound);
//     setTimeout(() => gameBtn.focus(), 2000);
//   });

//   gameBtn.addEventListener('click', () => {
//     play(afterstorySound);
//     play(clickSound);
//     setTimeout(() => {
//       window.location.href = 'zepta.html';
//     }, afterstorySound?.duration * 1000 || 4000);
//   });
//   document.getElementById('tugScroll').addEventListener('click', () => {
//   document.getElementById('welcomeSection').scrollIntoView({ behavior: 'smooth' });
// });


// });




// document.addEventListener('DOMContentLoaded', () => {
//   const welcomeForm = document.getElementById('welcomeForm');
//   const welcomeSection = document.getElementById('welcomeSection');
//   const storySection = document.getElementById('storySection');
//   const postStorySection = document.getElementById('postStorySection');
//   const playerNameInput = document.getElementById('playerName');
//   const playerAgeInput = document.getElementById('playerAge');
//   const ageLabel = document.getElementById('ageLabel');
//   const errorMessage = document.getElementById('errorMessage');
//   const storyText = document.getElementById('storyText');
//   const walletBtn = document.getElementById('walletBtn');
//   const gameBtn = document.getElementById('gameBtn');
//   const clickSound = document.getElementById('clickSound');
//   const introSound = document.getElementById('introSound');
//   const sparkleSound = document.getElementById('sparkleSound');
//   const levelupSound = document.getElementById('levelupSound');
//   const xpSound = document.getElementById('xpSound');
//   const marsostorySound = document.getElementById('marsostorySound');
//   const afterstorySound = document.getElementById('afterstorySound');
//   const popSound = document.getElementById('popSound');
  
//   let playerName = '';
//   let playerAge = 25;
//   let currentStoryIndex = 0;
//   let isNameSubmitted = false;
  
//   // Story segments
//   const storySegments = [
//     `Hello, %name%, good ${getTimeGreeting()}.`,
//     "Over the last decade, the Earth's core has been disintegrating.",
//     "But luckily, due to scientific research and breakthroughs by our scientists here on Earth...",
//     "Under the tutelage of Astrida Marvella, the zeptahacker herself...",
//     "We have found a way to warm up Mars' surface and make it habitable for Earth's life.",
//     "And luckily, here you are among one of the first people roaming Mars. You're a survivor. Welcome to MarsoVerse."
//   ];
  
//   // Determine time-based greeting
//   function getTimeGreeting() {
//     const hours = new Date().getHours();
//     if (hours < 12) return 'morning';
//     if (hours < 18) return 'afternoon';
//     return 'night';
//   }
  
//   // Play sound with error handling
//   function playSound(audio, duration = null) {
//     if (audio) {
//       try {
//         audio.currentTime = 0;
//         audio.play().catch(e => console.error(`Audio playback failed: ${audio.id}`, e));
//         if (duration) setTimeout(() => audio.pause(), duration);
//       } catch (e) {
//         console.error(`Error playing audio: ${audio.id}`, e);
//       }
//     }
//   }
  
//   // Update story text
//   function updateStoryText() {
//     const text = storySegments[currentStoryIndex].replace('%name%', playerName);
//     storyText.textContent = text;
//     storyText.classList.remove('animate');
//     void storyText.offsetWidth; // Trigger reflow
//     storyText.classList.add('animate');
//     playSound(popSound);
//     playSound(clickSound);
    
//     // Auto-advance after typewriter animation
//     setTimeout(() => {
//       currentStoryIndex++;
//       if (currentStoryIndex < storySegments.length) {
//         updateStoryText();
//       } else {
//         storySection.classList.replace('active', 'hidden');
//         postStorySection.classList.replace('hidden', 'active');
//         postStorySection.scrollIntoView({ behavior: 'smooth' });
//       }
//     }, 4000); // Matches typewriter animation duration
//   }
  
//   // Form submission
//   welcomeForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     if (!isNameSubmitted) {
//       playerName = playerNameInput.value.trim();
//       if (!playerName) {
//         errorMessage.textContent = 'Please enter your name.';
//         errorMessage.classList.add('active');
//         playerNameInput.focus();
//         return;
//       }
//       errorMessage.classList.remove('active');
//       playerNameInput.classList.add('hidden');
//       playerAgeInput.classList.remove('hidden');
//       playerAgeInput.classList.add('active');
//       ageLabel.classList.remove('hidden');
//       ageLabel.classList.add('active');
//       isNameSubmitted = true;
//       playSound(clickSound);
//     } else {
//       playerAge = parseInt(playerAgeInput.value);
//       if (!playerAge || playerAge < 18 || playerAge > 100) {
//         errorMessage.textContent = 'Please enter a valid age (18–100).';
//         errorMessage.classList.add('active');
//         playerAgeInput.focus();
//         return;
//       }
//       localStorage.setItem('marsoverseState', JSON.stringify({
//         ...JSON.parse(localStorage.getItem('marsoverseState') || '{}'),
//         playerName,
//         age: playerAge
//       }));
//       welcomeSection.classList.replace('active', 'hidden');
//       storySection.classList.replace('hidden', 'active');
//       updateStoryText();
//       playSound(clickSound);
//       playSound(introSound);
//       playSound(marsostorySound);
//       storySection.scrollIntoView({ behavior: 'smooth' });
//     }
//   });
  
//   // Clear error message
//   playerNameInput.addEventListener('input', () => {
//     if (playerNameInput.value.trim()) errorMessage.classList.remove('active');
//   });
  
//   playerAgeInput.addEventListener('input', () => {
//     if (playerAgeInput.value) errorMessage.classList.remove('active');
//   });
  
//   // Tap to continue (optional, for user control)
//   storySection.addEventListener('click', () => {
//     playSound(clickSound);
//   });
  
//   // Wallet connection
//   walletBtn.addEventListener('click', () => {
//     playSound(sparkleSound, 3000);
//     walletBtn.classList.add('hidden');
//     gameBtn.classList.remove('hidden');
//     introSound.pause();
//     marsostorySound.pause();
//     playSound(clickSound);
//     setTimeout(() => {
//       gameBtn.focus();
//     }, 3000);
//   });
  
//   // Start game
//   gameBtn.addEventListener('click', () => {
//     playSound(afterstorySound);
//     playSound(clickSound);
//     setTimeout(() => {
//       window.location.href = 'zepta.html';
//     }, afterstorySound.duration * 1000 || 3000);
//   });
// });