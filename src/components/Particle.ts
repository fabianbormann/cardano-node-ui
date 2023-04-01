export default class Particle {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private color: string;
  x: number;
  y: number;
  velocity: { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    options: { color: string; velocity: number }
  ) {
    this.canvas = canvas;
    this.context = context;
    this.color = options.color;

    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.velocity = {
      x: (Math.random() - 0.5) * options.velocity,
      y: (Math.random() - 0.5) * options.velocity,
    };
  }

  update() {
    if (this.x > this.canvas.width + 20 || this.x < -20) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.y > this.canvas.height + 20 || this.y < -20) {
      this.velocity.y = -this.velocity.y;
    }
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }

  draw() {
    this.context.beginPath();
    this.context.fillStyle = this.color;
    this.context.globalAlpha = 0.7;
    this.context.arc(this.x, this.y, 1.5, 0, 2 * Math.PI);
    this.context.fill();
  }
}
