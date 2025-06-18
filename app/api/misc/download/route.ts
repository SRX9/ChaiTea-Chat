import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AppHost } from "@/config/site";
import { isServerLoggedIn } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  let origin = (await headers()).get("origin") as string;
  origin = origin ? origin : ((await headers()).get("referer") as string);

  if (!origin || !AppHost?.includes(origin?.slice(0, 6))) {
    return NextResponse.json(
      {
        message: "Invalid API. API doesn't exist",
      },
      { status: 500 }
    );
  }

  const { isLoggedIn } = await isServerLoggedIn();
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const image_url = url.searchParams.get("image_url");

  if (!image_url || !image_url.includes(process.env.STORE_URL_ATTACHMENT!)) {
    return NextResponse.json(
      {
        message: "Invalid Request",
      },
      { status: 500 }
    );
  }

  try {
    const imageResponse = await fetch(image_url);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const contentType = "application/octet-stream";
    const filename = image_url.split("/").pop() || "downloaded-image";

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    return new Response(imageResponse.body, {
      headers: headers,
      status: 200,
    });
  } catch (error: any) {
    console.error("Error streaming image:", error);
    return NextResponse.json(
      {
        message: "Failed to process image",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
