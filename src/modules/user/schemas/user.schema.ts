import { Schema, Document,Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { skillSchema, Skill } from './skill.schema';
import { experienceSchema, Experience } from './experience.schema';

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
  roles: string[];
}

const userSchema = new Schema<User>({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  skills: { type: [skillSchema], default: [] },
  experiences: { type: [experienceSchema], default: [] },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post', default: [] }],
  refreshToken: { type: String, default: '' },
  roles: { type: [String], default: ['user'] },
}, { timestamps: true });


userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

export const UserSchema = userSchema;
