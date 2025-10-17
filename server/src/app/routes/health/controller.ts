import { Request, Response } from "express";
import { ApiResponse } from "../../lib/api.helper";

export class Controller {
  public async healthCheck(req: Request, res: Response): Promise<void> {
    res.json(
      new ApiResponse({
        statusCode: 200,
        message: "Server is up and running",
      })
    );
  }
}
