namespace Cguic {
  export async function bootstrap(): Promise<void> {
    const controller = new LayoutController();
    await controller.initialize();
  }
}

void Cguic.bootstrap();
