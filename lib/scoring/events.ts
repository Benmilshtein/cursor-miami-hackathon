import { EventEmitter } from "events";

const globalForRanking = globalThis as unknown as { rankingEmitter?: EventEmitter };

if (!globalForRanking.rankingEmitter) {
  globalForRanking.rankingEmitter = new EventEmitter();
  globalForRanking.rankingEmitter.setMaxListeners(200);
}

export const rankingEmitter = globalForRanking.rankingEmitter;

export const RANKING_UPDATED = "ranking:updated";

export function notifyRankingUpdate() {
  rankingEmitter.emit(RANKING_UPDATED);
}
