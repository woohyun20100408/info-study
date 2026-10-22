import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getTopRankings(limitCount = 10) {
  try {
    const usersRef = collection(db, "users");
    // XP 기준으로 상위 목록을 불러옵니다.
    const q = query(usersRef, orderBy("xp", "desc"), limit(limitCount * 2));
    const querySnapshot = await getDocs(q);

    const rankings = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // 게스트 유저(isGuest가 true인 사용자)는 랭킹 목록에서 제외합니다.
      if (!data.isGuest) {
        rankings.push({ id: doc.id, ...data });
      }
    });

    // 요청한 개수(limitCount)만큼 잘라서 반환합니다.
    return rankings.slice(0, limitCount);
  } catch (error) {
    console.error("랭킹 불러오기 실패:", error);
    return [];
  }
}
