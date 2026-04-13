
// ---------- متغيرات التحكم ----------
let storyIdx = 0;
let storyPlaying = false;
let storyRate = 1.0;       // سيتم ربطه لاحقاً بـ unifiedTTS.rate
let storyLoop = '1x';      // '1x', '3x', 'inf'
let storyIsCin = false;

// متغيرات الألعاب
let storyQuestions = [];
let storyGIdx = 0;

// ---------- تحديث واجهة المستخدم (UI) ----------
function storyUpdUI() {
    const playBtn = document.getElementById('story-pI');
    if (playBtn) playBtn.className = storyPlaying ? "fas fa-pause-circle story-p-main" : "fas fa-play-circle story-p-main";
    
    document.querySelectorAll('.story-card').forEach((c, i) => {
        c.classList.toggle('active', i === storyIdx);
    });
    
    const cinBtn = document.getElementById('story-cin-btn');
    if (cinBtn) cinBtn.classList.toggle('active', storyIsCin);
    
    const spdBtn = document.getElementById('story-spd-btn');
    if (spdBtn) spdBtn.classList.toggle('active', storyRate !== 1.0);
    
    const lpBtn = document.getElementById('story-lp-btn');
    if (lpBtn) lpBtn.classList.toggle('active', storyLoop !== '1x');
    
    const activeCard = document.getElementById(`story-c-${storyIdx}`);
    if (activeCard && storyPlaying) {
        activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

// ---------- النطق باستخدام النظام الموحد (بدون أي تعارض) ----------
async function storyPlayLine() {
    if (!storyData || !storyData[storyIdx] || !storyData[storyIdx].en) return;
    // تحديث سرعة النطق من المتغير المحلي
    window.unifiedTTS.rate = storyRate;
    await window.unifiedTTS.speak(storyData[storyIdx].en);
}

async function storyRun() {
    while (storyIdx < storyData.length && storyPlaying) {
        storyUpdUI();
        const reps = storyLoop === '1x' ? 1 : (storyLoop === '3x' ? 3 : 999);
        for (let n = 0; n < reps; n++) {
            if (!storyPlaying) break;
            await storyPlayLine();
            if (storyPlaying && n < reps - 1) await new Promise(r => setTimeout(r, 500));
        }
        if (storyLoop !== 'inf' && storyPlaying) {
            if (storyIdx < storyData.length - 1) storyIdx++;
            else storyPlaying = false;
        }
    }
    storyUpdUI();
}

// نطق كلمة مفردة (عند النقر على كلمة)
function storySpeakWord(word, event) {
    if (event) event.stopPropagation();
    if (!word) return;
    // نطق الكلمة بسرعة 0.9 (كما في الأصل)
    const oldRate = window.unifiedTTS.rate;
    window.unifiedTTS.rate = 0.9;
    window.unifiedTTS.speak(word);
    window.unifiedTTS.rate = oldRate;
}

// ---------- دوال التحكم الأساسية ----------
function storyTogP() {
    if (storyPlaying) {
        window.unifiedTTS.cancel();
        storyPlaying = false;
    } else {
        storyPlaying = true;
        storyRun();
    }
    storyUpdUI();
}

function storyJump(i) {
    window.unifiedTTS.cancel();
    storyIdx = Math.max(0, Math.min(storyData.length - 1, i));
    if (storyPlaying) {
        storyPlaying = false;
        setTimeout(() => { storyPlaying = true; storyRun(); }, 100);
    } else {
        storyPlayLine();
    }
    storyUpdUI();
}

function storyNav(d) {
    window.unifiedTTS.cancel();
    storyIdx = Math.max(0, Math.min(storyData.length - 1, storyIdx + d));
    if (storyPlaying) {
        storyPlaying = false;
        setTimeout(() => { storyPlaying = true; storyRun(); }, 100);
    } else {
        storyPlayLine();
    }
    storyUpdUI();
}

// ---------- ضبط السرعة والتكرار والسينما ----------
function storySetSpd() {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(storyRate);
    storyRate = speeds[(currentIndex + 1) % speeds.length];
    const speedText = document.getElementById('story-sT');
    if (speedText) speedText.innerText = storyRate + 'x';
    storyUpdUI();
}

function storySetLp() {
    const loops = ['1x', '3x', 'inf'];
    const currentIndex = loops.indexOf(storyLoop);
    storyLoop = loops[(currentIndex + 1) % loops.length];
    const loopText = document.getElementById('story-lT');
    if (loopText) loopText.innerText = storyLoop.toUpperCase();
    storyUpdUI();
}

function storyTogCin() {
    storyIsCin = !storyIsCin;
    document.body.classList.toggle('story-cinema-mode', storyIsCin);
    storyUpdUI();
}

// ---------- بناء بطاقات القصة مع إمكانية النقر على الكلمات ----------
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
            span.addEventListener('click', (e) => { e.stopPropagation(); storySpeakWord(word, e); });
            enDiv.appendChild(span);
            if (idx < words.length - 1) enDiv.appendChild(document.createTextNode(' '));
        });
        
        const btn = document.createElement('button');
        btn.className = 'story-translate-btn';
        btn.innerHTML = '<i class="fas fa-language"></i> Translate';
        btn.addEventListener('click', (e) => { e.stopPropagation(); storyTranslateSentence(s.en); });
        enDiv.appendChild(btn);
        
        card.appendChild(enDiv);
        storyFeed.appendChild(card);
    });
}

