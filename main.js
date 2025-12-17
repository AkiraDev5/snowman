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
        
        // Animar brazos - solo las partes alejadas del cuerpo se mueven más
        if (this.type === 'arm') {
            const armOffset = this.armSide === 'left' ? 
                Math.sin(armAnimation) * 20 * this.armDistance : 
                Math.sin(armAnimation + Math.PI) * 20 * this.armDistance;
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

function createCone(cx, cy, cz, radius, height, color, density, type = 'body', horizontal = false) {
    const points = Math.floor(radius * height * density);
    for (let i = 0; i < points; i++) {
        const t = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (1 - t) * Math.sqrt(Math.random());
        
        let x, y, z;
        if (horizontal) {
            // Nariz horizontal (apunta hacia el frente en Z)
            z = cz + t * height;
            x = cx + r * Math.cos(angle);
            y = cy + r * Math.sin(angle);
        } else {
            // Cono vertical (sombrero)
            x = cx + r * Math.cos(angle);
            y = cy - t * height;
            z = cz + r * Math.sin(angle);
        }
        
        particles.push(new Particle(x, y, z, color, type));
    }
}

function createCylinder(cx, cy, cz, radius, height, color, density, type = 'body', armSide = null, armDistance = 0) {
    const points = Math.floor(radius * height * density * 2);
    for (let i = 0; i < points; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * Math.sqrt(Math.random());
        const h = Math.random() * height;
        
        const x = cx + r * Math.cos(angle);
        const y = cy + h;
        const z = cz + r * Math.sin(angle);
        
        particles.push(new Particle(x, y, z, color, type, armSide, armDistance));
    }
}

// Cuerpo (3 esferas) - muchas más partículas para mejor definición
createSphere(0, 120, 0, 70, '#ffffff', 2.5);
createSphere(0, 20, 0, 55, '#ffffff', 2.5);
createSphere(0, -60, 0, 40, '#ffffff', 2.5);

// Sombrero de copa (ala ancha + cilindro alto) - más partículas
createCylinder(0, -102, 0, 48, 4, '#000000', 3, 'hat'); // Ala del sombrero
createCylinder(0, -138, 0, 32, 40, '#1a1a1a', 3, 'hat'); // Parte alta del sombrero
createCylinder(0, -142, 0, 32, 4, '#000000', 3, 'hat'); // Tope del sombrero

// Nariz (horizontal, apuntando hacia adelante desde el borde de la cabeza)
createCone(0, -55, 40, 8, 25, '#ff6600', 2.5, 'nose', true);

// Ojos
createSphere(-18, -65, 38, 5, '#000000', 3);
createSphere(18, -65, 38, 5, '#000000', 3);

// Botones
createSphere(0, 30, 50, 4, '#000000', 3);
createSphere(0, 70, 60, 4, '#000000', 3);
createSphere(0, 110, 65, 4, '#000000', 3);

// Bufanda (alrededor del cuello)
function createScarf() {
    const scarfColor = '#e74c3c';
    const neckY = -25;
    const neckRadius = 42;
    
    // Parte que rodea el cuello - más ancha
    for (let i = 0; i < 1200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = neckRadius + Math.random() * 12;
        const yOffset = Math.random() * 18 - 9;
        
        const x = r * Math.cos(angle);
        const y = neckY + yOffset;
        const z = r * Math.sin(angle);
        
        particles.push(new Particle(x, y, z, scarfColor, 'scarf'));
    }
    
    // Parte colgante (derecha) - más ancha
    for (let i = 0; i < 400; i++) {
        const t = Math.random();
        const width = 10 - t * 3;
        const x = neckRadius + Math.random() * width;
        const y = neckY + 5 + t * 45;
        const z = -8 + Math.random() * width;
        
        particles.push(new Particle(x, y, z, scarfColor, 'scarf'));
    }
}

createScarf();

// Brazos (ramas de madera)
function createArm(side) {
    const woodColor = '#8B4513';
    const baseX = side === 'left' ? -50 : 50;
    const baseY = 0;
    const baseZ = 0;
    
    // Brazo principal
    for (let i = 0; i < 200; i++) {
        const t = Math.random();
        const length = 60;
        const x = baseX + (side === 'left' ? -1 : 1) * t * length;
        const y = baseY - t * 10;
        const z = baseZ + Math.random() * 6 - 3;
        const radius = 3 - t * 1.5;
        
        const angle = Math.random() * Math.PI * 2;
        const r = radius * Math.random();
        
        particles.push(new Particle(
            x + r * Math.cos(angle),
            y,
            z + r * Math.sin(angle),
            woodColor,
            'arm',
            side,
            t
        ));
    }
    
    // Dedos pequeños
    for (let finger = 0; finger < 3; finger++) {
        const fingerAngle = (finger - 1) * 0.5;
        for (let i = 0; i < 30; i++) {
            const t = Math.random();
            const fingerLength = 15;
            const startX = baseX + (side === 'left' ? -1 : 1) * 55;
            const startY = baseY - 8;
            
            const x = startX + (side === 'left' ? -1 : 1) * t * fingerLength * Math.cos(fingerAngle);
            const y = startY + t * fingerLength * Math.sin(fingerAngle);
            const z = baseZ + Math.random() * 3 - 1.5;
            
            particles.push(new Particle(x, y, z, woodColor, 'arm', side, 1.0));
        }
    }
}

createArm('left');
createArm('right');

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    particles.forEach(p => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 1.5;
        const perspective = 600;
        const projScale = perspective / (perspective + p.z);
        
        const screenX = centerX + p.x * scale * projScale;
        const screenY = centerY + p.y * scale * projScale;
        
        const dx = screenX - mouseX;
        const dy = screenY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
            const force = (40 - dist) / 40;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 2;
            p.vy += Math.sin(angle) * force * 2;
        }
    });
});

canvas.addEventListener('mouseleave', () => {
    mouseX = null;
    mouseY = null;
});

    function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rotation += 0.008 * rotationDirection;
    armAnimation += 0.03;

    // Verificar si la nariz está visible
    const noseParticles = particles.filter(p => p.type === 'nose');
    if (noseParticles.length > 0) {
        const noseVisible = noseParticles.some(p => {
            const cosA = Math.cos(rotation);
            const sinA = Math.sin(rotation);
            const rotatedZ = p.baseX * sinA + p.baseZ * cosA;
            return rotatedZ > 0;
        });
        
        // Si la nariz no es visible, invertir dirección
        if (!noseVisible) {
            rotationDirection *= -1;
        }
    }

    particles.forEach(p => {
        p.rotate(rotation);
        p.update();
    });

    particles.sort((a, b) => a.getDepth() - b.getDepth());

    particles.forEach(p => {
        p.draw(1.5);
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

animate();
