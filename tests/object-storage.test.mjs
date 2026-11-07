import assert from "node:assert/strict";
import test from "node:test";
import { getObjectStorageConfig } from "../app/lib/object-storage.ts";

// Deliberately fake credentials; never load the user's environment or secrets.
const r2 = {
  R2_ACCOUNT_ID: "example-account",
  R2_ACCESS_KEY_ID: "fixture-key",
  R2_SECRET_ACCESS_KEY: "fixture-secret",
  R2_ASSETS_BUCKET: "assets",
  R2_RENDERS_BUCKET: "renders",
};
const s3 = {
  S3_ENDPOINT: "http://127.0.0.1:19000/",
  S3_ACCESS_KEY_ID: "fixture-s3-key",
  S3_SECRET_ACCESS_KEY: "fixture-s3-secret",
  S3_ASSETS_BUCKET: "local-assets",
  S3_RENDERS_BUCKET: "local-renders",
};

test("existing R2 configuration is preserved", () => {
  const config = getObjectStorageConfig(r2);
  assert.equal(config.client.endpoint, "https://example-account.r2.cloudflarestorage.com");
  assert.equal(config.client.region, "auto");
  assert.equal(config.client.forcePathStyle, false);
  assert.equal(config.assetsBucket, "assets");
  assert.equal(config.rendersBucket, "renders");
  assert.equal(config.client.credentials.secretAccessKey, "fixture-secret");
});

test("S3 works without a Cloudflare account", () => {
  const config = getObjectStorageConfig(s3);
  assert.equal(config.client.endpoint, "http://127.0.0.1:19000");
  assert.equal(config.client.region, "us-east-1");
  assert.equal(config.client.forcePathStyle, true);
  assert.equal(config.assetsBucket, "local-assets");
  assert.equal(config.rendersBucket, "local-renders");
});

test("explicit S3 settings override R2 without mixing credentials", () => {
  const config = getObjectStorageConfig({ ...r2, ...s3, S3_REGION: "eu-west-1", S3_FORCE_PATH_STYLE: "false" });
  assert.equal(config.client.credentials.accessKeyId, "fixture-s3-key");
  assert.equal(config.client.region, "eu-west-1");
  assert.equal(config.client.forcePathStyle, false);
  assert.throws(() => getObjectStorageConfig({ ...r2, S3_ENDPOINT: s3.S3_ENDPOINT }), /S3_ACCESS_KEY_ID/);
});

test("empty optional S3 endpoint keeps R2 compatibility", () => {
  assert.deepEqual(getObjectStorageConfig({ ...r2, S3_ENDPOINT: "  " }), getObjectStorageConfig(r2));
});

test("missing fields fail early and never disclose credentials", () => {
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ASSETS_BUCKET", "R2_RENDERS_BUCKET"]) {
    assert.throws(() => getObjectStorageConfig({ ...r2, [name]: " " }), new RegExp(name));
  }
  for (const name of ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_ASSETS_BUCKET", "S3_RENDERS_BUCKET"]) {
    assert.throws(() => getObjectStorageConfig({ ...s3, [name]: undefined }), new RegExp(name));
  }
});

test("reject malformed endpoints without echoing their contents", () => {
  for (const endpoint of ["not-a-url", "ftp://example.com", "https://user:secret@example.com", "https://example.com/path", "https://example.com?secret=value", "https://example.com#secret"]) {
    assert.throws(() => getObjectStorageConfig({ ...s3, S3_ENDPOINT: endpoint }), (error) => {
      assert.match(error.message, /HTTP\(S\) origin/);
      assert.equal(error.message.includes(endpoint), false);
      return true;
    });
  }
});

test("path-style booleans are validated instead of silently misconfigured", () => {
  assert.throws(() => getObjectStorageConfig({ ...s3, S3_FORCE_PATH_STYLE: "yes" }), /true or false/);
});
