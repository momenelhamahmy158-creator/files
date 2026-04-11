  document.addEventListener('DOMContentLoaded', function() {
    // النجوم
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
        for(let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 3 + 1;
            star.style.width = star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starsContainer.appendChild(star);
        }
    }

    // الجسيمات
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for(let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 8 + 2;
            p.style.width = p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 6 + 's';
            p.style.animationDuration = (Math.random() * 4 + 4) + 's';
            particlesContainer.appendChild(p);
        }
    }
});

  // Start Lesson
function startLesson(){
    const intro = document.getElementById('intro');
    intro.style.transition = 'all 1s ease';
    intro.style.opacity = '0';
    intro.style.transform = 'scale(1.1)';
    
    // التمرير إلى الأعلى فوراً
    window.scrollTo(0, 0);
    
    setTimeout(() => { 
        intro.remove(); 
        mainGameStart(); 
    }, 1000);
}

function mainGameStart(){
    // الانتقال سلس بدون مقاطعات
    // هنا تبدأ اللعبة الرئيسية مباشرة
    
    // يمكنك إضافة تمرير إضافي للتأكد إذا لزم الأمر
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    // بدء اللعبة التعليمية هنا
    // startGameLogic();
}

function showStage(stageId) {
    document.querySelectorAll('.lesson-part').forEach(part => {
        part.classList.remove('current');
    });
    
    document.getElementById(stageId).classList.add('current');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToNext() {
    if (document.referrer) {
        window.location.href = document.referrer;
    } else {
        window.location.href = '/';
    }
}
   
/*************************
 * تحصين ضد الأخطاء الشائعة *
 ************************/
// تأكد من تعريف جميع الدوال الضرورية
window.handleTrueFalse = window.handleTrueFalse || function(button, selected, isCorrect) {
  if (button.disabled) return;
  
  const answerIsCorrect = selected === isCorrect;
  button.classList.add(answerIsCorrect ? "correct" : "wrong");
  
  button.parentElement.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
  });
  
  document.getElementById("nextBtn").style.display = "inline-block";
};
    // دالة لعرض قائمة الكلمات
   function renderVocabList() {
    const vocabSection = document.getElementById("vocabSection");
    vocabSection.innerHTML = window.vocabList.map(item => `
        <div class="word-block">
            <div class="left-column">
                <div class="word-row">
                    <span class="word">${item.word}</span>
                    <button class="action-btn" onclick="speakWord('${item.word}')">🔊 Speak</button>
                    <button class="action-btn" onclick="openGoogleTranslate('${item.word}')">🌐 Translate</button>
                    <button class="action-btn" onclick="openGoogleImages('${item.word}')">🖼️ Image</button>
                </div>
            </div>
            <div class="divider"></div>
            <div class="right-column">
                <div class="word-row">
                    <span class="example">${item.example}</span>
                    <button class="action-btn" onclick="speakWord('${item.example.replace(/'/g, "\\'")}')">📢 Speak Example</button>
                </div>
            </div>
        </div>
    `).join('');
}
    // دالة عرض الترجمة
    function showTranslation(btn) {
      const span = btn.nextElementSibling;
      span.style.display = 'inline';
      btn.style.display = 'none';
    }

// ===== متغيرات النظام الجديد =====
let score = 0;
let timerInterval;
let gameTimerInterval = null;
const timePerQuestion = 15;
let timeLeft = timePerQuestion;

const quizSettings = {
  enabled: true,
  questionsPerWord: 2,
  totalQuestions: 50
};

// ===== دوال النظام الجديد =====
// ===== دوال الألعاب =====
// الألعاب المتبقية: missingLetter, listenWrite, pronunciation, audio, scramble, wheel

const gameTypes = [
    "missingLetter", "listenWrite", "pronunciation", "audio", "scramble", "wheel"
];

const gameDistribution = {
    audio: 1,
    missingLetter: 1,
    pronunciation: 1,
    scramble: 1,
  listenWrite: 1,
    wheel: 1
};

let currentGameIndex = 0;
let gamesSequence = [];
let currentGameData = null;
let selectedItems = [];

function preloadAudio() {
    const sounds = ['correctSound', 'wrongSound', 'winSound', 'completeSound'];
    sounds.forEach(soundId => {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.load();
        }
    });
}

function generateGamesSequence() {
    gamesSequence = [];
    
    let allGameTypes = [];
    
    Object.keys(gameDistribution).forEach(game => {
        for (let i = 0; i < gameDistribution[game]; i++) {
            allGameTypes.push(game);
        }
    });
    
    const shuffledWords = [...vocabList].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffledWords.length; i++) {
        const game = allGameTypes[i % allGameTypes.length];
        gamesSequence.push({
            type: game,
            data: shuffledWords[i]
        });
    }
    
    // تأكد أن wheel تكون أول لعبة إذا وجدت
    const wheelIndex = gamesSequence.findIndex(g => g.type === "wheel");
    if (wheelIndex > 0) {
        const [wheelGame] = gamesSequence.splice(wheelIndex, 1);
        gamesSequence.unshift(wheelGame);
    }
}

function renderCurrentGame() {
    const container = document.getElementById("gameContainer");
    container.innerHTML = "";
    selectedItems = [];
    
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
    
    if (currentGameIndex >= gamesSequence.length) {
        showCompletionScreen();
        return;
    }
    
    updateProgress();
    
    const currentGame = gamesSequence[currentGameIndex];
    currentGameData = currentGame.data;
    
    let gameHTML = "";
    
    switch(currentGame.type) {
        case "missingLetter":
            gameHTML = renderMissingLetterGame(currentGame.data);
            break;
        case "listenWrite":
            gameHTML = renderListenWriteGame(currentGame.data);
            break;
        case "pronunciation":
            gameHTML = renderPronunciationGame(currentGame.data);
            break;
        case "audio":
            gameHTML = renderAudioGame(currentGame.data);
            break;
        case "scramble":
            gameHTML = renderScrambleGame(currentGame.data);
            break;
        case "wheel":
            gameHTML = renderWheelGame();
            break;
        default:
            gameHTML = `<p>Game type unknown: ${currentGame.type}</p>`;
    }
    
    container.innerHTML = gameHTML;
}

