import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "./firebase";

// ==========================================
// 1. 게스트 로그인
// ==========================================
export async function loginAsGuest(nickname) {
  if (!nickname || nickname.trim() === "") {
    alert("닉네임을 입력해 주세요!");
    return null;
  }

  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    const cleanNickname = nickname.trim();

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

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
      return { uid: user.uid, ...userSnap.data() };
    }
  } catch (error) {
    console.error("❌ 게스트 로그인 실패:", error);
    alert("로그인 중 오류가 발생했습니다. (Firebase Auth의 익명 로그인 설정을 확인해 주세요)");
    return null;
  }
}

// ==========================================
// 2. 유저 프로필 조회
// ==========================================
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

// ==========================================
// 3. 유저 프로필 업데이트
// ==========================================
export async function updateUserProfile(uid, updateData) {
  try {
    const userRef = doc(db, "users", uid);
    // updateDoc은 문서가 없으면 실패하므로 setDoc + merge로 신규 프로필도 저장할 수 있게 합니다.
    await setDoc(userRef, updateData, { merge: true });
    return true;
  } catch (error) {
    console.error("❌ 프로필 업데이트 실패:", error);
    return false;
  }
}

// ==========================================
// 4. 새롭게 교체된 파이썬 퀴즈 데이터 (새로운 카테고리 적용)
// ==========================================
export const QUIZ_DATA = {
  input_output: {
    title: "입력과 출력",
    description: "표준 출력 print() 함수와 표준 입력 input() 함수",
    badge: "입출력",
    badgeColor: "blue",
    questions: [
      {
        id: 1,
        question: "파이썬에서 화면에 문자나 숫자 등의 결괏값을 출력할 때 사용하는 표준 출력 함수는 무엇인가요?",
        options: ["out()", "print()", "write()", "display()"],
        answer: 1,
        explanation: "파이썬의 표준 출력 함수는 print()입니다. 괄호 안에 출력하고 싶은 데이터를 넣습니다."
      },
      {
        id: 2,
        question: "사용자로부터 데이터를 입력받기 위해 사용하는 파이썬의 표준 입력 함수는 무엇인가요?",
        options: ["get()", "scan()", "input()", "read()"],
        answer: 2,
        explanation: "input() 함수는 프로그램 실행 중 사용자에게 텍스트를 입력받을 때 사용하는 표준 입력 함수입니다."
      }
    ]
  },
  variables_and_types: {
    title: "변수와 자료형",
    description: "변수의 정의, 대입 연산자, 단일형/컨테이너형 변수, type(), 변수명 규칙",
    badge: "기초",
    badgeColor: "green",
    questions: [
      {
        id: 1,
        question: "변수의 정의와 대입 연산자(=)의 역할에 대한 설명으로 가장 알맞은 것은?",
        options: [
          "변수는 수학의 변수처럼 항상 값이 변하며, '='는 양쪽이 같다는 뜻이다.",
          "변수는 데이터를 저장하는 이름 붙은 공간이며, '='는 오른쪽의 값을 왼쪽 변수에 저장(할당)하는 역할을 한다.",
          "변수는 함수를 의미하며, '='는 값을 비교할 때 사용한다.",
          "변수는 데이터를 지우는 역할을 하며, '='는 왼쪽의 값을 오른쪽에 복사한다."
        ],
        answer: 1,
        explanation: "프로그래밍에서 변수는 데이터를 담는 상자(공간)이며, 대입 연산자(=)는 우항의 값을 좌항의 변수에 집어넣는(할당) 역할을 합니다."
      },
      {
        id: 2,
        question: "다음 중 파이썬의 변수명 생성 규칙에 어긋나서 오류가 발생하는 변수명은?",
        options: ["my_name", "score1", "1st_grade", "_age"],
        answer: 2,
        explanation: "변수명은 숫자로 시작할 수 없습니다. 따라서 '1st_grade'는 잘못된 변수명입니다."
      },
      {
        id: 3,
        question: "단일형 변수와 컨테이너형 변수의 차이를 가장 바르게 설명한 것은?",
        options: [
          "단일형은 숫자만 저장하고, 컨테이너형은 문자만 저장한다.",
          "단일형은 하나의 값만 저장하고, 컨테이너형은 여러 개의 값을 묶어서 저장할 수 있다.",
          "단일형은 수정이 불가능하고, 컨테이너형은 수정이 가능하다.",
          "단일형은 파이썬에서만 쓰이고, 컨테이너형은 다른 언어에서 쓰인다."
        ],
        answer: 1,
        explanation: "단일형 변수(int, float, string, bool)는 한 번에 하나의 데이터만 담을 수 있고, 컨테이너형 변수(리스트, 딕셔너리, 튜플 등)는 여러 데이터를 하나로 묶어 관리합니다."
      },
      {
        id: 4,
        question: "다음 코드 실행 시 화면에 출력되는 자료형(type)으로 알맞은 것은?\n\na = 3.14\nprint(type(a))",
        options: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'bool'>"],
        answer: 2,
        explanation: "3.14는 소수점이 있는 실수이므로 type() 함수를 사용하면 float(실수형)이 출력됩니다."
      },
      {
        id: 5,
        question: "컨테이너형 변수에 대한 설명 중 튜플(Tuple)의 정의로 올바른 것은?",
        options: [
          "여러 개의 값을 저장하지만, 한 번 생성하면 요소를 수정하거나 삭제할 수 없는 자료형이다.",
          "키(Key)와 값(Value)의 쌍으로 데이터를 저장하는 자료형이다.",
          "대괄호 [ ]를 사용하여 만들며, 자유롭게 요소를 추가하거나 삭제할 수 있다.",
          "참(True)과 거짓(False)만을 저장하는 자료형이다."
        ],
        answer: 0,
        explanation: "튜플은 리스트와 비슷하게 여러 값을 저장하지만, 소괄호 ()를 사용하며 한 번 만들어지면 내부의 값을 변경할 수 없는(불변) 특징이 있습니다. 키-값은 딕셔너리, 대괄호는 리스트에 해당합니다."
      }
    ]
  },
  multidimensional_data: {
    title: "다차원 데이터",
    description: "다차원 데이터 정의, 1/2차원 리스트와 딕셔너리, 추가 및 삭제 기능",
    badge: "자료구조",
    badgeColor: "purple",
    questions: [
      {
        id: 1,
        question: "다차원 데이터(Multidimensional Data)의 정의로 가장 알맞은 것은?",
        options: [
          "하나의 변수에 단 하나의 숫자만 들어있는 데이터",
          "리스트 안에 리스트가 있거나 딕셔너리가 중첩되는 등, 2차원 이상의 구조를 가지는 데이터 형태",
          "문자열과 숫자를 더해서 만든 데이터",
          "프로그램의 실행 속도를 높이기 위해 압축된 데이터"
        ],
        answer: 1,
        explanation: "다차원 데이터는 1차원 데이터(단일 리스트/딕셔너리)를 넘어 요소 내부에 또 다른 리스트나 딕셔너리를 포함하여 표(Grid)나 트리 형태로 구성된 복잡한 데이터를 말합니다."
      },
      {
        id: 2,
        question: "다음 2차원 리스트에서 'apple'을 가져오기 위한 올바른 인덱싱 방법은?\n\nfruits = [['banana', 'grape'], ['apple', 'orange']]",
        options: ["fruits[0][1]", "fruits[1][0]", "fruits[2][1]", "fruits[1][1]"],
        answer: 1,
        explanation: "바깥쪽 리스트의 인덱스 1번(['apple', 'orange'])에 접근한 뒤, 그 안에서 인덱스 0번을 선택해야 하므로 fruits[1][0]이 맞습니다."
      },
      {
        id: 3,
        question: "다음 1차원 딕셔너리에서 'age'에 해당하는 값을 가져오는 코드로 알맞은 것은?\n\ninfo = {'name': 'Alice', 'age': 15}",
        options: ["info[1]", "info.age", "info['age']", "info[15]"],
        answer: 2,
        explanation: "딕셔너리는 인덱스 번호가 아닌 키(Key)를 사용하여 값(Value)에 접근합니다. 따라서 대괄호 안에 키인 'age'를 넣어야 합니다."
      },
      {
        id: 4,
        question: "리스트에 데이터를 추가하는 append()와 insert()에 대한 설명으로 올바른 것은?",
        options: [
          "append()는 리스트의 맨 마지막에 요소를 추가하고, insert()는 지정한 특정 위치에 요소를 추가한다.",
          "append()는 지정한 위치에 요소를 추가하고, insert()는 리스트의 맨 앞에 요소를 추가한다.",
          "두 함수 모두 리스트의 데이터를 삭제할 때 사용한다.",
          "append()는 딕셔너리에만 사용하고, insert()는 리스트에만 사용한다."
        ],
        answer: 0,
        explanation: "append(값)는 항상 리스트 끝에 데이터를 추가하며, insert(인덱스, 값)는 원하는 위치에 데이터를 끼워 넣습니다."
      },
      {
        id: 5,
        question: "리스트에서 요소를 삭제하는 pop()과 del 키워드에 대한 설명으로 틀린 것은?",
        options: [
          "pop()을 괄호 안을 비운 채 사용하면 리스트의 맨 마지막 요소를 삭제(반환)한다.",
          "del 키워드는 'del 리스트[인덱스]' 형태로 특정 위치의 요소를 삭제할 수 있다.",
          "pop(인덱스)를 사용하면 해당 인덱스의 요소를 삭제할 수 있다.",
          "del 키워드는 변수 자체는 삭제할 수 없고, 리스트 내부의 요소만 삭제할 수 있다."
        ],
        answer: 3,
        explanation: "del 키워드는 리스트의 특정 요소를 삭제할 수 있을 뿐만 아니라, 'del 변수명'을 사용해 변수(또는 데이터 구조) 자체를 메모리에서 완전히 삭제할 수도 있습니다."
      }
    ]
  },
  control_structures_app: {
    title: "제어 구조의 응용",
    description: "중첩 조건문, 중첩 반복문, break와 continue의 활용",
    badge: "응용",
    badgeColor: "orange",
    questions: [
      {
        id: 1,
        question: "조건문 안에 또 다른 조건문을 사용하는 '중첩 조건문(Nested if)'에 대한 설명으로 올바른 것은?",
        options: [
          "if 문 안에는 반드시 elif 문만 중첩해서 사용할 수 있다.",
          "바깥쪽 외부 조건이 참(True)일 때만 안쪽 내부 조건문이 실행된다.",
          "내부 조건문이 거짓(False)이면 외부 조건문도 즉시 거짓이 되어 종료된다.",
          "중첩 조건문은 프로그램의 속도 저하를 막기 위해 최대 2번까지만 사용할 수 있다."
        ],
        answer: 1,
        explanation: "중첩 조건문은 바깥쪽(외부) 조건이 참일 때 안쪽(내부) 조건문을 검사하며, 필요에 따라 여러 번 중첩하여 사용할 수 있습니다."
      },
      {
        id: 2,
        question: "다음 중첩 반복문을 실행했을 때 화면에 출력되는 별(*)의 총 개수는?\n\nfor i in range(3):\n    for j in range(4):\n        print('*', end='')",
        options: ["3개", "4개", "7개", "12개"],
        answer: 3,
        explanation: "바깥쪽 반복문이 3번, 안쪽 반복문이 4번 반복되므로, 안쪽에 있는 별 출력 명령은 총 3 x 4 = 12번 실행됩니다."
      },
      {
        id: 3,
        question: "반복문을 실행하다가 특정 조건을 만족했을 때, 반복을 완전히 중단하고 가장 가까운 반복문 블록을 빠져나오기 위해 사용하는 키워드는 무엇인가요?",
        options: ["stop", "continue", "break", "pass"],
        answer: 2,
        explanation: "break 명령어는 조건에 관계없이 현재 속해있는 반복문을 강제로 종료하고 빠져나올 때 사용합니다."
      },
      {
        id: 4,
        question: "다음 코드의 실행 결과로 알맞은 것은?\n\nfor i in range(1, 6):\n    if i == 3:\n        continue\n    print(i, end=' ')",
        options: [
          "1 2 3 4 5",
          "1 2 4 5",
          "3",
          "1 2"
        ],
        answer: 1,
        explanation: "continue 명령어는 반복문의 이하 코드를 실행하지 않고 다음 반복(처음)으로 넘어갑니다. 따라서 i가 3일 때는 print()를 건너뛰고 1, 2, 4, 5만 출력합니다."
      },
      {
        id: 5,
        question: "리스트의 숫자 중 짝수만 골라 출력하기 위해 반복문과 조건문을 결합한 코드입니다. 빈칸 ㈎에 들어갈 알맞은 조건식은?\n\nnumbers = [10, 15, 20, 25, 30]\nfor num in numbers:\n    if ㈎:\n        print(num)",
        options: [
          "num % 2 == 0",
          "num / 2 == 0",
          "num % 2 == 1",
          "num // 2 == 1"
        ],
        answer: 0,
        explanation: "짝수를 판별하려면 숫자를 2로 나눈 나머지(%)가 0인지 확인해야 합니다. 따라서 num % 2 == 0 이 올바른 조건식입니다."
      }
    ]
  }
};


