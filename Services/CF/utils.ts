import { IAttachmentType } from "@/components/chat/types";

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const MAX_ATTACH_PDF_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACH_TXT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACH_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

export const getAttachFileLink = (file_id: string) => {
  return `https://attach.ayesoul.com/${file_id}`;
};

export const getFileType = (file: File): IAttachmentType | null => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(extension as string)) {
    return extension as IAttachmentType;
  }
  return null;
};
