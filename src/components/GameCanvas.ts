import type { GameState, Vector2D, BallEntity } from '../types/game';
import { TERRAIN_DEFS, TOURNAMENT_DATA } from '../config/terrain';

interface SparkParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
}

interface TextPop {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    maxLife: number;
}

export class GameCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private onLaunch: ((vel: Vector2D) => void) | null = null;
    private onPlaceBlock: ((r: number, c: number) => void) | null = null;
    private hoverCell: { r: number; c: number } | null = null;

    // Drag aiming variables
    private isDragging = false;
    private dragStart: Vector2D = { x: 0, y: 0 };
    private dragCurrent: Vector2D = { x: 0, y: 0 };
    private maxDragDistance = 120; // limits pull power
    private maxLaunchVelocity = 18; // cap speed multiplier

    // Animation / Particle States
    private particles: SparkParticle[] = [];
    private textPops: TextPop[] = [];
    private animationFrameId = 0;
    private frameCount = 0;

    // Screenshake status
    private shakeDuration = 0;
    private shakeMagnitude = 0;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 384;
        this.ctx = this.canvas.getContext('2d')!;
    }

    mount(
        parent: HTMLElement,
        onLaunch: (vel: Vector2D) => void,
        onPlaceBlock: (r: number, c: number) => void
    ) {
        parent.innerHTML = '';
        parent.appendChild(this.canvas);
        this.onLaunch = onLaunch;
        this.onPlaceBlock = onPlaceBlock;

        // Setup interaction listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    unmount() {
        cancelAnimationFrame(this.animationFrameId);
    }

    triggerShake(duration: number, magnitude: number) {
        this.shakeDuration = duration;
        this.shakeMagnitude = magnitude;
    }

    spawnSparks(x: number, y: number, color = '#ff9ff3', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 4.0;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 30,
                maxLife: 30,
                size: 2 + Math.random() * 3
            });
        }
    }

    spawnTextPop(x: number, y: number, text: string, color = '#ffffff') {
        this.textPops.push({
            x,
            y: y - 10,
            text,
            color,
            life: 45,
            maxLife: 45
        });
    }

    private getCanvasMousePos(e: MouseEvent): Vector2D {
        const rect = this.canvas.getBoundingClientRect();
        // Calculate coordinate scale factors
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    private handleMouseDown(e: MouseEvent) {
        const pos = this.getCanvasMousePos(e);

        if (this.activeState && this.activeState.buildModeTileId !== null && this.activeState.gameMode === 'play') {
            const gridX = Math.floor(pos.x / 32);
            const gridY = Math.floor(pos.y / 32);
            if (this.onPlaceBlock) {
                this.onPlaceBlock(gridY, gridX);
            }
            return;
        }
        
        // Can only drag if game is ready
        if (this.isBallReadyToStrike()) {
            this.isDragging = true;
            this.dragStart = pos;
            this.dragCurrent = pos;
        }
    }

    private handleMouseMove(e: MouseEvent) {
        const pos = this.getCanvasMousePos(e);
        if (this.activeState && this.activeState.buildModeTileId !== null && this.activeState.gameMode === 'play') {
            const gridX = Math.floor(pos.x / 32);
            const gridY = Math.floor(pos.y / 32);
            if (gridX >= 0 && gridX < 16 && gridY >= 0 && gridY < 12) {
                this.hoverCell = { r: gridY, c: gridX };
            } else {
                this.hoverCell = null;
            }
        } else {
            this.hoverCell = null;
        }

        if (!this.isDragging) return;
        this.dragCurrent = pos;
    }

    private handleMouseUp(e: MouseEvent) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        const pos = this.getCanvasMousePos(e);
        const dragVector = {
            x: this.dragStart.x - pos.x,
            y: this.dragStart.y - pos.y
        };

        const distance = Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);
        
        if (distance > 5) {
            // Calculate direction and clamp launch magnitude
            const angle = Math.atan2(dragVector.y, dragVector.x);
            const clampDist = Math.min(distance, this.maxDragDistance);
            const intensity = clampDist / this.maxDragDistance;
            
            const launchVel = {
                x: Math.cos(angle) * intensity * this.maxLaunchVelocity,
                y: Math.sin(angle) * intensity * this.maxLaunchVelocity
            };

            if (this.onLaunch) {
                this.onLaunch(launchVel);
            }
        }
    }

    // Reference set from main game loop
    private activeState: GameState | null = null;
    
    private isBallReadyToStrike(): boolean {
        if (!this.activeState) return false;
        return !this.activeState.ball.isMoving && 
               this.activeState.allowedStrokes > 0 && 
               this.activeState.gameMode === 'play';
    }

    render(state: GameState) {
        this.activeState = state;
        this.frameCount++;
        
        this.ctx.save();

        // Apply screen shake
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeDuration > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeMagnitude;
            shakeY = (Math.random() - 0.5) * this.shakeMagnitude;
            this.shakeDuration--;
        }
        this.ctx.translate(shakeX, shakeY);

        // Clear Canvas
        this.ctx.fillStyle = '#0f0c1b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Grid Map (including custom placed blocks)
        let activeMapGrid: number[][] | null = null;
        if (state.gameMode === 'play' && state.scorecardList[state.currentHoleIndex]) {
            const baseMap = TOURNAMENT_DATA[state.currentTournamentIndex].holes[state.currentHoleIndex].map;
            activeMapGrid = baseMap.map(row => [...row]);
            if (state.placedBlocks) {
                for (const b of state.placedBlocks) {
                    activeMapGrid[b.r][b.c] = b.tileId;
                }
            }
        }

        if (activeMapGrid) {
            for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 16; c++) {
                    const tileId = activeMapGrid[r][c];
                    this.drawTile(c * 32, r * 32, tileId);
                }
            }
        } else {
            // Draw default blank green board on intro screens
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Draw Multiplier Gates and Bumpers explicitly with gorgeous glow styling
        if (activeMapGrid) {
            for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 16; c++) {
                    const tileId = activeMapGrid[r][c];
                    if (tileId === 8) { // Bumper
                        this.drawBumperGlow(c * 32 + 16, r * 32 + 16);
                    } else if (tileId === 9) { // Gate
                        this.drawGateGlow(c * 32 + 16, r * 32 + 16);
                    }
                }
            }
        }

        // 2.5. Draw Build Mode Hover Highlight & Preview
        if (state.gameMode === 'play' && state.buildModeTileId !== null && this.hoverCell) {
            const { r, c } = this.hoverCell;
            const x = c * 32;
            const y = r * 32;

            const isAlreadyCustomBlock = state.placedBlocks && state.placedBlocks.some(b => b.r === r && b.c === c);

            if (isAlreadyCustomBlock) {
                // Show delete indicator
                this.ctx.strokeStyle = 'rgba(235, 59, 90, 0.9)'; // Coral red glow
                this.ctx.lineWidth = 2.5;
                this.ctx.strokeRect(x, y, 32, 32);

                this.ctx.strokeStyle = '#eb3b5a';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 8, y + 8);
                this.ctx.lineTo(x + 24, y + 24);
                this.ctx.moveTo(x + 24, y + 8);
                this.ctx.lineTo(x + 8, y + 24);
                this.ctx.stroke();
            } else if (state.blockInventory[state.buildModeTileId] > 0) {
                // Check if placement is valid (e.g. not Tee, Cup, Wall, or Ball)
                const baseMap = TOURNAMENT_DATA[state.currentTournamentIndex].holes[state.currentHoleIndex].map;
                const baseTile = baseMap[r]?.[c];
                const ballGridX = Math.floor(state.ball.pos.x / 32);
                const ballGridY = Math.floor(state.ball.pos.y / 32);
                const isValid = baseTile !== undefined && baseTile !== 0 && baseTile !== 5 && baseTile !== 7 && !(ballGridX === c && ballGridY === r);

                if (isValid) {
                    this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)'; // green outline
                    this.ctx.lineWidth = 2.0;
                    this.ctx.strokeRect(x, y, 32, 32);

                    this.ctx.save();
                    this.ctx.globalAlpha = 0.55;
                    this.drawTile(x, y, state.buildModeTileId);
                    if (state.buildModeTileId === 8) {
                        this.drawBumperGlow(x + 16, y + 16);
                    } else if (state.buildModeTileId === 9) {
                        this.drawGateGlow(x + 16, y + 16);
                    }
                    this.ctx.restore();
                } else {
                    this.ctx.strokeStyle = 'rgba(235, 59, 90, 0.5)'; // red invalid outline
                    this.ctx.lineWidth = 1.5;
                    this.ctx.strokeRect(x, y, 32, 32);
                }
            }
        }

        // 3. Draw Ball Entity
        if (state.gameMode === 'play') {
            this.drawBall(state.ball);
        }

        // 4. Draw Trajectory Line if Aiming
        if (this.isDragging && this.isBallReadyToStrike()) {
            this.drawAimLine(state.ball.pos);
        }

        // 5. Update and Draw Particles
        this.updateAndDrawParticles();

        // 6. Update and Draw Score Floating Text
        this.updateAndDrawTextPops();

        // 7. Draw Wind direction overlay inside canvas if enabled
        if (state.gameMode === 'play' && (Math.abs(state.wind.x) > 0.01 || Math.abs(state.wind.y) > 0.01)) {
            this.drawWindHud(state.wind, state.activeSleeve.windImmunity);
        }

        this.ctx.restore();
    }


    private drawTile(x: number, y: number, tileId: number) {
        const def = TERRAIN_DEFS[tileId] || TERRAIN_DEFS[1];
        
        // Renders visual tile backgrounds
        this.ctx.fillStyle = def.color;
        this.ctx.fillRect(x, y, 32, 32);

        // Add visual texturing based on tile class
        switch (tileId) {
            case 0: // Tee Box
                this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x + 2, y + 2, 28, 28);
                // Draw a small white dot in center
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(x + 16, y + 16, 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 1: // Fairway
                // Draw subtle lawn mower strips
                if (Math.floor(x / 32) % 2 === 0) {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.04)';
                    this.ctx.fillRect(x, y, 32, 32);
                }
                break;

            case 2: // Rough
                // Add grass speckles
                this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
                this.ctx.fillRect(x + 4, y + 6, 2, 4);
                this.ctx.fillRect(x + 18, y + 14, 2, 4);
                this.ctx.fillRect(x + 12, y + 24, 2, 4);
                break;

            case 3: // Sand
                // Grain pixels
                this.ctx.fillStyle = 'rgba(214, 162, 59, 0.4)';
                this.ctx.fillRect(x + 8, y + 8, 2, 2);
                this.ctx.fillRect(x + 24, y + 16, 2, 2);
                this.ctx.fillRect(x + 12, y + 24, 2, 2);
                break;

            case 4: // Water ripples
                const ripple = Math.sin((this.frameCount + x + y) / 15) * 2;
                this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 4, y + 16 + ripple);
                this.ctx.lineTo(x + 16, y + 16 - ripple);
                this.ctx.lineTo(x + 28, y + 16 + ripple);
                this.ctx.stroke();
                break;

            case 5: // Cup
                // Black cup opening with gray border ring
                this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                this.ctx.beginPath();
                this.ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                // Flag pin base
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x + 15, y + 4, 2, 8);
                // Flag triangle (swaying)
                const sway = Math.sin(this.frameCount / 10) * 2;
                this.ctx.fillStyle = '#e84118';
                this.ctx.beginPath();
                this.ctx.moveTo(x + 17, y + 4);
                this.ctx.lineTo(x + 27 + sway, y + 7);
                this.ctx.lineTo(x + 17, y + 10);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 6: // Green
                // Draw sleek smooth lines
                this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
                this.ctx.stroke();
                break;

            case 7: // Brick Boundary Wall
                this.ctx.fillStyle = '#2c3e50'; // slate wall
                this.ctx.fillRect(x, y, 32, 32);
                this.ctx.strokeStyle = '#1e272e';
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeRect(x, y, 32, 32);
                // Draw pixelated brick splits
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + 16);
                this.ctx.lineTo(x + 32, y + 16);
                this.ctx.moveTo(x + 16, y);
                this.ctx.lineTo(x + 16, y + 16);
                this.ctx.moveTo(x + 8, y + 16);
                this.ctx.lineTo(x + 8, y + 32);
                this.ctx.moveTo(x + 24, y + 16);
                this.ctx.lineTo(x + 24, y + 32);
                this.ctx.stroke();
                break;

            case 10: // Cursed Cobblestone
                this.ctx.fillStyle = '#636e72';
                this.ctx.fillRect(x, y, 32, 32);
                // Stone block grid pattern
                this.ctx.strokeStyle = '#2d3436';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x + 2, y + 2, 13, 13);
                this.ctx.strokeRect(x + 17, y + 2, 13, 13);
                this.ctx.strokeRect(x + 2, y + 17, 13, 13);
                this.ctx.strokeRect(x + 17, y + 17, 13, 13);
                // Subtle purple curse glow
                this.ctx.fillStyle = 'rgba(155,89,182,0.12)';
                this.ctx.fillRect(x, y, 32, 32);
                break;

            case 11: // Bone Dust
                this.ctx.fillStyle = '#dfe6e9';
                this.ctx.fillRect(x, y, 32, 32);
                // Scattered bone fragment dots
                this.ctx.fillStyle = 'rgba(180,180,170,0.7)';
                this.ctx.fillRect(x + 5,  y + 8,  3, 1);
                this.ctx.fillRect(x + 20, y + 5,  4, 1);
                this.ctx.fillRect(x + 12, y + 18, 3, 1);
                this.ctx.fillRect(x + 26, y + 22, 3, 1);
                this.ctx.fillRect(x + 8,  y + 26, 4, 1);
                // Eerie pale shimmer
                this.ctx.fillStyle = 'rgba(255,255,255,0.06)';
                this.ctx.fillRect(x, y, 32, 32);
                break;
        }
    }

    private drawBumperGlow(cx: number, cy: number) {
        // Pixel-art bumper face
        const pulse = Math.sin(this.frameCount / 5) * 1.0;
        const r = 12 + pulse;

        // Bold black outer outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.stroke();

        // Bumper body
        this.ctx.fillStyle = '#c0392b'; // crimson red
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner golden ring
        this.ctx.fillStyle = '#f1c40f'; // vintage gold
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Single pixel glint
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(cx - 2, cy - 2, 2, 2);
    }

    private drawGateGlow(cx: number, cy: number) {
        const pulse = this.frameCount % 8;
        
        // Draw wood-style post blocks on left and right
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;

        // Left post (purple wood)
        this.ctx.fillStyle = '#8e44ad';
        this.ctx.fillRect(cx - 14, cy - 14, 6, 28);
        this.ctx.strokeRect(cx - 14, cy - 14, 6, 28);

        // Right post
        this.ctx.fillRect(cx + 8, cy - 14, 6, 28);
        this.ctx.strokeRect(cx + 8, cy - 14, 6, 28);

        // Dotted pixel energy field connecting them
        this.ctx.strokeStyle = '#9b59b6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 8, cy - 12 + pulse);
        this.ctx.lineTo(cx + 8, cy - 12 + pulse);
        this.ctx.moveTo(cx - 8, cy + 12 - pulse);
        this.ctx.lineTo(cx + 8, cy + 12 - pulse);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    private drawBall(ball: BallEntity) {
        this.ctx.save();
        
        // Draw shadow offset
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(ball.pos.x + 2, ball.pos.y + 2, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw ball body
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Stroke thick black pixel outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Simple pixel shine glint
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(ball.pos.x - 2, ball.pos.y - 2, 2, 2);

        this.ctx.restore();
    }

    private drawAimLine(ballPos: Vector2D) {
        const dragVec = {
            x: this.dragStart.x - this.dragCurrent.x,
            y: this.dragStart.y - this.dragCurrent.y
        };

        const distance = Math.sqrt(dragVec.x * dragVec.x + dragVec.y * dragVec.y);
        if (distance < 5) return;

        const clampDist = Math.min(distance, this.maxDragDistance);
        const intensity = clampDist / this.maxDragDistance;
        const angle = Math.atan2(dragVec.y, dragVec.x);

        // Aim indicator in opposite pull vector direction
        const aimAngle = angle;
        const aimLength = clampDist * 0.8;
        
        const endPoint = {
            x: ballPos.x + Math.cos(aimAngle) * aimLength,
            y: ballPos.y + Math.sin(aimAngle) * aimLength
        };

        // Determine pull color based on power intensity
        let pathColor = 'rgba(0, 210, 211, 0.8)'; // Ice blue (Low power)
        if (intensity > 0.75) {
            pathColor = 'rgba(232, 65, 24, 0.9)'; // Neon red (Max power)
        } else if (intensity > 0.4) {
            pathColor = 'rgba(241, 196, 15, 0.85)'; // Yellow (Medium power)
        }

        // Draw dotted indicator line
        this.ctx.save();
        this.ctx.strokeStyle = pathColor;
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(ballPos.x, ballPos.y);
        this.ctx.lineTo(endPoint.x, endPoint.y);
        this.ctx.stroke();

        // Draw small tip dot
        this.ctx.fillStyle = pathColor;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.arc(endPoint.x, endPoint.y, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Renders visual backing pull line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
        this.ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(this.dragStart.x, this.dragStart.y, 3, 0, Math.PI * 2);
        this.ctx.arc(this.dragCurrent.x, this.dragCurrent.y, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    private updateAndDrawParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            const alpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            
            return p.life > 0;
        });
        this.ctx.globalAlpha = 1.0;
    }

    private updateAndDrawTextPops() {
        this.textPops = this.textPops.filter(pop => {
            pop.y -= 0.5; // FLOAT up
            pop.life--;

            const alpha = pop.life / pop.maxLife;
            
            this.ctx.save();
            this.ctx.font = '10px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            
            // Text shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.globalAlpha = alpha;
            this.ctx.fillText(pop.text, pop.x + 1, pop.y + 1);

            // Fore color
            this.ctx.fillStyle = pop.color;
            this.ctx.fillText(pop.text, pop.x, pop.y);
            this.ctx.restore();

            return pop.life > 0;
        });
        this.ctx.globalAlpha = 1.0;
    }

    private drawWindHud(wind: Vector2D, windImmunity: boolean) {
        const cx = 450;
        const cy = 40;
        
        // Background panel box
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(cx - 30, cy - 25, 60, 50);
        this.ctx.strokeRect(cx - 30, cy - 25, 60, 50);

        // Wind speed label text
        const rawSpeed = Math.sqrt(wind.x * wind.x + wind.y * wind.y);
        const windYds = Math.round(rawSpeed * 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '7px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(windImmunity ? 'SPIN RESIST' : `${windYds} MPH`, cx, cy - 12);

        if (!windImmunity) {
            // Draw compass arrow
            const angle = Math.atan2(wind.y, wind.x);
            this.ctx.save();
            this.ctx.translate(cx, cy + 10);
            this.ctx.rotate(angle);
            
            this.ctx.strokeStyle = 'var(--color-base)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-12, 0);
            this.ctx.lineTo(12, 0);
            this.ctx.lineTo(4, -5);
            this.ctx.moveTo(12, 0);
            this.ctx.lineTo(4, 5);
            this.ctx.stroke();
            this.ctx.restore();
        } else {
            // Crossed out wind
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.font = '16px serif';
            this.ctx.fillText('Ø', cx, cy + 14);
        }
    }
}
