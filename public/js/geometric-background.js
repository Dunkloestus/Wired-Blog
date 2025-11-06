/* ============================================
   GEOMETRIC BACKGROUND - WIRED AESTHETICS
   Adapted from Iwakura Dynasty stylish site
   ============================================ */

// ============================================
// WIREFRAME CANVAS - Geometric Spheres & Lines
// ============================================

class WireframeRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mouse = { x: 0, y: 0 };

        this.resize();
        this.init();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const particleCount = Math.min(window.innerWidth / 10, 100);

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            });
        }
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Wrap around screen
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            if (p.z < 0) p.z = 1000;
            if (p.z > 1000) p.z = 0;

            // Mouse interaction
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                p.x -= dx * 0.01;
                p.y -= dy * 0.01;
            }
        });
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.globalAlpha = 1 - (dist / 150);
                    this.ctx.stroke();
                }
            }
        }

        this.ctx.globalAlpha = 1;

        // Draw particles
        this.particles.forEach(p => {
            const scale = 1000 / (1000 + p.z);
            const size = p.size * scale;

            this.ctx.fillStyle = `rgba(0, 255, 65, ${0.5 + scale * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Glow effect
            this.ctx.fillStyle = `rgba(0, 255, 65, ${0.2 * scale})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// MATRIX CANVAS - Falling Code Rain
// ============================================

class MatrixRain {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.columns = [];

        this.chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\|{}[]()'.split('');

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.fontSize = 14;
        this.columnCount = Math.floor(this.canvas.width / this.fontSize);

        this.columns = Array(this.columnCount).fill(0).map(() => ({
            y: Math.random() * this.canvas.height,
            speed: Math.random() * 2 + 1
        }));
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = `${this.fontSize}px monospace`;

        this.columns.forEach((column, i) => {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * this.fontSize;

            // Bright green for the head
            this.ctx.fillStyle = '#00ff41';
            this.ctx.fillText(char, x, column.y);

            // Dimmer trail
            this.ctx.fillStyle = 'rgba(0, 200, 50, 0.5)';
            this.ctx.fillText(char, x, column.y - this.fontSize);

            column.y += column.speed * this.fontSize;

            if (column.y > this.canvas.height && Math.random() > 0.98) {
                column.y = 0;
            }
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if canvas elements exist
    const wireframeCanvas = document.getElementById('wireframe-canvas');
    const matrixCanvas = document.getElementById('matrix-canvas');

    if (wireframeCanvas && matrixCanvas) {
        // Initialize canvas animations
        const wireframe = new WireframeRenderer('wireframe-canvas');
        wireframe.animate();

        const matrix = new MatrixRain('matrix-canvas');
        matrix.animate();

        console.log('%c GEOMETRIC BACKGROUND LOADED ', 'background: #000; color: #00ff41; font-size: 12px; padding: 5px;');
    }
});
