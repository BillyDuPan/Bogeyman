import type { BallEntity, StrokeFrame, Vector2D } from '../types/game';
import { TERRAIN_DEFS } from '../config/terrain';
import { audio } from './AudioSynthesizer';

export class PhysicsEngine {
    // Spatial constants
    private gridWidth = 16;
    private gridHeight = 12;
    private tileSize = 32;

    // Trackers for current shot to avoid double collision processing
    private crossedGateCoords: Set<string> = new Set();


    // Restitution parameters
    public baseElasticity = 0.85;

    // References to spawn UI pops
    private onBumperHit: (() => void) | null = null;
    private onGateCrossed: (() => void) | null = null;
    private onWaterSkim: (() => void) | null = null;
    private onWaterSink: (() => void) | null = null;
    private onWallBounce: (() => void) | null = null;

    setCallbacks(callbacks: {
        onBumperHit: () => void;
        onGateCrossed: () => void;
        onWaterSkim: () => void;
        onWaterSink: () => void;
        onWallBounce: () => void;
    }) {
        this.onBumperHit = callbacks.onBumperHit;
        this.onGateCrossed = callbacks.onGateCrossed;
        this.onWaterSkim = callbacks.onWaterSkim;
        this.onWaterSink = callbacks.onWaterSink;
        this.onWallBounce = callbacks.onWallBounce;
    }

    resetShotTracking() {
        this.crossedGateCoords.clear();
    }

    launchBall(ball: BallEntity, velocity: Vector2D) {
        ball.vel = { ...velocity };
        ball.isMoving = true;
        this.resetShotTracking();
    }

    updateFrame(
        ball: BallEntity,
        frame: StrokeFrame,
        mapGrid: number[][],
        elasticity: number,
        wind: Vector2D,
        windImmunity: boolean
    ) {
        if (!ball.isMoving) return;

        // 1. Apply Wind Drift (once per frame tick)
        if (!windImmunity && (Math.abs(wind.x) > 0.001 || Math.abs(wind.y) > 0.001)) {
            ball.vel.x += wind.x * 0.004;
            ball.vel.y += wind.y * 0.004;
        }

        // 2. Calculate Sub-steps to prevent wall tunneling at high velocities
        const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
        const maxStepSize = 3.0; // move max 3 pixels per step (well below ball radius 4.5 and wall tile size 32)
        const numSteps = Math.ceil(speed / maxStepSize);

        for (let step = 0; step < numSteps; step++) {
            // Apply a fraction of the velocity this sub-step
            const stepVx = ball.vel.x / numSteps;
            const stepVy = ball.vel.y / numSteps;

            ball.pos.x += stepVx;
            ball.pos.y += stepVy;

            // Accumulate yardage fractionally
            const stepDist = Math.sqrt(stepVx * stepVx + stepVy * stepVy);
            frame.accumulatedBaseYards += stepDist * 0.1;

            // 3. Canvas Outer boundary wall collisions
            this.handleCanvasBoundsCollisions(ball, frame, elasticity);

            // 4. Grid Tile Collisions (Wall bounce, Bumper hit, Gate crossover)
            this.handleTileCollisions(ball, frame, mapGrid, elasticity);

            // If a collision stopped the ball (e.g. water sink), break early
            if (!ball.isMoving) {
                break;
            }
        }

        // 5. Update Underlying Tile ID & Friction decay (once per frame tick, after all sub-steps settle)
        const gridX = Math.floor(ball.pos.x / this.tileSize);
        const gridY = Math.floor(ball.pos.y / this.tileSize);

        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            const tileId = mapGrid[gridY][gridX];
            ball.currentTileId = tileId;

            const def = TERRAIN_DEFS[tileId];
            if (def) {
                // Apply friction
                let activeFriction = def.friction;
                
                // If on Water hazard (ID 4) after sub-steps
                if (tileId === 4) {
                    const velocityMag = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
                    if (velocityMag > 12.0) {
                        // Skims across surface!
                        activeFriction = 0.90; // moderate drag during skim
                        
                        const skimCoord = `${gridX},${gridY}`;
                        if (!this.crossedGateCoords.has(skimCoord)) {
                            this.crossedGateCoords.add(skimCoord);
                            frame.waterSkimCount++;
                            frame.accumulatedMultiplier += 1.5;
                            
                            audio.playWaterSkim();
                            if (this.onWaterSkim) this.onWaterSkim();
                        }
                    } else {
                        // Sinks immediately!
                        ball.vel = { x: 0, y: 0 };
                        ball.isMoving = false;
                        
                        audio.playWaterSink();
                        if (this.onWaterSink) this.onWaterSink();
                    }
                }

                // Decay velocity
                ball.vel.x *= activeFriction;
                ball.vel.y *= activeFriction;
            }
        } else {
            // Out of bounds drop
            ball.vel = { x: 0, y: 0 };
            ball.isMoving = false;
            ball.currentTileId = 4;
            audio.playWaterSink();
            if (this.onWaterSink) this.onWaterSink();
        }

