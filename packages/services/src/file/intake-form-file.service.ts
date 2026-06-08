import { API_BASE_URL } from "@operis/constants";
import type { TFileSignedURLResponse } from "@operis/types";
import { FileUploadService } from "./file-upload.service";
import { FileService } from "./file.service";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "./helper";

export class IntakeFormFileService extends FileService {
  private fileUploadService: FileUploadService;

  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
    this.fileUploadService = new FileUploadService();
  }

  private async updateAssetUploadStatus(anchor: string, assetId: string): Promise<void> {
    return this.patch(`/api/public/intake-forms/${anchor}/assets/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadAttachment(anchor: string, file: File): Promise<TFileSignedURLResponse> {
    const fileMetaData = await getFileMetaDataForUpload(file);
    return this.post(`/api/public/intake-forms/${anchor}/assets/`, fileMetaData)
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateAssetUploadStatus(anchor, signedURLResponse.asset_id);
        return signedURLResponse;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
