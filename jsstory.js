<!-- ========== STORY PLAYER + GAME - النسخة النهائية المستقرة 2026 ========== -->
// ==================== المتغيرات العامة ====================
let storyIdx = 0;
let storyPlaying = false;
let storyRate = 1.0;
let storyLoop = '1x';
let storyIsCin = false;

let storySynth = window.speechSynthesis || null;
let storyVoicesReady = false;
let storyPendingSpeak = null;
let storyVoiceLoadAttempts = 0;
let storyCurrentUtterance = null;
let storyIOSAudioEnabled = false;
let storyResumeInterval = null;

let storyGIdx = 0;
let storyQuestions = [];

// ==================== دوال الصوت الأساسية ====================
function storyInitIOSAudio() {
    if (storyIOSAudioEnabled || !storySynth) return;
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0;
    storySynth.speak(silent);
    setTimeout(() => storySynth.cancel(), 100);
    storyIOSAudioEnabled = true;
}

function storyStartResumeInterval() {
    storyStopResumeInterval();
    storyResumeInterval = setInterval(() => {
        if (storySynth?.speaking && storyCurrentUtterance) {
            try { storySynth.pause(); storySynth.resume(); } catch(e) {}
        }
    }, 12000);
}

function storyStopResumeInterval() {
    if (storyResumeInterval) {
        clearInterval(storyResumeInterval);
        storyResumeInterval = null;
    }
}

function storyGetV() {
    if (!storySynth) return;
    const voices = storySynth.getVoices();

    if (voices.length === 0) {
        if (storyVoiceLoadAttempts < 50) {
            storyVoiceLoadAttempts++;
            setTimeout(storyGetV, 100);
        } else {
            storyVoicesReady = true;
        }
        return;
    }

    storyVoiceLoadAttempts = 0;
    storyVoicesReady = true;

    let clean = voices.filter(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith('en') &&
               !name.includes('india') && !name.includes('hindi') && lang !== 'en-in' &&
               !name.includes('mock') && !name.includes('dummy');
    });

    if (clean.length === 0) {
        clean = voices.filter(v => v.lang && v.lang.startsWith('en'));
    }

    const select = document.getElementById('story-vMap');
    if (!select) return;

    if (clean.length > 0) {
        clean.sort((a, b) => {
            const sa = a.name.toLowerCase().includes('google') ? 3 :
                       a.name.toLowerCase().includes('samantha') ? 2 :
                       a.name.toLowerCase().includes('android') ? 1 : 0;
            const sb = b.name.toLowerCase().includes('google') ? 3 :
                       b.name.toLowerCase().includes('samantha') ? 2 :
                       b.name.toLowerCase().includes('android') ? 1 : 0;
            return sb - sa;
        });

        select.innerHTML = clean.map(v => {
            let display = v.name.replace(/Microsoft|Google|Apple|Samantha|Daniel|UK|US/gi, '').trim();
            if (display.length < 2) display = v.name;
            return `<option value="${v.name}">${display} (${v.lang})</option>`;
        }).join('');

        if (!select.value) select.value = clean[0].name;
        document.getElementById('story-v-btn')?.classList.add('active');

        if (storyPendingSpeak) {
            const pending = storyPendingSpeak;
            storyPendingSpeak = null;
            storySpeakSentence(pending);
        }
    } else {
        select.innerHTML = '<option value="">⚠️ No English Voice Found</option>';
        document.getElementById('story-v-btn')?.classList.remove('active');
    }
}

function storyGetSafeVoice() {
    if (!storyVoicesReady) return null;
    const select = document.getElementById('story-vMap');
    if (select?.value) {
        const voice = storySynth.getVoices().find(v => v.name === select.value);
        if (voice) return voice;
    }
    return storySynth.getVoices().find(v => v.lang?.startsWith('en'));
}

function storyGetDynamicTimeout(text) {
    return 20000 + (text.split(' ').length * 350);
}

