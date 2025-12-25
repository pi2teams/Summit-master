import { JwtTokenPayloadStructure } from './../auth/generate-token/route';
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { DecryptToken } from "../auth/generate-token/route";
import { getRawTokenFromAuthHeader } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return NextResponse.json({
      status: 400,
      slug: "email-auth-disabled",
      message: "Email/OTP authentication is disabled. Please sign in with Pi Browser.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: 500,
      slug: "server-error",
      message: error,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const tokenHeader = req.headers.get("Authorization");
    const token = getRawTokenFromAuthHeader(tokenHeader);
    if (!token) {
      return NextResponse.json({
        status: 401,
        slug: "unauthorized",
        message: "Unauthorized",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({
        status: 500,
        slug: "server-error",
        message: "JWT secret is not defined",
      });
    }
    try {
      const payload: JwtTokenPayloadStructure = await DecryptToken(token);

      const user = await db.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return NextResponse.json({
          status: 404,
          slug: "user-not-found",
          message: "User not found",
        });
      }

      console.log(user);

      const body = await req.json();

      await db.user.update({
        where: { id: user.id },
        data: {
          ...body
        }
      })

      return NextResponse.json({
        status: 200,
        slug: "user-patched",
        patched: {
          ...body
        },
        message: "User verified successfully",
      });
    } catch (error) {
      return NextResponse.json({
        status: 400,
        slug: "invalid-token",
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: 500,
      slug: "server-error",
      message: error,
    });
  }
}
