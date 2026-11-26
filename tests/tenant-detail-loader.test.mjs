import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/tenant-detail-loader.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { loadTenantDetailResources, tenantDetailLoadError } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const detail = { status: true, data: { profile: { ot_id: "123.001", ot_nama: "Test Outlet" } } };

test("Sales can open an outlet without requesting forbidden economy resources", async () => {
  let optionalCalls = 0;
  const forbidden = async () => { optionalCalls++; throw { response: { status: 403 } }; };
  const result = await loadTenantDetailResources({
    getDetail: async () => detail,
    getConfigs: forbidden,
    getPackages: forbidden,
    canReadEconomy: false,
    canReadPackages: true,
  });
  assert.equal(result.detail.data.profile.ot_id, "123.001");
  assert.equal(optionalCalls, 0);
  assert.equal(result.configs, null);
  assert.equal(result.packages, null);
});

test("optional 403/500 responses do not erase a successful outlet response", async () => {
  const result = await loadTenantDetailResources({
    getDetail: async () => detail,
    getConfigs: async () => { throw { response: { status: 403 } }; },
    getPackages: async () => { throw { response: { status: 500 } }; },
    canReadEconomy: true,
    canReadPackages: true,
  });
  assert.equal(result.detail, detail);
  assert.equal(result.configs, null);
  assert.equal(result.packages, null);
});

test("master retains pricing and package data when authorized", async () => {
  const configs = { data: { data: [{ cfg_key: "price_per_coin", cfg_value: "100" }] } };
  const packages = { data: { data: [{ id: 1, jumlah_koin: 100 }] } };
  const result = await loadTenantDetailResources({
    getDetail: async () => detail, getConfigs: async () => configs, getPackages: async () => packages,
    canReadEconomy: true, canReadPackages: true,
  });
  assert.equal(result.configs, configs);
  assert.equal(result.packages, packages);
});

test("detail failure remains a failure even if optional resources succeed", async () => {
  const denied = { response: { status: 403 } };
  await assert.rejects(loadTenantDetailResources({
    getDetail: async () => { throw denied; }, getConfigs: async () => [], getPackages: async () => [],
    canReadEconomy: true, canReadPackages: true,
  }), (error) => error === denied);
});

test("only a true 404 is described as an outlet not found", () => {
  assert.equal(tenantDetailLoadError(404).title, "Outlet Tidak Ditemukan");
  assert.equal(tenantDetailLoadError(403).title, "Akses Detail Outlet Ditolak");
  for (const status of [undefined, 500, 502]) {
    assert.equal(tenantDetailLoadError(status).title, "Detail Outlet Gagal Dimuat");
  }
});
