import { Request, Response } from "express";
import { ApiResponse } from "../../lib/api.helper";
import client from "prom-client";

export class Controller {
  public async healthCheck(req: Request, res: Response): Promise<void> {
    res.json(
      new ApiResponse({
        statusCode: 200,
        message: "Server is up and running",
      })
    );
  }

  public async getMetrics(req: Request, res: Response): Promise<void> {
    res.setHeader("Content-Type", client.register.contentType);
    const metrics = await client.register.metrics();

    res.send(metrics)
  }
}
