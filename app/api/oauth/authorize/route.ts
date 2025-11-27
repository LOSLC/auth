import { generateAuthorizationCode } from "@/app/actions/oauth";
import { auth } from "@/lib/auth";
import { db } from "@/core/db/setup";
import { clientApp } from "@/core/db/schemas";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth 2.0 Authorization Endpoint
 * GET /api/oauth/authorize
 *
 * Query Parameters:
 * - client_id: The client identifier
 * - redirect_uri: The redirect URI registered with the client
 * - response_type: Must be "code" for authorization code flow
 * - scope: Space-separated list of scopes (optional)
 * - state: Opaque value used to maintain state (recommended)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const responseType = searchParams.get("response_type");
    const state = searchParams.get("state");

    if (!clientId) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing client_id parameter",
        },
        { status: 400 },
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing redirect_uri parameter",
        },
        { status: 400 },
      );
    }

    if (responseType !== "code") {
      return NextResponse.json(
        {
          error: "unsupported_response_type",
          error_description: "Only 'code' response type is supported",
        },
        { status: 400 },
      );
    }

    const [app] = await db
      .select()
      .from(clientApp)
      .where(eq(clientApp.clientId, clientId));

    if (!app) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client_id" },
        { status: 400 },
      );
    }

    if (!app.redirectUris.includes(redirectUri)) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "redirect_uri is not registered for this client",
        },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      const loginUrl = new URL("/signin", request.url);
      loginUrl.searchParams.set("callbackURL", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const result = await generateAuthorizationCode({
      user: session.user,
      clientId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "invalid_client", error_description: result.message },
        { status: 400 },
      );
    }

    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("code", result.data.code);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Authorization error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An internal error occurred",
      },
      { status: 500 },
    );
  }
}
