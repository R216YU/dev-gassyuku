import { S3Event } from "aws-lambda";
import {
  downloadFromS3,
  parseHtml,
  sendMessageToBedrock,
  uploadToS3,
  validateImageFormat,
} from "./packages/utils";
import { AllowedImageFormat } from "./packages/types";

export const handler = async (event: S3Event) => {
  // for (const record of event.Records) {
  //   const bucket = record.s3.bucket.name;
  //   const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  //   console.log(`S3 event: ${record.eventName} - ${bucket}/${key}`);

  //   const userMessage = `S3にファイルがアップロードされました。バケット: ${bucket}, キー: ${key}。このファイルについて簡単に説明してください。`;

  //   console.log("userMessage:", userMessage);
  // }

  const key = "2b465de7-1a48-4ac7-9d80-6bc456e30277.jpg";
  const extension = key.split(".").pop()?.toLowerCase();
  if (!extension) {
    console.error(`Failed to extract file extension from key: ${key}`);
    return;
  }

  const isValidFormat = validateImageFormat(extension);
  if (!isValidFormat) {
    console.error(`Invalid image format for key: ${key}`);
    return;
  }

  const imageBase64String = await downloadFromS3(key);

  const response = await sendMessageToBedrock(
    imageBase64String,
    extension as AllowedImageFormat,
  );
  const parsedHtml = parseHtml(response);

  const now = new Date().toISOString();
  const filename = `output-${now}.html`;
  await uploadToS3(parsedHtml, filename);
};