/**
 * 문제의 유형은 유지하면서, 숫자를 포함한 코드 예제만 새 숫자로 만드는 함수.
 * 정답과 해설도 새 숫자에 맞춰 함께 갱신한다.
 */
export function createRandomizedQuestion(categoryKey, question) {
  const variant = { ...question, options: [...question.options] };
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (categoryKey === "variables_and_types" && question.id === 4) {
    const value = String(randomInt(1, 20)) + "." + String(randomInt(1, 99)).padStart(2, "0");
    variant.question = variant.question.replace("a = 3.14", "a = " + value);
    variant.explanation = value + "는 소수점이 있는 실수이므로 type() 함수를 사용하면 float(실수형)이 출력됩니다.";
  }

  if (categoryKey === "multidimensional_data" && question.id === 3) {
    const age = randomInt(10, 25);
    variant.question = variant.question.replace("'age': 15", "'age': " + age);
  }

  if (categoryKey === "control_structures_app" && question.id === 2) {
    const outer = randomInt(3, 6);
    const inner = randomInt(4, 8);
    const total = outer * inner;
    variant.question = variant.question
      .replace("range(3)", "range(" + outer + ")")
      .replace("range(4)", "range(" + inner + ")");
    variant.options = [
      String(outer) + "개",
      String(inner) + "개",
      String(outer + inner) + "개",
      String(total) + "개"
    ];
    variant.answer = 3;
    variant.explanation = "바깥쪽 반복문이 " + outer + "번, 안쪽 반복문이 " + inner +
      "번 반복되므로 별 출력 명령은 총 " + outer + " × " + inner + " = " + total + "번 실행됩니다.";
  }

  if (categoryKey === "control_structures_app" && question.id === 4) {
    const start = randomInt(1, 3);
    const length = randomInt(5, 6);
    const stop = start + length;
    const skipped = start + randomInt(1, length - 2);
    const allValues = Array.from({ length }, (_, index) => start + index);
    const correctValues = allValues.filter((value) => value !== skipped);
    const beforeSkipped = allValues.filter((value) => value < skipped);
    const afterSkipped = allValues.filter((value) => value > skipped);

    variant.question = variant.question
      .replace("range(1, 6)", "range(" + start + ", " + stop + ")")
      .replace("i == 3", "i == " + skipped);
    variant.options = [
      allValues.join(" "),
      correctValues.join(" "),
      beforeSkipped.join(" "),
      afterSkipped.join(" ")
    ];
    variant.answer = 1;
    variant.explanation = "range(" + start + ", " + stop + ")은 " + start + "부터 " + (stop - 1) +
      "까지 반복합니다. i가 " + skipped + "일 때 continue가 print()를 건너뛰므로 " +
      correctValues.join(" ") + "이 출력됩니다.";
  }

  if (categoryKey === "control_structures_app" && question.id === 5) {
    const used = new Set();
    const nextNumber = (parity) => {
      let value;
      do {
        value = randomInt(5, 49) * 2 + parity;
      } while (used.has(value));
      used.add(value);
      return value;
    };
    const numbers = [nextNumber(0), nextNumber(1), nextNumber(0), nextNumber(1), nextNumber(0)];
    variant.question = variant.question.replace(
      "numbers = [10, 15, 20, 25, 30]",
      "numbers = [" + numbers.join(", ") + "]"
    );
    variant.explanation = "짝수는 2로 나눈 나머지가 0입니다. 따라서 num % 2 == 0으로 조건을 검사하면 짝수만 출력할 수 있습니다.";
  }

  return variant;
}

