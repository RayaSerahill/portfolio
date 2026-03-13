import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const STATE_COOKIE = "discord_oauth_state";
const MODE_COOKIE = "discord_oauth_mode";

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing DISCORD_CLIENT_ID" }, { status: 500 });
  }

  const reqUrl = new URL(req.url);
  const mode = reqUrl.searchParams.get("mode") === "connect" ? "connect" : "login";
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;
  const state = randomBytes(24).toString("hex");
  const authUrl = new URL("https://discord.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "identify email");
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };
  res.cookies.set(STATE_COOKIE, state, cookieOptions);
  res.cookies.set(MODE_COOKIE, mode, cookieOptions);
  return res;
}
