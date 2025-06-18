import { NextResponse } from "next/server";
// @ts-ignore – package lacks type declarations
import { createFal } from "@ai-sdk/fal";
import { experimental_generateImage as generateImage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import { decryptString } from "@/lib/crypto-utils";
import { EInferenceProviders } from "@/config/models";
import { uploadToR2 } from "@/Services/CF/CF_R2";
import { getAttachFileLink } from "@/Services/CF/utils";
import { isServerLoggedIn } from "@/lib/auth-server";

// Default Fal client using the server-side key. We can override this per-request
// if the user supplies a (still encrypted) BYOK credential.
const defaultFal = createFal({
  apiKey: process.env.FAL_API_KEY || "",
});

// Increase timeout because image generation can take longer
export const maxDuration = 60;

export async function POST(req: Request) {
  const { isLoggedIn } = await isServerLoggedIn();
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // BYOK additions -------------------------------------------------------
    const {
      prompt,
      modelId,
      imageUrl: sourceImageUrl,
      provider,
      api_key,
    } = await req.json();

    // Attempt to decrypt the api key if one was supplied for the Fal
    // provider. We silently fall back to the server key on any failure.
    let decryptedKey: string = "";
    if (provider === EInferenceProviders.FALAI && api_key) {
      try {
        decryptedKey = await decryptString(
          api_key,
          process.env.NEXT_PUBLIC_CHAI_SHIELD || ""
        );
      } catch (err) {
        console.error("[BYOK] Failed to decrypt Fal API key", err);
        decryptedKey = "";
      }
    }

    // Choose which Fal client to use (BYOK or default)
    const fal = decryptedKey ? createFal({ apiKey: decryptedKey }) : defaultFal;
    console.log("fal decryptedKey", decryptedKey);
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const targetModelId =
      typeof modelId === "string" && modelId.trim() !== ""
        ? modelId
        : "fal-ai/fast-sdxl";

    // Build provider options dynamically. Always include API key for Fal; if
    // an `imageUrl` is provided (image-editing mode), forward it so the model
    // can modify the supplied image instead of creating one from scratch.

    const providerOptions: Record<string, any> = {
      falai: {
        apiKey: decryptedKey || process.env.FAL_API_KEY || "",
      },
    };

    if (typeof sourceImageUrl === "string" && sourceImageUrl.trim() !== "") {
      providerOptions.fal = {
        image_url: sourceImageUrl,
      };
    }

    const { image } = await generateImage({
      model: fal.image(targetModelId),
      prompt,
      providerOptions,
    });

    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(image.uint8Array);

    // Upload to Cloudflare R2 using existing helper
    const uploadFilename = `gen_${Date.now()}_${uuidv4()}.png`;

    // Create a File‐like object compatible with uploadToR2 in a Node.js environment
    const fileLike: File = {
      name: uploadFilename,
      type: "image/png",
      size: buffer.length,
      arrayBuffer: async () => buffer,
      slice: () => new Blob(),
      stream: () => new ReadableStream(),
      text: async () => "",
      lastModified: Date.now(),
      webkitRelativePath: "",
    } as unknown as File;

    const storedFilename = await uploadToR2(fileLike);

    const imageUrl = getAttachFileLink(storedFilename);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("[IMAGE_GENERATION] Failed", error);
    return NextResponse.json(
      { error: error?.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
