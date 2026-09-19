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

  test("loadEnabledSetting returns boolean from storage or falls back to true", async () => {
    const originalChrome = (globalThis as any).chrome;
    try {
      let storedValue: unknown = false;
      (globalThis as any).chrome = {
        storage: {
          local: {
            get: async (defaults: Record<string, unknown>) => {
              if (storedValue !== undefined) {
                return { enabled: storedValue };
              }
              return defaults;
            },
          },
        },
      };

      storedValue = false;
      assert.equal(await Cguic.loadEnabledSetting(), false);

      storedValue = true;
      assert.equal(await Cguic.loadEnabledSetting(), true);

      storedValue = "false";
      assert.equal(await Cguic.loadEnabledSetting(), true);

      storedValue = undefined;
      assert.equal(await Cguic.loadEnabledSetting(), true);
    } finally {
      (globalThis as any).chrome = originalChrome;
    }
  });

  test("saveEnabledSetting saves enabled value to local storage", async () => {
    const originalChrome = (globalThis as any).chrome;
    try {
      let savedData: unknown = null;
      (globalThis as any).chrome = {
        storage: {
          local: {
            set: async (items: Record<string, unknown>) => {
              savedData = items;
            },
          },
        },
      };

      await Cguic.saveEnabledSetting(false);
      assert.deepEqual(savedData, { enabled: false });
    } finally {
      (globalThis as any).chrome = originalChrome;
    }
  });

  test("subscribeEnabledSetting ignores non-local and non-boolean changes", () => {
    const originalChrome = (globalThis as any).chrome;
    try {
      let changeListener:
        | ((changes: Record<string, any>, areaName: string) => void)
        | null = null;
      (globalThis as any).chrome = {
        storage: {
          onChanged: {
            addListener: (
              callback: (changes: Record<string, any>, areaName: string) => void,
            ) => {
              changeListener = callback;
            },
          },
        },
      };

      const calls: boolean[] = [];
      Cguic.subscribeEnabledSetting((enabled) => {
        calls.push(enabled);
      });

      assert.ok(changeListener !== null);
      const listener = changeListener!;

      // areaName が "local" 以外の変更は無視する
      listener({ enabled: { newValue: false } }, "sync");
      assert.equal(calls.length, 0);

      // newValue が boolean 以外の変更は無視する
      listener({ enabled: { newValue: "false" } }, "local");
      listener({ enabled: {} }, "local");
      listener({ otherKey: { newValue: false } }, "local");
      assert.equal(calls.length, 0);

      // boolean の変更だけ listener が呼ばれる
      listener({ enabled: { newValue: false } }, "local");
      assert.deepEqual(calls, [false]);

      listener({ enabled: { newValue: true } }, "local");
      assert.deepEqual(calls, [false, true]);
    } finally {
      (globalThis as any).chrome = originalChrome;
    }
  });
}
