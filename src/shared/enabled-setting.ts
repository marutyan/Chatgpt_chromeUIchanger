namespace Cguic {
  // chrome.storage.local で有効状態を保存・取得するためのキー名。拡張機能全体で設定キーの指定を単一箇所に統一するために定義する。
  export const ENABLED_STORAGE_KEY = "enabled";

  // 設定が存在しない初回起動時や不正な値が保存されている場合に、既定で拡張機能を有効動作させるための真偽値。
  export const DEFAULT_ENABLED = true;

  // storage等から取得した未検証の値を安全な真偽値へ変換する。想定外のデータ型によるランタイムエラーや動作不良を防ぐために使用する。
  export function normalizeEnabled(value: unknown): boolean {
    return typeof value === "boolean" ? value : DEFAULT_ENABLED;
  }

  // chrome.storage.local から現在の有効状態を非同期で読み込む。popupやcontent scriptの初期化時に永続化された設定を復元するために使用する。
  export async function loadEnabledSetting(): Promise<boolean> {
    const stored = await chrome.storage.local.get({
      [ENABLED_STORAGE_KEY]: DEFAULT_ENABLED,
    });
    return normalizeEnabled(stored[ENABLED_STORAGE_KEY]);
  }

  // 指定された有効状態を chrome.storage.local に非同期で保存する。popupでのトグル操作などを永続化してcontent scriptへ波及させるために使用する。
  export async function saveEnabledSetting(enabled: boolean): Promise<void> {
    await chrome.storage.local.set({ [ENABLED_STORAGE_KEY]: enabled });
  }

  // chrome.storage.local の設定変更を購読し、有効状態が更新された際にリスナーを実行する。content scriptがpopup側の設定変更へ即座に追随するために使用する。
  export function subscribeEnabledSetting(
    listener: (enabled: boolean) => void,
  ): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const change = changes[ENABLED_STORAGE_KEY];
      if (change !== undefined && typeof change.newValue === "boolean") {
        listener(change.newValue);
      }
    });
  }
}
