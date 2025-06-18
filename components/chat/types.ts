export type IAttachmentType = "png" | "jpg" | "jpeg" | "pdf" | "webp";

export interface IAttachment {
  id: string;
  name: string;
  type: IAttachmentType;
  url: string;
}

export interface IAttachmentUpload extends IAttachment {
  uploading: boolean;
  progress?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: IAttachment[];
  createdAt: Date;
}
