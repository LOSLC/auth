import { db } from "@/core/db/setup";
import { user as dbUser } from "@/core/db/schemas";
import { verifyJWT } from "@/core/utils/crypto";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import type { OAuthJWT } from "@/app/actions/types.oauth";

/**
 * OAuth 2.0 UserInfo Endpoint
 * GET /api/oauth/userinfo
 *
 * Headers:
 * - Authorization: Bearer <access_token>
 *
 * Returns user information based on the access token
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing or invalid Authorization header",
        },
        { status: 401 },
      );
    }

    const accessToken = authHeader.substring(7);

    let decoded: OAuthJWT;
    try {
      decoded = (await verifyJWT(accessToken)) as OAuthJWT;
    } catch (error) {
      return NextResponse.json(
        {
          error: "invalid_token",
          error_description: "Invalid or expired access token",
        },
        { status: 401 },
      );
    }

    if (decoded.exp < Date.now()) {
      return NextResponse.json(
        {
          error: "invalid_token",
          error_description: "Access token has expired",
        },
        { status: 401 },
      );
    }

    const [user] = await db
      .select()
      .from(dbUser)
      .where(eq(dbUser.id, decoded.sub));

    if (!user) {
      return NextResponse.json(
        { error: "invalid_token", error_description: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sub: user.id,
      name: user.name,
      email: user.email,
      email_verified: user.emailVerified,
      picture: user.image,
      updated_at: user.updatedAt?.getTime(),
    });
  } catch (error) {
    console.error("UserInfo endpoint error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An internal error occurred",
      },
      { status: 500 },
    );
  }
}
