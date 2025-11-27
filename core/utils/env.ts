type EnvKey =
  | "DATABASE_URL"
  | "NEXT_PUBLIC_APP_BASE_URL"
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET"
  | "DEBUG"
  | "SMTP_HOST"
  | "SMTP_LOGIN"
  | "SMTP_PASSWORD"
  | "DEFAULT_FROM_NAME"
  | "SUPPORT_EMAIL"
  | "CORS_ORIGINS"
  | "KEYGEN_SECRET"
  | "POCKETBASE_URL"
  | "POCKETBASE_ADMIN_EMAIL"
  | "POCKETBASE_ADMIN_PASSWORD"
  | "DEFAULT_APP_EMAIL"
  | "APP_NAME"
  | "JWT_PRIVATE_KEY" // openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 | base64 -w 0 | xclip -selection clipboard
  | "JWT_PUBLIC_KEY" // openssl rsa -pubout -in <(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048) | base64 -w 0 | xclip -selection clipboard
  | "NEXT_PUBLIC_APP_NAME"
  | "SUPPORTS_GOOGLE_AUTH"
  | "SUPPORTS_GITHUB_AUTH";

export function getEnv(key: EnvKey, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    console.log("Here's the value", value);
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
