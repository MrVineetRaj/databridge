import { type Request, type Response } from "express";
import { db } from "../../lib/db";
import { ApiResponse, ErrorResponse } from "../../lib/api.helper";
import { notificationJobQueue } from "../../../server";
import { Repository } from "./repository";

class Controller {
  repository: Repository;

  constructor() {
    this.repository = new Repository();
  }

  /**
   * Handles the GitHub OAuth callback, manages user login/signup, and notifies the frontend.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async githubCallback(req: Request, res: Response): Promise<void> {
    const user = req.user as any;

    if (!user) {
      res.send(`
        <html>
          <head><title>Authentication Success</title></head>
          <body>
            <script>
              // Notify parent window and close popup
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_SUCCESS', 
                  user: ${JSON.stringify(user)} 
                }, '${process.env.FRONTEND_URL}');
              }
              window.close();
            </script>
            <p>Authentication successful! This window will close automatically.</p>
          </body>
        </html>
      `);

      return;
    }

    const email = user.emails?.[0]?.value;
    const existingUser = await this.repository.getUserByEmail({ email });

    if (existingUser) {
      res.send(`
        <html>
          <head><title>Login Successful</title></head>
          <body>
            <script>
             if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_SUCCESS', 
                  message: 'Login success' 
                }, '${process.env.FRONTEND_URL}');
              }
              window.close();
            </script>
          <p>Login Successful! This window will close automatically.</p>
          </body>
        </html>
      `);

      return;
    }

    const newUser = await this.repository.createNewUser({
      name: user?.displayName || user?.username,
      email: user?.emails[0].value,
    });

    notificationJobQueue.add("welcome_mail", {
      username: newUser.name,
      email: newUser.email,
      platforms: ["mail"],
    });

    res.send(`
        <html>
          <head><title>Signup Successful</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_SUCCESS', 
                  message: 'Signup success' 
                }, '${process.env.FRONTEND_URL}');
              }
              window.close();
            </script>
          <p>Signup Successful! This window will close automatically.</p>
          </body>
        </html>
    `);
    return;
  }

  /**
   * Fetches the authenticated user's profile from the database and includes their GitHub avatar.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as any;
    const email = user?.emails[0].value;
    const userData = await this.repository.getUserByEmail({
      email,
    });
    res.json(
      new ApiResponse({
        statusCode: 200,
        message: "Profile fetched successfully",
        data: {
          avatar: user?.photos[0].value,
          ...userData,
        },
      })
    );
  }

  /**
   * Logs out the currently authenticated user.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async logout(req: Request, res: Response): Promise<void> {
    req.logout((err) => {
      if (err) {
        throw new ErrorResponse({
          statusCode: 400,
          message: "Logout failed",
          success: false,
        });
      }
      res.json(
        new ApiResponse({
          statusCode: 200,
          message: "Logged out successfully",
        })
      );
    });
  }
}

export default Controller;
