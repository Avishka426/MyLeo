import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectLocation {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
  placeName?: string;
}

export interface IProject extends Document {
  club: mongoose.Types.ObjectId;
  title: string;
  category: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate?: Date;
  endDate?: Date;
  outcomes?: string;
  media: string[];
  location?: IProjectLocation;
  isMapVisible: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    outcomes: {
      type: String,
    },
    media: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
      address: String,
      placeName: String,
    },
    isMapVisible: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ location: '2dsphere' });

export default mongoose.model<IProject>('Project', ProjectSchema);
