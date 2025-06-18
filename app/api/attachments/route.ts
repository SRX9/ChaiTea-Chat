import { NextResponse } from "next/server";
import { uploadToR2, deleteFromR2 } from "@/Services/CF/CF_R2";
import { getAttachFileLink } from "@/Services/CF/utils";
import { isServerLoggedIn } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { isLoggedIn } = await isServerLoggedIn();
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is missing in form data" },
        { status: 400 }
      );
    }

    const filename = await uploadToR2(file);
    const url = getAttachFileLink(filename);

    return NextResponse.json({ filename, url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { filename } = (await request.json()) as { filename?: string };
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    await deleteFromR2(filename);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
