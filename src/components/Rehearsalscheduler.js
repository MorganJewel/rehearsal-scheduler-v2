// ============================================================
// REHEARSAL SCHEDULER - Schedule with Auto-Timers
// Displays schedule blocks and auto-advances through them
// ============================================================

export const RehearsalScheduler = () => {
  // Database functions (inline)
  const saveSchedule = async (scheduleName, scheduleBlocks, userId) => {
    try {
      // Create a temporary production first if needed
      const { data: prodData, error: prodError } = await window.supabaseDb
        .from('productions')
        .insert({
          owner_id: userId || '00000000-0000-0000-0000-000000000000',
          title: 'Temp Production',
          acts: 1
        })
        .select();

      const productionId = prodData?.[0]?.id || '00000000-0000-0000-0000-000000000000';

      const { data, error } = await window.supabaseDb
        .from('rehearsal_sessions')
        .insert({
          production_id: productionId,
          session_date: new Date().toISOString().split('T')[0],
          start_time: '09:00:00',
          end_time: '17:00:00',
          session_type: 'custom',
          location: 'Studio',
          notes: JSON.stringify(scheduleBlocks)
        })
        .select();

      if (error) throw error;
      console.log('✅ Schedule saved:', scheduleName);
      return { success: true, data };
    } catch (error) {
      console.error('Error saving schedule:', error);
      return { success: false, error };
    }
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await window.supabaseDb
        .from('rehearsal_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('✅ Schedules loaded:', data.length);
      return data || [];
    } catch (error) {
      console.error('Error loading schedules:', error);
      return [];
    }
  };
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

        <div class="save-schedule">
          <h3>💾 Save This Schedule</h3>
          <input 
            type="text" 
            id="scheduleName" 
            placeholder="Enter schedule name (e.g., 'Act 1 Blocking')"
            class="schedule-name-input"
          />
          <button class="btn-primary" id="saveScheduleBtn">Save Schedule</button>
        </div>
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

        <div class="saved-schedules">
          <h3>📚 Saved Schedules</h3>
          <div id="savedSchedulesList" class="saved-list">
            <p class="placeholder">No saved schedules yet</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  setTimeout(async () => {
    document.getElementById('startBtn')?.addEventListener('click', () => {
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
        stopTimer();
        startBlock(idx, false);
      });
    });

    // Save schedule button
    document.getElementById('saveScheduleBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('scheduleName')?.value;
      if (!name) {
        alert('Please enter a schedule name');
        return;
      }
      const result = await saveSchedule(name, schedule, 'current-user');
      if (result.success) {
        alert('✅ Schedule saved!');
        document.getElementById('scheduleName').value = '';
        loadSavedSchedules();
      } else {
        alert('❌ Error saving schedule');
      }
    });

    // Load saved schedules on init
    loadSavedSchedules();
  }, 100);

  const loadSavedSchedules = async () => {
    const schedules = await loadSchedules();
    const list = document.getElementById('savedSchedulesList');
    
    if (schedules.length === 0) {
      list.innerHTML = '<p class="placeholder">No saved schedules yet</p>';
      return;
    }

    list.innerHTML = schedules.map(sched => `
      <div class="saved-schedule-item">
        <div class="sched-info">
          <p class="sched-name">${sched.session_type}</p>
          <p class="sched-date">${new Date(sched.session_date).toLocaleDateString()}</p>
        </div>
        <button class="btn-small" data-id="${sched.id}">Load</button>
      </div>
    `).join('');
  };

  return HTML;
};