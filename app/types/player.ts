export const PLAYER_RANKS = ['Bronze', 'Bronze+', 'Argent', 'Argent+', 'Or', 'Or+'] as const
export type PlayerRank = typeof PLAYER_RANKS[number]

export interface IPlayer {
  _id: string
  name: string
  firstName: string
  rank: PlayerRank
  blocked: boolean
  points: number
  createdAt: string
  updatedAt: string
}

export interface IPlayerForm {
  name: string
  firstName: string
  rank: PlayerRank
  blocked: boolean
  points: number
}
