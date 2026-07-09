// Wait for the DOM to fully load before running any scripts
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio framework ready for the human-art phase!");
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    // --- Hero Canvas Animation ---
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const heroSection = document.getElementById('hero');
        
        let width, height;
        let particles = [];
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;
        let animationFrameId;
        let isHeroVisible = false;

        function resizeCanvas() {
            width = canvas.width = heroSection.offsetWidth;
            height = canvas.height = heroSection.offsetHeight;
            mouseX = targetMouseX = width / 2;
            mouseY = targetMouseY = height / 2;
        }

        class Particle {
            constructor() {
                // Prefer spawning on the sides (left 30% or right 30%)
                const isLeft = Math.random() < 0.5;
                this.x = isLeft ? Math.random() * (width * 0.3) : width * 0.7 + Math.random() * (width * 0.3);
                this.startY = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.z = Math.random() * 2 + 1; // 3D depth for parallax
                this.targetOpacity = Math.random() * 0.4 + 0.1; // Faint visibility
                this.resetAnimation();
            }

            resetAnimation() {
                this.y = this.startY + 150; // Start positioned at bottom
                this.opacity = 0;
            }

            update() {
                // Slide up and fade in animation
                if (this.y > this.startY) {
                    this.y -= (this.y - this.startY) * 0.05;
                }
                if (this.opacity < this.targetOpacity) {
                    this.opacity += 0.005;
                }

                // Drift smoothly
                this.x += this.vx;
                this.startY += this.vy;

                // Softly repel from the center 40% to keep them mostly on the sides
                if (this.x > width * 0.3 && this.x < width * 0.7) {
                    this.vx += this.x < width / 2 ? -0.01 : 0.01;
                }
                
                // Velocity limit to prevent speeding up too much
                const maxV = 0.5;
                if (this.vx > maxV) this.vx = maxV;
                if (this.vx < -maxV) this.vx = -maxV;

                // Bounce off edges or gently wrap around if stuck
                if (this.x < 0 || this.x > width) this.vx *= -1;
                
                if (this.startY < 0) {
                    this.startY = height + 10;
                    this.resetAnimation(); // reset to fade in again from bottom
                } else if (this.startY > height + 20) {
                    this.vy *= -1;
                }

                // Parallax shift moving slightly away from the mouse
                const dx = (width / 2 - mouseX) / this.z * 0.15;
                const dy = (height / 2 - mouseY) / this.z * 0.15;

                this.drawX = this.x + dx;
                this.drawY = this.y + dy;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.drawX, this.drawY, 2.5 / this.z + 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 200, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            // Dynamically scale number of particles based on screen width, keeping them sparser
            const numParticles = Math.min(Math.floor(width / 25), 60);
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }

        function animateHero() {
            if (!isHeroVisible) return;
            
            // Smooth mouse transition
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;
            
            ctx.clearRect(0, 0, width, height);
            
            // Update and draw particles, connecting them with lines if close
            particles.forEach((p, index) => {
                p.update();
                p.draw();
                
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.drawX - p2.drawX;
                    const dy = p.drawY - p2.drawY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const maxDist = 130;
                    if (dist < maxDist) {
                        // Opacity depends on how close they are
                        const lineOpacity = (1 - dist / maxDist) * p.opacity * p2.opacity * 2.5;
                        ctx.beginPath();
                        ctx.moveTo(p.drawX, p.drawY);
                        ctx.lineTo(p2.drawX, p2.drawY);
                        ctx.strokeStyle = `rgba(150, 180, 255, ${lineOpacity})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            });
            
            animationFrameId = requestAnimationFrame(animateHero);
        }

        // Setup
        resizeCanvas();
        initParticles();
        
        // Mouse tracking for parallax
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            targetMouseX = width / 2;
            targetMouseY = height / 2;
        });
        
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        // Scroll observer for resetting effect
        const heroCanvasObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    isHeroVisible = true;
                    particles.forEach(p => p.resetAnimation());
                    cancelAnimationFrame(animationFrameId);
                    animateHero();
                } else {
                    isHeroVisible = false;
                    cancelAnimationFrame(animationFrameId);
                }
            });
        }, { threshold: 0.1 }); // Reset when mostly out of render
        
        heroCanvasObserver.observe(heroSection);

        // --- Dynamic Background Gradation Rotation ---
        window.addEventListener('scroll', () => {
            if (isHeroVisible) {
                const scrollY = window.scrollY;
                heroSection.style.setProperty('--bg-angle', `${135 + scrollY * 0.05}deg`);
            }
        });
    }

    // --- Text Scramble Effect ---
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    function scrambleText(element, originalText) {
        let iteration = 0;
        let interval = null;
        
        clearInterval(interval);
        
        interval = setInterval(() => {
            element.innerText = originalText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    if (originalText[index] === " ") return " ";
                    return letters[Math.floor(Math.random() * 26)];
                })
                .join("");
            
            if (iteration >= originalText.length) {
                clearInterval(interval);
            }
            
            iteration += 1; // Faster reveal
        }, 15); // Faster intervals
    }

    const heroH1 = document.querySelector('#hero h1');
    const heroQuote = document.querySelector('#hero .quote');
    const h1OriginalText = heroH1.innerText;
    const quoteOriginalText = heroQuote.innerText;

    // Create an observer specific for the scramble effect so it runs once
    const textScrambleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove delay, let it trigger the moment element is visible
                scrambleText(heroH1, h1OriginalText);
                scrambleText(heroQuote, quoteOriginalText);
                textScrambleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        textScrambleObserver.observe(heroContent);
    }
});