function storySpeakSentence(text) {
    return new Promise((resolve) => {
        if (!text || !storySynth) return resolve();

        if (!storyVoicesReady) {
            storyPendingSpeak = text;
            setTimeout(() => storySpeakSentence(text).then(resolve), 200);
            return;
        }

        const voice = storyGetSafeVoice();
        if (!voice) return resolve();

        storySynth.cancel();
        storyStopResumeInterval();

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voice;
            utterance.rate = storyRate;
            utterance.pitch = 1;
            utterance.volume = 1;

            let completed = false;
            const timeoutId = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    storyStopResumeInterval();
                    storyCurrentUtterance = null;
                    resolve();
                }
            }, storyGetDynamicTimeout(text));

            utterance.onstart = () => {
                if (voice.name.toLowerCase().includes('google')) storyStartResumeInterval();
            };

            utterance.onend = () => {
                if (!completed) {
                    completed = true;
                    storyStopResumeInterval();
                    storyCurrentUtterance = null;
                    resolve();
                }
            };

            utterance.onerror = () => {
                if (!completed) {
                    completed = true;
                    storyStopResumeInterval();
                    storyCurrentUtterance = null;
                    resolve();
                }
            };

            storyCurrentUtterance = utterance;

            try {
                storySynth.speak(utterance);
            } catch (e) {
                storyStopResumeInterval();
                storyCurrentUtterance = null;
                resolve();
            }
        }, 80);
    });
}

async function storyPlayLine() {
    if (storyData[storyIdx]?.en) {
        await storySpeakSentence(storyData[storyIdx].en);
    }
}

async function storyRun() {
    while (storyIdx < storyData.length && storyPlaying) {
        storyUpdUI();
        const reps = storyLoop === '1x' ? 1 : (storyLoop === '3x' ? 3 : 999);

        for (let n = 0; n < reps; n++) {
            if (!storyPlaying) break;
            await storyPlayLine();
            if (storyPlaying && n < reps - 1) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        if (storyLoop !== 'inf' && storyPlaying) {
            storyIdx < storyData.length - 1 ? storyIdx++ : storyPlaying = false;
        }
    }
    storyUpdUI();
    storyStopResumeInterval();
}

function storyEnableAudio() {
    if (!storySynth) return;
    try {
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0;
        storySynth.speak(dummy);
        setTimeout(() => storySynth.cancel(), 100);
    } catch (e) {}
}

function storySpeakWord(word, event) {
    if (event) event.stopPropagation();
    if (!storySynth || !word) return;

    storyInitIOSAudio();
    storySynth.cancel();
    storyStopResumeInterval();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.9;
        const voice = storyGetSafeVoice();
        if (voice) utterance.voice = voice;
        try { storySynth.speak(utterance); } catch (e) {}
    }, 50);
}

// ==================== UI Controls ====================
function storyJump(i) {
    storyInitIOSAudio();
    storySynth.cancel();
    storyStopResumeInterval();
    storyIdx = Math.max(0, Math.min(storyData.length - 1, i));

    if (storyPlaying) {
        storyPlaying = false;
        setTimeout(() => { storyPlaying = true; storyRun(); }, 100);
    } else {
        storyPlayLine();
    }
    storyUpdUI();
}

function storyTogP() {
    storyInitIOSAudio();
    storyEnableAudio();

    if (storyPlaying) {
        storySynth.cancel();
        storyStopResumeInterval();
        storyPlaying = false;
    } else {
        storyPlaying = true;
        storyRun();
    }
    storyUpdUI();
}

function storyNav(d) {
    storyInitIOSAudio();
    storySynth.cancel();
    storyStopResumeInterval();
    storyIdx = Math.max(0, Math.min(storyData.length - 1, storyIdx + d));

    if (storyPlaying) {
        storyPlaying = false;
        setTimeout(() => { storyPlaying = true; storyRun(); }, 100);
    } else {
        storyPlayLine();
    }
    storyUpdUI();
}

function storySetSpd() {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    storyRate = speeds[(speeds.indexOf(storyRate) + 1) % speeds.length];
    document.getElementById('story-sT').innerText = storyRate + 'x';
    storyUpdUI();
}

function storySetLp() {
    const loops = ['1x', '3x', 'inf'];
    storyLoop = loops[(loops.indexOf(storyLoop) + 1) % loops.length];
    document.getElementById('story-lT').innerText = storyLoop.toUpperCase();
    storyUpdUI();
}

function storyTogCin() {
    storyIsCin = !storyIsCin;
    document.body.classList.toggle('story-cinema-mode', storyIsCin);
    storyUpdUI();
}

