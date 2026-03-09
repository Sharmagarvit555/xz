/* =========================================================
   MindWell — script.js
   All interactivity & localStorage logic
   ========================================================= */

'use strict';

// ── Utility Helpers ──────────────────────────────────────

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── 1. Dark / Light Mode Toggle ──────────────────────────

(function initTheme() {
  const btn = document.getElementById('themeToggle');
  const icon = btn.querySelector('.theme-icon');
  const savedTheme = localStorage.getItem('mw_theme') || 'light';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      icon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      icon.textContent = '🌙';
    }
    localStorage.setItem('mw_theme', theme);
  }

  applyTheme(savedTheme);

  btn.addEventListener('click', function () {
    const isDark = document.body.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
  });
}());

// ── 2. Breathing Exercise ─────────────────────────────────

(function initBreathing() {
  const circle = document.getElementById('breathingCircle');
  const phaseEl = document.getElementById('breathPhase');
  const countEl = document.getElementById('breathCount');
  const instructionEl = document.getElementById('breathInstruction');
  const btn = document.getElementById('breathingBtn');

  const steps = [
    { id: 'step-inhale', name: 'Inhale',  instruction: 'Breathe in slowly through your nose…',   duration: 4, cls: 'active-inhale' },
    { id: 'step-hold1',  name: 'Hold',    instruction: 'Hold your breath gently…',                duration: 4, cls: 'active-hold1' },
    { id: 'step-exhale', name: 'Exhale',  instruction: 'Breathe out slowly through your mouth…', duration: 4, cls: 'active-exhale' },
    { id: 'step-hold2',  name: 'Hold',    instruction: 'Hold for a moment before the next cycle…',duration: 4, cls: 'active-hold2' }
  ];

  let running = false;
  let stepIndex = 0;
  let countdown = 0;
  let intervalId = null;

  function highlightStep(idx) {
    steps.forEach(function (s) {
      document.getElementById(s.id).classList.toggle('active', false);
    });
    document.getElementById(steps[idx].id).classList.add('active');
  }

  function tick() {
    const step = steps[stepIndex];

    if (countdown <= 0) {
      // advance to next phase
      circle.classList.remove(step.cls);
      stepIndex = (stepIndex + 1) % steps.length;
      const nextStep = steps[stepIndex];
      countdown = nextStep.duration;

      phaseEl.textContent = nextStep.name;
      instructionEl.textContent = nextStep.instruction;
      highlightStep(stepIndex);
      circle.classList.add(nextStep.cls);
    }

    countEl.textContent = countdown;
    countdown -= 1;
  }

  function startBreathing() {
    running = true;
    btn.textContent = '⏹ Stop';
    stepIndex = 0;
    countdown = steps[0].duration;

    phaseEl.textContent = steps[0].name;
    instructionEl.textContent = steps[0].instruction;
    highlightStep(0);
    circle.classList.add(steps[0].cls);
    countEl.textContent = countdown;

    intervalId = setInterval(tick, 1000);
  }

  function stopBreathing() {
    running = false;
    btn.textContent = '▶ Start';
    clearInterval(intervalId);

    steps.forEach(function (s) {
      circle.classList.remove(s.cls);
      document.getElementById(s.id).classList.remove('active');
    });

    phaseEl.textContent = 'Ready';
    countEl.textContent = '';
    instructionEl.textContent = 'Press Start to begin box breathing';
  }

  btn.addEventListener('click', function () {
    if (running) {
      stopBreathing();
    } else {
      startBreathing();
    }
  });
}());

// ── 3. Gratitude Journal ──────────────────────────────────

