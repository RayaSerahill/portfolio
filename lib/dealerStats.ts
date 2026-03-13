import "server-only";

import type { Db } from "mongodb";
import { ensureAuthCollections, ensureGameCollections, getDb } from "@/lib/db";

export type DealerRow = { total: number; count: number };
export type DailyRow = { day: string; profit: number };
export type DealerStatsData = {
  rows: DealerRow[];
  daily: DailyRow[];
  days: number;
};

type GameDoc = {
  uploaderId: string;
  gameType?: string;
  profit?: number;
  createdAt?: Date;
  sourceDateTime?: string;
  players?: Array<{ dealer?: boolean; cards?: Array<number | string> }>;
};

export async function loadDealerStats(uploaderId: string, daysInput: number, db?: Db): Promise<DealerStatsData> {
  await ensureAuthCollections();
  await ensureGameCollections();

  const days = Math.min(365, Math.max(1, Number(daysInput) || 20));
  const database = db ?? (await getDb());
  const games = database.collection<GameDoc>("games");

  const allowed = [17, 18, 19, 20, 21];
  const faceCards = [10, 11, 12, 13];

  const [rowsRaw, dailyRaw] = await Promise.all([
    games
      .aggregate([
        { $match: { uploaderId, gameType: "cards" } },
        { $unwind: { path: "$players", preserveNullAndEmptyArrays: false } },
        { $match: { "players.dealer": true } },
        {
          $addFields: {
            totalRaw: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$players.cards", []] },
                  as: "c",
                  in: {
                    $let: {
                      vars: { n: { $toInt: "$$c" } },
                      in: { $cond: [{ $in: ["$$n", faceCards] }, 10, "$$n"] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: {
              $switch: {
                branches: [
                  { case: { $in: ["$totalRaw", allowed] }, then: "$totalRaw" },
                  { case: { $gt: ["$totalRaw", 21] }, then: 0 },
                ],
                default: null,
              },
            },
          },
        },
        { $match: { total: { $ne: null } } },
        { $group: { _id: "$total", count: { $sum: 1 } } },
        { $project: { _id: 0, total: "$_id", count: 1 } },
        { $sort: { total: 1 } },
      ])
      .toArray(),
    games
      .aggregate([
        { $match: { uploaderId, gameType: "cards" } },
        { $match: { players: { $elemMatch: { dealer: true } } } },
        {
          $addFields: {
            sourceParsed: {
              $dateFromString: {
                dateString: "$sourceDateTime",
                format: "%d/%m/%Y %H.%M.%S %z",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $addFields: { dt: { $ifNull: ["$sourceParsed", "$createdAt"] } } },
        {
          $project: {
            day: {
              $dateToString: {
                date: "$dt",
                format: "%Y-%m-%d",
                timezone: "America/Chicago",
              },
            },
            profit: { $toDouble: { $ifNull: ["$profit", 0] } },
          },
        },
        { $group: { _id: "$day", profit: { $sum: "$profit" } } },
        { $project: { _id: 0, day: "$_id", profit: 1 } },
        { $sort: { day: -1 } },
        { $limit: days },
        { $sort: { day: 1 } },
      ])
      .toArray(),
  ]);

  const wantTotals = [0, ...allowed];
  const byTotal = new Map<number, number>(rowsRaw.map((r: any) => [Number(r.total), Number(r.count)]));
  const rows = wantTotals.map((t) => ({ total: t, count: byTotal.get(t) ?? 0 }));
  const daily = dailyRaw.map((d: any) => ({ day: String(d.day), profit: Number(d.profit) || 0 }));

  return { rows, daily, days };
}
