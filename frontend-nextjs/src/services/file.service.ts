import apiClient, { painainaApi } from "./api-client";
import type {
  FileMetadata,
  UploadFileResponse,
} from "@/interfaces";

export class FileService {
  private basePath = "/files";

  async uploadFile(file: File, tripId?: string, entryId?: string): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (tripId) formData.append("tripId", tripId);
    if (entryId) formData.append("entryId", entryId);

    const response = await painainaApi.post<UploadFileResponse>(
      `${this.basePath}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  async listFiles(tripId?: string, entryId?: string): Promise<FileMetadata[]> {
    const params: Record<string, string> = {};
    if (tripId) params.tripId = tripId;
    if (entryId) params.entryId = entryId;

    return apiClient.get<FileMetadata[]>(this.basePath, params);
  }

  async getFile(fileId: string): Promise<FileMetadata> {
    return apiClient.get<FileMetadata>(`${this.basePath}/${fileId}`);
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    return apiClient.delete(`${this.basePath}/${fileId}`);
  }
}

export const fileService = new FileService();
