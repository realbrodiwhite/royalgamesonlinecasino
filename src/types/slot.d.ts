// Type definitions for slot game components
import { Texture } from 'pixi.js';

// Re-export the SlotGame class type from the implementation
export { default as SlotGame } from '../slot/SlotGame';

// Define interfaces for other slot-related types
export interface ReelConfig {
  textures: Texture[];
  position?: number;
  blur?: boolean;
}

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  resolution?: number;
  autoDensity?: boolean;
}
