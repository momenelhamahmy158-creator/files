// ========== VOICE SYSTEM (نسخة مستقلة ومضمونة) ==========
let storyIdx = 0, storyPlaying = false, storyRate = 1.0, storyLoop = '1x', storyIsCin = false;
let storySynth = window.speechSynthesis;
let storyIsSpeaking = false;
let storyQueue = [];
let storyVoiceLoadAttempts = 0;

// تحميل الأصوات
function storyGetV() {
    let allVoices = storySynth.getVoices();
    
    if (allVoices.length === 0) {
        if (storyVoiceLoadAttempts < 30) {
            storyVoiceLoadAttempts++;
            setTimeout(storyGetV, 100);
        }
        return;
    }
    
    storyVoiceLoadAttempts = 0;
    
    let clean = allVoices.filter(v => {
        const n = v.name.toLowerCase();
        const l = v.lang.toLowerCase();
        const isEnglish = l.startsWith('en');
        const isIndian = n.includes('india') || n.includes('hindi') || l === 'en-in';
        return isEnglish && !isIndian;
    });
    
    if (clean.length === 0) {
        clean = allVoices.filter(v => v.lang.startsWith('en'));
    }
    
    const select = document.getElementById('story-vMap');
    if (!select) return;
    
    if (clean.length > 0) {
        clean.sort((a, b) => {
            const aQ = a.name.toLowerCase().includes('google') ? 2 : (a.name.toLowerCase().includes('android') ? 1 : 0);
            const bQ = b.name.toLowerCase().includes('google') ? 2 : (b.name.toLowerCase().includes('android') ? 1 : 0);
            return bQ - aQ;
        });
        
        select.innerHTML = clean.map(v => `<option value="${v.name}">${v.name.replace(/Microsoft|Google|Apple/gi, '').trim()} (${v.lang})</option>`).join('');
        if (!select.value) select.value = clean[0].name;
        document.getElementById('story-v-btn')?.classList.add('active');
    } else {
        select.innerHTML = '<option value="">⚠️ No English Voice</option>';
        document.getElementById('story-v-btn')?.classList.remove('active');
    }
}

function storyGetSafeVoice() {
    const select = document.getElementById('story-vMap');
    if (select && select.value) {
        const voice = storySynth.getVoices().find(v => v.name === select.value);
        if (voice) return voice;
    }
    return storySynth.getVoices().find(v => v.lang.startsWith('en'));
}

// دالة النطق الأساسية (بدون تداخل)
function storySpeakSentence(text) {
    return new Promise((resolve) => {
        if (!text || !storySynth) {
            resolve();
            return;
        }
        
        const voice = storyGetSafeVoice();
        if (!voice) {
            resolve();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = storyRate;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
            storyIsSpeaking = false;
            resolve();
        };
        
        utterance.onerror = (e) => {
            console.warn("Speech error:", e.error);
            storyIsSpeaking = false;
            resolve();
        };
        
        storyIsSpeaking = true;
        storySynth.speak(utterance);
    });
}

// تشغيل سطر القصة
async function storyPlayLine() {
    if (!storyData[storyIdx]?.en) return;
    await storySpeakSentence(storyData[storyIdx].en);
}

