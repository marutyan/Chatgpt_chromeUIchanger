namespace Cguic {
  export class LayoutController {
    private mainRegion: HTMLElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private enabled = false;
    private readonly refreshObserver = new RefreshObserver(() => this.refresh());

    constructor(
      private readonly targetElement: HTMLElement = getDefaultLayoutTarget(),
      private readonly layoutStyle = new LayoutStyle(),
    ) {}

    async initialize(): Promise<void> {
      const initialEnabled = await loadEnabledSetting();
      this.setEnabled(initialEnabled);

      subscribeEnabledSetting((nextEnabled) => {
        this.setEnabled(nextEnabled);
      });
    }

    setEnabled(enabled: boolean): void {
      if (this.enabled === enabled) {
        if (enabled) {
          this.refresh();
        }
        return;
      }

      this.enabled = enabled;
      if (enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }

    refresh(): void {
      if (!this.enabled) {
        return;
      }

      const nextMainRegion = findMainRegion();
      if (nextMainRegion === null) {
        this.detachFromMainRegion();
        return;
      }

      if (nextMainRegion !== this.mainRegion) {
        this.attachToMainRegion(nextMainRegion);
      }

      tagLayoutTargets(nextMainRegion);
      this.updateMetrics(nextMainRegion.clientWidth);
    }

    private enable(): void {
      this.layoutStyle.applyEnabled(this.targetElement);
      this.refreshObserver.start();
      this.refresh();
    }

    private disable(): void {
      this.refreshObserver.stop();
      this.detachFromMainRegion();
      this.layoutStyle.clear(this.targetElement);
    }

    private attachToMainRegion(mainRegion: HTMLElement): void {
      this.detachFromMainRegion();
      this.mainRegion = mainRegion;
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const width = entry?.contentRect.width ?? mainRegion.clientWidth;
        this.updateMetrics(width);
      });
      this.resizeObserver.observe(mainRegion);
    }

    private detachFromMainRegion(): void {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;

      if (this.mainRegion !== null) {
        clearTargetClasses(this.mainRegion);
      }
      this.mainRegion = null;
    }

    private updateMetrics(mainWidthPx: number): void {
      const metrics = calculateLayoutMetrics(mainWidthPx);
      this.layoutStyle.applyLayoutMetrics(this.targetElement, metrics);
    }
  }
}
