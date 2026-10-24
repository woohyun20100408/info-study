import "./style.css";
import { loginWithGoogle } from "./auth";
import { subscribeTopRankings, syncRankingEntry } from "./ranking";
import { 
  QUIZ_DATA, 
  finishQuiz, 
  loginAsGuest, 
  getUserProfile,
  updateUserProfile,
  createRandomizedQuestion
} from "./study";

const app = document.querySelector("#app");

let answerAudioContext = null;

function playCorrectAnswerSound() {
  if (localStorage.getItem("infoStudy_soundEffects") === "off") return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!answerAudioContext || answerAudioContext.state === "closed") {
      answerAudioContext = new AudioContextClass();
    }

    const context = answerAudioContext;
    const playChime = () => {
      const startAt = context.currentTime;
      const notes = [
        { frequency: 659.25, offset: 0, duration: 0.18 },
        { frequency: 783.99, offset: 0.085, duration: 0.22 }
      ];

      notes.forEach(({ frequency, offset, duration }) => {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const noteStart = startAt + offset;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        volume.gain.setValueAtTime(0.0001, noteStart);
        volume.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.01);
      });
    };

    if (context.state === "suspended") {
      context.resume().then(playChime).catch(() => {});
    } else {
      playChime();
    }
  } catch (error) {
    // 소리 출력이 지원되지 않더라도 퀴즈 진행에는 영향을 주지 않습니다.
    console.debug("정답 효과음을 재생하지 못했습니다.", error);
  }
}

// 오답 효과음: 부담스럽지 않은 낮은 두 음으로 짧게 알림
function playIncorrectAnswerSound() {
  if (localStorage.getItem("infoStudy_soundEffects") === "off") return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!answerAudioContext || answerAudioContext.state === "closed") {
      answerAudioContext = new AudioContextClass();
    }

    const context = answerAudioContext;
    const playSoftTone = () => {
      const startAt = context.currentTime;
      const notes = [
        { frequency: 392, offset: 0, duration: 0.13 },
        { frequency: 329.63, offset: 0.11, duration: 0.17 }
      ];

      notes.forEach(({ frequency, offset, duration }) => {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const noteStart = startAt + offset;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        volume.gain.setValueAtTime(0.0001, noteStart);
        volume.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.01);
      });
    };

    if (context.state === "suspended") {
      context.resume().then(playSoftTone).catch(() => {});
    } else {
      playSoftTone();
    }
  } catch (error) {
    // 오디오가 지원되지 않아도 문제 풀이 자체는 계속 진행합니다.
    console.debug("오답 효과음을 재생하지 못했습니다.", error);
  }
}



