import Constants from "@/data/Constants";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    "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",
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { model, description, imageUrl } = await req.json();

  const ModelObj = Constants.AiModelList.find((item) => item.name === model);
  const modelName =
    ModelObj?.modelName ?? "google/gemini-2.0-pro-exp-02-05:free";

  const response = await openai.chat.completions.create({
    model: modelName,
    stream: true,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: description },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of response) {
        const text = chunk.choices?.[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