function storyUpdUI() {
    const playBtn = document.getElementById('story-pI');
    if (playBtn) playBtn.className = storyPlaying ? "fas fa-pause-circle story-p-main" : "fas fa-play-circle story-p-main";

    document.querySelectorAll('.story-card').forEach((c, i) => c.classList.toggle('active', i === storyIdx));

    document.getElementById('story-cin-btn')?.classList.toggle('active', storyIsCin);
    document.getElementById('story-spd-btn')?.classList.toggle('active', storyRate !== 1.0);
    document.getElementById('story-lp-btn')?.classList.toggle('active', storyLoop !== '1x');

    const active = document.getElementById(`story-c-${storyIdx}`);
    if (active && storyPlaying) active.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ==================== بناء الكروت ====================
function storyBuildCards() {
    const storyFeed = document.getElementById('story-feed');
    if (!storyFeed) return;
    storyFeed.innerHTML = '';

    storyData.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.id = `story-c-${i}`;
        card.addEventListener('click', () => storyJump(i));

        const enDiv = document.createElement('div');
        enDiv.className = 'story-en';

        const words = s.en.split(' ');
        words.forEach((word, idx) => {
            const span = document.createElement('span');
            span.className = 'story-word';
            span.textContent = word;
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                storySpeakWord(word, e);
            });
            enDiv.appendChild(span);
            if (idx < words.length - 1) enDiv.appendChild(document.createTextNode(' '));
        });

        const btn = document.createElement('button');
        btn.className = 'story-translate-btn';
        btn.innerHTML = '<i class="fas fa-language"></i> Translate';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            storyTranslateSentence(s.en);
        });

        enDiv.appendChild(btn);
        card.appendChild(enDiv);
        storyFeed.appendChild(card);
    });
}

// ==================== Translation & Toast ====================
function storyTranslateSentence(sentence) {
    navigator.clipboard.writeText(sentence).catch(() => {});
    const userLang = localStorage.getItem('userLang') || 'en';
    window.open(`https://www.linguee.com/english-${userLang}/search?source=en&query=${encodeURIComponent(sentence)}`, '_blank');
    storyShowToast(`📋 Copied: "${sentence.substring(0, 50)}..."`);
}

function storyShowToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:12px 24px; border-radius:30px; z-index:100000; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation:storyFadeOut 2.2s ease forwards;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

function storyCopyForShadowing() {
    const text = storyData.map(item => `${item.en}.`).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    storyShowToast("✅ All sentences copied for shadowing!");
}

// ==================== GAME SYSTEM ====================
const storyCleanText = (s) => s ? s.toString().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';

const storyPlaySnd = (id) => {
    const a = document.getElementById(id);
    if (a) { a.currentTime = 0; a.play().catch(() => {}); }
};

function storyStartGame() {
    storyInitIOSAudio();
    storyEnableAudio();
    document.getElementById('story-game-overlay').style.display = 'flex';
    document.getElementById('story-start-screen').style.display = 'flex';
    document.getElementById('story-end-screen').style.display = 'none';
}

function storyCloseGame() {
    document.getElementById('story-game-overlay').style.display = 'none';
}

function storyStartActualGame() {
    document.getElementById('story-start-screen').style.display = 'none';
    storyBuildQuestions();
    storyGIdx = 0;
    storyRenderGameStep();
}

function storyBuildQuestions() {
    storyQuestions = [];
    if (!storyData?.length) return;

    storyQuestions.push({ type: 'story_sort', items: [...storyData] });

    for (let i = 0; i < Math.min(3, storyData.length); i++) {
        storyQuestions.push({ type: 'word_sort', sentence: storyData[i].en });
    }

    for (let i = Math.max(0, storyData.length - 3); i < storyData.length; i++) {
        storyQuestions.push({ type: 'listening', sentence: storyData[i].en });
    }
}

function storyBuildSortBox(items, isWordSort = false) {
    const box = document.createElement('div');
    box.id = 'story-sort-box';
    box.className = `story-sort-box${isWordSort ? '' : ' story-story-sort'}`;

    const shuffled = [...items].sort(() => 0.5 - Math.random());
    shuffled.forEach(item => {
        const div = document.createElement('div');
        div.className = 'story-drag-item';
        if (isWordSort) {
            div.dataset.word = item;
            div.textContent = item;
        } else {
            div.dataset.id = item.en;
            div.textContent = item.en;
        }
        box.appendChild(div);
    });
    return box;
}

