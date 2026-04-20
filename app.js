/**
 * Wim Hof Breathing App
 * ─────────────────────
 * Guided breathwork timer with retention tracking,
 * session logging, audio cues, and localStorage persistence.
 */

// ===== STATE =====
const state = {
  breathCount: 30,
  totalCycles: 3,
  retentionTime: 30,
  currentCycle: 0,
  currentBreath: 0,
  phase: 'idle', // idle | breathing | hold | recovery
  retentionElapsed: 0,
  recoveryRemaining: 15,
  sessionLog: [],
  totalSessionBreaths: 0,
  bestRetention: '0:00',
  isMuted: false,
  maxBreaths: 40,
  minBreaths: 10,
};

let breathInterval = null;
let retentionTimer = null;
let recoveryTimer = null;

// ===== DOM CACHE =====
const $ = (id) => document.getElementById(id);

const dom = {};

function cacheDom() {
  dom.orb = $('orb');
  dom.orbWrap = $('orbWrap');
  dom.breathCount = $('breathCount');
  dom.breathSetting = $('breathSetting');
  dom.cycleSetting = $('cycleSetting');
  dom.phaseText = $('phaseText');
  dom.phaseSubtext = $('phaseSubtext');
  dom.cycleHeader = $('cycleHeader');
  dom.retDisplay = $('retDisplay');
  dom.retTimer = $('retTimer');
  dom.progressWrap = $('progressWrap');
  dom.progressFill = $('progressFill');
  dom.logList = $('logList');
  dom.startBtn = $('startBtn');
  dom.recoveryCount = $('recoveryCount');
  dom.statRounds = $('statRounds');
  dom.statBreaths = $('statBreaths');
  dom.statBest = $('statBest');
  dom.soundToggle = $('soundToggle');
  dom.toast = $('toast');
}

// ===== AUDIO =====
const audioElements = {};