(function initJournal() {
  const textarea = document.getElementById('journalText');
  const saveBtn = document.getElementById('saveJournalBtn');
  const entriesContainer = document.getElementById('journalEntries');
  const emptyEl = document.getElementById('journalEmpty');

  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem('mw_journal') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem('mw_journal', JSON.stringify(entries));
  }

  function renderEntries() {
    const entries = loadEntries();

    // clear existing rendered entries (keep the empty-state el)
    Array.from(entriesContainer.querySelectorAll('.journal-entry')).forEach(function (el) {
      el.remove();
    });

    if (entries.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';

    // render newest first
    entries.slice().reverse().forEach(function (entry) {
      const div = document.createElement('div');
      div.className = 'journal-entry';
      div.innerHTML =
        '<div class="entry-content">' +
          '<p class="entry-text">' + sanitizeText(entry.text) + '</p>' +
          '<span class="entry-timestamp">' + sanitizeText(entry.timestamp) + '</span>' +
        '</div>' +
        '<button class="btn btn-danger delete-entry" data-id="' + entry.id + '" aria-label="Delete entry">✕</button>';
      entriesContainer.appendChild(div);
    });
  }

  function handleDelete(id) {
    const entries = loadEntries().filter(function (e) { return e.id !== id; });
    saveEntries(entries);
    renderEntries();
  }

  entriesContainer.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete-entry');
    if (btn) {
      handleDelete(Number(btn.dataset.id));
    }
  });

  saveBtn.addEventListener('click', function () {
    const text = textarea.value.trim();
    if (!text) return;

    const entries = loadEntries();
    entries.push({ id: Date.now(), text: text, timestamp: formatDate(new Date()) });
    saveEntries(entries);
    textarea.value = '';
    renderEntries();
  });

  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveBtn.click();
    }
  });

  renderEntries();
}());

// ── 4. Mood Tracker ───────────────────────────────────────

(function initMoodTracker() {
  const moodBtns = document.querySelectorAll('.mood-btn');
  const saveBtn = document.getElementById('saveMoodBtn');
  const moodLog = document.getElementById('moodLog');

  let selectedMood = null;

  function loadMoods() {
    try {
      return JSON.parse(localStorage.getItem('mw_moods') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveMoods(moods) {
    localStorage.setItem('mw_moods', JSON.stringify(moods));
  }

  function renderMoodLog() {
    const moods = loadMoods();
    moodLog.innerHTML = '';

    if (moods.length === 0) {
      moodLog.innerHTML = '<p class="empty-state">No moods logged yet. Select one above! 🌈</p>';
      return;
    }

    moods.slice().reverse().slice(0, 14).forEach(function (entry) {
      const div = document.createElement('div');
      div.className = 'mood-log-entry';
      div.innerHTML =
        '<span class="mood-log-emoji">' + sanitizeText(entry.emoji) + '</span>' +
        '<div class="mood-log-info">' +
          '<div class="mood-log-label">' + sanitizeText(entry.mood ? entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1) : '') + '</div>' +
          '<div class="mood-log-date">' + sanitizeText(entry.date) + '</div>' +
        '</div>';
      moodLog.appendChild(div);
    });
  }

  moodBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      moodBtns.forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedMood = { mood: btn.dataset.mood, emoji: btn.dataset.emoji };
    });
  });

  saveBtn.addEventListener('click', function () {
    if (!selectedMood) {
      saveBtn.textContent = '⚠ Pick a mood first!';
      setTimeout(function () { saveBtn.textContent = 'Log Mood'; }, 1800);
      return;
    }

    const moods = loadMoods();
    moods.push({
      mood: selectedMood.mood,
      emoji: selectedMood.emoji,
      date: formatDate(new Date()),
      id: Date.now()
    });

    // keep last 30 entries
    if (moods.length > 30) moods.splice(0, moods.length - 30);
    saveMoods(moods);

    moodBtns.forEach(function (b) { b.classList.remove('selected'); });
    selectedMood = null;
    saveBtn.textContent = '✅ Mood Logged!';
    setTimeout(function () { saveBtn.textContent = 'Log Mood'; }, 1800);

    renderMoodLog();
  });

  renderMoodLog();
}());

