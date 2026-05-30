// services
import { API_BASE_URL } from "@operis/constants";
import { APIService } from "@/services/api.service";
// helper
// types
// FIXME:
// import { TAppConfig } from "@operis/types";

export class AppConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async envConfig(): Promise<any> {
    return this.get("/api/configs/", {
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
