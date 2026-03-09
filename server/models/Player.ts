import mongoose, { Schema, Document } from 'mongoose'

export interface IPlayer extends Document {
  name: string
  rank: number
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rank: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const Player = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema)
