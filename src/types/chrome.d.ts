interface CguicStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

interface CguicStorageArea {
  get(defaultValues: { enabled: boolean }): Promise<{ enabled?: unknown }>;
  set(values: { enabled: boolean }): Promise<void>;
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
