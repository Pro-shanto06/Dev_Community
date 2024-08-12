import { Schema } from 'mongoose';

export interface Skill {
  name: string;
  level: string;
}

export const skillSchema = new Schema<Skill>({
  name: { type: String, required: true },
  level: { type: String, required: true },
});

