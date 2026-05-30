import { API_BASE_URL } from "@operis/constants";
import { APIService } from "../api.service";

export default class IntakeService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }
}

export { IntakeService };
