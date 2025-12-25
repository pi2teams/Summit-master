import { NextResponse } from "next/server";
import { DecryptToken } from "../../auth/generate-token/route";
import { db } from "@/lib/db";
import crypto from "crypto";

function createSignature(params: Record<string, string>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization");
    if (!token) {
      return NextResponse.json({ message: "User not authorized" }, { status: 401 });
    }
    const tokenInfo = await DecryptToken(token as string);

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ message: "Missing image" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: "Cloudinary is not configured" }, { status: 500 });
    }

    const publicId = `lumaClone_${tokenInfo.userId}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createSignature(
      {
        overwrite: "true",
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    const uploadBody = new FormData();
    uploadBody.append("file", base64Image);
    uploadBody.append("public_id", publicId);
    uploadBody.append("overwrite", "true");
    uploadBody.append("timestamp", timestamp);
    uploadBody.append("api_key", apiKey);
    uploadBody.append("signature", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      body: uploadBody,
    });

    if (!uploadResp.ok) {
      const errorText = await uploadResp.text();
      console.error("Cloudinary upload failed:", errorText);
      return NextResponse.json({ message: "Image upload failed" }, { status: 500 });
    }

    const { secure_url } = (await uploadResp.json()) as { secure_url?: string };
    if (!secure_url) {
      return NextResponse.json({ message: "Image upload failed" }, { status: 500 });
    }

    await db.$executeRaw`UPDATE "User" SET "imageUrl" = ${secure_url} WHERE id = ${tokenInfo.userId}`;

    return NextResponse.json({ url: secure_url }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
