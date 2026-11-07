import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const args = ["compose", "--env-file", "/dev/null", "-p", "kimu-config-test", "-f", "compose.selfhost-infra.yml", "config", "--format", "json"];

test("infrastructure resolves without starting containers and stays isolated", () => {
  const result = spawnSync("docker", args, {
    cwd,
    encoding: "utf8",
    env: { PATH: process.env.PATH, KIMU_POSTGRES_PASSWORD: "fixture-only-not-a-real-password" },
  });
  assert.equal(result.status, 0, "Docker Compose configuration validation failed");
  const config = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(config.services).sort(), ["postgres", "redis"]);
  for (const service of Object.values(config.services)) {
    assert.equal(service.container_name, undefined);
    assert.ok(service.mem_limit > 0);
    assert.equal(service.ports[0].host_ip, "127.0.0.1");
  }
  assert.equal(config.services.postgres.ports[0].published, "15432");
  assert.equal(config.services.redis.ports[0].published, "16379");
  assert.ok(config.services.postgres.volumes.some((volume) => volume.target === "/var/lib/postgresql"));
  assert.ok(config.services.postgres.volumes.some((volume) => volume.target === "/docker-entrypoint-initdb.d" && volume.read_only));
  assert.ok(config.services.redis.command.includes("noeviction"));
});

test("database configuration refuses an absent password", () => {
  const result = spawnSync("docker", args, { cwd, encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /KIMU_POSTGRES_PASSWORD/);
});
