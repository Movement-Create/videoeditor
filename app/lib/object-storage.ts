/** Configuration only: importing this module never connects to storage. */
export function getObjectStorageConfig(env: Record<string, string | undefined>) {
  function required(name: string): string {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing object storage setting: ${name}`);
    return value;
  }

  const customEndpoint = env.S3_ENDPOINT?.trim() || undefined;
  const prefix = customEndpoint ? "S3" : "R2";
  const endpoint = customEndpoint ?? `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Object storage endpoint must be an HTTP(S) origin");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("Object storage endpoint must be an HTTP(S) origin without credentials, path or query");
  }

  const pathStyle = env.S3_FORCE_PATH_STYLE?.trim() || "true";
  if (customEndpoint && pathStyle !== "true" && pathStyle !== "false") {
    throw new Error("S3_FORCE_PATH_STYLE must be true or false");
  }

  return {
    client: {
      endpoint: url.origin,
      region: customEndpoint ? env.S3_REGION?.trim() || "us-east-1" : "auto",
      forcePathStyle: customEndpoint ? pathStyle === "true" : false,
      credentials: {
        accessKeyId: required(`${prefix}_ACCESS_KEY_ID`),
        secretAccessKey: required(`${prefix}_SECRET_ACCESS_KEY`),
      },
    },
    assetsBucket: required(`${prefix}_ASSETS_BUCKET`),
    rendersBucket: required(`${prefix}_RENDERS_BUCKET`),
  };
}
