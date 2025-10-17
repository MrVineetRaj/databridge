import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { Request, Response } from "express";
import { User } from "../generated/prisma";
import { db } from "./lib/db";

/**
 * This is a context for making sure that it has access to current authenticated session
 * managed with express request and passport session
 * @param opts
 * @returns {req,res}
 */
export const createTRPCContext = (
  opts: trpcExpress.CreateExpressContextOptions
): {
  req: trpcExpress.CreateExpressContextOptions["req"] & Request;
  res: trpcExpress.CreateExpressContextOptions["res"] & Response;
} => {
  return { req: opts.req, res: opts.res };
};

/**
 * Just declaring type of the context
 */
export type Context = ReturnType<typeof createTRPCContext>;

/**
 * Creating the Authentication middleware type
 */
export type AuthedContext = Context & {
  user: User;
  role: string;
  token: string;
};

const t = initTRPC.context<Context>().create();
const tAuthed = initTRPC.context<AuthedContext>().create();

/**
 * Creating the Authentication middleware
 * It will attach the logged in user to each request as well
 */
const isAuthed = t.middleware(async ({ next, ctx }) => {
  const req = ctx.req;

  if (!req.isAuthenticated()) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await db.user.findUnique({
    where: {
      email: (req.user as { emails: [{ value: string }] })?.emails[0].value,
    },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      role: user.role,
      user: user,
    },
  });
});

/**
 * Defining various procedure along with other properties
 */
export const router = t.router;
export const createTRPCRouter: typeof t.router = t.router;
export const createCallerFactory: typeof t.createCallerFactory =
  t.createCallerFactory;
export const baseProcedure: typeof t.procedure = t.procedure;
export const protectedProcedure: typeof tAuthed.procedure =
  tAuthed.procedure.use(isAuthed);


