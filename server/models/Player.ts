import mongoose, { Schema, Document } from 'mongoose'

export const PLAYER_RANKS = ['Bronze', 'Bronze+', 'Argent', 'Argent+', 'Or', 'Or+'] as const
export type PlayerRank = typeof PLAYER_RANKS[number]

export interface IPlayer extends Document {
  name: string
  firstName: string
  rank: PlayerRank
  blocked: boolean
  points: number
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    rank: {
      type: String,
      enum: PLAYER_RANKS,
      required: true,
      default: 'Bronze',
    },
    blocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    points: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
)

export const Player = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema)
