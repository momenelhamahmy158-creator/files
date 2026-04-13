// ============================================================
// نظام المحادثة (Conversation System) - بالإصدار الموحد
// يحتوي على: 3 مراحل (استماع، تقليد، رد سريع)، تسجيل صوتي،
// ترجمة، إعدادات سرعة وتكرار، Toast، خلط نهائي.
// ============================================================

// ---------- المتغيرات العامة (تسجيل، بيانات) ----------
let convMediaRecorder = null;
let convAudioChunks = [];
let convS2UserBlobUrl = null;
let convFinalRecordings = [];
let convUserSide = '', convCurrentIdx = 0;
let convCurrentRate = 1.0;      // سيتم ربطه بـ unifiedTTS.rate
let convCurrentLoop = 1;         // عدد التكرارات في Stage 1

// ================================
// دوال الترجمة والإشعارات (Toast)
// ================================
function convTranslateSentence(sentence, event) {
    if(event) event.stopPropagation();
    let userLang = localStorage.getItem('userLang') || 'en';
    navigator.clipboard.writeText(sentence);
    window.open(`https://www.linguee.com/english-${userLang}/search?source=en&query=${encodeURIComponent(sentence)}`, '_blank');
    convShowToast(`📋 Copied: "${sentence.substring(0, 50)}..."`);
}

