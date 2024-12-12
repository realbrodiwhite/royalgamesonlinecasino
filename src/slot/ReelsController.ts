import Reel from './Reel';
import gsap from 'gsap';

export class ReelsController {
  reels: Reel[];
  running: boolean;
  spinDuration: number;
  spinningReels: number;
  onComplete?: () => void;

  constructor(reels: Reel[]) {
    this.reels = reels;
    this.running = false;
    this.spinDuration = 2;
    this.spinningReels = 0;
  }

  spin(onComplete?: () => void): void {
    if (this.running) return;

    this.onComplete = onComplete;
    this.running = true;
    this.spinningReels = this.reels.length;

    this.reels.forEach((reel, index) => {
      reel.running = true;
      
      // Use GSAP for smooth animation
      gsap.to(reel, {
        position: reel.position + 20 + index * 5,
        duration: this.spinDuration + index * 0.3,
        ease: 'power1.inOut',
        onComplete: () => {
          reel.stop();
          this.spinningReels--;
          
          if (this.spinningReels === 0) {
            this.running = false;
            if (this.onComplete) {
              this.onComplete();
            }
          }
        }
      });
    });
  }

  stop(): void {
    if (!this.running) return;
    
    this.reels.forEach(reel => {
      reel.stop();
    });
    
    this.running = false;
    this.spinningReels = 0;
    
    if (this.onComplete) {
      this.onComplete();
    }
  }
}
