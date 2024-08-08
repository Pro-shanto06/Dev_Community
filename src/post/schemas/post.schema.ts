import { Schema, Document, Types } from 'mongoose';

export interface Post extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  comments?: Types.ObjectId[];
  createdAt: Date;
}

const postSchema = new Schema<Post>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment', default: [] }],
  createdAt: { type: Date, default: Date.now },
});

export const PostSchema = postSchema;