// ---------- الترجمة والإشعارات (Toast) ----------
function storyTranslateSentence(sentence) {
    let userLang = localStorage.getItem('userLang') || 'en';
    navigator.clipboard.writeText(sentence).catch(() => {});
    window.open(`https://www.linguee.com/english-${userLang}/search?source=en&query=${encodeURIComponent(sentence)}`, '_blank');
    storyShowToast(`📋 Copied: "${sentence.substring(0, 50)}..."`);
}

function storyShowToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; z-index:100000; font-size:14px; animation:storyFadeOut 2s ease forwards; box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function storyCopyForShadowing() {
    let text = storyData.map(item => `${item.en}.\n`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    storyShowToast("✅ All sentences copied for shadowing!");
}

// ---------- نظام الألعاب (Game System) ----------
function storyCleanText(s) {
    return s ? s.toString().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
}

function storyPlaySnd(id) {
    const a = document.getElementById(id);
    if (a) { a.currentTime = 0; a.play().catch(() => {}); }
}

function storyStartGame() {
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
    if (!storyData || storyData.length === 0) return;
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
    box.className = 'story-sort-box' + (isWordSort ? '' : ' story-story-sort');
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    shuffled.forEach(item => {
        const div = document.createElement('div');
        div.className = 'story-drag-item';
        if (isWordSort) {
            div.setAttribute('data-word', item);
            div.textContent = item;
        } else {
            div.setAttribute('data-id', item.en);
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
    document.getElementById('story-g-progress').style.width = ((storyGIdx + 1) / storyQuestions.length * 100) + "%";
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
        const words = q.sentence.split(' ');
        const box = storyBuildSortBox(words, true);
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
        options = options.sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'story-option-btn';
            btn.style.color = '#dc143c';
            btn.textContent = opt;
            btn.addEventListener('click', () => storyCheckListening(opt, q.sentence));
            body.appendChild(btn);
        });
    }
    setTimeout(() => { const first = body.querySelector("h3"); if(first) first.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
}

function storyPlayListeningSentence(sentence) {
    window.unifiedTTS.speak(sentence);
}

function storyCheckStorySort() {
    const userOrder = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.id);
    const correctOrder = storyData.map(i => i.en);
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Perfect! Story order is correct! 📖" : "Not quite right. Read the story again!");
}

function storyCheckWordSort(correctSentence) {
    const userSentence = Array.from(document.querySelectorAll('#story-sort-box .story-drag-item')).map(i => i.dataset.word).join(' ');
    const isCorrect = storyCleanText(userSentence) === storyCleanText(correctSentence);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Excellent! Sentence order is correct! 🔤" : `Correct sentence: "${correctSentence}"`);
}

function storyCheckListening(selected, correct) {
    const isCorrect = storyCleanText(selected) === storyCleanText(correct);
    if(isCorrect) storyPlaySnd('story-snd-right'); else storyPlaySnd('story-snd-wrong');
    storyShowGameFeedback(isCorrect, isCorrect ? "Great listening! 🎧" : `The correct sentence was: "${correct}"`);
}

function storyShowGameFeedback(isCorrect, message) {
    const panel = document.getElementById('story-res-panel');
    panel.className = "story-result-panel show " + (isCorrect ? "story-res-correct" : "story-res-wrong");
    document.getElementById('story-res-text').innerHTML = `<b>${message}</b>`;
    document.getElementById('story-res-btn').style.background = isCorrect ? "#58cc02" : "#ea2b2b";
    setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
}

function storyNextStep() {
    storyPlaySnd('story-snd-next');
    storyGIdx++;
    if(storyGIdx < storyQuestions.length) {
        storyRenderGameStep();
    } else {
        storyPlaySnd('story-snd-win');
        document.getElementById('story-end-screen').style.display = 'flex';
        setTimeout(() => { const end = document.getElementById('story-end-screen'); if(end) end.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
    }
}

// ---------- تهيئة القصة عند تحميل الصفحة ----------
window.addEventListener('load', () => {
    storyBuildCards();
    storyUpdUI();
});
