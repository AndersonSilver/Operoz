// api service
import { APIService } from "../api.service";

/**
 * Service class for handling file upload operations
 * Handles file uploads
 * @extends {APIService}
 */
export class FileUploadService extends APIService {
  private cancelSource: AbortController | undefined;

  constructor() {
    super("");
  }

  /**
   * Uploads a file to the specified signed URL
   * @param {string} url - The URL to upload the file to
   * @param {FormData} data - The form data to upload
   * @returns {Promise<void>} Promise resolving to void
   * @throws {Error} If the request fails
   */
  async uploadFile(url: string, data: FormData): Promise<void> {
    this.cancelSource = new AbortController();
    return this.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal: this.cancelSource.signal,
      withCredentials: false,
    })
      .then((response) => response?.data)
      .catch((error) => {
        if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
          console.log("Upload canceled");
        } else {
          throw error?.response?.data;
        }
      });
  }

  /**
   * Cancels the upload
   */
  cancelUpload() {
    this.cancelSource?.abort("Upload canceled");
  }
}
