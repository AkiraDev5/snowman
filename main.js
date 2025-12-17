const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
let rotation = 0;
let rotationDirection = 1;
let mouseX = null;
let mouseY = null;
let armAnimation = 0;

class Particle {
    constructor(x, y, z, color, type = 'body', armSide = null, armDistance = 0) {
        this.baseX = x;
        this.baseY = y;
        this.baseZ = z;
        this.x = x;
        this.y = y;
        this.z = z;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
        this.color = color;
        this.type = type;
        this.armSide = armSide;
        this.armDistance = armDistance;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
    }

    rotate(angle) {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        this.targetX = this.baseX * cosA - this.baseZ * sinA;
        this.targetZ = this.baseX * sinA + this.baseZ * cosA;

        if (this.type === 'arm') {
            const armOffset = this.armSide === 'left'
                ? Math.sin(armAnimation) * 20 * this.armDistance
                : Math.sin(armAnimation + Math.PI) * 20 * this.armDistance;
            this.targetY = this.baseY + armOffset;
        } else {
            this.targetY = this.baseY;
        }
    }

    update() {
        const returnSpeed = 0.08;

        this.vx += (this.targetX - this.x) * returnSpeed;
        this.vy += (this.targetY - this.y) * returnSpeed;
        this.vz += (this.targetZ - this.z) * returnSpeed;

        this.vx *= 0.85;
        this.vy *= 0.85;
        this.vz *= 0.85;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
    }

    isVisible() {
        if (this.type === 'nose') {
            return this.z > 0;
        }
        return true;
    }

    draw(scale) {
        if (!this.isVisible()) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const perspective = 600;
        const projScale = perspective / (perspective + this.z);

        const screenX = centerX + this.x * scale * projScale;
        const screenY = centerY + this.y * scale * projScale;
        const size = projScale * 1.8;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(size, 0.5), 0, Math.PI * 2);
        ctx.fill();
    }

    getDepth() {
        return this.z;
    }
}

/* ===== Funciones de creación ===== */

function createSphere(cx, cy, cz, radius, color, density, type = 'body') {
    const points = Math.floor(radius * radius * density);
    for (let i = 0; i < points; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * Math.cbrt(Math.random());

        const x = cx + r * Math.sin(phi) * Math.cos(theta);
        const y = cy + r * Math.sin(phi) * Math.sin(theta);
        const z = cz + r * Math.cos(phi);

        particles.push(new Particle(x, y, z, color, type));
    }
}

function createCone(cx, cy, cz, radius, height, color, density, type, horizontal = false) {
    const points = Math.floor(radius * height * density);
    for (let i = 0; i < points; i++) {
        const t = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (1 - t) * Math.sqrt(Math.random());

        let x, y, z;
        if (horizontal) {
            z = cz + t * height;
            x = cx + r * Math.cos(angle);
            y = cy + r * Math.sin(angle);
        } else {
            x = cx + r * Math.cos(angle);
            y = cy - t * height;
            z = cz + r * Math.sin(angle);
        }

        particles.push(new Particle(x, y, z, color, type));
    }
}

/* ===== Construcción del muñeco ===== */

createSphere(0, 120, 0, 70, '#fff', 2.5);
createSphere(0, 20, 0, 55, '#fff', 2.5);
createSphere(0, -60, 0, 40, '#fff', 2.5);

createCone(0, -55, 40, 8, 25, '#ff6600', 2.5, 'nose', true);

/* ===== Animación ===== */

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rotation += 0.008 * rotationDirection;
    armAnimation += 0.03;

    particles.forEach(p => {
        p.rotate(rotation);
        p.update();
    });

    particles.sort((a, b) => a.getDepth() - b.getDepth());
    particles.forEach(p => p.draw(1.5));

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

animate();