        // 6. Absolute Stop Constraint check
        const postStepSpeed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
        if (postStepSpeed < 0.15 && ball.isMoving) {
            ball.vel = { x: 0, y: 0 };
            ball.isMoving = false;
        }
    }

    private handleCanvasBoundsCollisions(ball: BallEntity, frame: StrokeFrame, elasticity: number) {
        let hit = false;
        if (ball.pos.x - ball.radius < 0) {
            ball.pos.x = ball.radius;
            ball.vel.x = -ball.vel.x * elasticity;
            hit = true;
        } else if (ball.pos.x + ball.radius > 512) {
            ball.pos.x = 512 - ball.radius;
            ball.vel.x = -ball.vel.x * elasticity;
            hit = true;
        }

        if (ball.pos.y - ball.radius < 0) {
            ball.pos.y = ball.radius;
            ball.vel.y = -ball.vel.y * elasticity;
            hit = true;
        } else if (ball.pos.y + ball.radius > 384) {
            ball.pos.y = 384 - ball.radius;
            ball.vel.y = -ball.vel.y * elasticity;
            hit = true;
        }

        if (hit) {
            frame.bankShotCount++;
            frame.accumulatedMultiplier += 0.5;
            frame.collisionLog.push(`WallBounce_${frame.bankShotCount}`);
            audio.playBounce();
            if (this.onWallBounce) this.onWallBounce();
        }
    }

    private handleTileCollisions(ball: BallEntity, frame: StrokeFrame, mapGrid: number[][], elasticity: number) {
        // Scan surrounding tiles (current, above, below, left, right)
        const currentGridX = Math.floor(ball.pos.x / this.tileSize);
        const currentGridY = Math.floor(ball.pos.y / this.tileSize);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const gx = currentGridX + dx;
                const gy = currentGridY + dy;

                if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) continue;

                const tileId = mapGrid[gy][gx];
                
                // Solid Boundary Wall Collision (ID 7)
                if (tileId === 7) {
                    this.resolveSolidTileCollision(ball, frame, gx, gy, elasticity);
                }

                // Diagonal Wall Collisions (IDs 12-15)
                if (tileId >= 12 && tileId <= 15) {
                    this.resolveDiagonalTileCollision(ball, frame, gx, gy, tileId, elasticity);
                }

                // Arcade Bumper (ID 8) - circular physics reflection
                if (tileId === 8) {
                    this.resolveCircularBumperCollision(ball, frame, gx, gy);
                }

                // Neon Multiplier Gate (ID 9) - non-solid sensor
                if (tileId === 9) {
                    this.resolveGateCrossover(ball, frame, gx, gy);
                }
            }
        }
    }

    private resolveSolidTileCollision(ball: BallEntity, frame: StrokeFrame, gx: number, gy: number, elasticity: number) {
        const tileLeft = gx * this.tileSize;
        const tileRight = (gx + 1) * this.tileSize;
        const tileTop = gy * this.tileSize;
        const tileBottom = (gy + 1) * this.tileSize;

        // Closest point on AABB to circle center
        const cx = Math.max(tileLeft, Math.min(ball.pos.x, tileRight));
        const cy = Math.max(tileTop, Math.min(ball.pos.y, tileBottom));

        const diffX = ball.pos.x - cx;
        const diffY = ball.pos.y - cy;
        const distSq = diffX * diffX + diffY * diffY;

        if (distSq < ball.radius * ball.radius) {
            // Overlap detected! Find resolution normal
            const dist = Math.sqrt(distSq);
            let normalX = 0;
            let normalY = 0;

            if (dist === 0) {
                // Ball is directly centered in tile boundary, push out vertically
                normalY = -1;
            } else {
                normalX = diffX / dist;
                normalY = diffY / dist;
            }

            // Adjust ball outside wall bounds
            const overlap = ball.radius - dist;
            ball.pos.x += normalX * overlap;
            ball.pos.y += normalY * overlap;

            // Reflect velocity based on normal
            // Determine vertical vs horizontal bounce face
            if (Math.abs(normalX) > Math.abs(normalY)) {
                ball.vel.x = -ball.vel.x * elasticity;
            } else {
                ball.vel.y = -ball.vel.y * elasticity;
            }

            frame.bankShotCount++;
            frame.accumulatedMultiplier += 0.5;
            frame.collisionLog.push(`TileWall_${gx},${gy}`);
            
            audio.playBounce();
            if (this.onWallBounce) this.onWallBounce();
        }
    }

    private resolveDiagonalTileCollision(ball: BallEntity, frame: StrokeFrame, gx: number, gy: number, tileId: number, elasticity: number) {
        const L = gx * this.tileSize;
        const T = gy * this.tileSize;
        const S = this.tileSize;

        let nx = 0, ny = 0, dist = 0;

        const relX = ball.pos.x - L;
        const relY = ball.pos.y - T;

        if (tileId === 12) { // TL
            nx = 1; ny = 1;
            dist = (relX + relY - S) / Math.SQRT2;
        } else if (tileId === 13) { // TR
            nx = -1; ny = 1;
            dist = (relY - relX) / Math.SQRT2;
        } else if (tileId === 14) { // BL
            nx = 1; ny = -1;
            dist = (relX - relY) / Math.SQRT2;
        } else if (tileId === 15) { // BR
            nx = -1; ny = -1;
            dist = (S - relX - relY) / Math.SQRT2;
        }

        const invSqrt2 = 1 / Math.SQRT2;
        nx *= invSqrt2;
        ny *= invSqrt2;

        if (dist < ball.radius && dist > -ball.radius * 2) {
            // Check bounding box approximately to avoid extending the diagonal infinitely
            if (relX > -ball.radius && relX < S + ball.radius && relY > -ball.radius && relY < S + ball.radius) {
                const overlap = ball.radius - dist;
                ball.pos.x += nx * overlap;
                ball.pos.y += ny * overlap;

                const dot = ball.vel.x * nx + ball.vel.y * ny;
                if (dot < 0) {
                    ball.vel.x = (ball.vel.x - 2 * dot * nx) * elasticity;
                    ball.vel.y = (ball.vel.y - 2 * dot * ny) * elasticity;
                }

                frame.bankShotCount++;
                frame.accumulatedMultiplier += 0.5;
                frame.collisionLog.push(`DiagWall_${gx},${gy}`);
                
                audio.playBounce();
                if (this.onWallBounce) this.onWallBounce();
            }
        }
    }

    private resolveCircularBumperCollision(ball: BallEntity, frame: StrokeFrame, gx: number, gy: number) {
        // Bumper is centered in the tile space
        const bumperCx = gx * this.tileSize + this.tileSize / 2;
        const bumperCy = gy * this.tileSize + this.tileSize / 2;
        const bumperRadius = 11; // bumper fit radius

        const diffX = ball.pos.x - bumperCx;
        const diffY = ball.pos.y - bumperCy;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist < ball.radius + bumperRadius) {
            const normalX = diffX / dist;
            const normalY = diffY / dist;

            // Push ball outside bumper perimeter bounds
            const overlap = (ball.radius + bumperRadius) - dist;
            ball.pos.x += normalX * overlap;
            ball.pos.y += normalY * overlap;

            // Reflect velocity with 20% speed injection multiplier
            const dot = ball.vel.x * normalX + ball.vel.y * normalY;
            if (dot < 0) {
                const bounceElasticity = 1.25; // boost bumper bounce speed
                ball.vel.x = (ball.vel.x - 2 * dot * normalX) * bounceElasticity;
                ball.vel.y = (ball.vel.y - 2 * dot * normalY) * bounceElasticity;
            }

            // Bumper Bonuses: +150 yards flat, +0.5x multiplier
            frame.bumperHitCount++;
            frame.accumulatedBaseYards += 150;
            frame.accumulatedMultiplier += 0.5;
            frame.collisionLog.push(`Bumper_${gx},${gy}`);

            audio.playBumper();
            if (this.onBumperHit) this.onBumperHit();
        }
    }

    private resolveGateCrossover(ball: BallEntity, frame: StrokeFrame, gx: number, gy: number) {
        const gateKey = `${gx},${gy}`;
        
        // Sensor check: check overlap between ball circle and gate center
        const gateCx = gx * this.tileSize + this.tileSize / 2;
        const gateCy = gy * this.tileSize + this.tileSize / 2;
        
        const diffX = ball.pos.x - gateCx;
        const diffY = ball.pos.y - gateCy;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist < ball.radius + 12) { // trigger window
            if (!this.crossedGateCoords.has(gateKey)) {
                this.crossedGateCoords.add(gateKey);
                
                // Double multiplier stack!
                frame.gateCrossedCount++;
                frame.accumulatedMultiplier *= 2.0;
                frame.collisionLog.push(`Gate_${gx},${gy}`);

                audio.playGate();
                if (this.onGateCrossed) this.onGateCrossed();
            }
        }
    }
}
