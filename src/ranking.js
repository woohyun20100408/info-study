import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getTopRankings(limitCount = 10) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("xp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const rankings = [];
    querySnapshot.forEach((doc) => {
      rankings.push(doc.data());
    });

    return rankings;
  } catch (error) {
    console.error("❌ 랭킹 불러오기 실패:", error);
    return [];
  }
}