// ==========================================
// 공통 심플 회색 SVG 아이콘 모음 (#8b95a1)
// ==========================================
const ICONS = {
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  ide: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  ranking: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M6 9a6 6 0 0 0 12 0V3H6v6z"></path></svg>`,
  profile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  quizCard: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>`,
  terminal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  download: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3182f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
};

// ==========================================
// 아두이노 코드 학습 퀴즈 (기초 10문제)
// ==========================================
const ARDUINO_QUESTIONS = [
  {
    "question": "아두이노 스케치에서 setup()과 loop()의 역할을 올바르게 설명한 것은 무엇인가요?",
    "options": [
      "setup()은 한 번 실행되고, loop()는 보드가 작동하는 동안 반복 실행된다.",
      "setup()과 loop()는 모두 한 번만 실행된다.",
      "setup()이 계속 반복되고, loop()는 한 번만 실행된다.",
      "두 함수는 반드시 없어도 같은 방식으로 동작한다."
    ],
    "answer": 0,
    "explanation": "setup()은 전원 공급 또는 리셋 뒤 한 번 초기 설정을 할 때 사용하고, loop()는 그 이후 계속 반복 실행됩니다."
  },
  {
    "question": "다음 코드의 pinMode(LED_PIN, OUTPUT)은 무엇을 설정하나요?\n\nconst int LED_PIN = 13;\nvoid setup() {\n  pinMode(LED_PIN, OUTPUT);\n}",
    "options": [
      "13번 핀을 출력용으로 설정한다.",
      "13번 핀에서 아날로그 값을 읽는다.",
      "13번 핀을 통신 속도 13으로 설정한다.",
      "LED를 자동으로 13번 깜빡이게 한다."
    ],
    "answer": 0,
    "explanation": "pinMode()는 핀의 동작 모드를 설정합니다. OUTPUT은 해당 핀으로 HIGH나 LOW 신호를 출력할 때 사용합니다."
  },
  {
    "question": "다음 코드가 일반적인 LED 회로에서 실행되면 어떤 동작을 하나요?\n\ndigitalWrite(13, HIGH);",
    "options": [
      "13번 핀을 입력 모드로 바꾼다.",
      "13번 핀에서 아날로그 값을 읽는다.",
      "13번 핀을 HIGH 상태로 출력해 LED를 켠다.",
      "프로그램을 즉시 종료한다."
    ],
    "answer": 2,
    "explanation": "digitalWrite()는 디지털 핀에 HIGH 또는 LOW를 출력합니다. 일반적인 HIGH-활성 LED 회로에서는 HIGH가 켜짐, LOW가 꺼짐에 해당합니다."
  },
  {
    "question": "아두이노 코드에서 delay(1000);은 얼마나 기다리나요?",
    "options": [
      "1000초",
      "1초",
      "100밀리초",
      "프로그램을 멈추지 않고 즉시 다음 줄로 이동한다."
    ],
    "answer": 1,
    "explanation": "delay()의 단위는 밀리초(ms)입니다. 1000밀리초는 1초입니다."
  },
  {
    "question": "버튼을 2번 핀과 GND 사이에 연결하고 pinMode(2, INPUT_PULLUP)을 사용했습니다. 버튼을 눌렀을 때 일반적으로 digitalRead(2)는 무엇을 반환하나요?",
    "options": [
      "HIGH",
      "1023",
      "2",
      "LOW"
    ],
    "answer": 3,
    "explanation": "INPUT_PULLUP은 내부 풀업 저항을 사용합니다. 버튼이 눌려 핀이 GND에 연결되면 LOW, 누르지 않으면 HIGH로 읽히는 구성이 일반적입니다."
  },
  {
    "question": "Arduino Uno에서 analogRead(A0)의 반환값 범위로 알맞은 것은 무엇인가요?",
    "options": [
      "0부터 1023까지",
      "0부터 255까지",
      "-100부터 100까지",
      "항상 0 또는 1"
    ],
    "answer": 0,
    "explanation": "Arduino Uno의 기본 ADC는 10비트이므로 analogRead() 결과는 일반적으로 0~1023 범위입니다."
  },
  {
    "question": "Arduino Uno에서 analogWrite(9, 128);을 실행했을 때 가장 알맞은 설명은 무엇인가요?",
    "options": [
      "9번 핀에서 128볼트를 출력한다.",
      "9번 핀을 입력 전용으로 설정한다.",
      "PWM 출력값 0~255 중 128에 해당하는 신호를 출력한다.",
      "9번 핀의 아날로그 입력을 읽는다."
    ],
    "answer": 2,
    "explanation": "Uno의 analogWrite()는 PWM을 지원하는 핀에서 0~255 값으로 출력 세기를 조절합니다. 128은 대략 절반 수준의 듀티 사이클에 해당합니다."
  },
  {
    "question": "Serial.begin(9600);의 목적은 무엇인가요?",
    "options": [
      "디지털 9600번 핀을 켠다.",
      "시리얼 통신 속도를 9600 baud로 설정한다.",
      "프로그램을 9600초 동안 대기시킨다.",
      "아날로그 입력 범위를 9600으로 변경한다."
    ],
    "answer": 1,
    "explanation": "Serial.begin(9600)은 시리얼 통신을 시작하고 통신 속도를 9600 baud로 설정합니다. 시리얼 모니터의 속도도 일치시켜야 합니다."
  },
  {
    "question": "가변저항이나 조도 센서처럼 아날로그 값을 읽기 위한 코드로 알맞은 것은 무엇인가요?",
    "options": [
      "digitalWrite(A0, HIGH);",
      "pinMode(A0, OUTPUT);",
      "delay(A0);",
      "int sensorValue = analogRead(A0);"
    ],
    "answer": 3,
    "explanation": "analogRead(A0)는 A0 핀에서 아날로그 입력값을 읽어 반환합니다. 센서값을 변수에 저장해 조건 판단 등에 사용할 수 있습니다."
  },
  {
    "question": "다음 코드가 계속 실행될 때 LED의 동작은 무엇인가요?\n\nconst int ledPin = 13;\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(500);\n  digitalWrite(ledPin, LOW);\n  delay(500);\n}",
    "options": [
      "LED가 한 번 켜진 뒤 계속 켜져 있다.",
      "LED가 5초 켜지고 5초 꺼진다.",
      "LED가 0.5초 켜지고 0.5초 꺼지는 동작을 반복한다.",
      "LED 핀을 입력 모드로 바꿔 버튼을 읽는다."
    ],
    "answer": 2,
    "explanation": "loop()가 반복되며 LED를 켠 뒤 500ms 기다리고, 끈 뒤 다시 500ms 기다립니다. 따라서 0.5초 켜짐과 0.5초 꺼짐이 반복됩니다."
  }
];

// ==========================================
// 파이썬 실행 엔진 (Pyodide) 인스턴스
// ==========================================
let pyodideInstance = null;

async function initPyodide() {
  if (!pyodideInstance && window.loadPyodide) {
    pyodideInstance = await window.loadPyodide();
  }
  return pyodideInstance;
}

// HTML 특수문자 이스케이프 함수
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 문제 텍스트 및 코드 포맷팅
function formatQuestionContent(questionText) {
  if (questionText.includes("\n\n")) {
    const splitIdx = questionText.indexOf("\n\n");
    const prompt = questionText.substring(0, splitIdx);
    const code = questionText.substring(splitIdx + 2);

    return `
      <div class="quiz-prompt">${prompt.replace(/\n/g, "<br>")}</div>
      <pre class="quiz-code-block"><code>${escapeHtml(code)}</code></pre>
    `;
  }
  return `<div class="quiz-prompt">${questionText.replace(/\n/g, "<br>")}</div>`;
}

// 테마 초기화
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// 앱 시작
async function initApp() {
  const savedUser = localStorage.getItem("infoStudy_user");
  if (savedUser) {
    const parsedUser = JSON.parse(savedUser);

    // [스윙투앱 연동] 세션 유지되어 자동 로그인 시 앱 회원 등록
    if (window.swingWebViewPlugin?.app?.login) {
      window.swingWebViewPlugin.app.login.doAppLogin(
        parsedUser.uid,
        parsedUser.nickname || parsedUser.displayName || "학습자"
      );
    }

    if (parsedUser.isGuest) {
      showApp(parsedUser);
    } else {
      const freshProfile = await getUserProfile(parsedUser.uid);
      if (freshProfile) {
        localStorage.setItem("infoStudy_user", JSON.stringify(freshProfile));
        await syncRankingEntry(parsedUser.uid, { ...freshProfile, isGuest: false });
        showApp(freshProfile);
      } else {
        // 이전 버전에서 로그인했지만 Firestore 프로필 저장에 실패한 계정을 복구합니다.
        const recoveredProfile = {
          uid: parsedUser.uid,
          nickname: parsedUser.nickname || parsedUser.displayName || "학습자",
          email: parsedUser.email || "",
          xp: Number(parsedUser.xp) || 0,
          level: Number(parsedUser.level) || 1,
          solvedProblems: Number(parsedUser.solvedProblems) || 0,
          isGuest: false
        };
        await updateUserProfile(parsedUser.uid, {
          nickname: recoveredProfile.nickname,
          email: recoveredProfile.email,
          xp: recoveredProfile.xp,
          level: recoveredProfile.level,
          solvedProblems: recoveredProfile.solvedProblems,
          isGuest: false
        });
        localStorage.setItem("infoStudy_user", JSON.stringify(recoveredProfile));
        showApp(recoveredProfile);
      }
    }
  } else {
    showLogin();
  }
}

function showLogin() {
  initTheme();
  app.innerHTML = `
    <div class="login-page">
      <section class="login-content" aria-label="인포스터디 로그인">
        <div class="login-brand">
          <div class="login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M6.5 11.5v4.2c3.5 2.7 7.5 2.7 11 0v-4.2M21 9.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="login-brand-name">인포스터디</h1>
          <p class="login-description">로그인하고 학습을 시작하세요.</p>
        </div>

        <button id="google-login" class="google-button">
          <svg class="google-icon" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.8 46.98 24.55Z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -2)"/>
          </svg>
          <span>Google로 계속하기</span>
        </button>

        <div class="login-divider"><span>또는</span></div>

        <div class="guest-login-panel">
          <label class="guest-label" for="guest-nickname-input">닉네임으로 체험하기</label>
          <input type="text" id="guest-nickname-input" class="guest-nickname-input" maxlength="10" placeholder="사용할 닉네임" autocomplete="nickname" />
          <button id="guest-login" class="guest-button">게스트로 시작하기</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector("#google-login").addEventListener("click", async () => {
    const user = await loginWithGoogle();
    if (user) {
      const existingProfile = await getUserProfile(user.uid);
      
      const userData = existingProfile ? {
        ...existingProfile,
        nickname: existingProfile.nickname || user.displayName || "학습자"
      } : {
        uid: user.uid,
        nickname: user.displayName || "학습자",
        email: user.email || "",
        xp: 0,
        level: 1,
        isGuest: false
      };

      if (!existingProfile && typeof updateUserProfile === "function") {
        await updateUserProfile(user.uid, {
          nickname: userData.nickname,
          email: userData.email,
          xp: userData.xp,
          level: userData.level,
          solvedProblems: userData.solvedProblems || 0,
          isGuest: false
        });
      }

      // [스윙투앱 연동] 구글 로그인 성공 시
      if (window.swingWebViewPlugin?.app?.login) {
        window.swingWebViewPlugin.app.login.doAppLogin(userData.uid, userData.nickname);
      }

      // 이전에 만들어진 사용자 프로필도 로그인 시 랭킹 DB에 반영합니다.
      if (existingProfile) {
        await syncRankingEntry(user.uid, { ...userData, isGuest: false });
      }

      localStorage.setItem("infoStudy_user", JSON.stringify(userData));
      showApp(userData);
    }
  });

  document.querySelector("#guest-login").addEventListener("click", async () => {
    const nicknameInput = document.querySelector("#guest-nickname-input");
    const nickname = nicknameInput ? nicknameInput.value.trim() : "";
    
    if (!nickname) {
      alert("닉네임을 입력해 주세요!");
      return;
    }

    const guestUser = await loginAsGuest(nickname);
    if (guestUser) {
      guestUser.isGuest = true;
      guestUser.nickname = nickname;

      // [스윙투앱 연동] 게스트 로그인 성공 시
      if (window.swingWebViewPlugin?.app?.login) {
        window.swingWebViewPlugin.app.login.doAppLogin(guestUser.uid, `(게스트) ${nickname}`);
      }

      localStorage.setItem("infoStudy_user", JSON.stringify(guestUser));
      showApp(guestUser);
    }
  });
}

