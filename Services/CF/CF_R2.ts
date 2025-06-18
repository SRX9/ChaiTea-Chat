import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import {
  MAX_ATTACH_IMAGE_FILE_SIZE,
  MAX_ATTACH_PDF_FILE_SIZE,
  MAX_ATTACH_TXT_FILE_SIZE,
} from "./utils";
import { getFileType } from "./utils";

const getS3Client = () => {
  return new S3Client({
    endpoint: `https://${process.env.CLOUDFLARE_APP_ID}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_ATTACH_KEY || "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ATTACH_KEY || "",
    },
  });
};

export const uploadToR2 = async (file: File) => {
  try {
    const fileType = getFileType(file);
    if (!fileType) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (
      (fileType === "jpg" ||
        fileType === "png" ||
        fileType === "jpeg" ||
        fileType === "webp") &&
      file.size > MAX_ATTACH_IMAGE_FILE_SIZE
    ) {
      throw new Error(`Image file size must be less than 10MB`);
    }

    if (fileType === "pdf" && file.size > MAX_ATTACH_PDF_FILE_SIZE) {
      throw new Error(`PDF file size must be less than 10MB`);
    }

    const timestamp = Date.now();
    const filename = `file_${timestamp}_${uuidv4()}.${fileType}`;

    const s3Client = getS3Client();
    const fileBuffer = await file.arrayBuffer();
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_ATTACH_NAME,
      Key: filename,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    });
    await s3Client.send(putObjectCommand);

    return filename;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFromR2 = async (filename: string) => {
  try {
    const s3Client = getS3Client();
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_ATTACH_NAME,
      Key: filename,
    });
    await s3Client.send(deleteObjectCommand);
  } catch (error: any) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
