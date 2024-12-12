import { Container, Sprite, Texture } from 'pixi.js';
import { ReelsController } from './ReelsController';

interface Controls {
  container: Container;
  spinButton: Sprite;
}

export default function initControls(
  textures: { [key: string]: Texture },
  reelsController: ReelsController,
  onSpin?: () => void
): Controls {
  const container = new Container();

  // Create spin button
  const spinButton = new Sprite(textures['btn-spin']);
  spinButton.interactive = true;
  spinButton.cursor = 'pointer';
  
  // Center the button
  spinButton.anchor.set(0.5);
  spinButton.x = spinButton.width / 2;
  spinButton.y = spinButton.height / 2;

  // Add click handler
  spinButton.on('pointerdown', () => {
    if (!reelsController.running) {
      if (onSpin) {
        onSpin();
      }
      reelsController.spin();
    }
  });

  container.addChild(spinButton);

  return {
    container,
    spinButton,
  };
}
