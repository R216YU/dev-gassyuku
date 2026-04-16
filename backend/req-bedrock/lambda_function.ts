import { S3Event } from "aws-lambda";
import {
  downloadFromS3,
  parseHtml,
  sendMessageToBedrock,
  uploadToS3,
} from "./packages/utils";
import { AllowedImageFormat } from "./packages/types";

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const extension = key.split(".").pop()?.toLowerCase() as AllowedImageFormat;

    const imageBase64String = await downloadFromS3(key);

    const response = await sendMessageToBedrock(imageBase64String, extension);
    const parsedHtml = parseHtml(response);

    const now = new Date().toISOString();
    const filename = `output-${now}.html`;
    await uploadToS3(parsedHtml, `outputs/${filename}`);
  }
};
