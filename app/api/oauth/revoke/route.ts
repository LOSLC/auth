import { revokeRefreshToken } from "@/app/actions/oauth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth 2.0 Token Revocation Endpoint
 * POST /api/oauth/revoke
 *
 * Request Body (application/x-www-form-urlencoded or application/json):
 * - token: The token to revoke (refresh token)
 * - token_type_hint: Optional hint about the token type (e.g., "refresh_token")
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    let body: Record<string, string>;

    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else if (contentType?.includes("application/json")) {
      body = await request.json();
    } else {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description:
            "Content-Type must be application/x-www-form-urlencoded or application/json",
        },
        { status: 400 },
      );
    }

    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing token parameter",
        },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Authentication required",
        },
        { status: 401 },
      );
    }

    const result = await revokeRefreshToken({
      refreshToken: token,
      user: session.user,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "invalid_token", error_description: result.message },
        { status: 400 },
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An internal error occurred",
      },
      { status: 500 },
    );
  }
}
