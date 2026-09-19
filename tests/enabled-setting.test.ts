declare function require(name: string): any;

namespace EnabledSettingTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  test("normalizeEnabled keeps valid boolean values", () => {
    assert.equal(Cguic.normalizeEnabled(true), true);
    assert.equal(Cguic.normalizeEnabled(false), false);
  });

  test("normalizeEnabled falls back to default true for invalid values", () => {
    assert.equal(Cguic.normalizeEnabled(undefined), true);
    assert.equal(Cguic.normalizeEnabled(null), true);
    assert.equal(Cguic.normalizeEnabled("true"), true);
    assert.equal(Cguic.normalizeEnabled("false"), true);
    assert.equal(Cguic.normalizeEnabled(0), true);
    assert.equal(Cguic.normalizeEnabled(1), true);
    assert.equal(Cguic.normalizeEnabled({}), true);
    assert.equal(Cguic.normalizeEnabled([]), true);
  });
}
