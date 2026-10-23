import {
  ref,
  get,
  set,
  remove,
  query,
  orderByChild,
  limitToLast,
  onValue
} from "firebase/database";
import { rtdb } from "./firebase";

function requireRealtimeDatabase() {
  if (!rtdb) {
    throw new Error(
      "Realtime Database URL이 설정되지 않았습니다. GitHub Actions Secret에 VITE_FIREBASE_DATABASE_URL을 추가해 주세요."
    );
  }
  return rtdb;
}

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function snapshotToRankings(snapshot, limitCount) {
  const rankings = [];
  snapshot.forEach((child) => {
    const data = child.val() || {};
    if (data.isGuest === true) return;

    rankings.push({
      uid: child.key,
      ...data,
      xp: toNonNegativeNumber(data.xp, 0),
      level: Math.max(1, toNonNegativeNumber(data.level, 1)),
      solvedProblems: toNonNegativeNumber(data.solvedProblems, 0)
    });
  });

  // limitToLast()는 XP가 높은 항목을 골라오지만 결과가 오름차순이라 화면용으로 역정렬합니다.
  rankings.sort((a, b) => b.xp - a.xp);
  return rankings.slice(0, limitCount);
}

// Firestore 프로필/점수는 유지하고, 랭킹 전용 항목을 Realtime Database에 동기화합니다.
export async function syncRankingEntry(uid, userData = {}) {
  if (!uid) return false;

  try {
    const database = requireRealtimeDatabase();
    const rankingRef = ref(database, `rankings/${uid}`);

    if (userData.isGuest === true) {
      await remove(rankingRef);
      return true;
    }

    const existingSnapshot = await get(rankingRef);
    const existing = existingSnapshot.exists() ? existingSnapshot.val() || {} : {};
    const merged = { ...existing, ...userData };

    const entry = {
      uid,
      nickname: String(merged.nickname || merged.displayName || "학습자").slice(0, 30),
      xp: toNonNegativeNumber(merged.xp, 0),
      level: Math.max(1, toNonNegativeNumber(merged.level, 1)),
      solvedProblems: toNonNegativeNumber(merged.solvedProblems, 0),
      updatedAt: Date.now()
    };

    await set(rankingRef, entry);
    return true;
  } catch (error) {
    console.error("Realtime Database 랭킹 동기화 실패:", error);
    return false;
  }
}

// 한 번 조회가 필요한 곳을 위한 Realtime Database 랭킹 조회 함수입니다.
export async function getTopRankings(limitCount = 10) {
  const database = requireRealtimeDatabase();
  const rankingsQuery = query(
    ref(database, "rankings"),
    orderByChild("xp"),
    limitToLast(limitCount)
  );
  const snapshot = await get(rankingsQuery);
  return snapshotToRankings(snapshot, limitCount);
}

// 랭킹 탭을 열어 둔 동안 RTDB 변경 사항을 자동으로 반영합니다.
export function subscribeTopRankings(limitCount = 10, onData, onError = () => {}) {
  let database;
  try {
    database = requireRealtimeDatabase();
  } catch (error) {
    onError(error);
    return () => {};
  }

  const rankingsQuery = query(
    ref(database, "rankings"),
    orderByChild("xp"),
    limitToLast(limitCount)
  );

  return onValue(
    rankingsQuery,
    (snapshot) => onData(snapshotToRankings(snapshot, limitCount)),
    (error) => onError(error)
  );
}