function showCompletionScreen() {
    const container = document.getElementById("gameContainer");
    container.innerHTML = `
        <div class="completed-screen">
            <div class="game-block celebration-effect">
                <h2>🎉 You completed all games successfully!</h2>
                <p>Click the button to practice words again, or go to Word List to continue studying.</p>
                <button class="btn" onclick="restartGame()">Play Again</button>
            </div>
        </div>
    `;
    document.getElementById("progress").style.width = "100%";
    playSound('completeSound');
}

function restartGame() {
    currentGameIndex = 0;
    generateGamesSequence();
    renderCurrentGame();
}

function nextGame() {
    currentGameIndex++;
    renderCurrentGame();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
    const progress = (currentGameIndex / gamesSequence.length) * 100;
    document.getElementById("progress").style.width = `${progress}%`;
}

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.error(`Audio error: ${soundId}`, e);
        });
    }
}
// ===== دوال الترجمة والصورة والنطق =====
function openGoogleTranslate(word) {
  let userLang = localStorage.getItem('userLang') || 'en';
    
    // خريطة اللغات لـ WordReference
    const wrMap = {
        'en': 'enen',    // English → English (قاموس)
        'ar': 'enar',    // English → Arabic
        'es': 'enes',    // English → Spanish
        'fr': 'enfr',    // English → French
        'de': 'ende',    // English → German
        'it': 'enit',    // English → Italian
        'pt': 'enpt',    // English → Portuguese
        'ru': 'enru',    // English → Russian
        'zh': 'enzh',    // English → Chinese
        'ja': 'enja',    // English → Japanese
        'ko': 'enko',    // English → Korean
        'tr': 'entr',    // English → Turkish
        'nl': 'ennl',    // English → Dutch
        'pl': 'enpl',    // English → Polish
        'vi': 'envi',    // English → Vietnamese
        'th': 'enth'     // English → Thai
    };
    
    const targetCode = wrMap[userLang] || 'enen';
    window.open(`https://www.wordreference.com/${targetCode}/${encodeURIComponent(word)}`, '_blank');
}
function openGoogleImages(word) {
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word)}`, '_blank');
}

// دالة نطق ذكية - تكتشف لغة الكلمة تلقائياً
// دالة نطق - قوة بريطانية 💂
function speakWord(word) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // قائمة بأسماء الأصوات البريطانية المعروفة
        const britishVoiceNames = [
            'Google UK English Female',
            'Google UK English Male',
            'Microsoft Hazel Desktop',
            'Microsoft George Desktop',
            'British English',
            'UK English Female',
            'UK English Male',
            'en-GB',
            'English United Kingdom'
        ];
        
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        // 1. البحث عن صوت بريطاني بالاسم المحدد
        for (let i = 0; i < voices.length; i++) {
            const voice = voices[i];
            const name = voice.name;
            const lang = voice.lang;
            
            // التحقق من الاسم البريطاني
            for (let j = 0; j < britishVoiceNames.length; j++) {
                if (name.toLowerCase().includes(britishVoiceNames[j].toLowerCase()) ||
                    (lang === 'en-GB' && !name.toLowerCase().includes('indian'))) {
                    selectedVoice = voice;
                    break;
                }
            }
            if (selectedVoice) break;
        }
        
        // 2. إذا لم نجد، ابحث عن أي en-GB وليس هندياً
        if (!selectedVoice) {
            for (let i = 0; i < voices.length; i++) {
                const voice = voices[i];
                const name = voice.name.toLowerCase();
                const lang = voice.lang.toLowerCase();
                
                if (lang === 'en-gb' && 
                    !name.includes('indian') && 
                    !name.includes('india')) {
                    selectedVoice = voice;
                    break;
                }
            }
        }
        
        // 3. أخيراً، استخدم أي صوت إنجليزي ليس هندياً
        if (!selectedVoice) {
            for (let i = 0; i < voices.length; i++) {
                const voice = voices[i];
                const name = voice.name.toLowerCase();
                const lang = voice.lang.toLowerCase();
                
                if ((lang.includes('en') || lang === 'en') && 
                    !name.includes('indian') && 
                    !name.includes('india') &&
                    !name.includes('australian')) {
                    selectedVoice = voice;
                    break;
                }
            }
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`✅ Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            // لو مفيش خيار تاني
            utterance.lang = 'en-GB';
            console.log('⚠️ No British voice found, using en-GB default');
        }
        
        utterance.onerror = function(event) {
            console.error('Speech error:', event);
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert(`Speech not supported. Word: ${word}`);
    }
}

