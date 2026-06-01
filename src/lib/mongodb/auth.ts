import crypto from "crypto";
import { connectMongo } from "@/lib/mongodb/connect";
import { UserModel } from "@/lib/mongodb/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
};

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  await connectMongo();
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || email.split("@")[0] || "User";

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({ email, name, passwordHash });

  return {
    ok: true,
    user: { id: String(user._id), email: user.email, name: user.name ?? name, onboardingCompleted: false },
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  await connectMongo();
  const normalized = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalized }).lean();
  if (!user?.passwordHash) {
    return { ok: false, message: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Invalid email or password." };
  }

  return {
    ok: true,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name ?? normalized.split("@")[0] ?? "User",
      onboardingCompleted: user.onboardingCompleted === true,
    },
  };
}

export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; userId: string } | null> {
  await connectMongo();
  const normalized = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalized });
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpires = expires;
  await user.save();

  return { token, userId: String(user._id) };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await connectMongo();
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return { ok: false, message: "Reset link is invalid or expired." };
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return { ok: true };
}
