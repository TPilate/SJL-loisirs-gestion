// ─── Tournament types (client-side) ─────────────────────────────────────────

export type TournamentStatus = 'draft' | 'active' | 'finished'
export type MatchStatus = 'pending' | 'played'

export interface IMatchSet {
  scoreA: number
  scoreB: number
}

export interface IMatch {
  _id: string
  teamAId: string
  teamBId: string
  sets: IMatchSet[]
  status: MatchStatus
}

export interface IPool {
  _id: string
  name: string
  teamIds: string[]
  matches: IMatch[]
}

export interface ITeam {
  _id: string
  name: string
  playerIds: string[]
}

export interface IMatchFormat {
  setsToWin: number
  pointsPerSet: number
  goldenSetPoints: number
}

export interface ITournament {
  _id: string
  name: string
  date?: string
  status: TournamentStatus
  matchFormat: IMatchFormat
  teamsPerPool: number
  teams: ITeam[]
  pools: IPool[]
  createdAt: string
  updatedAt: string
}

export interface ITournamentForm {
  name: string
  date: string
  matchFormat: IMatchFormat
  teamsPerPool: number
}