// عرض جميع الأصوات المتاحة (لمساعدتك في معرفة الأسماء الصحيحة)
function listVoices() {
    const voices = window.speechSynthesis.getVoices();
    console.log('📢 Available voices:');
    voices.forEach((voice, i) => {
        console.log(`${i + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
    });
}

// استدعاء بعد تحميل الأصوات
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function() {
        console.log('Voices loaded!');
        listVoices(); // اطبع الأصوات في console
    };
}

// ===== دوال الألعاب التفصيلية =====
// ===== دالة playSound الأساسية =====
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.error(`حدث خطأ في تشغيل الصوت: ${soundId}`, e);
        });
    }
}

// ===== دوال مساعدة =====
function getTranslation(word) {
    const item = window.vocabList.find(w => w.word === word);
    return item ? item.translation : 'ترجمة غير متوفرة';
}

function getExample(word) {
    const item = window.vocabList.find(w => w.word === word);
    if (item) {
        return `<span style="color: #666;">${item.example}</span> <br><span style="color: #999;">${item.exampleAr}</span>`;
    }
    return 'مثال غير متوفر';
}

function scrambleWord(word) {
    return word.split('').sort(() => 0.5 - Math.random()).join('');
}

function generateMisspelling(word) {
    const commonMisspellings = {
        'husband': ['husbend', 'hasband', 'husbant'],
        'apple': ['aple', 'epple', 'appel'],
        'book': ['buk', 'bock', 'bouk'],
        'cat': ['kat', 'ket', 'cit'],
        'dog': ['dag', 'dug', 'dock'],
        'house': ['hous', 'hose', 'hause'],
        'car': ['kar', 'care', 'curr'],
        'water': ['watar', 'woter', 'weter'],
        'food': ['fud', 'fode', 'foud'],
        'school': ['skool', 'schol', 'skul'],
        'friend': ['frend', 'frynd', 'frind']
    };
    
    const lowerWord = word.toLowerCase();
    if (commonMisspellings[lowerWord]) {
        return commonMisspellings[lowerWord][Math.floor(Math.random() * commonMisspellings[lowerWord].length)];
    }
    
    const randomIndex = Math.floor(Math.random() * word.length);
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    return word.substring(0, randomIndex) + randomChar + word.substring(randomIndex + 1);
}

// ===== الألعاب المعدلة مع الميزة الجديدة =====

// لعبة اكمل الحرف الناقص
function renderMissingLetterGame(item) {
    const word = item.word;
    const randomIndex = Math.floor(Math.random() * word.length);
    const wordWithMissingLetter = word.substring(0, randomIndex) + '_' + word.substring(randomIndex + 1);
    
    return `
        <div class="game-block">
            <h3 style="color: crimson; margin-bottom: 20px;">Complete the missing letter</h3>
            
            <!-- Help Buttons -->
            <div style="margin: 10px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #17a2b8; padding: 8px 15px;" onclick="speakWord('${word}')">🔊 Speak</button>
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="openGoogleTranslate('${word}')">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="openGoogleImages('${word}')">🖼️ Image</button>
            </div>
            
            <div class="missing-letter-word" style="font-size: 32px; letter-spacing: 8px; margin: 20px 0; font-weight: bold; color: #8B0000;">
                ${wordWithMissingLetter}
            </div>
            
            <input type="text" id="missingLetterInput" maxlength="1" placeholder="Type missing letter..." style="padding: 10px; font-size: 24px; width: 60px; text-align: center; border: 2px solid gray; border-radius: 8px;">
            
            <button onclick="checkMissingLetterAnswer('${word}', ${randomIndex}, '${item.word}', '${item.example}')" style="background: crimson; color: white; border: none; padding: 10px 20px; margin: 15px; border-radius: 8px; cursor: pointer;">
                Check
            </button>
            
            <div id="missingLetterFeedback" style="min-height: 120px; margin: 15px 0; font-weight: bold; font-size: 18px;"></div>
            <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextBtn">Next</button>
        </div>
    `;
}

function checkMissingLetterAnswer(correctWord, missingIndex, word, example) {
    const userAnswer = document.getElementById('missingLetterInput').value.trim().toLowerCase();
    const feedbackEl = document.getElementById('missingLetterFeedback');
    const nextBtn = document.getElementById('nextBtn');
    const correctLetter = correctWord[missingIndex].toLowerCase();
    
    if (userAnswer === correctLetter) {
        feedbackEl.innerHTML = `
            <p style="color: green; font-size: 20px;">✓ Correct! Great job! 🎉</p>
            <div style="margin-top: 15px; padding: 15px; background: #f8fff8; border-radius: 8px; border: 2px solid #28a745;">
                <p style="margin: 5px 0;"><strong>Word:</strong> ${word}</p>
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('correctSound');
    } else {
        feedbackEl.innerHTML = `
            <p style="color: red; font-size: 20px;">✗ Wrong answer!</p>
            <p style="margin-top: 10px;"><strong>Correct letter:</strong> <span style="color: #8B0000; font-size: 24px;">${correctLetter}</span></p>
            <div style="margin-top: 15px; padding: 15px; background: #fff8f8; border-radius: 8px; border: 2px solid #dc3545;">
                <p style="margin: 5px 0;"><strong>Word:</strong> ${word}</p>
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('wrongSound');
    }
    nextBtn.style.display = 'inline-block';
    scrollTo75Percent(nextBtn);
}



// لعبة الاستماع والكتابة
function renderListenWriteGame(item) {
    const textToSpeak = item.word;
    
    return `
        <div class="game-block">
            <h3 style="color: crimson; margin-bottom: 20px;">Listen and write the word</h3>
            
            <!-- Help Buttons -->
            <div style="margin: 10px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="openGoogleTranslate('${textToSpeak}')">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="openGoogleImages('${textToSpeak}')">🖼️ Image</button>
            </div>
            
            <div class="audio-button-container">
                <button class="audio-button" onclick="speakWord('${textToSpeak}')">🎧 Listen to the word</button>
            </div>
            
            <input type="text" id="listenWriteInput" placeholder="Type what you heard..." style="padding: 12px; font-size: 18px; width: 80%; text-align: center; border: 2px solid gray; border-radius: 8px;">
            
            <button onclick="checkListenWriteAnswer('${textToSpeak.replace(/'/g, "\\'")}', '${item.word}', '${item.example}')" style="background: crimson; color: white; border: none; padding: 10px 20px; margin: 15px; border-radius: 8px; cursor: pointer;">
                Check
            </button>
            
            <div id="listenWriteFeedback" style="min-height: 120px; margin: 15px 0; font-weight: bold; font-size: 18px;"></div>
            <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextBtn">Next</button>
        </div>
    `;
}

function checkListenWriteAnswer(correctText, word, example) {
    const userAnswer = document.getElementById('listenWriteInput').value.trim();
    const feedbackEl = document.getElementById('listenWriteFeedback');
    const nextBtn = document.getElementById('nextBtn');
    
    const normalizedUserAnswer = userAnswer.toLowerCase();
    const normalizedCorrectText = correctText.toLowerCase();
    
    if (normalizedUserAnswer === normalizedCorrectText) {
        feedbackEl.innerHTML = `
            <p style="color: green; font-size: 20px;">✓ Correct! Great job! 🎉</p>
            <div style="margin-top: 15px; padding: 15px; background: #f8fff8; border-radius: 8px; border: 2px solid #28a745;">
                <p style="margin: 5px 0;"><strong>Word:</strong> ${word}</p>
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('correctSound');
    } else {
        feedbackEl.innerHTML = `
            <p style="color: red; font-size: 20px;">✗ Wrong answer!</p>
            <p style="margin-top: 10px;"><strong>Correct word:</strong> <span style="color: #8B0000;">${correctText}</span></p>
            <p style="margin-top: 5px;"><strong>You wrote:</strong> ${userAnswer}</p>
            <div style="margin-top: 15px; padding: 15px; background: #fff8f8; border-radius: 8px; border: 2px solid #dc3545;">
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('wrongSound');
    }
    nextBtn.style.display = 'inline-block'; 
    scrollTo75Percent(nextBtn);
}


// لعبة الصوت
function renderAudioGame(item) {
    const otherWords = window.vocabList.filter(w => w.word !== item.word)
                             .map(w => w.word)
                             .sort(() => 0.5 - Math.random())
                             .slice(0, 3);
    
    const options = [item.word, ...otherWords].sort(() => 0.5 - Math.random());
    
    return `
        <div class="game-block">
            <h3 style="color: crimson; margin-bottom: 20px;">Listen and choose the correct word</h3>
            
            <!-- Help Buttons -->
            <div style="margin: 10px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
               
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="openGoogleTranslate('${item.word}')">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="openGoogleImages('${item.word}')">🖼️ Image</button>
            </div>
            
            <div class="audio-button-container">
                <button class="audio-button" onclick="speakWord('${item.word}')">🎧 Listen to the word</button>
            </div>
            
            <div class="audio-options">
                ${options.map(opt => `
                    <button onclick="handleAudioAnswer(this, '${opt}', '${item.word}', '${item.example}')" style="padding: 15px; margin: 10px; font-size: 18px; border: 2px solid crimson; border-radius: 8px; background: white; color: black; cursor: pointer;">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <div id="audioFeedback" style="min-height: 120px; margin: 15px 0;"></div>
            <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextAudioBtn">Next</button>
        </div>
    `;
}

function handleAudioAnswer(button, selectedWord, correctWord, example) {
    const feedbackEl = document.getElementById('audioFeedback');
    const nextBtn = document.getElementById('nextAudioBtn');
    
    const allButtons = button.parentElement.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    
    if (selectedWord === correctWord) {
        button.style.background = '#28a745';
        button.style.color = 'white';
        feedbackEl.innerHTML = `
            <p style="color: green; font-size: 20px;">✓ Correct! Great job! 🎉</p>
            <div style="margin-top: 15px; padding: 15px; background: #f8fff8; border-radius: 8px; border: 2px solid #28a745;">
                <p style="margin: 5px 0;"><strong>Word:</strong> ${correctWord}</p>
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('correctSound');
    } else {
        button.style.background = '#dc3545';
        button.style.color = 'white';
        
        const correctButton = Array.from(allButtons).find(btn => btn.textContent === correctWord);
        if (correctButton) {
            correctButton.style.background = '#28a745';
            correctButton.style.color = 'white';
        }
        
        feedbackEl.innerHTML = `
            <p style="color: red; font-size: 20px;">✗ Wrong answer!</p>
            <p style="margin-top: 10px;"><strong>Correct word:</strong> <span style="color: #8B0000;">${correctWord}</span></p>
            <div style="margin-top: 15px; padding: 15px; background: #fff8f8; border-radius: 8px; border: 2px solid #dc3545;">
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('wrongSound');
    }
    
    nextBtn.style.display = 'inline-block'; 
    scrollTo75Percent(nextBtn);
}



// لعبة ترتيب الحروف
function renderScrambleGame(item) {
    const scrambled = scrambleWord(item.word);
    
    return `
        <div class="game-block">
            <h3 style="color: crimson; margin-bottom: 20px;">Arrange the letters to form the correct word</h3>
            
            <!-- Help Buttons -->
            <div style="margin: 10px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #17a2b8; padding: 8px 15px;" onclick="speakWord('${item.word}')">🔊 Speak</button>
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="openGoogleTranslate('${item.word}')">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="openGoogleImages('${item.word}')">🖼️ Image</button>
            </div>
            
            <div class="scramble-word" style="font-size: 28px; letter-spacing: 8px; margin: 20px 0; font-weight: bold; color: #8B0000;">
                ${scrambled}
            </div>
            
            <input type="text" id="scrambleInput" placeholder="Type the correct word..." style="padding: 10px; font-size: 18px; width: 80%; text-align: center; border: 2px solid gray; border-radius: 8px;">
            
            <button onclick="checkScrambleAnswer('${item.word}', '${item.example}')" style="background: crimson; color: white; border: none; padding: 10px 20px; margin: 15px; border-radius: 8px; cursor: pointer;">
                Check
            </button>
            
            <div id="scrambleFeedback" style="min-height: 120px; margin: 15px 0;"></div>
            <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextBtn">Next</button>
        </div>
    `;
}

function checkScrambleAnswer(correctWord, example) {
    const userAnswer = document.getElementById('scrambleInput').value.trim();
    const feedbackEl = document.getElementById('scrambleFeedback');
    const nextBtn = document.getElementById('nextBtn');
    
    if (userAnswer.toLowerCase() === correctWord.toLowerCase()) {
        feedbackEl.innerHTML = `
            <p style="color: green; font-size: 20px;">✓ Correct! Great job! 🎉</p>
            <div style="margin-top: 15px; padding: 15px; background: #f8fff8; border-radius: 8px; border: 2px solid #28a745;">
                <p style="margin: 5px 0;"><strong>Word:</strong> ${correctWord}</p>
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('correctSound');
    } else {
        feedbackEl.innerHTML = `
            <p style="color: red; font-size: 20px;">✗ Wrong answer!</p>
            <p style="margin-top: 10px;"><strong>Correct word:</strong> <span style="color: #8B0000;">${correctWord}</span></p>
            <div style="margin-top: 15px; padding: 15px; background: #fff8f8; border-radius: 8px; border: 2px solid #dc3545;">
                <p style="margin: 5px 0;"><strong>Example:</strong> ${example}</p>
            </div>
        `;
        playSound('wrongSound');
    }
    
    nextBtn.style.display = 'inline-block'; 
    scrollTo75Percent(nextBtn);
}

// لعبة تمرين النطق باستخدام Web Speech API
function renderPronunciationGame(item) {
    const textToPronounce = item.word;
    
    return `
        <div class="game-block">
            <h3 style="color: crimson; margin-bottom: 20px;">Pronunciation Practice</h3>
            
            <!-- Help Buttons -->
            <div style="margin: 10px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="openGoogleTranslate('${textToPronounce}')">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="openGoogleImages('${textToPronounce}')">🖼️ Image</button>
            </div>
            
            <div style="margin: 20px 0; font-size: 20px;">
                <p>Pronounce the following word:</p>
                <p style="font-weight: bold; color: #8B0000; font-size: 28px;">${textToPronounce}</p>
            </div>
            
            <div style="margin: 20px 0;">
                <button class="audio-button" onclick="speakWord('${textToPronounce}')">🎧 Listen to correct pronunciation</button>
            </div>
            
            <div style="margin: 20px 0; text-align: center;">
                <p style="margin-bottom: 15px;">Click to start pronunciation test:</p>
                <button id="startTestBtn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 30px;
                    font-size: 18px;
                    cursor: pointer;
                    margin: 10px;
                " onclick="startPronunciationTest('${textToPronounce.replace(/'/g, "\\'")}')">
                    🎤 Start Test
                </button>
                
                <button id="stopTestBtn" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 30px;
                    font-size: 18px;
                    cursor: pointer;
                    margin: 10px;
                    display: none;
                " onclick="stopPronunciationTest()">
                    ⏹ Stop
                </button>
            </div>
            
            <div id="testStatus" style="margin: 15px 0; text-align: center;">
                <p id="statusText" style="font-size: 16px; color: #666;"></p>
            </div>
            
            <div id="pronunciationResult" style="margin: 15px 0; display: none;">
                <p style="font-size: 18px;"><strong>You said:</strong> <span id="spokenWord" style="color: #8B0000; font-weight: bold;"></span></p>
                <div id="pronunciationFeedback" style="min-height: 40px; margin: 15px 0; font-weight: bold; font-size: 18px;"></div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextBtn">Next</button>
                <button class="btn" onclick="skipPronunciationGame()" style="background: #FF9800; margin-left: 10px;">Skip</button>
            </div>
        </div>
    `;
}

// كائن التعرف على الكلام
let speechRecognition = null;

// بدء اختبار النطق
function startPronunciationTest(correctWord) {
    // إيقاف أي اختبار سابق
    stopPronunciationTest();
    
    // التحقق من دعم المتصفح
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        const feedbackEl = document.getElementById('pronunciationFeedback');
        if (feedbackEl) {
            feedbackEl.innerHTML = '<p style="color: red;">✗ متصفحك لا يدعم التعرف على الصوت. جرب Chrome أو Edge.</p>';
        }
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.style.display = 'inline-block'; scrollTo75Percent(nextBtn);
        return;
    }
    
    // إعداد التعرف على الكلام
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    
    speechRecognition.lang = 'en-US';
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 1;
    
    // تحديث واجهة المستخدم (بعد التأكد من وجود العناصر)
    const startBtn = document.getElementById('startTestBtn');
    const stopBtn = document.getElementById('stopTestBtn');
    const statusText = document.getElementById('statusText');
    const resultEl = document.getElementById('pronunciationResult');
    const feedbackEl = document.getElementById('pronunciationFeedback');
    
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    if (statusText) statusText.innerHTML = '<span style="color: #4CAF50;">🎤 جاري الاستماع... انطق الكلمة الآن</span>';
    if (resultEl) resultEl.style.display = 'block';
    if (feedbackEl) feedbackEl.innerHTML = '';
    
    // معالجة النتائج
    speechRecognition.onresult = function(event) {
        const userSpeech = event.results[0][0].transcript.toLowerCase().trim();
        const normalizedCorrect = correctWord.toLowerCase().trim();
        
        const spokenWordEl = document.getElementById('spokenWord');
        const statusTextEl = document.getElementById('statusText');
        const feedbackEl = document.getElementById('pronunciationFeedback');
        const nextBtn = document.getElementById('nextBtn');
        
        if (spokenWordEl) spokenWordEl.textContent = userSpeech;
        if (statusTextEl) statusTextEl.innerHTML = '<span style="color: #666;">✓ تم التعرف على الكلمة</span>';
        
        // إيقاف التعرف
        stopPronunciationTest();
        
        // تقييم النطق
        if (userSpeech === normalizedCorrect) {
            if (feedbackEl) {
                feedbackEl.innerHTML = '<p style="color: green; font-size: 20px;">✓ نطق صحيح! أحسنت!</p>';
            }
            playSound('correctSound');
        } else {
            if (feedbackEl) {
                feedbackEl.innerHTML = 
                    `<p style="color: red; font-size: 20px;">✗ نطق خاطئ!</p>
                     <p style="margin-top: 10px; color: #333;"><strong>نطقت:</strong> "${userSpeech}"</p>
                     <p style="color: #333;"><strong>الصحيح:</strong> "${correctWord}"</p>`;
            }
            playSound('wrongSound');
        }
        
        if (nextBtn) nextBtn.style.display = 'inline-block'; scrollTo75Percent(nextBtn);
    };
    
    // معالجة الأخطاء
    speechRecognition.onerror = function(event) {
        let errorMessage = 'حدث خطأ في التعرف على الصوت';
        
        switch(event.error) {
            case 'not-allowed':
                errorMessage = 'لم يتم السماح بالوصول إلى الميكروفون. تأكد من منح الإذن.';
                break;
            case 'no-speech':
                errorMessage = 'لم يتم اكتشاف أي كلام. حاول مرة أخرى.';
                break;
            case 'audio-capture':
                errorMessage = 'لا يوجد ميكروفون متاح.';
                break;
            case 'network':
                errorMessage = 'حدث خطأ في الشبكة.';
                break;
        }
        
        const feedbackEl = document.getElementById('pronunciationFeedback');
        if (feedbackEl) {
            feedbackEl.innerHTML = `<p style="color: red;">✗ ${errorMessage}</p>`;
        }
        
        stopPronunciationTest();
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.style.display = 'inline-block'; scrollTo75Percent(nextBtn);
    };
    
    speechRecognition.onend = function() {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.innerHTML = '<span style="color: #666;">⏹ توقف الاستماع</span>';
        }
    };
    
    // بدء التعرف
    try {
        speechRecognition.start();
        
        // إيقاف تلقائي بعد 10 ثواني
        setTimeout(() => {
            if (speechRecognition && speechRecognition.state === 'listening') {
                stopPronunciationTest();
                const feedbackEl = document.getElementById('pronunciationFeedback');
                if (feedbackEl) {
                    feedbackEl.innerHTML = '<p style="color: red;">⏰ انتهى الوقت! حاول مرة أخرى.</p>';
                }
            }
        }, 10000);
        
    } catch (error) {
        const feedbackEl = document.getElementById('pronunciationFeedback');
        if (feedbackEl) {
            feedbackEl.innerHTML = '<p style="color: red;">✗ لا يمكن بدء التعرف على الصوت</p>';
        }
    }
}

// إيقاف اختبار النطق
function stopPronunciationTest() {
    if (speechRecognition) {
        try {
            if (speechRecognition.state === 'listening') {
                speechRecognition.stop();
            }
        } catch (error) {
            console.log('خطأ في إيقاف التعرف:', error);
        }
        speechRecognition = null;
    }
    
    const startBtn = document.getElementById('startTestBtn');
    const stopBtn = document.getElementById('stopTestBtn');
    
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
}

// دالة تجاوز لعبة النطق
function skipPronunciationGame() {
    stopPronunciationTest();
    playSound('wrongSound');
    nextGame();
}

// تأكد من أن nextGame الأساسية لا تستدعي stopPronunciationTest
// إذا كان عندك nextGame أخرى، احذف السطر الذي يستدعي stopPronunciationTest منها

// ===== دالة playSound الأساسية (إذا لم تكن موجودة) =====
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.error(`حدث خطأ في تشغيل الصوت: ${soundId}`, e);
        });
    }
}

// ===== الألعاب بدون الميزة الجديدة (التوصيل والعجلة) =====
function renderWheelGame() {
    const wheelItems = [...vocabList].sort(() => 0.5 - Math.random()).slice(0, 8);
    const wheelId = `wheel-${Date.now()}`;
    
    return `
        <div class="game-block">
            <div class="wheel-container">
                <div class="pointer"></div>
                <div class="wheel" id="${wheelId}">
                    ${wheelItems.map((item, i) => `
                        <div class="wheel-item" style="transform: rotate(${(360 / wheelItems.length) * i}deg) skewY(-60deg);">
                            ${item.word}
                        </div>
                    `).join('')}
                </div>
                <button class="btn" onclick="spinWheel('${wheelId}', ${JSON.stringify(wheelItems).replace(/"/g, '&quot;')})">🎡 Spin the Wheel</button>
            </div>
            
            <div class="flip-card" id="flipCard-${wheelId}" onclick="flipCard('flipCard-${wheelId}')">
                <div class="flip-card-inner">
                    <div class="flip-card-front" id="cardFront-${wheelId}">
                        <div style="font-size: 24px; font-weight: bold;">🎡 Spin the wheel first!</div>
                    </div>
                    <div class="flip-card-back" id="cardBack-${wheelId}">
                        <div id="word-${wheelId}" style="font-size: 26px; font-weight: bold; color: #dc143c; margin-bottom: 10px;"></div>
                        <div id="example-${wheelId}" style="margin-bottom: 15px; color: #555; font-size: 14px;"></div>
                    </div>
                </div>
            </div>
            
            <!-- أزرار منفصلة خارج البطاقة - مخفية في البداية -->
            <div id="wheel-buttons-${wheelId}" style="display: none; margin-top: 15px; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button class="btn" style="background: #17a2b8; padding: 8px 15px;" onclick="event.stopPropagation(); speakWord(document.getElementById('word-${wheelId}').innerText)">🔊 Speak Word</button>
                <button class="btn" style="background: #ffc107; padding: 8px 15px; color:#333;" onclick="event.stopPropagation(); speakWord(document.getElementById('example-${wheelId}').innerText.replace('📝 ', ''))">📢 Speak Example</button>
                <button class="btn" style="background: #007bff; padding: 8px 15px;" onclick="event.stopPropagation(); openGoogleTranslate(document.getElementById('word-${wheelId}').innerText)">🌐 Translate</button>
                <button class="btn" style="background: #28a745; padding: 8px 15px;" onclick="event.stopPropagation(); openGoogleImages(document.getElementById('word-${wheelId}').innerText)">🖼️ Image</button>
            </div>
            
            <button class="btn" onclick="nextGame()" style="display:none; margin-top:20px;" id="nextBtn">Next</button>
        </div>
    `;
}

// تحميل الأصوات عند بدء الصفحة
window.speechSynthesis.getVoices();
// ===== دوال التحكم في الألعاب =====

function handleAnswer(button, selected, correct) {
  if (button.disabled) return;
  
  const isCorrect = selected === correct;
  button.classList.add(isCorrect ? "correct" : "wrong");
  
  button.parentElement.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
  });
  
  if (isCorrect) {
    playSound('correctSound');
  } else {
    playSound('wrongSound');
  }
  
  document.getElementById("nextBtn").style.display = "inline-block";
}

function handleTimedAnswer(button, selected, correct) {
  if (button.disabled) return;
  
  const isCorrect = selected === correct;
  button.classList.add(isCorrect ? "correct" : "wrong");
  
  button.parentElement.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
  });
  
  if (isCorrect) {
    playSound('correctSound');
  } else {
    playSound('wrongSound');
  }
  
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
  
  document.getElementById("nextBtn").style.display = "inline-block";
}

function handleTrueFalse(button, selected, isCorrect) {
  if (button.disabled) return;
  
  const answerIsCorrect = selected === isCorrect;
  button.classList.add(answerIsCorrect ? "correct" : "wrong");
  
  button.parentElement.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
  });
  
  if (answerIsCorrect) {
    playSound('correctSound');
  } else {
    playSound('wrongSound');
  }
  
  document.getElementById("nextBtn").style.display = "inline-block";
}

function spinWheel(wheelId, items) {
    const wheel = document.getElementById(wheelId);
    const sectors = items.length;
    let angle = Math.floor(Math.random() * 360) + 1440;
    
    wheel.style.transform = `rotate(${angle}deg)`;
    
    setTimeout(() => {
        const normalizedAngle = angle % 360;
        const selectedIndex = Math.floor(normalizedAngle / (360 / sectors));
        const selected = items[selectedIndex];
        
        const flipCard = document.getElementById(`flipCard-${wheelId}`);
        const cardFront = document.getElementById(`cardFront-${wheelId}`);
        const wordDiv = document.getElementById(`word-${wheelId}`);
        const exampleDiv = document.getElementById(`example-${wheelId}`);
        const buttonsDiv = document.getElementById(`wheel-buttons-${wheelId}`);
        
        // إظهار البطاقة والأزرار
        flipCard.style.display = "block";
        if (buttonsDiv) {
            buttonsDiv.style.display = "flex";  // إظهار الأزرار
        }
        
        cardFront.innerHTML = `<div style="font-size: 28px; font-weight: bold;">🎉 ${selected.word} 🎉</div>`;
        wordDiv.textContent = selected.word;
        exampleDiv.innerHTML = `📝 ${selected.example}`;
        
        playSound('winSound');
        
        const nextBtn = document.getElementById("nextBtn");
        if (nextBtn) {
            nextBtn.style.display = "inline-block";
            scrollTo75Percent(nextBtn);
        }
    }, 4000);
}

function flipCard(cardId) {
  const card = document.getElementById(cardId);
  card.classList.toggle("flipped");
}

function handleMatch(element, word, gameId) {
  if (element.classList.contains('matched')) return;
  
  selectedItems.push({
    element: element,
    word: word
  });
  
  element.classList.add('selected');
  
  if (selectedItems.length === 2) {
    const [first, second] = selectedItems;
    
    if (first.word === second.word) {
      first.element.classList.remove('selected');
      first.element.classList.add('matched');
      second.element.classList.remove('selected');
      second.element.classList.add('matched');
      
      playSound('correctSound');
      
      const allItems = document.querySelectorAll(`#${gameId} .match-item`);
      const matchedItems = document.querySelectorAll(`#${gameId} .matched`);
      
      if (allItems.length === matchedItems.length) {
    playSound('winSound');
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
        nextBtn.style.display = "inline-block";
        scrollTo75Percent(nextBtn);
    }
}
    } else {
      first.element.classList.add('wrong-match');
      second.element.classList.add('wrong-match');
      
      playSound('wrongSound');
      
      setTimeout(() => {
        first.element.classList.remove('selected', 'wrong-match');
        second.element.classList.remove('selected', 'wrong-match');
      }, 500);
    }
    
    selectedItems = [];
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== بدء التطبيق =====

