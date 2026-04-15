import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3 } from "@aws-sdk/client-s3";
import { Payload } from "./types";
import { BEDROCK_MESSAGE_PROMPT } from "./prompts";
import { REGION, MODEL_ID, BUCKET_NAME } from "./env";

const bedrock = new BedrockRuntimeClient({ region: REGION });
const s3 = new S3({ region: REGION });

/**
 * Bedrockにメッセージを送信する
 * @param image_base64_string 送信する画像のBase64エンコード文字列
 * @returns Bedrockからの応答テキスト
 */
export const sendMessageToBedrock = async (
  image_base64_string: string,
): Promise<string> => {
  const payload: Payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format: "jpeg",
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
  const response = await s3.getObject({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const contentBase64String = await response.Body?.transformToString("base64");

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
  await s3.putObject({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: "text/html",
  });
};

/**
 * Bedrockからの応答テキストをサニタイズする
 * @param html Bedrockからの応答HTML
 * @returns sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  return html.replace(/^```html\s*/, "").replace(/\s*```$/, "");
};
