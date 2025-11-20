import { User } from "../../../generated/prisma";
import { db } from "../../lib/db";

export class Repository {
  /**
   * Retrieves a user by their email address.
   * @param params - Object containing the user's email.
   * @returns The user object with id if found, otherwise null.
   */
  public async getUserByEmail({ email }: { email: string }): Promise<{
    id: string;
  } | null> {
    const user = await db.user.findUnique({
      where: { email },
    });

    return user;
  }

  /**
   * Creates a new user with the given name and email.
   * @param params - Object containing name and email.
   * @returns The newly created User object.
   */
  public async createNewUser({
    name,
    email,
  }: {
    name: string;
    email: string;
  }): Promise<User> {
    const newUser = await db.user.create({
      data: { name, email },
    });
    return newUser;
  }
}
