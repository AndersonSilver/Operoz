/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// external imports
import { fileTypeFromBuffer } from "file-type";
// plane imports
import type { TFileMetaDataLite, TFileSignedURLResponse } from "@plane/types";
import { DANGEROUS_EXTENSIONS } from "@plane/constants";

/**
 * @description Filename validation - checks for double extensions and dangerous patterns
 * @param {string} filename
 * @returns {string | null} Error message if invalid, null if valid
 */
const validateFilename = (filename: string): string | null => {
  if (!filename || filename.trim().length === 0) {
    return "Filename cannot be empty";
  }

  // Check for dot files (e.g., .htaccess, .env)
  if (filename.startsWith(".")) {
    return "Hidden files (starting with dot) are not allowed";
  }

  // Check for path separators
  if (filename.includes("/") || filename.includes("\\")) {
    return "Filename cannot contain path separators";
  }

  const parts = filename.split(".");

  // Check for double extensions with dangerous patterns
  if (parts.length >= 3) {
    const secondLastExt = parts[parts.length - 2]?.toLowerCase() || "";
    if (DANGEROUS_EXTENSIONS.includes(secondLastExt)) {
      return "File has suspicious double extension";
    }
  }

  // Check if the actual extension is dangerous
  const extension = parts[parts.length - 1]?.toLowerCase() || "";
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return `File extension '${extension}' is not allowed`;
  }

  return null;
};

/**
 * @description from the provided signed URL response, generate a payload to be used to upload the file
 * @param {TFileSignedURLResponse} signedURLResponse
 * @param {File} file
 * @returns {FormData} file upload request payload
 */
export const generateFileUploadPayload = (signedURLResponse: TFileSignedURLResponse, file: File): FormData => {
  const formData = new FormData();
  Object.entries(signedURLResponse.upload_data.fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", file);
  return formData;
};

/**
 * @description Detect MIME type from file signature using file-type library
 * @param {File} file
 * @returns {Promise<string>} detected MIME type or empty string if unknown
 */
const detectMimeTypeFromSignature = async (file: File): Promise<string> => {
  try {
    // Read first 4KB which is usually sufficient for most file type detection
    const chunk = file.slice(0, 4096);
    const buffer = await chunk.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const fileType = await fileTypeFromBuffer(uint8Array);
    return fileType?.mime || "";
  } catch (_error) {
    return "";
  }
};

/**
 * @description Validate and detect the MIME type of a file using signature detection
 * Also performs basic security checks on filename
 * @param {File} file
 * @returns {Promise<string>} validated and detected MIME type
 */
const inferMimeTypeFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    md: "text/markdown",
    markdown: "text/markdown",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    pdf: "application/pdf",
  };
  return map[ext] ?? "";
};

const validateAndDetectFileType = async (file: File): Promise<string> => {
  // Basic filename validation
  const filenameError = validateFilename(file.name);
  if (filenameError) {
    console.warn(`File validation warning: ${filenameError}`);
  }

  const htmlFromExtension = inferMimeTypeFromFilename(file.name) === "text/html";
  if (htmlFromExtension) {
    const fromBrowser = file.type?.trim() ?? "";
    if (fromBrowser === "text/html" || fromBrowser === "application/xhtml+xml") {
      return fromBrowser;
    }
    try {
      const signatureType = await detectMimeTypeFromSignature(file);
      if (signatureType === "text/html" || signatureType === "application/xhtml+xml") {
        return signatureType;
      }
    } catch (_error) {
      console.warn("Error detecting file type from signature:", _error);
    }
    // Magic-byte sniffing is unreliable for HTML; trust .html/.htm for editor/HTML embed uploads.
    return "text/html";
  }

  try {
    const signatureType = await detectMimeTypeFromSignature(file);
    if (signatureType) {
      return signatureType;
    }
  } catch (_error) {
    console.warn("Error detecting file type from signature:", _error);
  }

  // fallback: browser-reported MIME, then extension (some browsers leave type empty for .html)
  const fromBrowser = file.type?.trim() ?? "";
  if (fromBrowser) return fromBrowser;

  const fromName = inferMimeTypeFromFilename(file.name);
  return fromName || "";
};

/**
 * @description returns the necessary file meta data to upload a file
 * @param {File} file
 * @returns {Promise<TFileMetaDataLite>} payload with file info
 */
export const getFileMetaDataForUpload = async (file: File): Promise<TFileMetaDataLite> => {
  const fileType = await validateAndDetectFileType(file);
  return {
    name: file.name,
    size: file.size,
    type: fileType,
  };
};

/**
 * @description this function returns the assetId from the asset source
 * @param {string} src
 * @returns {string} assetId
 */
export const getAssetIdFromUrl = (src: string): string => {
  const sourcePaths = src.split("/");
  const assetUrl = sourcePaths[sourcePaths.length - 1];
  return assetUrl ?? "";
};
