namespace Cguic {
  // 拡張機能が有効状態であることをCSSセレクタへ通知するための属性名。CSSルール全体の適用・解除を切り替えるために定義する。
  const ENABLED_ATTRIBUTE = "data-cguic-enabled";

  // レイアウト状態（compact または wide）をCSSセレクタへ通知するための属性名。画面幅に応じたCSSスタイルの分岐を可能にするために定義する。
  const LAYOUT_ATTRIBUTE = "data-cguic-layout";

  // 反映対象のCSS変数名とLayoutMetrics値からの文字列化関数を組にした定義。CSS変数名の記述を一元化し重複を排除するために使用する。
  interface LayoutStylePropertyDefinition {
    readonly name: string;
    readonly getValue: (metrics: LayoutMetrics) => string;
  }

  // DOM要素へ反映および削除を行うCSS変数の定義一覧。変数名と値の変換ロジックをまとめて管理し、設定時と削除時の乖離を防ぐために保持する。
  const LAYOUT_STYLE_PROPERTIES: readonly LayoutStylePropertyDefinition[] = [
    {
      name: "--cguic-gutter",
      getValue: (metrics) => `${metrics.gutterPx}px`,
    },
    {
      name: "--cguic-text-width",
      getValue: (metrics) => `${metrics.textWidthPx}px`,
    },
    {
      name: "--cguic-canvas-width",
      getValue: (metrics) => `${metrics.canvasWidthPx}px`,
    },
  ];

  // 計算されたLayoutMetricsや有効フラグを対象DOM要素へ反映・削除する責務を持つクラス。DOMスタイル変更処理をコントローラーから切り離して独立管理するために提供する。
  export class LayoutStyle {
    private previousMetricsKey = "";

    // 拡張機能の有効化を示す属性を対象要素へ付与する。CSSルールによるレイアウト適応を有効化するために使用する。
    applyEnabled(element: HTMLElement): void {
      element.setAttribute(ENABLED_ATTRIBUTE, "true");
    }

    // 計算されたLayoutMetricsを元に属性とCSS変数を対象要素へ反映する。前回適用時とメトリクス値が同一の場合は不要なDOM更新を抑止してパフォーマンスを保つ。
    applyLayoutMetrics(element: HTMLElement, metrics: LayoutMetrics): boolean {
      const metricsKey = [
        metrics.gutterPx,
        metrics.textWidthPx,
        metrics.canvasWidthPx,
        metrics.compact,
      ].join(":");

      if (metricsKey === this.previousMetricsKey) {
        return false;
      }
      this.previousMetricsKey = metricsKey;

      element.setAttribute(
        LAYOUT_ATTRIBUTE,
        metrics.compact ? "compact" : "wide",
      );
      for (const property of LAYOUT_STYLE_PROPERTIES) {
        element.style.setProperty(property.name, property.getValue(metrics));
      }
      return true;
    }

    // 対象要素から拡張機能固有の属性とCSS変数をすべて除去し、キャッシュを初期化する。無効化時にChatGPT標準の表示スタイルへ安全に復帰させるために使用する。
    clear(element: HTMLElement): void {
      element.removeAttribute(ENABLED_ATTRIBUTE);
      element.removeAttribute(LAYOUT_ATTRIBUTE);
      for (const property of LAYOUT_STYLE_PROPERTIES) {
        element.style.removeProperty(property.name);
      }
      this.previousMetricsKey = "";
    }
  }

  // レイアウトスタイルを反映する標準の対象要素を取得する。LayoutControllerなどの呼び出し元がDOMルート要素へ直接依存しないように分離するために使用する。
  export function getDefaultLayoutTarget(): HTMLElement {
    return document.documentElement;
  }
}
