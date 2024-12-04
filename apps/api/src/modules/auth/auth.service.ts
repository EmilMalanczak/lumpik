import { TRPCError } from "@trpc/server";
import { tables } from "node_modules/@lumpik/db/src/tables";
import { v4 as uuid } from "uuid";

import type { User, VerifyToken } from "@lumpik/db/types";
import { db, eq } from "@lumpik/db";

import { emailConfirmationEmailHtml } from "~mails/email-confirmation";
import { findUserById } from "~modules/user/user.service";
import { accessToken, refreshToken } from "~utils/jwt";
import { mailer } from "~utils/mailer";

export const createUser = async (input: User<"insert">) => {
  const [user] = await db.insert(tables.users).values(input).returning({
    id: tables.users.id,
    email: tables.users.email,
    name: tables.users.name,
    provider: tables.users.provider,
  });

  return user;
};

// USER

export const signTokens = (userId: number) => {
  const tokenPayload = { userId };
  const access_token = accessToken.sign(tokenPayload);

  const refresh_token = refreshToken.sign(tokenPayload);

  return { access_token, refresh_token };
};

// VERIFY TOKENS
export const verifyUserToken = async (token: string) => {
  try {
    const decodedToken = accessToken.decode(token);

    if (!decodedToken) throw new Error("Token is invalid");

    const user = await findUserById(decodedToken.userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  } catch (err) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Could not authenticate user. Please try again.",
    });
  }
};

export const removeVerificationToken = async (token: string) => {
  await db
    .delete(tables.verifyTokens)
    .where(eq(tables.verifyTokens.token, token));
};

export const validateVerifyToken = (token: VerifyToken) => {
  // 1hour expiry
  return token.createdAt.getTime() > Date.now() - 60 * 60 * 1000;
};

export const getVerificationToken = async (token: string) => {
  const verifyToken = await db.query.verifyTokens.findFirst({
    where: eq(tables.verifyTokens.token, token),
  });

  return verifyToken;
};

export const createVerificationToken = async (
  user: Pick<User, "id" | "email">,
) => {
  const [verifyToken] = await db
    .insert(tables.verifyTokens)
    .values({
      userId: user.id,
      token: uuid(),
      id: uuid(),
    })
    .returning();

  return verifyToken;
};

export const getUserVerificationToken = async (userId: number) => {
  const verifyToken = await db.query.verifyTokens.findFirst({
    where: eq(tables.verifyTokens.userId, userId),
  });

  return verifyToken;
};

export const updateUserVerificationToken = async (
  user: Pick<User, "id" | "email">,
) => {
  const [updatedVerifyToken] = await db
    .update(tables.verifyTokens)
    .set({
      createdAt: new Date(),
      token: uuid(),
    })
    .where(eq(tables.verifyTokens.userId, user.id))
    .returning();

  return updatedVerifyToken;
};

export const sendVerificationEmail = async (
  token: string,
  user: Pick<User, "name" | "email">,
) => {
  const url = new URL("http://localhost:3000/api/auth/verify-email");
  url.searchParams.append("token", token);

  await mailer.sendMail({
    subject: "Welcome to Lumpik - Confirm Your Registration!",
    to: user.email,
    html: emailConfirmationEmailHtml({
      name: user.name,
      confirmUrl: url.toString(),
    }),
  });
};
