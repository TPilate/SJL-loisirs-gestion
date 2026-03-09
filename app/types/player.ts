export interface IPlayer {
  _id: string
  name: string
  rank: number
  createdAt: string
  updatedAt: string
}

export interface IPlayerForm {
  name: string
  rank: number
}
