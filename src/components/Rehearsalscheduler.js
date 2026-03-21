// ============================================================
// REHEARSAL SCHEDULER - Schedule with Auto-Timers
// Displays schedule blocks and auto-advances through them
// ============================================================

export const RehearsalScheduler = () => {
  // Sample schedule for testing
  const schedule = [
    { id: 1, name: 'Scene 1: Opening', duration: 15, type: 'scene' },
    { id: 2, name: 'Break', duration: 5, type: 'break' },
    { id: 3, name: 'Scene 2: Act II', duration: 20, type: 'scene' },
    { id: 4, name: 'Technical Notes', duration: 10, type: 'notes' },
    { id: 5, name: 'Scene 3: Finale', duration: 12, type: 'scene' }
  ];

  let currentBlockIndex = 0;
  let timeRemaining = 0;
  let isRunning = false;
  let timerInterval = null;

  const startBlock = (blockIndex, autoStart = true) => {
    currentBlockIndex = blockIndex;
    const block = schedule[blockIndex];
    timeRemaining = block.duration * 60; // Convert to seconds
    isRunning = autoStart;
    updateDisplay();
    if (autoStart) startTimer();
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        // Auto-advance to next block
        if (currentBlockIndex < schedule.length - 1) {
          setTimeout(() => {
            startBlock(currentBlockIndex + 1);
          }, 1000);
        } else {
          isRunning = false;
          updateDisplay();
        }
      }
    }, 1000);
  };

  const pauseTimer = () => {
    isRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    updateDisplay();
  };

  const resumeTimer = () => {
    if (timeRemaining > 0) {
      isRunning = true;
      startTimer();
    }
  };

  const stopTimer = () => {
    isRunning = false;
    timeRemaining = 0;
    if (timerInterval) clearInterval(timerInterval);
    updateDisplay();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateDisplay = () => {
    const timerDisplay = document.getElementById('timerDisplay');
    const currentBlock = schedule[currentBlockIndex];
    
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(timeRemaining);
    }

    const blockNameEl = document.getElementById('currentBlockName');
    if (blockNameEl) {
      blockNameEl.textContent = currentBlock.name;
    }

    // Update block highlights
    const blocks = document.querySelectorAll('.schedule-block');
    blocks.forEach((block, idx) => {
      if (idx === currentBlockIndex) {
        block.classList.add('active');
      } else {
        block.classList.remove('active');
      }
    });
  };

  const HTML = `
    <div class="scheduler-container">
      <div class="timer-section">
        <h2>🎭 Rehearsal Timer</h2>
        
        <div class="current-block">
          <p class="block-label">Now Playing:</p>
          <p class="block-name" id="currentBlockName">${schedule[0].name}</p>
        </div>

        <div class="timer-display-large">
          <div class="time" id="timerDisplay">15:00</div>
        </div>

        <div class="timer-controls">
          <button class="btn-timer" id="startBtn">▶️ START</button>
          <button class="btn-timer" id="pauseBtn">⏸️ PAUSE</button>
          <button class="btn-timer" id="stopBtn">⏹️ STOP</button>
        </div>

        <p class="timer-info">Click START to begin. Timer auto-advances to next block.</p>
      </div>

      <div class="schedule-section">
        <h3>📋 Today's Schedule</h3>
        <div class="schedule-list">
          ${schedule.map((block, idx) => `
            <div class="schedule-block" data-index="${idx}">
              <div class="block-info">
                <span class="block-type ${block.type}">${block.type}</span>
                <span class="block-name-small">${block.name}</span>
                <span class="block-duration">${block.duration} min</span>
              </div>
              <button class="btn-block" data-index="${idx}">Jump to</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  setTimeout(() => {
    document.getElementById('startBtn')?.addEventListener('click', () => {
      // If no block selected yet, start from block 0. Otherwise continue current block
      if (currentBlockIndex === 0 && timeRemaining === 0) {
        startBlock(0, true);
      } else {
        resumeTimer();
      }
    });
    document.getElementById('pauseBtn')?.addEventListener('click', pauseTimer);
    document.getElementById('stopBtn')?.addEventListener('click', stopTimer);
    
    document.querySelectorAll('.btn-block').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        stopTimer(); // Stop current timer first
        startBlock(idx, false); // Jump to block but don't auto-start
      });
    });
  }, 100);

  return HTML;
};