function storyRenderGameStep() {
    const body = document.getElementById('story-g-body');
    if (!body) return;

    const q = storyQuestions[storyGIdx];
    if (!q) return;

    document.getElementById('story-res-panel').classList.remove('show');
    document.getElementById('story-g-progress').style.width = `${((storyGIdx + 1) / storyQuestions.length) * 100}%`;
    body.innerHTML = "";

    if (q.type === 'story_sort') {
        const title = document.createElement('h3');
        title.textContent = '📖 Arrange the story events in correct order';
        body.appendChild(title);

        const box = storyBuildSortBox(q.items, false);
        body.appendChild(box);

        const btn = document.createElement('button');
        btn.className = 'story-option-btn';
        btn.style.cssText = 'background:var(--story-crimson);color:#fff;margin-top:20px';
        btn.textContent = 'Check Order';
        btn.addEventListener('click', storyCheckStorySort);
        body.appendChild(btn);

        if (typeof Sortable !== 'undefined') new Sortable(box, { animation: 150 });
    }
    else if (q.type === 'word_sort') {
        const title = document.createElement('h3');
        title.textContent = '🔤 Arrange the words to form the correct sentence';
        body.appendChild(title);

        const box = storyBuildSortBox(q.sentence.split(' '), true);
        body.appendChild(box);

        const btn = document.createElement('button');
        btn.className = 'story-option-btn';
        btn.style.cssText = 'background:var(--story-crimson);color:white;margin-top:20px';
        btn.textContent = 'Check Sentence';
        btn.addEventListener('click', () => storyCheckWordSort(q.sentence));
        body.appendChild(btn);

        if (typeof Sortable !== 'undefined') new Sortable(box, { animation: 150 });
    }
    else if (q.type === 'listening') {
        const title = document.createElement('h3');
        title.textContent = '🎧 Listen to the sentence and choose what you heard';
        body.appendChild(title);

        const playDiv = document.createElement('div');
        playDiv.style.cssText = 'width:80px;height:80px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:20px auto;cursor:pointer;box-shadow:0 4px 0 #ddd;';
        playDiv.innerHTML = '<i class="fas fa-volume-up" style="font-size:2rem;color:var(--story-crimson);"></i>';
        playDiv.addEventListener('click', () => storyPlayListeningSentence(q.sentence));
        body.appendChild(playDiv);

        let options = [q.sentence];
        for (let i = 0; i < storyData.length && options.length < 4; i++) {
            if (storyData[i].en !== q.sentence && !options.includes(storyData[i].en)) {
                options.push(storyData[i].en);
            }
        }
        options.sort(() => 0.5 - Math.random());

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'story-option-btn';
            btn.style.color = '#dc143c';
            btn.textContent = opt;
            btn.addEventListener('click', () => storyCheckListening(opt, q.sentence));
            body.appendChild(btn);
        });
    }

    setTimeout(() => {
        body.querySelector("h3")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

function storyPlayListeningSentence(sentence) {
    if (storySynth) {
        storyInitIOSAudio();
        storySpeakSentence(sentence);
    }
}

function storyCheckStorySort() {
    const userOrder = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.id);
    const correctOrder = storyData.map(i => i.en);
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    storyPlaySnd(isCorrect ? 'story-snd-right' : 'story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Perfect! Story order is correct! 📖" : "Not quite right. Read the story again!");
}

function storyCheckWordSort(correctSentence) {
    const userSentence = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.word).join(' ');
    const isCorrect = storyCleanText(userSentence) === storyCleanText(correctSentence);
    storyPlaySnd(isCorrect ? 'story-snd-right' : 'story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Excellent! Sentence order is correct! 🔤" : `Correct sentence: "${correctSentence}"`);
}

function storyCheckListening(selected, correct) {
    const isCorrect = storyCleanText(selected) === storyCleanText(correct);
    storyPlaySnd(isCorrect ? 'story-snd-right' : 'story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Great listening! 🎧" : `The correct sentence was: "${correct}"`);
}

function storyShowGameFeedback(isCorrect, message) {
    const panel = document.getElementById('story-res-panel');
    panel.className = `story-result-panel show ${isCorrect ? "story-res-correct" : "story-res-wrong"}`;
    document.getElementById('story-res-text').innerHTML = `<b>${message}</b>`;
    document.getElementById('story-res-btn').style.background = isCorrect ? "#58cc02" : "#ea2b2b";

    setTimeout(() => {
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
}

function storyNextStep() {
    storyPlaySnd('story-snd-next');
    storyGIdx++;
    if (storyGIdx < storyQuestions.length) {
        storyRenderGameStep();
    } else {
        storyPlaySnd('story-snd-win');
        document.getElementById('story-end-screen').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('story-end-screen')?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }
}

// ==================== التهيئة النهائية ====================
if (storySynth) {
    storySynth.onvoiceschanged = storyGetV;
    storySynth.addEventListener('voiceschanged', storyGetV);
}

document.addEventListener('click', storyInitIOSAudio, { once: true });

window.addEventListener('load', () => {
    storyGetV();
    storyBuildCards();
    storyUpdUI();
});
