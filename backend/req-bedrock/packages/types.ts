export type AllowedImageFormat = "jpeg" | "png" | "jpg";

type ChatContent = {
  text: string;
};

type MediaContent = {
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
};