function showApp(user) {
  initTheme();

  app.innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="logo">인포스터디</div>
        <button id="logout" class="logout-button">로그아웃</button>
      </header>

      <main id="main-content" class="container"></main>

      <nav class="bottom-nav">
        <button class="nav-btn active" data-tab="home">
          <span class="nav-icon-box">${ICONS.home}</span>
          <small>홈</small>
        </button>

        <button class="nav-btn" data-tab="study">
          <span class="nav-icon-box">${ICONS.ide}</span>
          <small>IDE</small>
        </button>

        <button class="nav-btn" data-tab="ranking">
          <span class="nav-icon-box">${ICONS.ranking}</span>
          <small>랭킹</small>
        </button>

        <button class="nav-btn" data-tab="profile">
          <span class="nav-icon-box">${ICONS.profile}</span>
          <small>설정</small>
        </button>
      </nav>
    </div>
  `;

  const mainContent = document.querySelector("#main-content");
  const navButtons = document.querySelectorAll(".nav-btn");

  let stopRankingUpdates = null;

  async function switchTab(tabName) {
    if (stopRankingUpdates) {
      stopRankingUpdates();
      stopRankingUpdates = null;
    }

    let currentUser = JSON.parse(localStorage.getItem("infoStudy_user")) || user;
    
    if (!currentUser.isGuest) {
      const freshData = await getUserProfile(currentUser.uid);
      if (freshData) {
        currentUser = freshData;
        localStorage.setItem("infoStudy_user", JSON.stringify(currentUser));
      }
    }

    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    if (tabName === "ranking") {
      mainContent.innerHTML = `<div class="empty-state"><p class="gray-text">Realtime Database에서 랭킹을 불러오는 중...</p></div>`;

      const showRankingError = (error) => {
        console.error("랭킹 화면 표시 실패:", error);
        const rankingButton = document.querySelector('.nav-btn[data-tab="ranking"]');
        if (!rankingButton?.classList.contains("active")) return;

        mainContent.innerHTML = `
          <section class="page-header fade-in">
            <h1>실시간 랭킹</h1>
            <p class="gray-text">Realtime Database에 연결하지 못했습니다. 데이터베이스 URL과 보안 규칙을 확인해 주세요.</p>
            <button id="retry-ranking-btn" class="google-button" style="margin-top: 12px;">다시 불러오기</button>
          </section>
        `;
        const retryButton = mainContent.querySelector("#retry-ranking-btn");
        if (retryButton) retryButton.addEventListener("click", () => switchTab("ranking"));
      };

      try {
        stopRankingUpdates = subscribeTopRankings(
          10,
          (rankData) => {
            const rankingButton = document.querySelector('.nav-btn[data-tab="ranking"]');
            if (rankingButton?.classList.contains("active")) {
              mainContent.innerHTML = renderRanking(currentUser, rankData);
            }
          },
          showRankingError
        );
      } catch (error) {
        showRankingError(error);
      }
    } else if (tabName === "home") {
      mainContent.innerHTML = renderHome(currentUser);
      bindHomeEvents();
    } else if (tabName === "study") {
      mainContent.innerHTML = renderStudy();
      bindStudyEvents();
    } else if (tabName === "profile") {
      mainContent.innerHTML = renderMyInfo(currentUser);
      bindProfileEvents(currentUser);
    }
  }

  function bindHomeEvents() {
    const studyCard = document.querySelector(".study-card");
    if (studyCard) {
      studyCard.addEventListener("click", () => {
        startQuiz();
      });
    }

    const arduinoStudyCard = document.querySelector(".arduino-study-card");
    if (arduinoStudyCard) {
      arduinoStudyCard.addEventListener("click", () => {
        startQuiz("arduino");
      });
    }
  }

  function bindStudyEvents() {
    const runBtn = document.querySelector("#run-code-btn");
    const codeInput = document.querySelector("#python-code-input");
    const inputValues = document.querySelector("#python-stdin-input");
    const outputEl = document.querySelector("#python-output");

    if (runBtn && codeInput && outputEl) {
      runBtn.addEventListener("click", async () => {
        if (!window.loadPyodide) {
          outputEl.textContent = "❌ index.html에 Pyodide 스크립트가 추가되지 않았습니다.";
          return;
        }

        const code = codeInput.value;
        outputEl.textContent = "파이썬 엔진 준비 및 코드 실행 중...";
        runBtn.disabled = true;
        
        const originalText = runBtn.textContent;
        runBtn.textContent = "실행 중...";
        runBtn.style.backgroundColor = "#8b95a1";

        try {
          const pyodide = await initPyodide();
          if (!pyodide) {
            throw new Error("파이썬 엔진을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
          }

          pyodide.globals.set("infoStudyInputText", inputValues ? inputValues.value : "");
          pyodide.runPython(`
import sys
import io
import builtins

_info_study_original_stdout = sys.stdout
_info_study_original_input = builtins.input
sys.stdout = io.StringIO()
_info_study_input_lines = iter(infoStudyInputText.splitlines())

def _info_study_input(prompt=""):
    if prompt:
        print(prompt, end="")
    try:
        value = next(_info_study_input_lines)
    except StopIteration:
        raise EOFError("input()에 사용할 입력값이 부족합니다. 입력값 칸에 한 줄씩 추가하세요.")
    print(value)
    return value

builtins.input = _info_study_input
          `);

          await pyodide.runPythonAsync(code);

          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          outputEl.textContent = stdout || "(출력 결과가 없습니다)";
        } catch (err) {
          let partialOutput = "";
          try {
            partialOutput = pyodideInstance ? (pyodideInstance.runPython("sys.stdout.getvalue()") || "") : "";
          } catch {
            // 출력 버퍼가 준비되기 전에 발생한 오류는 별도로 표시한다.
          }
          outputEl.textContent = (partialOutput ? partialOutput + "\n" : "") + "❌ 에러 발생:\n" + err.message;
        } finally {
          if (pyodideInstance) {
            try {
              pyodideInstance.runPython("builtins.input = _info_study_original_input\nsys.stdout = _info_study_original_stdout");
            } catch {
              // 초기화 도중 실패한 경우 출력/입력 복원은 건너뛴다.
            }
          }
          runBtn.disabled = false;
          runBtn.textContent = originalText;
          runBtn.style.backgroundColor = "#3182f6";
        }
      });
    }
  }

  function bindProfileEvents(userObj) {
    const themeToggleBtn = document.querySelector("#theme-toggle-btn");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");

        const labelEl = document.querySelector("#theme-label");
        if (labelEl) {
          labelEl.textContent = isDark ? "다크 모드" : "라이트 모드";
        }
      });
    }

    const soundToggleBtn = document.querySelector("#sound-toggle-btn");
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener("click", () => {
        const isEnabled = localStorage.getItem("infoStudy_soundEffects") === "off";
        localStorage.setItem("infoStudy_soundEffects", isEnabled ? "on" : "off");
        soundToggleBtn.setAttribute("aria-pressed", String(isEnabled));

        const soundLabel = document.querySelector("#sound-label");
        if (soundLabel) {
          soundLabel.textContent = `정답·오답 효과음 ${isEnabled ? "켜짐" : "꺼짐"}`;
        }

        const soundState = document.querySelector("#sound-toggle-state");
        if (soundState) {
          soundState.textContent = isEnabled ? "ON" : "OFF";
          soundState.classList.toggle("is-on", isEnabled);
          soundState.classList.toggle("is-off", !isEnabled);
        }
      });
    }

    const saveNicknameBtn = document.querySelector("#save-nickname-btn");
    const nicknameInput = document.querySelector("#nickname-input");

    if (saveNicknameBtn && nicknameInput) {
      saveNicknameBtn.addEventListener("click", async () => {
        const newNickname = nicknameInput.value.trim();

        if (!newNickname) {
          alert("닉네임을 입력해 주세요.");
          return;
        }

        saveNicknameBtn.disabled = true;
        saveNicknameBtn.textContent = "저장 중...";

        userObj.nickname = newNickname;
        localStorage.setItem("infoStudy_user", JSON.stringify(userObj));

        if (userObj.uid && !userObj.isGuest && typeof updateUserProfile === "function") {
          await updateUserProfile(userObj.uid, { nickname: newNickname });
        }

        // [스윙투앱 연동] 닉네임 변경 시 스윙투앱 회원 정보도 업데이트
        if (window.swingWebViewPlugin?.app?.login) {
          window.swingWebViewPlugin.app.login.doAppLogin(userObj.uid, newNickname);
        }

        alert("닉네임이 저장되었습니다!");
        switchTab("profile");
      });
    }

    // 🔥 infostudy.apk 다운로드 버튼 클릭 이벤트 (GitHub 저장소 직접 다운로드 링크 적용)
    const downloadApkBtn = document.querySelector("#download-apk-btn");
    if (downloadApkBtn) {
      downloadApkBtn.addEventListener("click", () => {
        window.open("https://github.com/woohyun20100408/info-study-apk/raw/main/infostudy.apk", "_blank");
      });
    }
  }

  function startQuiz(mode = "random") {
    // 아두이노 학습은 준비된 10문제를 모두 사용하고, 일반 퀴즈는 기존 단원에서 추출합니다.
    let allQuestions = [];
    if (mode === "arduino") {
      allQuestions = ARDUINO_QUESTIONS;
    } else {
      Object.keys(QUIZ_DATA).forEach((key) => {
        if (QUIZ_DATA[key] && Array.isArray(QUIZ_DATA[key].questions)) {
          allQuestions.push(...QUIZ_DATA[key].questions.map((question) => createRandomizedQuestion(key, question)));
        }
      });
    }

    if (allQuestions.length === 0) {
      alert("현재 푸실 수 있는 문제가 없습니다.");
      return;
    }

    // 일반 랜덤 퀴즈는 기존처럼 5문제, 아두이노 코스는 10문제 전체를 출제합니다.
    const questions = mode === "arduino"
      ? [...allQuestions]
      : [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 5);

    let currentIndex = 0;
    let score = 0;

    mainContent.innerHTML = `
      <style>
        .quiz-compact-container {
          max-width: 520px;
          margin: 0 auto;
          padding: 8px 4px;
        }
        .quiz-prompt {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.45;
          margin-bottom: 10px;
          color: var(--text-color, #191f28);
          word-break: keep-all;
        }
        .quiz-code-block {
          background-color: #282c34;
          color: #abb2bf;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13.5px;
          line-height: 1.45;
          padding: 12px 14px;
          border-radius: 8px;
          margin: 8px 0 14px 0;
          overflow-x: auto;
          white-space: pre;
          text-align: left;
          box-shadow: inset 0 0 4px rgba(0,0,0,0.2);
        }
        .quiz-option-compact {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          margin-bottom: 8px;
          font-size: 14px;
          border-radius: 8px;
          border: 1px solid #e5e8eb;
          background-color: var(--card-bg, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .quiz-option-compact:hover {
          background-color: #f2f4f6;
        }
        .quiz-option-compact.correct {
          background-color: #e8f5e9 !important;
          border-color: #2e7d32 !important;
          color: #1b5e20 !important;
          font-weight: 600;
        }
        .quiz-option-compact.wrong {
          background-color: #ffebee !important;
          border-color: #c62828 !important;
          color: #b71c1c !important;
        }
      </style>

      <div class="quiz-compact-container fade-in">
        <div class="quiz-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="quiz-category" style="font-size: 13px; color: #3182f6; font-weight: 600;">${mode === "arduino" ? "아두이노 코드 학습" : "랜덤 퀴즈"}</span>
          <span class="quiz-step" style="font-size: 13px; color: #8b95a1;">1 / ${questions.length}</span>
        </div>

        <div style="width: 100%; height: 6px; background-color: #e5e8eb; border-radius: 3px; overflow: hidden; margin-bottom: 14px;">
          <div id="quiz-progress-fill" style="width: 0%; height: 100%; background-color: #3182f6; border-radius: 3px; transition: width 0.3s ease-in-out;"></div>
        </div>

        <div id="quiz-body"></div>

        <div class="quiz-options" style="margin-top: 10px;"></div>

        <div id="quiz-feedback" class="quiz-feedback hidden" style="margin-top: 12px; padding: 10px 12px; border-radius: 8px; font-size: 13.5px;"></div>

        <div id="quiz-next-container" class="hidden" style="margin-top: 14px;">
          <button id="next-question-btn" class="google-button" style="width: 100%; height: 44px; font-size: 15px;">다음 문제</button>
        </div>
      </div>
    `;

    const quizStep = mainContent.querySelector(".quiz-step");
    const progressFill = mainContent.querySelector("#quiz-progress-fill");
    const quizBody = mainContent.querySelector("#quiz-body");
    const quizOptions = mainContent.querySelector(".quiz-options");
    const feedbackEl = mainContent.querySelector("#quiz-feedback");
    const nextContainer = mainContent.querySelector("#quiz-next-container");
    const nextBtn = mainContent.querySelector("#next-question-btn");

    function renderQuestion() {
      const q = questions[currentIndex];

      const optionsWithMeta = q.options.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === q.answer
      })).sort(() => Math.random() - 0.5);

      const shuffledOptions = optionsWithMeta.map(item => item.text);
      const newCorrectIndex = optionsWithMeta.findIndex(item => item.isCorrect);

      if (quizStep) quizStep.textContent = `${currentIndex + 1} / ${questions.length}`;
      if (quizBody) quizBody.innerHTML = formatQuestionContent(q.question);

      const currentPercent = (currentIndex / questions.length) * 100;
      if (progressFill) progressFill.style.width = `${currentPercent}%`;

      if (feedbackEl) {
        feedbackEl.innerHTML = "";
        feedbackEl.classList.add("hidden");
      }
      if (nextContainer) {
        nextContainer.classList.add("hidden");
      }

      if (quizOptions) {
        quizOptions.innerHTML = shuffledOptions
          .map(
            (opt, idx) => `
            <button class="quiz-option-compact" data-index="${idx}">
              <span><strong>${idx + 1}.</strong> ${escapeHtml(opt)}</span>
            </button>
          `
          )
          .join("");

        const optionBtns = quizOptions.querySelectorAll(".quiz-option-compact");
        optionBtns.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const selectedIdx = parseInt(e.currentTarget.dataset.index);
            handleAnswer(selectedIdx, newCorrectIndex, q.explanation);
          });
        });
      }
    }

    function handleAnswer(selected, correct, explanation) {
      const optionBtns = quizOptions.querySelectorAll(".quiz-option-compact");
      optionBtns.forEach((btn) => (btn.disabled = true));

      const solvedPercent = ((currentIndex + 1) / questions.length) * 100;
      if (progressFill) progressFill.style.width = `${solvedPercent}%`;

      if (selected === correct) {
        score++;
        playCorrectAnswerSound();
        optionBtns[selected].classList.add("correct");
        feedbackEl.innerHTML = `<p style="color: #2e7d32; font-weight: 600; margin: 0 0 4px 0;">정답입니다!</p><small style="color: #4e5968; line-height: 1.4;">${explanation}</small>`;
      } else {
        playIncorrectAnswerSound();
        optionBtns[selected].classList.add("wrong");
        optionBtns[correct].classList.add("correct");
        feedbackEl.innerHTML = `<p style="color: #c62828; font-weight: 600; margin: 0 0 4px 0;">오답입니다.</p><small style="color: #4e5968; line-height: 1.4;">${explanation}</small>`;
      }

      feedbackEl.classList.remove("hidden");

      const isLastQuestion = currentIndex === questions.length - 1;
      nextBtn.textContent = isLastQuestion ? "결과 보기" : "다음 문제";
      nextContainer.classList.remove("hidden");

      nextBtn.onclick = async () => {
        currentIndex++;
        if (currentIndex < questions.length) {
          renderQuestion();
        } else {
          const currentUser = JSON.parse(localStorage.getItem("infoStudy_user")) || user;
          const isGuest = Boolean(currentUser.isGuest);
          const earnedXP = score * 10;
          
          if (!isGuest) {
            await finishQuiz(currentUser.uid, earnedXP, questions.length);
            const updatedProfile = await getUserProfile(currentUser.uid);
            if (updatedProfile) {
              localStorage.setItem("infoStudy_user", JSON.stringify(updatedProfile));
            }
          }

          renderResult(score, questions.length);
        }
      };
    }

    function renderResult(correctCount, totalCount) {
      mainContent.innerHTML = `
        <div class="quiz-result fade-in" style="text-align: center; padding: 32px 10px;">
          <div class="result-icon" style="margin-bottom: 12px;">${ICONS.quizCard}</div>
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">수고하셨습니다!</h2>
          <p class="gray-text" style="font-size: 15px; color: #6b7684; margin-bottom: 28px;">
            ${totalCount}문제 중 <strong style="color: #3182f6;">${correctCount}문제</strong>를 맞췄습니다.
          </p>

          <button id="go-home-btn" class="google-button" style="width: 100%; height: 48px; font-size: 15px; font-weight: 600;">
            홈으로 돌아가기
          </button>
        </div>
      `;

      document.querySelector("#go-home-btn").addEventListener("click", () => {
        switchTab("home");
      });
    }

    renderQuestion();
  }

  function renderHome(user) {
    const isGuest = Boolean(user.isGuest);
    const totalXP = user.xp || 0;
    const level = user.level || Math.floor(totalXP / 100) + 1;
    const currentLevelXP = totalXP % 100;
    const remainingXP = 100 - currentLevelXP;

    return `
      <section class="welcome fade-in">
        <p class="small-text">오늘도 꾸준히</p>
        <h1>${user.nickname || user.displayName || "학습자"}님, 안녕하세요</h1>
        <p class="gray-text">${isGuest ? "게스트 모드로 이용 중입니다." : "랜덤 학습 코스를 시작해보세요."}</p>
      </section>

      <section class="level-card fade-in">
        <div class="level-header">
          <div>
            <span class="level-label">LEVEL</span>
            <strong>${level}</strong>
          </div>
          <span class="xp-text">${currentLevelXP} / 100 XP</span>
        </div>

        <div class="xp-bar" style="width: 100%; height: 10px; background-color: #e5e8eb; border-radius: 5px; overflow: hidden; margin: 8px 0;">
          <div style="width: ${currentLevelXP}%; height: 100%; background-color: #3182f6; border-radius: 5px; transition: width 0.5s ease-in-out;"></div>
        </div>

        ${
          isGuest
            ? `<p class="level-info" style="color: #e53e3e; font-weight: 600;">게스트 계정에서는 일부 기능이 제한됩니다</p>`
            : `<p class="level-info">다음 레벨까지 ${remainingXP} XP (총 누적: ${totalXP} XP)</p>`
        }
      </section>

      <section class="section fade-in">
        <div class="section-title">
          <h2>실력 점검</h2>
        </div>

        <button class="study-card" style="cursor: pointer; text-align: left; width: 100%; display: flex; align-items: center;">
          <div class="study-icon" style="display: flex; align-items: center; justify-content: center; background: #f2f4f6; width: 40px; height: 40px; border-radius: 8px; margin-right: 12px;">
            ${ICONS.quizCard}
          </div>
          <div class="study-info" style="flex: 1;">
            <h3>랜덤 퀴즈 시작하기</h3>
            <p>전체 학습 코스 중 무작위 문제 풀이</p>
          </div>
          <div class="arrow">›</div>
        </button>
      </section>

      <section class="section fade-in">
        <div class="section-title">
          <h2>기타</h2>
        </div>

        <button class="study-card arduino-study-card" style="cursor: pointer; text-align: left; width: 100%; display: flex; align-items: center; margin-top: 12px;">
          <div class="study-icon" style="display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: #0f9d58; width: 40px; height: 40px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="2"></rect>
              <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"></path>
              <circle cx="10" cy="10" r=".7" fill="currentColor" stroke="none"></circle>
              <path d="M10 13h4"></path>
            </svg>
          </div>
          <div class="study-info" style="flex: 1;">
            <h3>아두이노 코드 학습</h3>
            <p>LED, 핀 설정, 센서, 시리얼 통신 기초</p>
          </div>
          <div class="arrow">›</div>
        </button>
      </section>
    `;
  }

  function renderStudy() {
    return `
      <section class="page-header fade-in">
        <h1>파이썬 연습장</h1>
        <p class="gray-text" style="font-size: 13px;">웹 브라우저에서 파이썬 코드를 작성하고 실행하세요.</p>
      </section>

      <section class="ide-container fade-in" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="code-editor-box" style="border: 1px solid #e5e8eb; border-radius: 12px; overflow: hidden; background: #282c34; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: #21252b; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #181a1f;">
            <span style="color: #abb2bf; font-size: 13px; font-family: 'Consolas', monospace; font-weight: 600;">main.py</span>
            <button id="run-code-btn" style="background-color: #3182f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; transition: background-color 0.2s;">
              ▶ 실행하기
            </button>
          </div>
          <textarea id="python-code-input" style="width: 100%; height: 200px; background: transparent; color: #abb2bf; border: none; padding: 14px; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; outline: none; resize: vertical; box-sizing: border-box;" spellcheck="false" placeholder="파이썬 코드를 입력하세요...">print("Hello, InfoStudy!")</textarea>
        </div>

        <div class="code-input-box" style="border: 1px solid #e5e8eb; border-radius: 12px; padding: 14px; background-color: var(--card-bg, #ffffff); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <label for="python-stdin-input" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: var(--text-color, #333333);">input() 입력값</label>
          <p style="margin: 0 0 10px; font-size: 12px; color: var(--gray-text, #8b95a1); line-height: 1.5;">코드에서 input()을 호출하는 순서대로 한 줄에 하나씩 입력하세요. 예: 숫자나 이름</p>
          <textarea id="python-stdin-input" rows="3" style="width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e5e8eb; border-radius: 8px; background: var(--card-bg, #ffffff); color: var(--text-color, #333333); font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.5; resize: vertical;" spellcheck="false" placeholder="첫 번째 입력값&#10;두 번째 입력값&#10;세 번째 입력값"></textarea>
        </div>

        <div class="code-output-box" style="border: 1px solid #e5e8eb; border-radius: 12px; padding: 14px; background-color: var(--card-bg, #ffffff); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; color: var(--text-color, #333333); display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; align-items: center;">${ICONS.terminal}</span> 실행 결과
          </h4>
          <pre id="python-output" style="margin: 0; padding: 12px; background: #f8f9fa; border-radius: 8px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13.5px; color: #212529; min-height: 80px; white-space: pre-wrap; word-break: break-all; border: 1px solid #e9ecef;">[▶ 실행하기] 버튼을 누르면 여기에 결과가 출력됩니다.</pre>
        </div>
      </section>
    `;
  }

  function renderRanking(currentUser, rankList) {
    if (!rankList || rankList.length === 0) {
      return `
        <section class="page-header fade-in">
          <h1>실시간 랭킹</h1>
          <p class="gray-text">아직 랭킹에 표시할 사용자가 없습니다.</p>
          <p class="gray-text" style="font-size: 13px; margin-top: 8px;">Google 계정으로 로그인한 뒤 퀴즈를 풀면 XP와 함께 순위가 표시됩니다. 게스트 계정은 랭킹에서 제외됩니다.</p>
        </section>
      `;
    }

    const getDisplayName = (item) => {
      if (item.uid === currentUser.uid && currentUser.nickname) {
        return currentUser.nickname;
      }
      return item.nickname || item.name || "학습자";
    };

    const top3 = rankList.slice(0, 3);

    return `
      <section class="page-header fade-in">
        <h1>실시간 랭킹</h1>
        <p class="gray-text">전체 학습자의 XP 순위입니다.</p>
      </section>

      <section class="ranking-podium fade-in">
        ${top3[1] ? `
          <div class="podium-item rank-2">
            <span class="podium-badge">2</span>
            <strong class="podium-name">${getDisplayName(top3[1])}</strong>
            <span class="podium-xp">${top3[1].xp || 0} XP</span>
          </div>
        ` : ''}

        ${top3[0] ? `
          <div class="podium-item rank-1">
            <span class="podium-badge">1</span>
            <strong class="podium-name">${getDisplayName(top3[0])}</strong>
            <span class="podium-xp">${top3[0].xp || 0} XP</span>
          </div>
        ` : ''}

        ${top3[2] ? `
          <div class="podium-item rank-3">
            <span class="podium-badge">3</span>
            <strong class="podium-name">${getDisplayName(top3[2])}</strong>
            <span class="podium-xp">${top3[2].xp || 0} XP</span>
          </div>
        ` : ''}
      </section>

      <section class="ranking-list fade-in">
        ${rankList
          .map((item, index) => {
            const isMe = item.uid === currentUser.uid;
            const displayName = getDisplayName(item);
            return `
              <div class="ranking-item ${isMe ? "my-rank" : ""}">
                <span class="rank-num">${index + 1}</span>
                <div class="rank-user">
                  <strong>${displayName} ${isMe ? "<small>(나)</small>" : ""}</strong>
                  <p>Lv. ${item.level || 1}</p>
                </div>
                <span class="rank-xp">${item.xp || 0} XP</span>
              </div>
            `;
          })
          .join("")}
      </section>
    `;
  }

  function renderMyInfo(user) {
    const isDark = document.body.classList.contains("dark-mode");
    const isSoundEnabled = localStorage.getItem("infoStudy_soundEffects") !== "off";
    const nickname = user.nickname || user.displayName || "학습자";

    return `
      <section class="profile-header fade-in">
        <div class="profile-avatar">${nickname[0]}</div>
        <h2>${nickname}님</h2>
        <p class="gray-text">${user.isGuest ? "게스트 계정" : (user.email || "이메일 없음")}</p>
      </section>

      <section class="section fade-in">
        <div class="section-title">
          <h2>설정 및 앱 정보</h2>
        </div>

        <div class="menu-list">
          <div style="padding: 16px; background-color: var(--card-bg, #ffffff); border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(0, 0, 0, 0.05);">
            <label for="nickname-input" style="display: block; font-size: 13px; color: var(--gray-text, #888888); margin-bottom: 8px;">닉네임 변경</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="nickname-input" value="${nickname}" maxlength="10" placeholder="닉네임 입력" style="flex: 1; padding: 10px 12px; border: 1px solid #e5e8eb; border-radius: 8px; font-size: 14px; outline: none; background: transparent; color: inherit;" />
              <button id="save-nickname-btn" style="padding: 10px 16px; background-color: #3182f6; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">저장</button>
            </div>
          </div>

          <button id="theme-toggle-btn" class="menu-item" style="margin-bottom: 12px;">
            <div class="menu-item-left">
              <span>테마 변경</span>
              <small id="theme-label" class="gray-text" style="display:block; font-size:12px; margin-top:2px;">${isDark ? "다크 모드" : "라이트 모드"}</small>
            </div>
            <span class="arrow">›</span>
          </button>

          <button id="sound-toggle-btn" class="menu-item" type="button" aria-pressed="${isSoundEnabled}">
            <div class="menu-item-left">
              <span>효과음</span>
              <small id="sound-label" class="gray-text" style="display:block; font-size:12px; margin-top:2px;">정답·오답 효과음 ${isSoundEnabled ? "켜짐" : "꺼짐"}</small>
            </div>
            <span id="sound-toggle-state" class="sound-toggle-state ${isSoundEnabled ? "is-on" : "is-off"}">${isSoundEnabled ? "ON" : "OFF"}</span>
          </button>

          <!-- APK 다운로드 버튼 -->
          <button id="download-apk-btn" class="menu-item">
            <div class="menu-item-left">
              <span style="font-weight: 600; color: #3182f6;">안드로이드 앱 다운로드(베타)</span>
              <small class="gray-text" style="display:block; font-size:12px; margin-top:2px;">인포스터디 앱 설치 파일 받기</small>
            </div>
            <span class="arrow">›</span>
          </button>
        </div>
      </section>
    `;
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 로그아웃 이벤트 처리
  document.querySelector("#logout").addEventListener("click", () => {
    // [스윙투앱 연동] 로그아웃 시 스윙투앱 회원 해제
    if (window.swingWebViewPlugin?.app?.login) {
      window.swingWebViewPlugin.app.login.doAppLogout();
    }

    localStorage.removeItem("infoStudy_user");
    showLogin();
  });

  switchTab("home");
}

initApp();