// ── 5. Positive Affirmations ──────────────────────────────

(function initAffirmations() {
  const affirmations = [
    'You are enough, exactly as you are.',
    'Every day is a new beginning — take a deep breath and start again.',
    'You have survived every difficult day so far. You are stronger than you know.',
    'Your feelings are valid. It\'s okay to not be okay.',
    'You deserve kindness — especially from yourself.',
    'Small steps still move you forward.',
    'You are worthy of love and belonging.',
    'It\'s okay to ask for help. That\'s courage, not weakness.',
    'You bring something unique and irreplaceable to this world.',
    'Progress, not perfection.',
    'Your mental health matters more than your productivity.',
    'Rest is productive. Taking a break is an act of self-love.',
    'You are not your thoughts — you are the one who notices them.',
    'Healing is not linear, and that\'s perfectly okay.',
    'Today, I choose peace over worry.',
    'I am learning, growing, and doing my best.',
    'My past does not define my future.',
    'I am allowed to take up space.',
    'I trust myself to handle whatever comes my way.',
    'I am surrounded by love, even when it\'s hard to see.',
    'One breath at a time. One moment at a time.',
    'I am worthy of good things happening to me.',
    'My feelings are a natural part of being human.',
    'I give myself permission to let go of what I cannot control.',
    'Every storm runs out of rain. This too shall pass.',
    'I choose to nourish my mind, body, and spirit today.',
    'I am proud of how far I have come.',
    'Today, I will be gentle with myself.',
    'I deserve the same compassion I give to others.',
    'I am not alone. Many people care about me and my wellbeing.',
    'I have the power to create positive change in my life.',
    'My sensitivity is a gift, not a weakness.',
    'I choose to focus on what I can control.',
    'I am a work in progress, and that is beautiful.'
  ];

  const textEl = document.getElementById('affirmationText');
  const btn = document.getElementById('newAffirmationBtn');
  let lastIndex = -1;

  function getRandomAffirmation() {
    let index;
    do {
      index = Math.floor(Math.random() * affirmations.length);
    } while (index === lastIndex && affirmations.length > 1);
    lastIndex = index;
    return affirmations[index];
  }

  function showAffirmation() {
    textEl.classList.add('fade-out');
    setTimeout(function () {
      textEl.textContent = getRandomAffirmation();
      textEl.classList.remove('fade-out');
      textEl.classList.add('fade-in');
    }, 300);
  }

  btn.addEventListener('click', showAffirmation);

  // Show a random one on load
  textEl.textContent = getRandomAffirmation();
}());

// ── 6. Calm Sounds ────────────────────────────────────────