function initAudio() {
  audioElements[30] = document.getElementById('audio30');
  audioElements[60] = document.getElementById('audio60');
  audioElements[90] = document.getElementById('audio90');

  // Force load all audio files and log status
  Object.entries(audioElements).forEach(([key, audio]) => {
    if (audio) {
      audio.load();
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio ${key}s ready`);
      });
      audio.addEventListener('error', (e) => {
        console.error(`Audio ${key}s failed to load:`, audio.error);
      });
    } else {
      console.error(`Audio element for ${key}s not found in DOM`);
    }
  });
}

function playAudio(seconds) {
  if (state.isMuted) {
    console.log('Audio muted, skipping playback');
    return;
  }
  const audio = audioElements[seconds];
  if (audio) {
    console.log(`Playing ${seconds}s audio, readyState: ${audio.readyState}, src: ${audio.src}`);
    audio.currentTime = 0;
    audio.play().then(() => {
      console.log(`Audio ${seconds}s playing successfully`);
    }).catch((err) => {
      console.error(`Audio ${seconds}s play failed:`, err.message);
    });
  } else {
    console.error(`No audio element found for ${seconds}s`);
  }
}

function stopAllAudio() {
  Object.values(audioElements).forEach((a) => {
    if (a) { 
      a.pause(); 
      a.currentTime = 0; 
      a.onended = null; // Prevent triggers after stop
    }
  });
}

function toggleSound() {
  state.isMuted = !state.isMuted;
  dom.soundToggle.classList.toggle('muted', state.isMuted);
  dom.soundToggle.textContent = state.isMuted ? '🔇' : '🔊';
  if (state.isMuted) stopAllAudio();
  showToast(state.isMuted ? 'Sound muted' : 'Sound enabled');
  saveSettings();
}

// ===== CONTROLS =====
function changeBreaths(delta) {
  if (state.phase !== 'idle') return;
  state.breathCount = Math.max(10, Math.min(60, state.breathCount + delta));
  dom.breathSetting.textContent = state.breathCount;
  dom.breathCount.textContent = state.breathCount;
  saveSettings();
}

function changeCycles(delta) {
  if (state.phase !== 'idle') return;
  state.totalCycles = Math.max(1, Math.min(10, state.totalCycles + delta));
  dom.cycleSetting.textContent = state.totalCycles;
  saveSettings();
}

function selectRetention(el) {
  if (state.phase !== 'idle') return;
  document.querySelectorAll('.ret-chip').forEach((c) => c.classList.remove('active'));
  el.classList.add('active');
  state.retentionTime = parseInt(el.dataset.val);
  saveSettings();
}

function handleOrbClick() {
  if (state.phase === 'idle') startSession();
}

// ===== SESSION FLOW =====
function startSession() {
  if (state.phase !== 'idle') return;
  state.currentCycle = 0;
  state.sessionLog = [];
  state.totalSessionBreaths = 0;
  state.bestRetention = '0:00';
  dom.startBtn.disabled = true;
  updateStats();

  showToast('Session started — breathe deeply');
  startBreathingRound();
}

function startBreathingRound() {
  state.currentCycle++;
  state.currentBreath = state.breathCount;
  state.phase = 'breathing';

  // [New] Play/Restart audio for every round
  stopAllAudio();
  if (!state.isMuted) {
    const sessionAudio = audioElements[state.retentionTime];
    if (sessionAudio) {
      sessionAudio.currentTime = 0;
      sessionAudio.play().then(() => {
        console.log(`Round ${state.currentCycle} audio playing`);
      }).catch(err => console.error('Session audio failed:', err.message));

      // [New] Wait for audio to end before moving to next round
      sessionAudio.onended = () => {
        console.log(`Round ${state.currentCycle} audio ended`);
        if (state.currentCycle < state.totalCycles) {
          setPhase(`ROUND ${state.currentCycle} COMPLETE`, 'idle');
          setSubtext('Next round in 3 seconds…');
          setTimeout(startBreathingRound, 3000);
        } else {
          finishSession();
        }
      };
    }
  }

  dom.cycleHeader.textContent = `ROUND ${state.currentCycle}/${state.totalCycles}`;
  dom.cycleHeader.className = 'status-badge active';
  setPhase('BREATHE IN · BREATHE OUT', 'breathing');
  setSubtext(`Round ${state.currentCycle} of ${state.totalCycles}`);
  dom.progressWrap.classList.add('active');
  dom.retDisplay.classList.remove('active');
  dom.recoveryCount.textContent = '';
  dom.breathCount.textContent = state.currentBreath;
  dom.progressFill.style.width = '0%';

  let toggle = true;
  setOrbAnim('inhale');

  breathInterval = setInterval(() => {
    toggle = !toggle;
    if (toggle) {
      setOrbAnim('inhale');
      setPhase('INHALE', 'breathing');
    } else {
      setOrbAnim('exhale');
      setPhase('EXHALE', 'breathing');
      state.currentBreath--;
      dom.breathCount.textContent = Math.max(0, state.currentBreath);
      updateProgress(state.breathCount - state.currentBreath, state.breathCount);

      if (state.currentBreath <= 0) {
        clearInterval(breathInterval);
        breathInterval = null;
        state.totalSessionBreaths += state.breathCount;
        updateStats();
        setTimeout(startRetention, 400);
      }
    }
  }, 1883);
}

function startRetention() {
  state.phase = 'hold';
  state.retentionElapsed = 0;

  dom.progressWrap.classList.remove('active');
  dom.retDisplay.classList.add('active');
  dom.breathCount.textContent = '∞';
  dom.orb.className = 'orb hold';
  setPhase('HOLD YOUR BREATH', 'hold');
  setSubtext(`Retention — ${formatTime(state.retentionTime)} target`);
  updateRetDisplay();

  retentionTimer = setInterval(() => {
    state.retentionElapsed++;
    updateRetDisplay();

    if (state.retentionElapsed >= state.retentionTime) {
      clearInterval(retentionTimer);
      retentionTimer = null;
      logCycle();
      renderLog();
      updateStats();
      startRecovery();
    }
  }, 1000);
}

function startRecovery() {
  state.phase = 'recovery';
  state.recoveryRemaining = 15;

  dom.retDisplay.classList.remove('active');
  dom.breathCount.textContent = '↑';
  setOrbAnim('inhale');
  setPhase('DEEP BREATH IN & HOLD', 'recovery');
  setSubtext('Recovery breath');
  dom.orb.className = 'orb hold';
  dom.recoveryCount.textContent = `${state.recoveryRemaining}s`;

  recoveryTimer = setInterval(() => {
    state.recoveryRemaining--;
    dom.recoveryCount.textContent = state.recoveryRemaining > 0 ? `${state.recoveryRemaining}s` : '';

    if (state.recoveryRemaining <= 0) {
      clearInterval(recoveryTimer);
      recoveryTimer = null;
      dom.orb.className = 'orb';
      dom.recoveryCount.textContent = '';

      // If no audio is playing (e.g. muted), use the old timeout logic
      if (state.isMuted || !audioElements[state.retentionTime]) {
        if (state.currentCycle < state.totalCycles) {
          setPhase(`ROUND ${state.currentCycle} COMPLETE`, 'idle');
          setSubtext('Next round in 3 seconds…');
          setTimeout(startBreathingRound, 3000);
        } else {
          finishSession();
        }
      } else {
        setPhase('AWAITING NEXT ROUND', 'idle');
        setSubtext('Finish current audio track…');
      }
    }
  }, 1000);
}

function finishSession() {
  state.phase = 'idle';
  stopAllAudio();
  clearAllTimers();

  dom.orb.className = 'orb';
  dom.breathCount.textContent = state.breathCount;
  dom.retDisplay.classList.remove('active');
  dom.progressWrap.classList.remove('active');
  dom.recoveryCount.textContent = '';
  setPhase('SESSION COMPLETE ✦', 'done');
  setSubtext(`${state.totalCycles} rounds · ${state.totalSessionBreaths} breaths`);
  dom.cycleHeader.textContent = 'COMPLETE';
  dom.cycleHeader.className = 'status-badge done';
  dom.startBtn.disabled = false;

  saveSessionHistory();
  showToast('Great session! Namaste 🙏');
}

function resetSession() {
  clearAllTimers();
  stopAllAudio();
  state.phase = 'idle';
  state.currentCycle = 0;
  state.totalSessionBreaths = 0;
  state.bestRetention = '0:00';
  state.sessionLog = [];

  dom.orb.className = 'orb';
  dom.breathCount.textContent = state.breathCount;
  dom.retDisplay.classList.remove('active');
  dom.progressWrap.classList.remove('active');
  dom.progressFill.style.width = '0%';
  dom.recoveryCount.textContent = '';
  setPhase('TAP THE ORB TO BEGIN', 'idle');
  setSubtext('Configure your session below');
  dom.cycleHeader.textContent = 'READY';
  dom.cycleHeader.className = 'status-badge ready';
  dom.startBtn.disabled = false;

  updateStats();
  renderLog();
}

// ===== HELPERS =====
function clearAllTimers() {
  if (breathInterval) { clearInterval(breathInterval); breathInterval = null; }
  if (retentionTimer) { clearInterval(retentionTimer); retentionTimer = null; }
  if (recoveryTimer) { clearInterval(recoveryTimer); recoveryTimer = null; }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateRetDisplay() {
  dom.retTimer.textContent = formatTime(state.retentionElapsed);
}

function updateProgress(done, total) {
  const pct = Math.min(100, Math.round((done / total) * 100));
  dom.progressFill.style.width = pct + '%';
}

function setOrbAnim(anim) {
  dom.orb.className = 'orb';
  void dom.orb.offsetWidth; // trigger reflow
  dom.orb.classList.add(anim);
}

function setPhase(text, phaseName) {
  dom.phaseText.textContent = text;
  const colorMap = {
    hold: 'var(--glow)',
    done: 'var(--success)',
    recovery: 'var(--glow-warm)',
    breathing: 'var(--ice)',
    idle: 'var(--ice)',
  };
  dom.phaseText.style.color = colorMap[phaseName] || 'var(--ice)';
}

function setSubtext(text) {
  dom.phaseSubtext.textContent = text;
}

// ===== LOGGING =====
function logCycle() {
  const retFormatted = formatTime(state.retentionElapsed);
  state.sessionLog.push({
    cycle: state.currentCycle,
    total: state.totalCycles,
    ret: retFormatted,
    retSeconds: state.retentionElapsed,
    breaths: state.breathCount,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Update best retention
  if (state.retentionElapsed > parseTimeToSeconds(state.bestRetention)) {
    state.bestRetention = retFormatted;
  }
}

function parseTimeToSeconds(timeStr) {
  const [m, s] = timeStr.split(':').map(Number);
  return m * 60 + s;
}

function renderLog() {
  if (!state.sessionLog.length) {
    dom.logList.innerHTML =
      '<div class="log-empty">No rounds completed yet — begin a session to track your progress.</div>';
    return;
  }
  dom.logList.innerHTML = state.sessionLog
    .slice()
    .reverse()
    .map(
      (e) => `
    <div class="log-item fade-in">
      <span class="log-cycle">Round ${e.cycle}/${e.total} · ${e.breaths} breaths</span>
      <span class="log-ret">${e.ret}</span>
      <span class="log-time">${e.time}</span>
    </div>`
    )
    .join('');
}

function clearLog() {
  state.sessionLog = [];
  state.totalSessionBreaths = 0;
  state.bestRetention = '0:00';
  updateStats();
  renderLog();
  showToast('Session log cleared');
}

// ===== STATS =====
function updateStats() {
  dom.statRounds.textContent = state.sessionLog.length;
  dom.statBreaths.textContent = state.totalSessionBreaths;
  dom.statBest.textContent = state.bestRetention;
}

// ===== PERSISTENCE =====
function saveSettings() {
  try {
    localStorage.setItem(
      'wimhof_settings',
      JSON.stringify({
        breathCount: state.breathCount,
        totalCycles: state.totalCycles,
        retentionTime: state.retentionTime,
        isMuted: state.isMuted,
      })
    );
  } catch (e) {}
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('wimhof_settings'));
    if (saved) {
      state.breathCount = saved.breathCount || 30;
      state.totalCycles = saved.totalCycles || 3;
      state.retentionTime = saved.retentionTime || 30;
      state.isMuted = saved.isMuted || false;

      dom.breathSetting.textContent = state.breathCount;
      dom.breathCount.textContent = state.breathCount;
      dom.cycleSetting.textContent = state.totalCycles;

      // Activate the correct retention chip
      document.querySelectorAll('.ret-chip').forEach((c) => {
        c.classList.toggle('active', parseInt(c.dataset.val) === state.retentionTime);
      });

      // Sound state
      dom.soundToggle.classList.toggle('muted', state.isMuted);
      dom.soundToggle.textContent = state.isMuted ? '🔇' : '🔊';
    }
  } catch (e) {}
}

function saveSessionHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('wimhof_history') || '[]');
    history.push({
      date: new Date().toISOString(),
      rounds: state.sessionLog.length,
      totalBreaths: state.totalSessionBreaths,
      bestRetention: state.bestRetention,
      log: state.sessionLog,
    });
    // Keep last 50 sessions
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem('wimhof_history', JSON.stringify(history));
  } catch (e) {}
}

// ===== TOAST =====
let toastTimeout = null;
function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 2500);
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;
  const count = window.innerWidth < 480 ? 15 : 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = 8 + Math.random() * 12 + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.width = 1 + Math.random() * 2 + 'px';
    p.style.height = p.style.width;
    p.style.opacity = 0.1 + Math.random() * 0.3;
    container.appendChild(p);
  }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.phase === 'idle') startSession();
    }
    if (e.code === 'Escape') {
      resetSession();
    }
    if (e.code === 'KeyM') {
      toggleSound();
    }
  });
}

// ===== INIT =====
function init() {
  cacheDom();
  initAudio();
  loadSettings();
  createParticles();
  setupKeyboard();
  updateStats();
  renderLog();
}

document.addEventListener('DOMContentLoaded', init);
