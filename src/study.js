import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "./firebase";

// 1. 닉네임만 입력해서 로그인하는 게스트 로그인 함수
export async function loginAsGuest(nickname) {
  if (!nickname || nickname.trim() === "") {
    alert("닉네임을 입력해 주세요!");
    return null;
  }

  try {
    // Firebase 익명 인증 실행 (고유 uid 생성)
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    const cleanNickname = nickname.trim();

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // 신규 유저인 경우 DB에 기본 정보 생성
    if (!userSnap.exists()) {
      const newUser = {
        nickname: cleanNickname,
        xp: 0,
        level: 1,
        solvedProblems: 0,
        isGuest: true,
        createdAt: new Date()
      };
      await setDoc(userRef, newUser);
      return { uid: user.uid, ...newUser };
    } else {
      // 이미 존재하는 게스트 유저일 경우 정보 반환
      return { uid: user.uid, ...userSnap.data() };
    }
  } catch (error) {
    console.error("❌ 게스트 로그인 실패:", error);
    alert("로그인 중 오류가 발생했습니다. (Firebase Auth의 익명 로그인 설정을 확인해 주세요)");
    return null;
  }
}

// 2. 현재 로그인된 유저 프로필 조회 함수
export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { uid, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ 유저 정보 로드 실패:", error);
    return null;
  }
}

// 3. 고등학교 정보 교과서 (씨마스 3-2 프로그래밍 단원) 퀴즈 데이터
export const QUIZ_DATA = {
  variables_and_operators: {
    title: "변수와 연산자",
    description: "변수 개념, 데이터 타입, 산술·비교·논리 연산자",
    badge: "기초",
    badgeColor: "blue",
    questions: [
      {
        id: 1,
        question: "다음 파이썬 코드의 실행 결과로 올바른 것은?\n\na = 17\nb = 4\nprint(a // b + a % b)",
        options: ["4", "5", "7", "8.25"],
        answer: 2,
        explanation: "17 // 4는 몫인 4이고, 17 % 4는 나머지인 1입니다. 따라서 4 + 1 = 7이 출력됩니다."
      },
      {
        id: 2,
        question: "다음 중 파이썬의 변수명으로 올바르게 지정된 것은?",
        options: ["2nd_score", "class", "user_name", "my-age"],
        answer: 2,
        explanation: "변수명은 숫자로 시작할 수 없고(2nd_score), 예약어(class)나 하이픈(my-age)을 사용할 수 없습니다."
      },
      {
        id: 3,
        question: "다음 조건식의 결과가 'True'가 되는 입력값 x로 알맞은 것은?\n\nx > 10 and x % 3 == 0",
        options: ["9", "12", "14", "15"],
        answer: 1,
        explanation: "x는 10보다 크고 동시에 3의 배수여야 하므로 12가 조건에 부합합니다."
      }
    ]
  },
  control_statements: {
    title: "제어문 (조건문 & 반복문)",
    description: "if 조건문과 for, while 반복문을 활용한 흐름 제어",
    badge: "핵심",
    badgeColor: "green",
    questions: [
      {
        id: 1,
        question: "다음 코드가 실행되었을 때 최종적으로 출력되는 total의 값은?\n\ntotal = 0\nfor i in range(1, 6):\n    if i % 2 != 0:\n        total += i\nprint(total)",
        options: ["6", "9", "12", "15"],
        answer: 1,
        explanation: "range(1, 6)은 1부터 5까지 반복하며, i가 홀수인 경우(1, 3, 5)만 더해지므로 1 + 3 + 5 = 9입니다."
      },
      {
        id: 2,
        question: "다음 파이썬 코드의 실행 결과는?\n\nscore = 85\nif score >= 90:\n    print('A')\nelif score >= 80:\n    print('B')\nelif score >= 70:\n    print('C')\nelse:\n    print('F')",
        options: ["A", "B", "C", "F"],
        answer: 1,
        explanation: "score가 85이므로 두 번째 조건(>=80)이 참이 되어 'B'가 출력됩니다."
      },
      {
        id: 3,
        question: "반복문 내부에서 특정 조건을 만족할 때 반복을 즉시 중단하고 빠져나오기 위해 사용하는 키워드는?",
        options: ["continue", "break", "pass", "return"],
        answer: 1,
        explanation: "break문은 반복문의 실행을 즉시 중단하고 탈출할 때 사용합니다."
      }
    ]
  },
  list_and_data: {
    title: "자료구조 (리스트)",
    description: "순서가 있는 값들의 집합, 리스트 요소 추가/수정/인덱싱",
    badge: "응용",
    badgeColor: "purple",
    questions: [
      {
        id: 1,
        question: "다음 파이썬 코드 실행 후 fruits[1]의 값은?\n\nfruits = ['apple', 'banana', 'cherry']\nfruits.append('orange')",
        options: ["'apple'", "'banana'", "'cherry'", "'orange'"],
        answer: 1,
        explanation: "리스트의 인덱스는 0부터 시작하므로 fruits[1]은 'banana'입니다."
      },
      {
        id: 2,
        question: "다음 코드 실행 후 'numbers' 리스트의 요소 개수(len)는?\n\nnumbers = [10, 20, 30, 40]\nnumbers.pop()",
        options: ["3", "4", "5", "Error"],
        answer: 0,
        explanation: "pop() 메서드가 마지막 요소(40)를 제거하므로 요소 개수는 3개가 됩니다."
      }
    ]
  },
  functions: {
    title: "함수와 모듈",
    description: "함수 정의와 매개변수, 반환값, 코드의 재사용",
    badge: "심화",
    badgeColor: "orange",
    questions: [
      {
        id: 1,
        question: "다음 파이썬 함수가 호출되었을 때 반환값(return)은?\n\ndef find_max(numbers):\n    max_val = numbers[0]\n    for num in numbers:\n        if num > max_val:\n            max_val = num\n    return max_val\n\nresult = find_max([3, 8, 2, 9, 5])",
        options: ["3", "5", "8", "9"],
        answer: 3,
        explanation: "리스트 내 가장 큰 값인 9가 반환됩니다."
      },
      {
        id: 2,
        question: "파이썬에서 사용자 정의 함수를 만들기 위해 사용하는 키워드는?",
        options: ["function", "def", "func", "define"],
        answer: 1,
        explanation: "파이썬에서는 `def` 키워드를 사용해 함수를 정의합니다."
      }
    ]
  }
};

// 4. 퀴즈 완료 시 Firestore 유저 XP 및 레벨 업데이트
export async function finishQuiz(uid, earnedXP, solvedCount) {
  try {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      xp: increment(earnedXP),
      solvedProblems: increment(solvedCount)
    });

    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const newLevel = Math.floor((userData.xp || 0) / 100) + 1;

      if (newLevel !== userData.level) {
        await updateDoc(userRef, { level: newLevel });
      }
    }
  } catch (error) {
    console.error("XP 업데이트 실패:", error);
  }
}