import { API_BASE_URL } from "@operoz/constants";
import type { TTimezones } from "@operoz/types";
// helpers
// api services
import { APIService } from "@/services/api.service";

export class TimezoneService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(): Promise<TTimezones> {
    return this.get(`/api/timezones/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const timezoneService = new TimezoneService();

export default timezoneService;
