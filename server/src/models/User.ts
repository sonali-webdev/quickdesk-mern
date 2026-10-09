import { Schema, model, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserMethods, USER_ROLES } from '../types';

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
    },
    password: {
      type: String, required: true, minlength: 8,
      select: false, // excluded from queries by default
    },
    role: { type: String, enum: USER_ROLES, default: 'customer' },
  },
  { timestamps: true }
);

// Hash only when the password actually changed (otherwise we'd re-hash
// an already-hashed value every time a user is saved for any reason).
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser, UserModel>('User', userSchema);