export interface FileMetadata {
  _id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  tripId?: string;
  entryId?: string;
  createdAt: string;
}

export interface UploadFileRequest {
  file: File;
  tripId?: string;
  entryId?: string;
}

export interface UploadFileResponse {
  file: FileMetadata;
  url: string;
}

export interface GenerateUploadUrlResponse {
  uploadUrl: string;
  fileId: string;
}
