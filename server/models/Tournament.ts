import mongoose, { Schema, Document, Types } from 'mongoose'

// ─── Sub-document types ─────────────────────────────────────────────────────

export interface IMatchSet {
  scoreA: number
  scoreB: number
}

export interface IMatch {
  _id: Types.ObjectId
  teamAId: Types.ObjectId
  teamBId: Types.ObjectId
  sets: IMatchSet[]
  status: 'pending' | 'played'
}

export interface IPool {
  _id: Types.ObjectId
  name: string
  teamIds: Types.ObjectId[]
  matches: IMatch[]
}

export interface ITeam {
  _id: Types.ObjectId
  name: string
  playerIds: Types.ObjectId[]
}

export interface IMatchFormat {
  setsToWin: number
  pointsPerSet: number
  goldenSetPoints: number
}

// ─── Tournament Document ─────────────────────────────────────────────────────

export interface ITournament extends Document {
  name: string
  date?: Date
  status: 'draft' | 'active' | 'finished'
  matchFormat: IMatchFormat
  teamsPerPool: number
  teams: ITeam[]
  pools: IPool[]
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const MatchSetSchema = new Schema<IMatchSet>(
  { scoreA: { type: Number, default: 0 }, scoreB: { type: Number, default: 0 } },
  { _id: false }
)

const MatchSchema = new Schema<IMatch>({
  teamAId: { type: Schema.Types.ObjectId, required: true },
  teamBId: { type: Schema.Types.ObjectId, required: true },
  sets: { type: [MatchSetSchema], default: [] },
  status: { type: String, enum: ['pending', 'played'], default: 'pending' },
})

const PoolSchema = new Schema<IPool>({
  name: { type: String, required: true, trim: true },
  teamIds: { type: [Schema.Types.ObjectId], default: [] },
  matches: { type: [MatchSchema], default: [] },
})

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, trim: true },
  playerIds: { type: [Schema.Types.ObjectId], default: [], validate: {
    validator: (arr: Types.ObjectId[]) => arr.length <= 6,
    message: 'A team can have at most 6 players',
  }},
})

const MatchFormatSchema = new Schema<IMatchFormat>(
  {
    setsToWin: { type: Number, default: 2 },
    pointsPerSet: { type: Number, default: 25 },
    goldenSetPoints: { type: Number, default: 15 },
  },
  { _id: false }
)

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date },
    status: { type: String, enum: ['draft', 'active', 'finished'], default: 'draft' },
    matchFormat: { type: MatchFormatSchema, default: () => ({}) },
    teamsPerPool: { type: Number, default: 4, min: 2 },
    teams: { type: [TeamSchema], default: [] },
    pools: { type: [PoolSchema], default: [] },
  },
  { timestamps: true }
)

export const Tournament =
  mongoose.models.Tournament || mongoose.model<ITournament>('Tournament', TournamentSchema)
