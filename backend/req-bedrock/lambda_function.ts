import { S3Event } from "aws-lambda";
import {
  downloadFromS3,
  sanitizeHtml,
  sendMessageToBedrock,
  uploadToS3,
} from "./packages/utils";

export const handler = async (event: S3Event) => {
  // for (const record of event.Records) {
  //   const bucket = record.s3.bucket.name;
  //   const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  //   console.log(`S3 event: ${record.eventName} - ${bucket}/${key}`);

  //   const userMessage = `S3にファイルがアップロードされました。バケット: ${bucket}, キー: ${key}。このファイルについて簡単に説明してください。`;

  //   console.log("userMessage:", userMessage);
  // }
  const imageBase64String = await downloadFromS3(
    "2b465de7-1a48-4ac7-9d80-6bc456e30277.jpg",
  );

  const response = await sendMessageToBedrock(imageBase64String);
  const sanitizedHtml = sanitizeHtml(response);

  const now = new Date().toISOString();
  const filename = `output-${now}.html`;
  await uploadToS3(sanitizedHtml, filename);
};