(function initSounds() {
  // We use the Web Audio API to generate simple ambient tones/noise
  // since external audio URLs may not always be available.

  const soundBtns = document.querySelectorAll('.sound-btn');
  let activeSound = null;
  let audioCtx = null;
  let activeNodes = [];

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // Creates a looped white/pink noise buffer generator
  function createNoise(ctx, type) {
    const bufferSize = ctx.sampleRate * 2; // 2 sec buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        // Paul Kellet's pink noise approximation
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  function createRain(ctx) {
    const noise = createNoise(ctx, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.4;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    return { source: noise, gain: gainNode, extras: [filter] };
  }

  function createOcean(ctx) {
    const noise = createNoise(ctx, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    lfo.start();
    return { source: noise, gain: gainNode, extras: [filter, lfo, lfoGain] };
  }

  function createBirds(ctx) {
    // Chirp-like tone using oscillators
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);

    const oscSources = [];

    function chirp() {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 1800 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, ctx.currentTime + 0.2);
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      oscSources.push(osc);
    }

    // Schedule chirps
    const timerId = setInterval(function () {
      if (Math.random() > 0.4) chirp();
      if (Math.random() > 0.7) setTimeout(chirp, 150);
    }, 600);

    return { source: null, gain: masterGain, timerId: timerId, extras: [] };
  }

  function createWind(ctx) {
    const noise = createNoise(ctx, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 1.5;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.3;
    lfoGain.connect(gainNode.gain);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    lfo.start();
    return { source: noise, gain: gainNode, extras: [filter, lfo, lfoGain] };
  }

  function stopActiveSound() {
    if (!activeSound) return;

    // fade out
    const ctx = getAudioCtx();
    activeSound.gain.gain.setValueAtTime(activeSound.gain.gain.value, ctx.currentTime);
    activeSound.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    setTimeout(function () {
      if (activeSound && activeSound.source) {
        try { activeSound.source.stop(); } catch (e) { /* source may be null or already stopped */ }
      }
      if (activeSound && activeSound.timerId) {
        clearInterval(activeSound.timerId);
      }
    }, 600);

    activeSound = null;

    // reset UI
    document.querySelectorAll('.sound-card').forEach(function (c) { c.classList.remove('playing'); });
    document.querySelectorAll('.sound-btn').forEach(function (b) { b.textContent = 'Play'; b.classList.remove('stop-btn'); });
    document.querySelectorAll('.sound-visualizer').forEach(function (v) { v.classList.remove('active'); });
  }

  function playSound(type, card, btn) {
    const ctx = getAudioCtx();
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let nodes;
    if (type === 'rain')   nodes = createRain(ctx);
    else if (type === 'ocean') nodes = createOcean(ctx);
    else if (type === 'birds') nodes = createBirds(ctx);
    else if (type === 'wind')  nodes = createWind(ctx);
    else return;

    if (nodes.source) nodes.source.start();

    activeSound = nodes;
    activeSound.type = type;

    card.classList.add('playing');
    btn.textContent = '■ Stop';
    btn.classList.add('stop-btn');
    document.getElementById('viz-' + type).classList.add('active');
  }

  soundBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const type = btn.dataset.sound;
      const card = btn.closest('.sound-card');

      if (activeSound && activeSound.type === type) {
        // toggle off
        stopActiveSound();
      } else {
        // stop any current sound, then play new
        stopActiveSound();
        setTimeout(function () { playSound(type, card, btn); }, 50);
      }
    });
  });
}());

// ── 7. Daily Self-Care Checklist ──────────────────────────

(function initChecklist() {
  const checkboxes = document.querySelectorAll('#selfCareChecklist input[type="checkbox"]');
  const progressEl = document.getElementById('checklistProgress');
  const progressFill = document.getElementById('progressFill');
  const resetBtn = document.getElementById('resetChecklistBtn');
  const dateEl = document.getElementById('checklistDate');
  const todayKey = getTodayKey();
  const storageKey = 'mw_checklist_' + todayKey;

  function loadChecks() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveChecks(checks) {
    localStorage.setItem(storageKey, JSON.stringify(checks));
  }

  function updateProgress() {
    const total = checkboxes.length;
    const done = Array.from(checkboxes).filter(function (c) { return c.checked; }).length;
    progressEl.textContent = done + ' / ' + total + ' completed';
    progressFill.style.width = (done / total * 100) + '%';
  }

  function applyChecks() {
    const checks = loadChecks();
    checkboxes.forEach(function (cb) {
      cb.checked = !!checks[cb.dataset.task];
    });
    updateProgress();
  }

  checkboxes.forEach(function (cb) {
    cb.addEventListener('change', function () {
      const checks = loadChecks();
      checks[cb.dataset.task] = cb.checked;
      saveChecks(checks);
      updateProgress();
    });
  });

  resetBtn.addEventListener('click', function () {
    checkboxes.forEach(function (cb) { cb.checked = false; });
    saveChecks({});
    updateProgress();
  });

  // Show today's date
  dateEl.textContent = 'Checklist for ' + formatDateShort(new Date());

  applyChecks();
}());
