namespace Cguic {
  const INSTALLED_ATTRIBUTE = "data-cguic-installed";

  export function bootstrap(): void {
    document.documentElement.setAttribute(INSTALLED_ATTRIBUTE, "true");
  }
}

Cguic.bootstrap();
