export type Position = "탑" | "정글" | "미드" | "원딜" | "서포터";

export interface PlayerEntry {
  position: Position | "";
  nickname: string;
  champion: string;
  kills: string;
  deaths: string;
  assists: string;
  cs: string;
  visionScore: string;
  damageDealt: string;
  receivedDamage: string;
  gold: string;
  cc: string;
  pinkWardCount: string;
  firstBlood: boolean;
}

export type Team = "blue" | "red";

export interface Match {
  id: string;
  date: string;
  winner: Team;
  gameDurationSeconds?: number;
  blueTeam: PlayerEntry[];
  redTeam: PlayerEntry[];
  bans?: { blue: string[]; red: string[] };
}
