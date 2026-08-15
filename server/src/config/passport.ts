import passport from "passport";
import mongoose from "mongoose";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";

import { env } from "./env.js";
import { UserModel } from "../modules/auth/user.model.js";

export function initializePassport(): void {
  if (!env.googleClientId || !env.googleClientSecret) {
    console.warn(
      "Google OAuth credentials were not found. Passport Google strategy was skipped.",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        callbackURL: env.googleCallbackUrl || "/auth/google/callback",
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          let user = await UserModel.findOne({ googleId: profile.id }).exec();
          const profileImage = profile.photos?.[0]?.value ?? "";
          const primaryEmail = profile.emails?.[0]?.value ?? "";

          if (!user) {
            user = await UserModel.create({
              displayName: profile.displayName ?? "",
              email: primaryEmail || undefined,
              emails: profile.emails ?? [],
              googleId: profile.id,
              name: profile.name ?? {},
              profileImage: profileImage || undefined,
              role: "user",
            });
          } else {
            user.displayName = profile.displayName;
            if (primaryEmail && !user.email) {
              user.email = primaryEmail;
            }
            user.emails = profile.emails ?? [];
            user.name = profile.name ?? {};
            user.profileImage = profileImage;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    const currentUser = user as { _id: unknown };
    done(null, String(currentUser._id));
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (!mongoose.isValidObjectId(id)) {
        done(null, false);
        return;
      }

      const user = await UserModel.findById(id).exec();
      done(null, user ?? false);
    } catch (error) {
      done(error as Error);
    }
  });
}
