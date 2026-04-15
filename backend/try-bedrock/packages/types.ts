type ChatContent = {
  text: string;
};

type MediaContent = {
  image: {
    format: "jpeg" | "png" | "jpg";
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