// ==========================================
// 5. 퀴즈 완료 시 XP, 풀이 수, 레벨 업데이트
// ==========================================
export async function finishQuiz(uid, earnedXP, solvedCount) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    // 게스트 계정은 DB 점수 업데이트 대상에서 제외
    if (userData.isGuest) {
      console.log("ℹ️ 게스트 계정은 XP 및 레벨이 증가하지 않습니다.");
      return;
    }

    const updatedXP = (userData.xp || 0) + earnedXP;
    const updatedSolved = (userData.solvedProblems || 0) + solvedCount;
    const newLevel = Math.floor(updatedXP / 100) + 1;

    await updateDoc(userRef, {
      xp: updatedXP,
      solvedProblems: updatedSolved,
      level: newLevel
    });
  } catch (error) {
    console.error("❌ XP 업데이트 실패:", error);
  }
}

// ==========================================
// 6. 랭킹(리더보드) 조회
// ==========================================
export async function getLeaderboard(topLimit = 10) {
  try {
    const usersRef = collection(db, "users");

    // 게스트 계정 제외(isGuest == false) 및 XP 내림차순 정렬
    const q = query(
      usersRef,
      where("isGuest", "==", false),
      orderBy("xp", "desc"),
      limit(topLimit)
    );

    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    querySnapshot.forEach((docSnap) => {
      leaderboard.push({ uid: docSnap.id, ...docSnap.data() });
    });

    return leaderboard;
  } catch (error) {
    console.error("❌ 랭킹 조회 실패:", error);
    return [];
  }
}
