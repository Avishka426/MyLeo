import mongoose, { Document, Schema } from 'mongoose';

export interface IJoinRequest {
  club: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
}

export interface IHelpRequest extends Document {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  subject: string;
  message: string;
  images: string[];
  status: 'pending' | 'claimed' | 'joint' | 'converted_to_project';
  claimedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  isJoint: boolean;
  joinRequests: IJoinRequest[];
  assignedTo?: mongoose.Types.ObjectId;
  convertedProject?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JoinRequestSchema = new Schema<IJoinRequest>(
  {
    club: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    guestName:  { type: String, required: [true, 'Name is required'], trim: true },
    guestEmail: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
    guestPhone: { type: String, trim: true },
    subject:    { type: String, required: [true, 'Subject is required'], trim: true },
    message:    { type: String, required: [true, 'Message is required'] },
    images:     [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'claimed', 'joint', 'converted_to_project'],
      default: 'pending',
    },
    claimedBy:  { type: Schema.Types.ObjectId, ref: 'Club' },
    claimedAt:  { type: Date },
    isJoint:    { type: Boolean, default: false },
    joinRequests: [JoinRequestSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedProject: { type: Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
);

export default mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);