window.addEventListener("DOMContentLoaded", () => {
  preloadAudio();
  generateGamesSequence();
  renderVocabList();
  renderCurrentGame();
});

// تحصين عام ضد الأخطاء
window.addEventListener('error', function(e) {
  console.error('حدث خطأ غير متوقع:', e.message);
});
        let gfc_currentIndex = 0;
        const gfc_overlay = document.getElementById('gfc-fullscreen-overlay');
        const gfc_card = document.getElementById('gfc-card-element');

        function gfc_launchApp() {
    gfc_overlay.style.display = 'flex';
    if (gfc_overlay.requestFullscreen) {
        gfc_overlay.requestFullscreen();
    }
    gfc_updateUI();
    restoreCardState(); // استعادة الحالة المحفوظة
}
    
function toggleCardFlip(event) {
    if (event && event.target !== gfc_card && !gfc_card.contains(event.target)) return;
    // منع التقليب إذا كان الضغط على زر
    if (event && (event.target.tagName === 'BUTTON' || event.target.closest('button'))) return;
    
    gfc_card.classList.toggle('gfc-is-flipped');
    saveCardState();
}
function gfc_exitApp() {
    // فقط نغلق الـ overlay، لا نخرج من fullscreen تلقائياً
    gfc_overlay.style.display = 'none';
    
    // إذا كنا في وضع fullscreen، نخرج منه فقط إذا كان المستخدم ضغط Close
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

       function gfc_updateUI() {
    const data = window.vocabList[gfc_currentIndex];
    
    gfc_card.classList.remove('gfc-is-flipped');
    
    setTimeout(() => {
        document.getElementById('gfc-front-val').innerText = data.word;
        document.getElementById('gfc-ex-en').innerText = `"${data.example}"`;
        
        const total = window.vocabList.length;
        document.getElementById('gfc-counter-text').innerText = `${gfc_currentIndex + 1} / ${total}`;
        document.getElementById('gfc-bar-fill').style.width = ((gfc_currentIndex + 1) / total * 100) + '%';
        
        const backDiv = document.querySelector('#gfc-card-element .gfc-face-back');
        if (backDiv && !backDiv.querySelector('.help-buttons')) {
            const helpDiv = document.createElement('div');
            helpDiv.className = 'help-buttons';
            helpDiv.style.marginTop = '15px';
            helpDiv.style.display = 'flex';
            helpDiv.style.gap = '10px';
            helpDiv.style.justifyContent = 'center';
            helpDiv.style.flexWrap = 'wrap';
            helpDiv.innerHTML = `
                <button class="btn" style="background:#17a2b8; padding:5px 10px; font-size:12px;" data-action="speakWord">🔊 Speak Word</button>
                <button class="btn" style="background:#ffc107; padding:5px 10px; font-size:12px; color:#333;" data-action="speakExample">📢 Speak Example</button>
                <button class="btn" style="background:#007bff; padding:5px 10px; font-size:12px;" data-action="translate">🌐 Translate</button>
                <button class="btn" style="background:#28a745; padding:5px 10px; font-size:12px;" data-action="image">🖼️ Image</button>
            `;
            
            // إضافة الأحداث مع منع انتشارها
            const wordSpeakBtn = helpDiv.querySelector('[data-action="speakWord"]');
            const exampleSpeakBtn = helpDiv.querySelector('[data-action="speakExample"]');
            const translateBtn = helpDiv.querySelector('[data-action="translate"]');
            const imageBtn = helpDiv.querySelector('[data-action="image"]');
            
            wordSpeakBtn.onclick = (e) => { e.stopPropagation(); speakWord(data.word); };
            exampleSpeakBtn.onclick = (e) => { e.stopPropagation(); speakWord(data.example); };
            translateBtn.onclick = (e) => { e.stopPropagation(); openGoogleTranslate(data.word); };
            imageBtn.onclick = (e) => { e.stopPropagation(); openGoogleImages(data.word); };
            
            backDiv.appendChild(helpDiv);
        }
    }, 150);
    
    gfc_speak();
}

        function gfc_move(step) {
    event.stopPropagation();
    let target = gfc_currentIndex + step;
    if (target >= 0 && target < window.vocabList.length) {
        gfc_currentIndex = target;
        gfc_updateUI();
        // عند تغيير البطاقة، نعيد البطاقة للوضع الأمامي
        gfc_card.classList.remove('gfc-is-flipped');
        saveCardState();
    }
}

        // إغلاق الواجهة عند الخروج من الفول سكرين بزر Esc
        document.addEventListener('fullscreenchange', () => {
    // لا نفعل شيئاً، فقط نسجل أن المستخدم خرج من fullscreen
    console.log('Fullscreen mode changed');
});
function gfc_speak(event) {
    if (event) event.stopPropagation(); // يمنع قلب البطاقة
    
    const word = window.vocabList[gfc_currentIndex].word;
    const msg = new SpeechSynthesisUtterance();
    msg.text = word;
    msg.lang = 'en-GB';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}
    function scrollTo75Percent(element) {
  const windowHeight = window.innerHeight;
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const targetScrollPos = absoluteElementTop - (windowHeight * 0.75) + elementRect.height;
  // نحدد الحد الأدنى للتمرير (0) والحد الأقصى (scrollHeight)
  const maxScroll = document.body.scrollHeight - windowHeight;
  const finalScrollPos = Math.max(0, Math.min(targetScrollPos, maxScroll));
  window.scrollTo({
    top: finalScrollPos,
    behavior: 'smooth'
  });
}
    // دالة لتنسيق النص للـ Shadowing
function formatForShadowing() {
    let result = '';
    for (let i = 0; i < window.vocabList.length; i++) {
        const item = window.vocabList[i];
        result += `${item.word}.\n`;
        result += `${item.example}\n\n`;
    }
    return result.trim();
}

// دالة النسخ
async function copyForShadowing() {
    const text = formatForShadowing();
    
    try {
        await navigator.clipboard.writeText(text);
        
        // إظهار رسالة نجاح مؤقتة
        const btn = document.getElementById('copyShadowingBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.background = '#28a745';
        btn.style.color = '#fff';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
        
        console.log('Shadowing text copied successfully!');
    } catch (err) {
        console.error('Failed to copy: ', err);
        
        // Fallback للمتصفحات القديمة
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const btn = document.getElementById('copyShadowingBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⚠️ Copied!';
        btn.style.background = '#ffc107';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#28a745';
        }, 2000);
    }
}

// ربط الزر بالدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyShadowingBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyForShadowing);
    }
});
    // دالة العودة إلى الألعاب
function backToGames() {
    // العودة إلى stage1 (الألعاب)
    showStage('stage1');
    
    // إعادة تعيين اللعبة إذا أردت
    // currentGameIndex = 0;
    // generateGamesSequence();
    // renderCurrentGame();
}

// ربط الأزرار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // ربط أزرار العودة إلى الألعاب
    const backBtn1 = document.getElementById('backToGamesBtn');
    const backBtn2 = document.getElementById('backToGamesBtn2');
    
    if (backBtn1) backBtn1.addEventListener('click', backToGames);
    if (backBtn2) backBtn2.addEventListener('click', backToGames);
});
    // ===== دوال النطق والصوت =====

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang.includes('en'));
        
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        utterance.onerror = function(event) {
            console.error('خطأ في النطق:', event);
            alert(`الكلمة هي: ${text}`);
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert(`الكلمة هي: ${text}`);
    }
}

function loadVoices() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
}

window.addEventListener('DOMContentLoaded', function() {
    loadVoices();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
});
