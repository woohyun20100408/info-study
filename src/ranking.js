import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getTopRankings(limitCount = 10) {
  try {
    const usersRef = collection(db, "users");
    // XP 필드가 없는 예전 프로필도 불러온 뒤 0점으로 취급해 목록이 누락되지 않게 합니다.
    const querySnapshot = await getDocs(usersRef);
    const rankings = [];

    querySnapshot.forEach((userDoc) => {
      const data = userDoc.data() || {};
      // 명시적으로 게스트인 계정만 제외합니다. 이전 버전의 Google 프로필도 포함합니다.
      if (data.isGuest === true) return;

      const xp = Number(data.xp);
      rankings.push({
        uid: userDoc.id,
        ...data,
        xp: Number.isFinite(xp) && xp >= 0 ? xp : 0
      });
    });

    rankings.sort((a, b) => b.xp - a.xp);
    return rankings.slice(0, limitCount);
  } catch (error) {
    console.error("랭킹 불러오기 실패:", error);
    return [];
  }
}