function convShowToast(msg) {
    const toast = document.createElement('div');
    toast.innerHTML = `<div style="position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; z-index:100000; font-size:14px; animation:conv-fadeOut 2s ease forwards;">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ================================
// نظام الصوت الموحد للمحادثة (باستخدام unifiedTTS)
// ================================
// دالة النطق الأساسية - تحاكي old convPlayVoice مع دعم اختلاف المتحدث (pitch)
async function convPlayVoice(text, speaker) {
    if (!text) return;
    // ضبط السرعة من الإعدادات
    window.unifiedTTS.rate = convCurrentRate;
    // محاكاة اختلاف pitch حسب المتحدث (اختياري)
    const oldPitch = window.unifiedTTS.pitch;
    if (speaker === "Speaker 1") {
        window.unifiedTTS.pitch = 0.7;  // صوت منخفض قليلاً للرجل
    } else {
        window.unifiedTTS.pitch = 1.0;  // طبيعي للمرأة
    }
    await window.unifiedTTS.speak(text);
    window.unifiedTTS.pitch = oldPitch;
}

// دالة إلغاء النطق (تستخدم عند إعادة التشغيل)
function convCancelSpeech() {
    window.unifiedTTS.cancel();
}

// ================================
// STAGE 1 - محادثة تلقائية (استماع)
// ================================
async function convStartStage1() {
    document.getElementById('conv-start-s1').style.display = 'none';
    document.getElementById('conv-welcome-msg').style.display = 'none';

    for (let item of convData) {
        document.getElementById('conv-typing-status').innerText = `${item.name} is speaking...`;
        convAddBubble(item);
        
        let reps = convCurrentLoop;
        for (let i = 0; i < reps; i++) {
            await convPlayVoice(item.en, item.name);
            if (i < reps - 1) await new Promise(r => setTimeout(r, 800));
        }
        await new Promise(r => setTimeout(r, 600));
    }

    document.getElementById('conv-typing-status').innerText = "Stage 1 completed!";
    document.getElementById('conv-next-to-s2').style.display = 'block';
}

// ================================
// STAGE 2 - تقليد (Shadowing) مع تسجيل
// ================================
function convSetupStage2() {
    convCurrentIdx = 0;
    document.getElementById('conv-next-to-s2').style.display = 'none';
    document.getElementById('conv-s2-tools').style.display = 'block';
    document.getElementById('conv-chat-scroller').innerHTML = '';
    convLoadS2Item();
}

function convLoadS2Item() {
    const scroller = document.getElementById('conv-chat-scroller');
    scroller.innerHTML = '';
    convAddBubble(convData[convCurrentIdx]);
    document.getElementById('conv-play-s2-user').style.display = 'none';
}

function convPlayS2Native() {
    convPlayVoice(convData[convCurrentIdx].en, convData[convCurrentIdx].name);
}

async function convToggleS2Rec() {
    if (convMediaRecorder && convMediaRecorder.state === "recording") {
        convMediaRecorder.stop();
        document.getElementById('conv-rec-s2-btn').innerText = "🎤 Record Your Voice";
        document.getElementById('conv-rec-s2-btn').style.background = "#444";
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            convMediaRecorder = new MediaRecorder(stream);
            convAudioChunks = [];
            convMediaRecorder.ondataavailable = e => convAudioChunks.push(e.data);
            convMediaRecorder.onstop = () => {
                const blob = new Blob(convAudioChunks, { type: 'audio/wav' });
                convS2UserBlobUrl = URL.createObjectURL(blob);
                document.getElementById('conv-play-s2-user').style.display = 'inline-block';
            };
            convMediaRecorder.start();
            document.getElementById('conv-rec-s2-btn').innerText = "Stop";
            document.getElementById('conv-rec-s2-btn').style.background = "#10b981";
        } catch(e) { alert("Please allow microphone access"); }
    }
}

function convPlayS2User() {
    if (convS2UserBlobUrl) new Audio(convS2UserBlobUrl).play();
}

function convNextS2Item() {
    if (convCurrentIdx < convData.length - 1) {
        convCurrentIdx++;
        convLoadS2Item();
    } else {
        document.getElementById('conv-s2-tools').style.display = 'none';
        document.getElementById('conv-role-overlay').style.display = 'flex';
    }
}

// ================================
// STAGE 3 - رد سريع (تسجيل تلقائي)
// ================================
function convStartStage3(side) {
    convUserSide = side;
    convCurrentIdx = 0;
    document.getElementById('conv-role-overlay').style.display = 'none';
    document.getElementById('conv-s3-tools').style.display = 'block';
    document.getElementById('conv-chat-scroller').innerHTML = '';
    convRunS3Loop();
}

async function convRunS3Loop() {
    if (convCurrentIdx >= convData.length) {
        document.getElementById('conv-s3-tools').style.display = 'none';
        document.getElementById('conv-end-overlay').style.display = 'flex';
        return;
    }

    const m = convData[convCurrentIdx];
    if (m.side !== convUserSide) {
        document.getElementById('conv-rp-status').innerText = "Listening...";
        convAddBubble(m);
        await convPlayVoice(m.en, m.name);
        convCurrentIdx++;
        convRunS3Loop();
    } else {
        document.getElementById('conv-rp-status').innerText = "Record now (5 seconds)...";
        document.getElementById('conv-mic-s3').style.display = 'block';
        document.getElementById('conv-mic-s3').classList.add('active');
        convAddBubble(m);
        await convAutoRecordS3(5);
        document.getElementById('conv-mic-s3').classList.remove('active');
        document.getElementById('conv-mic-s3').style.display = 'none';
        convCurrentIdx++;
        convRunS3Loop();
    }
}

function convAutoRecordS3(sec) {
    return new Promise(async res => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const rec = new MediaRecorder(stream);
            let chunks = [];
            rec.ondataavailable = e => chunks.push(e.data);
            rec.onstop = () => {
                convFinalRecordings[convCurrentIdx] = URL.createObjectURL(new Blob(chunks));
                res();
            };
            rec.start();
            let left = sec;
            document.getElementById('conv-timer-s3').innerText = left;
            const timer = setInterval(() => {
                document.getElementById('conv-timer-s3').innerText = --left;
                if (left <= 0) { clearInterval(timer); rec.stop(); }
            }, 1000);
        } catch(e) { res(); }
    });
}

// ================================
// فقاعة المحادثة (بزر ترجمة)
// ================================
function convAddBubble(m) {
    const scroller = document.getElementById('conv-chat-scroller');
    const cls = m.side === 'right' ? 'conv-msg-right' : 'conv-msg-left';
    const now = new Date();
    const timeStr = now.getHours() + ":" + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    const checks = m.side === 'right' ? '<span class="conv-checks">✓✓</span>' : '';
    
    scroller.innerHTML += `
        <div class="conv-bubble ${cls}">
            <span class="conv-en">${m.en}</span>
            <button class="conv-translate-btn" onclick="convTranslateSentence('${m.en.replace(/'/g, "\\'")}', event)">
                <i class="fas fa-language"></i> Translate
            </button>
            <div class="conv-msg-meta">
                <span>${timeStr}</span>
                ${checks}
            </div>
        </div>`;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
}

// ================================
// المزج النهائي (تسجيلات المستخدم + النطق)
// ================================
async function convPlayFinalMix() {
    for (let i = 0; i < convData.length; i++) {
        if (convData[i].side === convUserSide && convFinalRecordings[i]) {
            const a = new Audio(convFinalRecordings[i]);
            await new Promise(r => { a.onended = r; a.play(); });
        } else {
            await convPlayVoice(convData[i].en, convData[i].name);
        }
    }
}

// ================================
// الإعدادات والمرافق
// ================================
function convToggleSettings() {
    const menu = document.getElementById('conv-settings-menu');
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

function convUpdateSettings() {
    convCurrentRate = parseFloat(document.getElementById('conv-spd-select').value);
    convCurrentLoop = parseInt(document.getElementById('conv-loop-select').value);
    // تحديث سرعة النظام الموحد فوراً
    window.unifiedTTS.rate = convCurrentRate;
}

async function convReplayStage1() {
    const menu = document.getElementById('conv-settings-menu');
    if (menu) menu.style.display = 'none';
    
    convCancelSpeech();  // إلغاء أي نطق جاري
    
    const scroller = document.getElementById('conv-chat-scroller');
    if (scroller) scroller.innerHTML = '';

    const nextBtn = document.getElementById('conv-next-to-s2');
    if (nextBtn) nextBtn.style.display = 'none';

    try {
        await convStartStage1();
    } catch (e) {
        console.log("Conversation stage 1 restart handled safely");
    }
}

// إغلاق قائمة الإعدادات عند النقر خارجها
window.addEventListener('click', function(e) {
    const menu = document.getElementById('conv-settings-menu');
    const trigger = document.querySelector('.conv-settings-trigger');
    if (menu && menu.style.display === 'block') {
        if (!trigger.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    }
});
