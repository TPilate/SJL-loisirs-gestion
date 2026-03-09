import mongoose, { Schema, Document } from 'mongoose'
import bcryptjs from 'bcryptjs'

export interface IAdmin extends Document {
  username: string
  password: string
  comparePassword(candidate: string): Promise<boolean>
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
)

AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcryptjs.hash(this.password, 12)
})

AdminSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcryptjs.compare(candidate, this.password)
}

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)
