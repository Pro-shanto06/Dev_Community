import { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface User extends Document {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
  skills?: string[];
  experiences?: string[];
}

const userSchema = new Schema<User>({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  skills: { type: [String], default: [] },
  experiences: { type: [String], default: [] },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export const UserSchema = userSchema;
