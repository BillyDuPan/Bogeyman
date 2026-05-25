export function resizeCabinetLayout() {
    const cabinet = document.getElementById('main-cabinet');
    const wrapper = document.getElementById('game-canvas-container');
    const hudPanel = document.querySelector('.hud-panel') as HTMLElement;
    const appContent = document.getElementById('app-content');
    if (!cabinet || !wrapper || !appContent) return;

    // Always fill the screen
    cabinet.style.position = 'fixed';
    cabinet.style.top = '0';
    cabinet.style.left = '0';
    cabinet.style.width = '100vw';
    cabinet.style.height = '100vh';
    cabinet.style.maxWidth = 'none';
    cabinet.style.border = 'none';
    cabinet.style.borderRadius = '0';
    cabinet.style.margin = '0';
    cabinet.style.boxShadow = 'none';
    cabinet.style.padding = '1.5em';

    const isMobile = window.innerWidth <= 768;
    const sidebarWidth = isMobile ? 180 : Math.max(300, Math.round(window.innerWidth * 0.20));

    // Fix HUD container to the right side of the screen
    const hudContainer = document.getElementById('game-hud-container');
    if (hudContainer) {
        hudContainer.style.position = 'fixed';
        hudContainer.style.top = isMobile ? '12px' : '24px';
        hudContainer.style.right = isMobile ? '12px' : '24px';
        hudContainer.style.bottom = isMobile ? '12px' : '24px';
        hudContainer.style.width = `${sidebarWidth}px`;
        hudContainer.style.height = 'auto';
        hudContainer.style.zIndex = '10';
        hudContainer.style.display = 'flex';
    }

    const playWrapper = appContent.firstElementChild as HTMLElement;
    if (playWrapper) {
        playWrapper.style.display = 'flex';
        playWrapper.style.flexDirection = 'column';
        playWrapper.style.alignItems = 'center';
        playWrapper.style.justifyContent = 'center';
        playWrapper.style.height = '100%';
        playWrapper.style.width = `calc(100% - ${sidebarWidth + (isMobile ? 16 : 32)}px)`;
        playWrapper.style.marginRight = `${sidebarWidth + (isMobile ? 16 : 32)}px`;
    }

    // Compute max bounds with a 0.8x scale multiplier for extra space/margins around play field
    const scaleMultiplier = 0.8;
    const gapAndMargins = isMobile ? 40 : 80;
    const availWidth = (window.innerWidth - sidebarWidth - gapAndMargins) * scaleMultiplier;
    const availHeight = (window.innerHeight - gapAndMargins) * scaleMultiplier;

    let w = availWidth;
    let h = w * 3 / 4;
    if (h > availHeight) {
        h = availHeight;
        w = h * 4 / 3;
    }

    wrapper.style.width = `${Math.round(w)}px`;
    wrapper.style.height = `${Math.round(h)}px`;

    if (hudPanel) {
        hudPanel.style.width = '100%';
        hudPanel.style.height = '100%';
    }

    // Proportional fonts — scale with canvas width, no hard cap for large screens
    const fontSize = Math.max(12, Math.round(w / 26));
    cabinet.style.fontSize = `${fontSize}px`;
}

export function initBackgroundSpiral() {
    const bgCanvas = document.getElementById('bg-spiral-canvas') as HTMLCanvasElement;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d')!;

    function resizeBg() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        resizeCabinetLayout();
    }
    window.addEventListener('resize', resizeBg);
    resizeBg();

    let rotationAngle = 0;
    
    // We can define a set of spiral stars/particles for texture
    const particles: { angle: number; radius: number; size: number; color: string }[] = [];
    // Cozy warm and starry cosmic choices
    const colorChoices = ['#5f27cd', '#341f97', '#d35400', '#f1c40f', '#f39c12', '#706fd3', '#2c3e50'];
    
    for (let i = 0; i < 220; i++) {
        // Spiral arms distribution
        const arm = (i % 3) * (Math.PI * 2 / 3);
        const radius = Math.random() * 550 + 20;
        // Spiral formula: angle is proportional to radius
        const angle = arm + (radius * 0.012) + (Math.random() * 0.25 - 0.125);
        particles.push({
            angle,
            radius,
            size: Math.random() * 3.5 + 1.5,
            color: colorChoices[Math.floor(Math.random() * colorChoices.length)]
        });
    }

    function drawSpiral() {
        rotationAngle += 0.0015;
        
        // Dark cosmic space wash trail
        bgCtx.fillStyle = 'rgba(12, 8, 19, 0.15)'; 
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        const cx = bgCanvas.width / 2;
        const cy = bgCanvas.height / 2;

        bgCtx.save();
        
        // Draw soft glowing core
        const grad = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, 220);
        grad.addColorStop(0, 'rgba(211, 84, 0, 0.12)'); // warm orange core glow
        grad.addColorStop(0.5, 'rgba(95, 39, 205, 0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        bgCtx.fillStyle = grad;
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, 220, 0, Math.PI * 2);
        bgCtx.fill();

        // Draw pixelated star clusters
        particles.forEach(p => {
            const currentAngle = p.angle + rotationAngle;
            const x = cx + Math.cos(currentAngle) * p.radius;
            const y = cy + Math.sin(currentAngle) * p.radius;

            // Draw pixel star
            bgCtx.fillStyle = p.color;
            const flicker = Math.sin(rotationAngle * 15 + p.radius) * 0.35 + 0.65;
            bgCtx.globalAlpha = flicker;
            
            const s = Math.round(p.size);
            bgCtx.fillRect(Math.round(x), Math.round(y), s, s);
        });

        bgCtx.restore();
        requestAnimationFrame(drawSpiral);
    }
    
    requestAnimationFrame(drawSpiral);
}