// دالة تشغيل القصة الرئيسية
async function storyRun() {
    while (storyIdx < storyData.length && storyPlaying) {
        storyUpdUI();
        
        let reps = storyLoop === '1x' ? 1 : (storyLoop === '3x' ? 3 : 999);
        
        for (let n = 0; n < reps; n++) {
            if (!storyPlaying) break;
            
            await storyPlayLine();
            
            if (storyPlaying && n < reps - 1) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        if (storyLoop !== 'inf' && storyPlaying) {
            if (storyIdx < storyData.length - 1) {
                storyIdx++;
            } else {
                storyPlaying = false;
            }
        }
    }
    storyUpdUI();
}

// تفعيل الصوت
function storyEnableAudio() {
    if (!storySynth) return;
    const dummy = new SpeechSynthesisUtterance(' ');
    dummy.volume = 0;
    storySynth.speak(dummy);
    setTimeout(() => storySynth.cancel(), 100);
}

// نطق كلمة
function storySpeakWord(word, event) {
    if (event) event.stopPropagation();
    if (!storySynth || !word) return;
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.9;
    const voice = storyGetSafeVoice();
    if (voice) utterance.voice = voice;
    storySynth.cancel();
    setTimeout(() => storySynth.speak(utterance), 50);
}

// دوال التحكم (بدون استدعاء cancel غير ضروري)
function storyJump(i) {
    if (storyPlaying) {
        storyPlaying = false;
        storySynth.cancel();
        storyIdx = Math.max(0, Math.min(storyData.length - 1, i));
        setTimeout(() => {
            storyPlaying = true;
            storyRun();
        }, 100);
    } else {
        storySynth.cancel();
        storyIdx = Math.max(0, Math.min(storyData.length - 1, i));
        storyPlayLine();
    }
    storyUpdUI();
}

function storyTogP() {
    if (storyPlaying) {
        storySynth.cancel();
        storyPlaying = false;
    } else {
        storyPlaying = true;
        storyRun();
    }
    storyUpdUI();
}

function storyNav(d) {
    if (storyPlaying) {
        storyPlaying = false;
        storySynth.cancel();
        storyIdx = Math.max(0, Math.min(storyData.length - 1, storyIdx + d));
        setTimeout(() => {
            storyPlaying = true;
            storyRun();
        }, 100);
    } else {
        storySynth.cancel();
        storyIdx = Math.max(0, Math.min(storyData.length - 1, storyIdx + d));
        storyPlayLine();
    }
    storyUpdUI();
}

// ========== BUILD STORY CARDS ==========
const storyFeed = document.getElementById('story-feed');
storyData.forEach((s, i) => {
    const words = s.en.split(' ').map(w => `<span class="story-word" onclick="storySpeakWord('${w.replace(/'/g, "\\'")}', event)">${w}</span>`).join(' ');
    storyFeed.innerHTML += `
        <div class="story-card" id="story-c-${i}" onclick="storyJump(${i})">
            <div class="story-en">${words}
            <button class="story-translate-btn" onclick="event.stopPropagation(); storyTranslateSentence('${s.en.replace(/'/g, "\\'")}')">
                <i class="fas fa-language"></i> Translate
            </button></div>
        </div>`;
});

// ========== TRANSLATION FUNCTION ==========
function storyTranslateSentence(sentence) {
    let userLang = localStorage.getItem('userLang') || 'en';
    navigator.clipboard.writeText(sentence);
    window.open(`https://www.linguee.com/english-${userLang}/search?source=en&query=${encodeURIComponent(sentence)}`, '_blank');
    storyShowToast(`📋 Copied: "${sentence.substring(0, 50)}..."`);
}

function storyShowToast(msg) {
    const toast = document.createElement('div');
    toast.innerHTML = `<div style="position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; z-index:100000; font-size:14px; animation:storyFadeOut 2s ease forwards;">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ========== SHADOWING COPY ==========
function storyCopyForShadowing() {
    let text = storyData.map(item => `${item.en}.\n`).join('\n');
    navigator.clipboard.writeText(text);
    storyShowToast("✅ All sentences copied for shadowing!");
}

// ========== GAME SYSTEM ==========
let storyGIdx = 0, storyQuestions = [];
const storyCleanText = (s) => s ? s.toString().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
const storyPlaySnd = (id) => { const a = document.getElementById(id); if(a){ a.currentTime=0; a.play(); } };

function storyStartGame() { 
    storyEnableAudio();
    document.getElementById('story-game-overlay').style.display = 'flex'; 
    document.getElementById('story-start-screen').style.display = 'flex'; 
    document.getElementById('story-end-screen').style.display = 'none'; 
}

function storyCloseGame() { document.getElementById('story-game-overlay').style.display = 'none'; }

function storyStartActualGame() {
    document.getElementById('story-start-screen').style.display = 'none';
    storyBuildQuestions();
    storyGIdx = 0;
    storyRenderGameStep();
}

function storyBuildQuestions() {
    storyQuestions = [];
    storyQuestions.push({ type: 'story_sort', items: [...storyData] });
    storyQuestions.push({ type: 'word_sort', sentence: storyData[0].en });
    storyQuestions.push({ type: 'word_sort', sentence: storyData[1].en });
    storyQuestions.push({ type: 'listening', sentence: storyData[2].en });
    storyQuestions.push({ type: 'listening', sentence: storyData[3].en });
}

function storyRenderGameStep() {
    const body = document.getElementById('story-g-body');
    const q = storyQuestions[storyGIdx];
    document.getElementById('story-res-panel').classList.remove('show');
    document.getElementById('story-g-progress').style.width = ((storyGIdx + 1) / storyQuestions.length * 100) + "%";
    body.innerHTML = "";

    if (q.type === 'story_sort') {
        body.innerHTML = `<h3>📖 Arrange the story events in correct order</h3>
            <div id="story-sort-box" class="story-sort-box story-story-sort"></div>
            <button class="story-option-btn" style="background:var(--story-crimson);color:#fff;margin-top:20px" onclick="storyCheckStorySort()">Check Order</button>`;
        let shuffled = [...q.items].sort(() => 0.5 - Math.random());
        shuffled.forEach(item => {
            document.getElementById('story-sort-box').innerHTML += `<div class="story-drag-item" data-id="${item.en.replace(/'/g, "\\'")}">${item.en}</div>`;
        });
        if (typeof Sortable !== 'undefined' && document.getElementById('story-sort-box')) {
    new Sortable(document.getElementById('story-sort-box'), { animation: 150 });
}
    }
    else if (q.type === 'word_sort') {
        let words = q.sentence.split(' ');
        let shuffledWords = [...words].sort(() => 0.5 - Math.random());
        body.innerHTML = `<h3>🔤 Arrange the words to form the correct sentence</h3>
            <div id="story-sort-box" class="story-sort-box"></div>
            <button class="story-option-btn" style="background:var(--story-crimson);color:white;margin-top:20px" onclick="storyCheckWordSort('${q.sentence.replace(/'/g, "\\'")}')">Check Sentence</button>`;
        shuffledWords.forEach(word => {
            document.getElementById('story-sort-box').innerHTML += `<div class="story-drag-item" data-word="${word}">${word}</div>`;
        });
        if (typeof Sortable !== 'undefined' && document.getElementById('story-sort-box')) {
    new Sortable(document.getElementById('story-sort-box'), { animation: 150 });
}
    }
    else if (q.type === 'listening') {
        let options = [q.sentence, storyData[2].en, storyData[3].en].sort(() => 0.5 - Math.random());
        body.innerHTML = `<h3>🎧 Listen to the sentence and choose what you heard</h3>
            <div onclick="storyPlayListeningSentence('${q.sentence.replace(/'/g, "\\'")}')" style="width:80px;height:80px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:20px auto;cursor:pointer;box-shadow:0 4px 0 #ddd;">
                <i class="fas fa-volume-up" style="font-size:2rem;color:var(--story-crimson);"></i>
            </div>
            ${options.map(opt => `<button class="story-option-btn" style="color:#dc143c;" onclick="storyCheckListening('${opt.replace(/'/g, "\\'")}', '${q.sentence.replace(/'/g, "\\'")}')">${opt}</button>`).join('')}`;
    }
  // ✅ سكرول لأول السؤال بعد التحميل
    setTimeout(() => {
        const firstElement = body.querySelector("h3");
        if(firstElement) {
            firstElement.scrollIntoView({ 
                behavior: "smooth", 
                block: "start"
            });
        }
    }, 100);
}

