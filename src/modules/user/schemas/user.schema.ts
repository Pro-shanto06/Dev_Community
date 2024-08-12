import { Schema, Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface Skill {
  name: string;
  level: string;
}

export interface Experience {
  title: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface User extends Document {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
  profilePic?: string;
  skills?: Skill[];
  experiences?: Experience[];
  posts?: Types.ObjectId[];
  refreshToken?: string;
}

const skillSchema = new Schema<Skill>({
  name: { type: String, required: true },
  level: { type: String, required: true },
});

const experienceSchema = new Schema<Experience>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
});

const userSchema = new Schema<User>({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  skills: { type: [skillSchema], default: [] },
  experiences: { type: [experienceSchema], default: [] },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post', default: [] }],
  refreshToken: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export const UserSchema = userSchema;
