import { API_BASE_URL } from "@operoz/constants";
import { APIService } from "./api.service";

export abstract class LiveService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }
}
