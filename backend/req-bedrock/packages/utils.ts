import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { AllowedImageFormat, allowedImageFormats, Payload } from "./types";
import { BEDROCK_MESSAGE_PROMPT } from "./prompts";
import { REGION, MODEL_ID, BUCKET_NAME } from "./env";

const bedrock = new BedrockRuntimeClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

/**
 * Bedrockにメッセージを送信する
 * @param image_base64_string 送信する画像のBase64エンコード文字列
 * @returns Bedrockからの応答テキスト
 */
export const sendMessageToBedrock = async (
  image_base64_string: string,
  imageFormat: AllowedImageFormat,
): Promise<string> => {
  const payload: Payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format: imageFormat,
              source: {
                bytes: image_base64_string,
              },
            },
          },
          {
            text: BEDROCK_MESSAGE_PROMPT,
          },
        ],
      },
    ],
    inferenceConfig: {
      max_new_tokens: 1000,
    },
  };

  const apiResponse = await bedrock.send(
    new InvokeModelCommand({
      contentType: "application/json",
      body: JSON.stringify(payload),
      modelId: MODEL_ID,
    }),
  );

  const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
  const responseBody = JSON.parse(decodedResponseBody);
  const responses = responseBody.output.message.content;

  if (responses.length === 1) {
    console.log(`Response: ${responses[0].text}`);
  } else {
    console.log("Nova returned multiple responses:");
    console.log(responses);
  }

  return responses[0].text;
};

/**
 * S3からファイルをダウンロードする
 * @param key ダウンロードするS3オブジェクトキー
 * @returns ダウンロードしたファイルの内容
 */
export const downloadFromS3 = async (key: string): Promise<string> => {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );

  const contentBase64String: string | undefined =
    await response.Body?.transformToString("base64");

  if (!contentBase64String) {
    throw new Error("Failed to download content from S3");
  }

  return contentBase64String;
};

/**
 * S3にファイルをアップロードする
 * @param content アップロードするファイル本体
 * @param key アップロード先のS3オブジェクトキー
 */
export const uploadToS3 = async (content: string, key: string) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: "text/html",
    }),
  );
};

/**
 * Bedrockから受け取った応答テキストの不要部分を削除する
 * @param html Bedrockからの応答HTML
 * @returns parsed HTML string
 */
export const parseHtml = (html: string): string => {
  return html.replace(/^```html\s*/, "").replace(/\s*```$/, "");
};

/**
 * S3から取得したファイルの拡張子を確認する
 * @param format
 * @returns boolean
 */
export const validateImageFormat = (
  format: string,
): format is AllowedImageFormat => {
  return allowedImageFormats.includes(format as AllowedImageFormat);
};
