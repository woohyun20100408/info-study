import {
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

import { auth, db } from "./firebase";

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    // Google 로그인
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("✅ Google 인증 성공:", user.email);

    // Firestore 사용자 문서
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      console.log("새 사용자입니다. Firestore에 생성합니다.");

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName ?? "",
        email: user.email ?? "",
        profileImage: user.photoURL ?? "",
        level: 1,
        xp: 0,
        streak: 0,
        totalStudyTime: 0,
        solvedProblems: 0
      });

      console.log("✅ 사용자 데이터 생성 완료");
    } else {
      console.log("✅ 기존 사용자입니다.");
    }

    return user;

  } catch (error) {
    console.error("❌ Firebase 오류");
    console.error("code:", error.code);
    console.error("message:", error.message);
    console.error(error);

    alert(`로그인 실패\n${error.code}\n${error.message}`);
  }
}