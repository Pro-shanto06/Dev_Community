import { Schema, Document, Types } from 'mongoose';

export interface Comment extends Document {
  content: string;
  author: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<Comment>({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true, 
});


export const CommentSchema = commentSchema;
