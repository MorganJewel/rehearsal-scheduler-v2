// ============================================================
// REHEARSAL SCHEDULER - Schedule with Auto-Timers + Production Link
// ============================================================

export const RehearsalScheduler = () => {
  const saveSchedule = async (scheduleName, scheduleBlocks, productionId) => {
    try {
      const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '[]');
      const newSchedule = {
        id: Date.now(),
        name: scheduleName,
        blocks: scheduleBlocks,
        productionId: productionId,
        createdAt: new Date().toISOString()
      };
      savedSchedules.push(newSchedule);
      localStorage.setItem('savedSchedules', JSON.stringify(savedSchedules));
      
      console.log('✅ Schedule saved:', scheduleName);
      return { success: true, data: newSchedule };
    } catch (error) {
      console.error('Error saving schedule:', error);
      return { success: false, error };
    }
  };

  const loadSchedules = async () => {
    try {
      const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '[]');
      console.log('✅ Schedules loaded:', savedSchedules.length);
      return savedSchedules;
    } catch (error) {
      console.error('Error loading schedules:', error);
      return [];
    }
  };

  const getProductions = () => {
    return JSON.parse(localStorage.getItem('productions') || '[]');
  };

  // Sample schedule for testing
  let schedule = [
    { id: 1, name: 'Scene 1: Opening', duration: 15, type: 'scene' },
    { id: 2, name: 'Break', duration: 5, type: 'break' },
    { id: 3, name: 'Scene 2: Act II', duration: 20, type: 'scene' },
    { id: 4, name: 'Technical Notes', duration: 10, type: 'notes' },
    { id: 5, name: 'Scene 3: Finale', duration: 12, type: 'scene' }
  ];

  // Check if loading a saved schedule
  const loadedScheduleId = localStorage.getItem('loadScheduleId');
  if (loadedScheduleId) {
    const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '[]');
    const found = savedSchedules.find(s => s.id === parseInt(loadedScheduleId));
    if (found) {
      schedule = found.blocks;
      localStorage.removeItem('loadScheduleId');
    }
  }

  let currentBlockIndex = 0;
  let timeRemaining = 0;
  let isRunning = false;
  let timerInterval = null;

  const startBlock = (blockIndex, autoStart = true) => {
    currentBlockIndex = blockIndex;
    const block = schedule[blockIndex];
    timeRemaining = block.duration * 60;
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

    const blocks = document.querySelectorAll('.schedule-block');
    blocks.forEach((block, idx) => {
      if (idx === currentBlockIndex) {
        block.classList.add('active');
      } else {
        block.classList.remove('active');
      }
    });
  };

  const loadSavedSchedules = async () => {
    const schedules = await loadSchedules();
    const productions = getProductions();
    const list = document.getElementById('savedSchedulesList');
    
    if (!schedules || schedules.length === 0) {
      list.innerHTML = '<p class="placeholder">No saved schedules yet</p>';
      return;
    }

    list.innerHTML = schedules.map(sched => {
      const prod = productions.find(p => p.id === parseInt(sched.productionId));
      const prodName = prod ? prod.title : 'No Production';
      
      return `
        <div class="saved-schedule-item">
          <div class="sched-info">
            <p class="sched-name">${sched.name}</p>
            <p class="sched-date">${new Date(sched.createdAt).toLocaleDateString()}</p>
            <p class="sched-production">📽️ ${prodName}</p>
          </div>
          <button class="btn-small" id="load-${sched.id}">Load</button>
        </div>
      `;
    }).join('');

    // Attach load buttons
    schedules.forEach(sched => {
      const btn = document.getElementById(`load-${sched.id}`);
      if (btn) {
        btn.addEventListener('click', () => {
          localStorage.setItem('loadScheduleId', sched.id.toString());
          location.reload();
        });
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
          <div class="form-group">
            <label for="prodSelect">Production</label>
            <select id="prodSelect" class="schedule-name-input" required>
              <option value="">-- Select a Production --</option>
            </select>
            <small style="color: var(--text-light); margin-top: 0.25rem;">Need a new production? <a href="#" id="createProdLink" style="color: var(--color-primary); text-decoration: underline;">Create one</a></small>
          </div>
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

  setTimeout(async () => {
    // Populate production dropdown
    const prodSelect = document.getElementById('prodSelect');
    const productions = getProductions();
    productions.forEach(prod => {
      const option = document.createElement('option');
      option.value = prod.id;
      option.textContent = prod.title;
      prodSelect.appendChild(option);
    });

    // Create production link
    const createProdLink = document.getElementById('createProdLink');
    if (createProdLink) {
      createProdLink.addEventListener('click', (e) => {
        e.preventDefault();
        const title = prompt('Production name:');
        if (!title) return;
        const playwright = prompt('Playwright name:');
        if (!playwright) return;
        
        const prods = JSON.parse(localStorage.getItem('productions') || '[]');
        const newProd = {
          id: Date.now(),
          title,
          playwright,
          createdAt: new Date().toISOString()
        };
        prods.push(newProd);
        localStorage.setItem('productions', JSON.stringify(prods));
        
        // Reload production dropdown
        prodSelect.innerHTML = '<option value="">-- Select a Production --</option>';
        prods.forEach(prod => {
          const option = document.createElement('option');
          option.value = prod.id;
          option.textContent = prod.title;
          prodSelect.appendChild(option);
        });
        prodSelect.value = newProd.id;
        alert('✅ Production created!');
      });
    }

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

    document.getElementById('saveScheduleBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('scheduleName')?.value;
      const prodId = document.getElementById('prodSelect')?.value;
      
      if (!name) {
        alert('Please enter a schedule name');
        return;
      }
      if (!prodId) {
        alert('Please select a production');
        return;
      }
      
      const result = await saveSchedule(name, schedule, prodId);
      if (result.success) {
        alert('✅ Schedule saved!');
        document.getElementById('scheduleName').value = '';
        document.getElementById('prodSelect').value = '';
        loadSavedSchedules();
      } else {
        alert('❌ Error saving schedule');
      }
    });

    await loadSavedSchedules();
  }, 100);

  return HTML;
};