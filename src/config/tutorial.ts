export interface TutorialSlide {
    title: string;
    text: string;
    icon: string;
    showScaleSettings?: boolean;
    mockupHtml?: string;
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
    {
        title: "1. AIM & STRIKE",
        text: "Click and drag anywhere on the field to aim.<br><br>Pull back in the opposite direction and release to strike.<br><br>Sink the ball in the cup with the fewest strokes!",
        icon: "⛳",
        mockupHtml: `
            <div class="aim-demo-container">
                <div class="aim-demo-cup"></div>
                <div class="aim-demo-flag">⛳</div>
                <div class="aim-demo-launch-line"></div>
                <div class="aim-demo-drag-line"></div>
                <div class="aim-demo-ball"></div>
                <div class="aim-demo-cursor">👆</div>
            </div>
        `
    },
    {
        title: "2. MULTIPLIERS",
        text: "Total score = Yards &times; Multiplier.<br><br>Bounce off solid walls to add <strong>+0.5x</strong> multiplier.<br><br>Pass through glowing arches to <strong>double (x2.0)</strong> your multiplier!",
        icon: "✨",
        mockupHtml: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 200px; margin: 1.2em auto; pointer-events: none;">
                <!-- Arena showing diagonal bounce around corner animation -->
                <div class="tut-arena">
                    <div class="tut-bumper"></div>
                    <div class="tut-obstacle"></div>
                    <div class="tut-spark bounce-collision"></div>
                    <div class="tut-ball"></div>
                </div>
                
                <!-- HUD Panel Copy -->
                <div class="hud-panel" style="width: 100%; gap: 8px;">
                    <div class="hud-block">
                        <div class="hud-score-row">
                            <div class="hud-title">Stroke Pts</div>
                            <div class="hud-title">Target Cut</div>
                        </div>
                        <div class="hud-score-row">
                            <div class="hud-value-large base tut-animated-pts" style="margin: 0;"></div>
                            <div class="hud-value-large" style="color: var(--color-gold); margin: 0;">/ 800</div>
                        </div>
                    </div>
                    <div class="hud-block">
                        <div class="hud-title">Lie / Multiplier</div>
                        <div class="tut-animated-status" style="font-family: var(--font-ui); font-size: clamp(11px, 1.3vw, 14px); font-weight: 700; margin-bottom: 4px; height: 1.2em; line-height: 1.2;"></div>
                        <div class="hud-value-large mult tut-animated-mult" style="margin: 0;"></div>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "3. CLUBS & LIE PHYSICS",
        text: "Terrain affects your shot starting multiplier.<br><br>Sand reduces lie to <strong>0.4x</strong>, Rough to <strong>0.6x</strong>.<br><br>Choose Wedges for sand traps, and Putters on the Green!",
        icon: "🏌️",
        mockupHtml: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 240px; margin: 1.2em auto; pointer-events: none;">
                <!-- Club Card -->
                <div class="club-card selected" style="width: 100%; padding: 0.6em 0.8em; border-color: var(--color-base); background: rgba(243, 156, 18, 0.12); display: flex; justify-content: space-between; align-items: center; border-radius: 4px; box-sizing: border-box;">
                    <div class="club-card-left" style="text-align: left; display: flex; flex-direction: column; line-height: 1.2;">
                        <span class="club-card-name" style="font-size: 0.8em; font-weight: bold; color: #ffffff;">Steel Wedge</span>
                        <span class="club-card-desc" style="font-size: 0.7em; color: rgba(255,255,255,0.6);">Bypasses Sand Penalty</span>
                    </div>
                    <span class="club-card-power" style="font-size: 0.55em; font-family: var(--font-arcade); color: var(--color-gold);">0.8x Power</span>
                </div>
                
                <!-- Terrain Demo -->
                <div class="terrain-demo-container">
                    <div class="terrain-demo-lane fairway">
                        <div class="terrain-demo-label">Fairway</div>
                        <div class="terrain-demo-ball fairway-ball"></div>
                    </div>
                    <div class="terrain-demo-lane sand">
                        <div class="terrain-demo-label" style="color: #000; text-shadow: none;">Sand Trap</div>
                        <div class="terrain-demo-ball sand-ball"></div>
                    </div>
                    <div class="terrain-demo-lane green">
                        <div class="terrain-demo-label" style="color: #000; text-shadow: none;">Green</div>
                        <div class="terrain-demo-ball green-ball"></div>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "4. MAP UPGRADES",
        text: "Buy special blocks (Bumpers, Gates, and Terrain patches) in the Locker Room Shop.<br><br>Click an upgrade chip in your sidebar to enter <strong>Build Mode</strong>, then click any valid tile on the field to place it!<br><br>Click placed blocks to reclaim them. All blocks are automatically returned to your bag at the end of each hole.",
        icon: "🔴",
        mockupHtml: `
            <div style="display: flex; gap: 8px; justify-content: center; margin: 1.2em 0; pointer-events: none; width: 100%;">
                <div style="width: 60px; height: 60px; padding: 6px; border: 2px solid var(--color-base); background: rgba(0, 210, 211, 0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 4px;">
                    <span style="font-size: 20px; line-height: 1;">🔴</span>
                    <span style="font-weight: bold; font-size: 9px; color: #fff; margin-top: 4px;">Bumper</span>
                </div>
                <div style="width: 60px; height: 60px; padding: 6px; border: 2px solid rgba(255,255,255,0.1); background: #15131a; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 4px; opacity: 0.6;">
                    <span style="font-size: 20px; line-height: 1;">🟣</span>
                    <span style="font-weight: bold; font-size: 9px; color: #fff; margin-top: 4px;">Gate</span>
                </div>
            </div>
        `
    },
    {
        title: "5. THE MULLIGAN",
        text: "Made a terrible shot? Don't panic!<br><br>Click the Mulligan button on the HUD to rewind time, restore your ball position, and retry the shot.",
        icon: "⏪",
        mockupHtml: `
            <div style="display: flex; justify-content: center; margin: 1.2em 0; pointer-events: none;">
                <button class="action-btn" style="width: 140px; padding: 0.6em; display: flex; flex-direction: column; align-items: center; background: #2d2a36; border: 2px solid var(--color-mult); border-bottom-width: 4px; border-radius: 4px; color: #ffffff; line-height: 1.2;">
                    <span style="font-size: 0.72em; font-weight: bold;">Mulligan</span>
                    <span class="count" style="font-size: 0.45em; font-family: var(--font-arcade); color: var(--color-mult); margin-top: 2px;">Charges: 2</span>
                </button>
            </div>
        `
    },
    {
        title: "6. AUDIO & FULLSCREEN",
        text: "Adjust the volume or toggle fullscreen at any time!<br><br>Click the <strong>Gear Icon (⚙)</strong> in the bottom-left corner to adjust SFX/music, swap soundtracks, or enter full browser view.",
        icon: "⚙️",
        mockupHtml: `
            <div class="hud-block" style="width: 220px; margin: 1.2em auto; padding: 0.8em; text-align: left; font-size: 0.75em; border-color: var(--border-steel); background: #15131a; pointer-events: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 0.9em;">SFX Volume:</span>
                    <input type="range" min="0" max="1" step="0.1" value="0.5" style="width: 70px; accent-color: var(--color-base); height: 6px; cursor: pointer;" />
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9em;">Music Vol:</span>
                    <input type="range" min="0" max="1" step="0.1" value="0.5" style="width: 70px; accent-color: var(--color-mult); height: 6px; cursor: pointer;" />
                </div>
            </div>
        `
    },
    {
        title: "7. TOURNAMENT CUTS",
        text: "Advance through 8 pro tournaments.<br><br>Achieve the target cut score to earn cash rewards and unlock new gear in the Locker Room Shop!",
        icon: "🏆",
        mockupHtml: `
            <div class="hud-block" style="width: 220px; margin: 1.2em auto; padding: 0.8em; font-size: 0.75em; text-align: left; border-color: var(--color-success); background: rgba(39, 174, 96, 0.05); pointer-events: none;">
                <div class="hud-score-row" style="margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 0.9em;">
                    <span>Recap: Payout</span>
                    <span style="color: var(--color-success); font-weight: bold;">+$250 Cash</span>
                </div>
                <div class="hud-score-row" style="display: flex; justify-content: space-between; font-size: 0.9em;">
                    <span>vs Cut Line</span>
                    <span style="color: var(--color-gold);">1,250 / 800 pts</span>
                </div>
            </div>
        `
    }
];
