import Constants from "@/data/Constants";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    process.env.OPENROUTER_API_KEY ||
    "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",
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { model, description, imageUrl } = await req.json();

    const ModelObj = Constants.AiModelList.find((item) => item.name === model);
    const modelName = ModelObj?.modelName ?? "google/gemini-2.0-flash-001";

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
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
