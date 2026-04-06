import mongoose, { Document, Schema } from 'mongoose';

export interface INewsPost extends Document {
  club: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images: string[];
  author: mongoose.Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsPostSchema = new Schema<INewsPost>(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

NewsPostSchema.pre('save', function (next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.model<INewsPost>('NewsPost', NewsPostSchema);