function storyPlayListeningSentence(sentence) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

function storyCheckStorySort() {
    let userOrder = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.id);
    let correctOrder = storyData.map(i => i.en);
    let isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Perfect! Story order is correct! 📖" : "Not quite right. Read the story again!");
}

function storyCheckWordSort(correctSentence) {
    let userSentence = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.word).join(' ');
    let isCorrect = storyCleanText(userSentence) === storyCleanText(correctSentence);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Excellent! Sentence order is correct! 🔤" : `Correct sentence: "${correctSentence}"`);
}

function storyCheckListening(selected, correct) {
    let isCorrect = storyCleanText(selected) === storyCleanText(correct);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Great listening! 🎧" : `The correct sentence was: "${correct}"`);
}

function storyShowGameFeedback(isCorrect, message) {
    const panel = document.getElementById('story-res-panel');
    panel.className = "story-result-panel show " + (isCorrect ? "story-res-correct" : "story-res-wrong");
    document.getElementById('story-res-text').innerHTML = `<b>${message}</b>`;
    document.getElementById('story-res-btn').style.background = isCorrect ? "#58cc02" : "#ea2b2b";
  // ✅ سكرول سلس للوحة النتيجة
    setTimeout(() => {
        panel.scrollIntoView({ 
            behavior: "smooth", 
            block: "center"
        });
    }, 100);
}

function storyNextStep() {
    storyPlaySnd('story-snd-next');
    storyGIdx++;
    if(storyGIdx < storyQuestions.length) {
        storyRenderGameStep();
    } else { 
        storyPlaySnd('story-snd-win'); 
        document.getElementById('story-end-screen').style.display = 'flex';
        setTimeout(() => {
            const endScreen = document.getElementById('story-end-screen');
            if (endScreen) {
                endScreen.scrollIntoView({ 
                    behavior: "smooth", 
                    block: "center"
                });
            }
        }, 100);
    }
}  // ✅ إغلاق الدالة بشكل صحيح
// Voice check on load
function storyUpdUI() {
    document.getElementById('story-pI').className = storyPlaying ? "fas fa-pause-circle story-p-main" : "fas fa-play-circle story-p-main";
    document.querySelectorAll('.story-card').forEach((c, i) => { c.classList.toggle('active', i === storyIdx); });
    document.getElementById('story-cin-btn').classList.toggle('active', storyIsCin);
    document.getElementById('story-spd-btn').classList.toggle('active', storyRate !== 1.0);
    document.getElementById('story-lp-btn').classList.toggle('active', storyLoop !== '1x');
    const active = document.getElementById(`story-c-${storyIdx}`);
    if(active && storyPlaying) active.scrollIntoView({ behavior: "smooth", block: "center" });
}
window.addEventListener('load', () => { storyGetV(); storyUpdUI(); });
