import "./style.css";
import { loginWithGoogle } from "./auth";
import { getTopRankings } from "./ranking";
import { QUIZ_DATA, finishQuiz } from "./study";

const app = document.querySelector("#app");

// 테마 상태 초기화 (localStorage)
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// 앱 시작 시 저장된 로그인 정보 확인 (자동 로그인)
function initApp() {
  const savedUser = localStorage.getItem("infoStudy_user");
  if (savedUser) {
    showApp(JSON.parse(savedUser));
  } else {
    showLogin();
  }
}

function showLogin() {
  initTheme();
  app.innerHTML = `
    <div class="login-page">
      <div class="login-content">
        <div class="logo">인포스터디</div>
        <p class="login-subtitle">
          공부하면 성장하는<br>
          정보 학습 서비스
        </p>

        <button id="google-login" class="google-button">
          <span>Google로 시작하기</span>
        </button>

        <button id="guest-login" class="google-button" style="margin-top: 12px; background-color: #f1f3f5; color: #495057; border: none;">
          <span>게스트로 둘러보기</span>
        </button>
      </div>
    </div>
  `;

  // Google 로그인 처리
  document.querySelector("#google-login").addEventListener("click", async () => {
    const user = await loginWithGoogle();
    if (user) {
      const userData = {
        uid: user.uid,
        displayName: user.displayName || "학습자",
        email: user.email,
        isGuest: false
      };
      localStorage.setItem("infoStudy_user", JSON.stringify(userData));
      showApp(userData);
    }
  });

  // 게스트 로그인 처리
  document.querySelector("#guest-login").addEventListener("click", () => {
    const guestUser = {
      uid: "guest_" + Date.now(),
      displayName: "게스트",
      email: "guest@infostudy.com",
      isGuest: true
    };
    localStorage.setItem("infoStudy_user", JSON.stringify(guestUser));
    showApp(guestUser);
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
          <span>⌂</span>
          <small>홈</small>
        </button>

        <button class="nav-btn" data-tab="study">
          <span>▣</span>
          <small>학습</small>
        </button>

        <button class="nav-btn" data-tab="ranking">
          <span>♛</span>
          <small>랭킹</small>
        </button>

        <button class="nav-btn" data-tab="profile">
          <span>⚙</span>
          <small>설정</small>
        </button>
      </nav>
    </div>
  `;

  const mainContent = document.querySelector("#main-content");
  const navButtons = document.querySelectorAll(".nav-btn");

  async function switchTab(tabName) {
    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    if (tabName === "ranking") {
      mainContent.innerHTML = `<div class="empty-state"><p class="gray-text">랭킹 정보를 불러오는 중...</p></div>`;
      const rankData = await getTopRankings(10);
      mainContent.innerHTML = renderRanking(user, rankData);
    } else if (tabName === "home") {
      mainContent.innerHTML = renderHome(user);
      bindHomeEvents();
    } else if (tabName === "study") {
      mainContent.innerHTML = renderStudy();
      bindStudyEvents();
    } else if (tabName === "profile") {
      mainContent.innerHTML = renderMyInfo(user);
      bindProfileEvents(user);
    }
  }

  // 홈 화면 이벤트
  function bindHomeEvents() {
    const studyCard = document.querySelector(".study-card");
    if (studyCard) {
      studyCard.addEventListener("click", () => startQuiz("algorithm"));
    }
  }

  // 학습 목록 이벤트
  function bindStudyEvents() {
    const startBtns = document.querySelectorAll(".start-quiz-btn");
    startBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const key = e.target.getAttribute("data-key");
        startQuiz(key);
      });
    });
  }

  // 설정(프로필) 탭 이벤트 (테마 변경 + 닉네임 변경)
  function bindProfileEvents(userObj) {
    // 테마 토글
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

    // 닉네임 저장
    const saveNicknameBtn = document.querySelector("#save-nickname-btn");
    const nicknameInput = document.querySelector("#nickname-input");

    if (saveNicknameBtn && nicknameInput) {
      saveNicknameBtn.addEventListener("click", () => {
        const newNickname = nicknameInput.value.trim();

        if (!newNickname) {
          alert("닉네임을 입력해 주세요.");
          return;
        }

        // 유저 객체 정보 업데이트 및 로컬 스토리지 저장
        userObj.displayName = newNickname;
        localStorage.setItem("infoStudy_user", JSON.stringify(userObj));

        alert("닉네임이 성공적으로 변경되었습니다!");
        
        // 설정 화면 즉시 갱신
        switchTab("profile");
      });
    }
  }

  // 퀴즈 진행 로직
  function startQuiz(courseKey) {
    const course = QUIZ_DATA[courseKey] || QUIZ_DATA.algorithm;
    let currentIndex = 0;
    let score = 0;

    function renderQuestion() {
      const q = course.questions[currentIndex];
      const progressPercent = Math.round(((currentIndex + 1) / course.questions.length) * 100);

      mainContent.innerHTML = `
        <div class="quiz-container fade-in">
          <div class="quiz-header">
            <span class="quiz-category">${course.title}</span>
            <span class="quiz-step">${currentIndex + 1} / ${course.questions.length}</span>
          </div>

          <div class="xp-bar">
            <div class="xp-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <h2 class="quiz-title">${q.question.replace(/\n/g, "<br>")}</h2>

          <div class="quiz-options">
            ${q.options
              .map(
                (opt, idx) => `
              <button class="quiz-option-btn" data-index="${idx}">
                <span>${idx + 1}. ${opt}</span>
              </button>
            `
              )
              .join("")}
          </div>

          <div id="quiz-feedback" class="quiz-feedback hidden"></div>
        </div>
      `;

      const optionBtns = document.querySelectorAll(".quiz-option-btn");
      optionBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const selectedIdx = parseInt(e.currentTarget.dataset.index);
          handleAnswer(selectedIdx, q.answer, q.explanation);
        });
      });
    }

    function handleAnswer(selected, correct, explanation) {
      const optionBtns = document.querySelectorAll(".quiz-option-btn");
      const feedbackEl = document.querySelector("#quiz-feedback");

      optionBtns.forEach((btn) => (btn.disabled = true));

      if (selected === correct) {
        score++;
        optionBtns[selected].classList.add("correct");
        feedbackEl.innerHTML = `<p class="correct-text">⭕ 정답입니다!</p><small>${explanation}</small>`;
      } else {
        optionBtns[selected].classList.add("wrong");
        optionBtns[correct].classList.add("correct");
        feedbackEl.innerHTML = `<p class="wrong-text">❌ 오답입니다.</p><small>${explanation}</small>`;
      }

      feedbackEl.classList.remove("hidden");

      setTimeout(async () => {
        currentIndex++;
        if (currentIndex < course.questions.length) {
          renderQuestion();
        } else {
          const earnedXP = score * 10;
          await finishQuiz(user.uid, earnedXP, course.questions.length);
          renderResult(score, course.questions.length, earnedXP);
        }
      }, 2000);
    }

    function renderResult(correctCount, totalCount, earnedXP) {
      mainContent.innerHTML = `
        <div class="quiz-result fade-in">
          <div class="result-icon">🎉</div>
          <h2>학습 완료!</h2>
          <p class="gray-text">${totalCount}문제 중 ${correctCount}문제를 맞췄습니다.</p>

          <div class="result-xp-card">
            <span class="label">획득한 경험치</span>
            <strong class="value">+${earnedXP} XP</strong>
          </div>

          <button id="go-home-btn" class="google-button">홈으로 돌아가기</button>
        </div>
      `;

      document.querySelector("#go-home-btn").addEventListener("click", () => {
        switchTab("home");
      });
    }

    renderQuestion();
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 로그아웃 처리
  document.querySelector("#logout").addEventListener("click", () => {
    localStorage.removeItem("infoStudy_user");
    showLogin();
  });

  switchTab("home");
}

function renderHome(user) {
  return `
    <section class="welcome fade-in">
      <p class="small-text">오늘도 꾸준히</p>
      <h1>${user.displayName || "학습자"}님, 안녕하세요</h1>
      <p class="gray-text">오늘의 추천 코스를 시작해보세요.</p>
    </section>

    <section class="level-card fade-in">
      <div class="level-header">
        <div>
          <span class="level-label">LEVEL</span>
          <strong>1</strong>
        </div>
        <span class="xp-text">0 / 100 XP</span>
      </div>

      <div class="xp-bar">
        <div class="xp-fill zero"></div>
      </div>

      <p class="level-info">다음 레벨까지 100 XP</p>
    </section>

    <section class="section fade-in">
      <div class="section-title">
        <h2>오늘의 추천 학습</h2>
      </div>

      <button class="study-card">
        <div class="study-icon">⌘</div>
        <div class="study-info">
          <h3>알고리즘 & 프로그래밍</h3>
          <p>4문제 · 약 5분</p>
        </div>
        <div class="arrow">›</div>
      </button>
    </section>
  `;
}

function renderStudy() {
  return `
    <section class="page-header fade-in">
      <h1>학습 코스</h1>
      <p class="gray-text">고등학교 정보 교과 과정 기반 퀴즈입니다.</p>
    </section>

    <section class="course-grid fade-in">
      ${Object.keys(QUIZ_DATA)
        .map((key) => {
          const item = QUIZ_DATA[key];
          return `
            <div class="course-card">
              <div class="course-badge ${item.badgeColor}">${item.badge}</div>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="course-footer">
                <span>${item.questions.length} 문제</span>
                <button class="start-btn start-quiz-btn" data-key="${key}">시작하기</button>
              </div>
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderRanking(currentUser, rankList) {
  if (!rankList || rankList.length === 0) {
    return `
      <section class="page-header fade-in">
        <h1>실시간 랭킹</h1>
        <p class="gray-text">등록된 랭킹 데이터가 없습니다.</p>
      </section>
    `;
  }

  const top3 = rankList.slice(0, 3);

  return `
    <section class="page-header fade-in">
      <h1>실시간 랭킹</h1>
      <p class="gray-text">전체 학습자의 XP 순위입니다.</p>
    </section>

    <section class="ranking-podium fade-in">
      ${top3[1] ? `
        <div class="podium-item rank-2">
          <span class="podium-badge">🥈</span>
          <strong class="podium-name">${top3[1].name || "학습자"}</strong>
          <span class="podium-xp">${top3[1].xp || 0} XP</span>
        </div>
      ` : ''}

      ${top3[0] ? `
        <div class="podium-item rank-1">
          <span class="podium-badge">🥇</span>
          <strong class="podium-name">${top3[0].name || "학습자"}</strong>
          <span class="podium-xp">${top3[0].xp || 0} XP</span>
        </div>
      ` : ''}

      ${top3[2] ? `
        <div class="podium-item rank-3">
          <span class="podium-badge">🥉</span>
          <strong class="podium-name">${top3[2].name || "학습자"}</strong>
          <span class="podium-xp">${top3[2].xp || 0} XP</span>
        </div>
      ` : ''}
    </section>

    <section class="ranking-list fade-in">
      ${rankList
        .map((item, index) => {
          const isMe = item.uid === currentUser.uid;
          return `
            <div class="ranking-item ${isMe ? "my-rank" : ""}">
              <span class="rank-num">${index + 1}</span>
              <div class="rank-user">
                <strong>${item.name || "학습자"} ${isMe ? "<small>(나)</small>" : ""}</strong>
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

// 설정 탭 뷰 렌더링 (닉네임 설정 입력창 추가)
function renderMyInfo(user) {
  const isDark = document.body.classList.contains("dark-mode");

  return `
    <section class="profile-header fade-in">
      <div class="profile-avatar">${(user.displayName || "학")[0]}</div>
      <h2>${user.displayName || "학습자"}님</h2>
      <p class="gray-text">${user.email || "user@infostudy.com"}</p>
    </section>

    <section class="section fade-in">
      <div class="section-title">
        <h2>설정</h2>
      </div>

      <div class="menu-list">
        <!-- 닉네임 변경 카드 -->
        <div style="padding: 16px; background-color: var(--card-bg, #ffffff); border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(0, 0, 0, 0.05);">
          <label for="nickname-input" style="display: block; font-size: 13px; color: var(--gray-text, #888888); margin-bottom: 8px;">닉네임 변경</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="nickname-input" value="${user.displayName || "학습자"}" maxlength="10" placeholder="닉네임 입력" style="flex: 1; padding: 10px 12px; border: 1px solid #e5e8eb; border-radius: 8px; font-size: 14px; outline: none; background: transparent; color: inherit;" />
            <button id="save-nickname-btn" style="padding: 10px 16px; background-color: #3182f6; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">저장</button>
          </div>
        </div>

        <!-- 테마 변경 버튼 -->
        <button id="theme-toggle-btn" class="menu-item">
          <div class="menu-item-left">
            <span>테마 변경</span>
            <small id="theme-label" class="gray-text" style="display:block; font-size:12px; margin-top:2px;">${isDark ? "다크 모드" : "라이트 모드"}</small>
          </div>
          <span class="arrow">›</span>
        </button>
      </div>
    </section>
  `;
}

// 앱 최초 실행
initApp();