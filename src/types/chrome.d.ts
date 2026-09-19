interface CguicStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

interface CguicStorageArea {
  get(defaultValues: Record<string, unknown>): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

interface CguicStorageChangeEvent {
  addListener(
    listener: (
      changes: Record<string, CguicStorageChange>,
      areaName: string,
    ) => void,
  ): void;
}

declare const chrome: {
  storage: {
    local: CguicStorageArea;
    onChanged: CguicStorageChangeEvent;
  };
};
