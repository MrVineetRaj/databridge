import { type Request, type Response } from "express";
import { db } from "../../lib/db";
import { ApiResponse, ErrorResponse } from "../../lib/api.helper";
import { notificationJobQueue } from "../../../server";

class Controller {
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
    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

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

    const newUser = await db.user.create({
      data: {
        name: user?.displayName || user?.username,
        email: user?.emails[0].value,
      },
    });

    notificationJobQueue.add("welcome_mail", {
      username: newUser.name,
      email: newUser.email,
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
   * This controller provides profile from database along with image of the profile from github
   * @param req
   * @param res
   */
  public async getProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as any;
    const userData = await db.user.findUnique({
      where: {
        email: user?.emails[0].value,
      },
    });
    res.json(
      new ApiResponse({
        statusCode: 200,
        message: "Profile fetched",
        data: {
          avatar: user?.photos[0].value,
          ...userData,
        },
      })
    );
  }

  /**
   * Simple route to logout logged in user
   * @param req
   * @param res
   */
  public async logout(req: Request, res: Response): Promise<void> {
    req.logout((err) => {
      if (err) {
        throw new ErrorResponse({
          statusCode: 400,
          message: "Failed to logout",
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
