import { authorizeOAuthApp, regenerateAccessToken } from "@/app/actions/oauth";
import { clientApp } from "@/core/db/schemas";
import { db } from "@/core/db/setup";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth 2.0 Token Endpoint
 * POST /api/oauth/token
 *
 * Request Body (application/x-www-form-urlencoded or application/json):
 *
 * For Authorization Code Grant:
 * - grant_type: "authorization_code"
 * - code: The authorization code
 * - client_id: The client identifier
 * - client_secret: The client secret
 * - redirect_uri: The redirect URI (must match the one used in authorize)
 *
 * For Refresh Token Grant:
 * - grant_type: "refresh_token"
 * - refresh_token: The refresh token
 * - client_id: The client identifier
 * - client_secret: The client secret
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

    const grantType = body.grant_type;

    if (!grantType) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing grant_type parameter",
        },
        { status: 400 },
      );
    }

    if (grantType === "authorization_code") {
      const { code, client_id, client_secret } = body;

      if (!code || !client_id || !client_secret) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description:
              "Missing required parameters: code, client_id, client_secret",
          },
          { status: 400 },
        );
      }

      const [oauthApp] = await db
        .select()
        .from(clientApp)
        .where(eq(clientApp.clientId, client_id))
        .limit(1);
      const offline = oauthApp.scopes.includes("offline_access");

      const result = await authorizeOAuthApp({
        code,
        clientId: client_id,
        clientSecret: client_secret,
        offline,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: result.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        access_token: result.data.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: result.data.refreshToken,
      });
    }

    if (grantType === "refresh_token") {
      const { refresh_token } = body;

      if (!refresh_token) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: "Missing refresh_token parameter",
          },
          { status: 400 },
        );
      }

      const result = await regenerateAccessToken({
        refreshToken: refresh_token,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: "invalid_grant", error_description: result.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        access_token: result.data.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: result.data.refreshToken,
      });
    }

    return NextResponse.json(
      {
        error: "unsupported_grant_type",
        error_description: `Grant type '${grantType}' is not supported`,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Token endpoint error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An internal error occurred",
      },
      { status: 500 },
    );
  }
}
