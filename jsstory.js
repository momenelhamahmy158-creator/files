// ========== VOICE SYSTEM ==========
let storyIdx = 0, storyPlaying = false, storyRate = 1.0, storyLoop = '1x', storyIsCin = false;
let storySynth = window.speechSynthesis;
let storyVoicesLoaded = false;
let storyPendingSpeak = null;

function storyInitAudioOnUserInteraction() {
    const silentUtterance = new SpeechSynthesisUtterance('');
    silentUtterance.volume = 0;
    storySynth.speak(silentUtterance);
}

function storyGetV() {
    let allVoices = storySynth.getVoices();
    
    if (allVoices.length === 0) {
        setTimeout(storyGetV, 100);
        return;
    }
    
    let clean = allVoices.filter(v => {
        const n = v.name.toLowerCase();
        const l = v.lang.toLowerCase();
        const isEnglish = l.startsWith('en');
        const isIndian = n.includes('india') || n.includes('hindi') || n.includes('hi-') || l === 'en-in';
        return isEnglish && !isIndian;
    });
    
    if (clean.length === 0) {
        clean = allVoices.filter(v => v.lang.startsWith('en'));
    }
    
    const select = document.getElementById('story-vMap');
    if (clean.length > 0) {
        clean.sort((a, b) => {
            const aQuality = a.name.toLowerCase().includes('google') ? 2 : (a.name.toLowerCase().includes('android') ? 1 : 0);
            const bQuality = b.name.toLowerCase().includes('google') ? 2 : (b.name.toLowerCase().includes('android') ? 1 : 0);
            return bQuality - aQuality;
        });
        
        select.innerHTML = clean.map(v => `<option value="${v.name}">${v.name.replace(/Microsoft|Google|Apple/gi, '').trim()} (${v.lang})</option>`).join('');
        document.getElementById('story-v-btn').classList.add('active');
        storyVoicesLoaded = true;
        
        if (storyPendingSpeak) {
            storySpeakSentence(storyPendingSpeak);
            storyPendingSpeak = null;
        }
    } else {
        select.innerHTML = '<option value="">⚠️ No English Voice</option>';
        document.getElementById('story-v-btn').classList.remove('active');
    }
}

function storyGetSafeVoice() {
    const select = document.getElementById('story-vMap');
    if (!select || !select.value) {
        const voices = storySynth.getVoices();
        return voices.find(v => v.lang.startsWith('en'));
    }
    const name = select.value;
    return storySynth.getVoices().find(v => v.name === name);
}

function storySpeakSentence(text) {
    return new Promise((res) => {
        if (!storyVoicesLoaded && storySynth.getVoices().length === 0) {
            storyPendingSpeak = text;
            setTimeout(() => {
                if (storyPendingSpeak === text) {
                    storySpeakSentence(text).then(res);
                }
            }, 500);
            return;
        }
        
        const v = storyGetSafeVoice();
        if (!v) {
            res();
            return;
        }
        
        storySynth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.voice = v;
        u.rate = storyRate;
        u.pitch = 1.0;
        u.volume = 1;
        
        u.onend = () => res();
        u.onerror = () => res();
        
        setTimeout(() => {
            storySynth.speak(u);
        }, 50);
    });
}

function storyEnableAudio() {
    if (storySynth) {
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0;
        storySynth.speak(dummy);
        storySynth.cancel();
    }
}

function storyPlayLine() {
    return storySpeakSentence(storyData[storyIdx].en);
}

async function storyRun() {
    while(storyIdx < storyData.length && storyPlaying) {
        storyUpdUI();
        let reps = storyLoop === '1x' ? 1 : (storyLoop === '3x' ? 3 : 999);
        for(let n=0; n<reps; n++) {
            if(!storyPlaying) break;
            try { await storyPlayLine(); } catch(e) { break; }
            if(storyPlaying) await new Promise(r => setTimeout(r, 800));
        }
        if(storyLoop !== 'inf' && storyPlaying) { if(storyIdx < storyData.length-1) storyIdx++; else storyPlaying = false; }
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

// ========== WORD PRONUNCIATION ==========
function storySpeakWord(word, event) {
    event.stopPropagation();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// ========== UI CONTROLS ==========
function storyJump(i) { storySynth.cancel(); storyIdx = i; if(storyPlaying) { storyPlaying = false; setTimeout(() => { storyPlaying = true; storyRun(); }, 50); } else { storyPlayLine(); } storyUpdUI(); }
function storyTogP() { 
    storyEnableAudio();
    if(storyPlaying) { 
        storySynth.cancel(); 
        storyPlaying = false; 
    } else { 
        if(!storyGetSafeVoice()) { 
            storyGetV();
            setTimeout(() => {
                if(!storyGetSafeVoice()) {
                    alert("Please wait, voices are loading...");
                } else {
                    storyPlaying = true; 
                    storyRun();
                }
            }, 500);
            return; 
        } 
        storyPlaying = true; 
        storyRun(); 
    } 
    storyUpdUI(); 
}
function storySetSpd() { storyRate = [0.5, 0.75, 1.0, 1.25, 1.5][([0.5, 0.75, 1.0, 1.25, 1.5].indexOf(storyRate)+1)%5]; document.getElementById('story-sT').innerText = storyRate+'x'; storyUpdUI(); }
function storySetLp() { storyLoop = ['1x','3x','inf'][(['1x','3x','inf'].indexOf(storyLoop)+1)%3]; document.getElementById('story-lT').innerText = storyLoop.toUpperCase(); storyUpdUI(); }
function storyTogCin() { storyIsCin = !storyIsCin; document.body.classList.toggle('story-cinema-mode', storyIsCin); storyUpdUI(); }
function storyNav(d) { storySynth.cancel(); storyIdx = Math.max(0, Math.min(storyData.length - 1, storyIdx + d)); if(storyPlaying) { storyPlaying = false; setTimeout(() => { storyPlaying = true; storyRun(); }, 50); } storyUpdUI(); }

function storyUpdUI() {
    document.getElementById('story-pI').className = storyPlaying ? "fas fa-pause-circle story-p-main" : "fas fa-play-circle story-p-main";
    document.querySelectorAll('.story-card').forEach((c, i) => { c.classList.toggle('active', i === storyIdx); });
    document.getElementById('story-cin-btn').classList.toggle('active', storyIsCin);
    document.getElementById('story-spd-btn').classList.toggle('active', storyRate !== 1.0);
    document.getElementById('story-lp-btn').classList.toggle('active', storyLoop !== '1x');
    const active = document.getElementById(`story-c-${storyIdx}`);
    if(active && storyPlaying) active.scrollIntoView({ behavior: "smooth", block: "center" });
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
        if (window.Sortable) new Sortable(document.getElementById('story-sort-box'), { animation: 150 });
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
        if (window.Sortable) new Sortable(document.getElementById('story-sort-box'), { animation: 150 });
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
window.addEventListener('load', () => { storyGetV(); storyUpdUI(); });
