import {
  ContainerSize,
  densityOptions,
  ParticleNetworkOptions,
} from '../global/types';
import Particle from './Particle';

export default class ParticleNetwork {
  container: HTMLDivElement;
  private containerSize: ContainerSize;
  private options: ParticleNetworkOptions;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private resetTimer?: number;
  private particles: Array<Particle> = [];
  private mouseParticle: Particle | null = null;
  private removeResizeListener: Function = () => {};
  private removeMouseMoveListener: Function = () => {};
  private removeMouseUpListener: Function = () => {};

  constructor(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    options?: ParticleNetworkOptions
  ) {
    this.container = container;
    this.containerSize = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight,
    };

    this.options = {
      color: options?.color || '#fff',
      background: options?.background || '#1a252f',
      interactive:
        typeof options?.interactive === 'boolean' ? options.interactive : true,
      velocity: options?.velocity || 0.5,
      useWindowForMouseEvents:
        typeof options?.useWindowForMouseEvents === 'boolean'
          ? options.useWindowForMouseEvents
          : false,
    };
    this.setDensity(options?.density);

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.canvas.width = this.containerSize.width;
    this.canvas.height = this.containerSize.height - 5;
    this.init();
  }

  clear() {
    this.options.velocity = 0;
    this.removeMouseMoveListener();
    this.removeMouseUpListener();
    this.removeResizeListener();
    this.particles = [];
    this.mouseParticle = null;
  }

  init() {
    this.setStyles(this.container, {
      background: this.options.background!,
    });

    const resizeListener = () => {
      if (
        this.container.offsetWidth === this.containerSize.width &&
        this.container.offsetHeight === this.containerSize.height
      ) {
        return false;
      }

      this.canvas.width = this.containerSize.width = this.container.offsetWidth;
      this.canvas.height =
        (this.containerSize.height = this.container.offsetHeight) - 5;

      clearTimeout(this.resetTimer);
      this.resetTimer = window.setTimeout(() => {
        this.particles = [];
        for (
          var i = 0;
          i < (this.canvas.width * this.canvas.height) / this.options.density!;
          i++
        ) {
          this.particles.push(
            new Particle(this.canvas, this.context!, {
              color: this.options.color!,
              velocity: this.options.velocity!,
            })
          );
        }
        if (this.options.interactive) {
          this.particles.push(this.mouseParticle!);
        }
      }, 500);
    };

    window.addEventListener('resize', resizeListener);
    this.removeResizeListener = () => {
      window.removeEventListener('resize', resizeListener);
    };

    this.particles = [];
    for (
      var i = 0;
      i < (this.canvas.width * this.canvas.height) / this.options.density!;
      i++
    ) {
      this.particles.push(
        new Particle(this.canvas, this.context!, {
          color: this.options.color!,
          velocity: this.options.velocity!,
        })
      );
    }

    if (this.options.interactive) {
      this.mouseParticle = new Particle(this.canvas, this.context!, {
        color: this.options.color!,
        velocity: this.options.velocity!,
      });
      this.mouseParticle.velocity = {
        x: 0,
        y: 0,
      };
      this.particles.push(this.mouseParticle);

      const mousemoveListener = (event: MouseEvent) => {
        this.mouseParticle!.x = event.clientX - this.canvas.offsetLeft;
        this.mouseParticle!.y = event.clientY - this.canvas.offsetTop;
      };

      if (this.options.useWindowForMouseEvents) {
        window.addEventListener('mousemove', mousemoveListener);
        this.removeMouseMoveListener = () => {
          window.removeEventListener('mousemove', mousemoveListener);
        };
      } else {
        this.canvas.addEventListener('mousemove', mousemoveListener);
        this.removeMouseMoveListener = () => {
          this.canvas.removeEventListener('mousemove', mousemoveListener);
        };
      }

      const mouseupListener = (event: MouseEvent) => {
        this.mouseParticle!.velocity = {
          x: (Math.random() - 0.5) * this.options.velocity!,
          y: (Math.random() - 0.5) * this.options.velocity!,
        };
        this.mouseParticle = new Particle(this.canvas, this.context!, {
          color: this.options.color!,
          velocity: this.options.velocity!,
        });
        this.mouseParticle.velocity = {
          x: 0,
          y: 0,
        };
        this.particles.push(this.mouseParticle);
      };

      if (this.options.useWindowForMouseEvents) {
        window.addEventListener('mouseup', mouseupListener);
        this.removeMouseUpListener = () => {
          window.removeEventListener('mousemove', mouseupListener);
        };
      } else {
        this.canvas.addEventListener('mouseup', mouseupListener);
        this.removeMouseUpListener = () => {
          this.canvas.removeEventListener('mousemove', mouseupListener);
        };
      }
    }

    requestAnimationFrame(this.update.bind(this));
  }

  update() {
    this.context!.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context!.globalAlpha = 1;

    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].update();
      this.particles[i].draw();

      for (var j = this.particles.length - 1; j > i; j--) {
        var distance = Math.sqrt(
          Math.pow(this.particles[i].x - this.particles[j].x, 2) +
            Math.pow(this.particles[i].y - this.particles[j].y, 2)
        );
        if (distance > 120) {
          continue;
        }

        this.context!.beginPath();
        this.context!.strokeStyle = this.options.color!;
        this.context!.globalAlpha = (120 - distance) / 120;
        this.context!.lineWidth = 0.7;
        this.context!.moveTo(this.particles[i].x, this.particles[i].y);
        this.context!.lineTo(this.particles[j].x, this.particles[j].y);
        this.context!.stroke();
      }
    }

    if (this.options.velocity !== 0) {
      requestAnimationFrame(this.update.bind(this));
    }
  }

  setDensity(density?: densityOptions | number) {
    if (typeof density === 'undefined') {
      this.options.density = 10000;
    } else if (typeof density === 'number') {
      this.options.density = density;
    } else if (density === 'high') {
      this.options.density = 5000;
    } else if (density === 'low') {
      this.options.density = 20000;
    } else if (density === 'medium') {
      this.options.density = 10000;
    } else {
      throw Error(
        `This density parameter is not allowed: ${density}. Use a number or the strings 'high' || 'medium' || 'low' instead`
      );
    }
  }

  setStyles(div: HTMLElement, styles: { [key: string]: string }) {
    for (const style in styles) {
      div.style.setProperty(style, styles[style]);
    }
  }
}
