import { Schema } from 'mongoose';

export interface Experience {
  title: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export const experienceSchema = new Schema<Experience>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
});