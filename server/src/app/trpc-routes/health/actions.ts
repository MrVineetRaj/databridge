import { ApiResponse } from "../../lib/api.helper";

export class Actions {
  async trpcHealth() {
    return new ApiResponse({
      message: "Server is up and running",
      statusCode: 200,
    });
  }
}
