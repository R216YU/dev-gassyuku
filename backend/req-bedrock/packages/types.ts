export type ChatContent = {
  text: string;
};

export const allowedImageFormats = ["jpeg", "png", "jpg"] as const;
export type AllowedImageFormat = (typeof allowedImageFormats)[number];

export type MediaContent = {
  image: {
    format: AllowedImageFormat;
    source: {
      bytes: string; // base64 encoded image data
    };
  };
};

/**
 * Bedrockに投げるペイロードの型定義
 */
export type Payload = {
  messages: {
    role: string;
    content: (ChatContent | MediaContent)[];
  }[];
  inferenceConfig?: {
    max_new_tokens: number;
  };
};
