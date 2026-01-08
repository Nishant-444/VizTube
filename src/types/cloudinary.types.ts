export interface CloudinaryResponse {
  url: string;
  public_id: string;
  secure_url?: string;
  duration?: number;
  format?: string; // mp4, jpg
  width?: number;
  height?: number;
  resource_type?: string; // img, vid
}
