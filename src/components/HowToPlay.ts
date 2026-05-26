import { audio } from '../engine/AudioSynthesizer';
import { TUTORIAL_SLIDES } from '../config/tutorial';

let context: {
    onComplete: () => void;
    resizeCabinetLayout: () => void;
    overlayContainer: HTMLElement;
    appContent: HTMLElement;
} | null = null;

// Typewriter & mascot dialogue state for tutorial screen
let tutTypeTimeout: number | null = null;
let tutMascotTimeout: number | null = null;
let tutTypingActive = false;
let tutFullText = "";
let tutTextElement: HTMLElement | null = null;
let tutMascotElement: HTMLImageElement | null = null;

export function setupHowToPlay(ctx: typeof context) {
    context = ctx;
}

export function stopTutorialTypewriter() {
    tutTypingActive = false;
    if (tutTypeTimeout !== null) {
        clearTimeout(tutTypeTimeout);
        tutTypeTimeout = null;
    }
    if (tutMascotTimeout !== null) {
        clearTimeout(tutMascotTimeout);
        tutMascotTimeout = null;
    }
    if (tutMascotElement) {
        tutMascotElement.src = "/billy/1.png"; // Reset to idle frame
    }
}

function startTutorialTypewriter(htmlText: string) {
    stopTutorialTypewriter();
    
    tutFullText = htmlText;
    tutTextElement = document.getElementById('tut-animated-text');
    tutMascotElement = document.getElementById('tut-mascot-img') as HTMLImageElement;
    
    if (!tutTextElement) return;
    
    tutTextElement.innerHTML = "";
    tutTypingActive = true;
    let i = 0;
    
    // Mascot animated speaker loop
    function animateMascot() {
        if (!tutTypingActive || !tutMascotElement) return;
        
        // Randomly play frames 1-4 in random order
        const randFrame = Math.floor(Math.random() * 4) + 1;
        tutMascotElement.src = `/billy/${randFrame}.png`;
        
        // Randomly speed up/slow down: wait between 60ms and 180ms
        const frameDelay = 60 + Math.random() * 120;
        tutMascotTimeout = window.setTimeout(animateMascot, frameDelay);
    }
    
    animateMascot();
    
    function tick() {
        if (!tutTypingActive || !tutTextElement) {
            stopTutorialTypewriter();
            return;
        }
        
        if (i >= htmlText.length) {
            stopTutorialTypewriter();
            return;
        }
        
        let char = htmlText[i];
        
        // Handle HTML tags
        if (char === '<') {
            const closingIndex = htmlText.indexOf('>', i);
            if (closingIndex !== -1) {
                tutTextElement.innerHTML += htmlText.substring(i, closingIndex + 1);
                i = closingIndex + 1;
                // Tick next character immediately
                tick();
                return;
            }
        }
        
        // Handle HTML entities
        if (char === '&') {
            const closingIndex = htmlText.indexOf(';', i);
            if (closingIndex !== -1) {
                tutTextElement.innerHTML += htmlText.substring(i, closingIndex + 1);
                i = closingIndex + 1;
                // Play blip and schedule next tick
                audio.playTalkBlip();
                const delay = 20 + Math.random() * 20;
                tutTypeTimeout = window.setTimeout(tick, delay);
                return;
            }
        }
        
        // Standard character
        tutTextElement.innerHTML += char;
        i++;
        
        // Play speech sound blip (skip spaces for better rhythm)
        if (char !== ' ') {
            audio.playTalkBlip();
        }
        
        // Random typing speed variation slightly (20-40ms)
        const delay = 20 + Math.random() * 20;
        tutTypeTimeout = window.setTimeout(tick, delay);
    }
    
    tick();
}

export function showHowToPlayScreen(stepIndex: number = 0) {
    if (!context) {
        console.error("HowToPlay has not been setup yet. Call setupHowToPlay() first.");
        return;
    }
    
    stopTutorialTypewriter();
    context.appContent.style.opacity = '0';
    context.overlayContainer.classList.add('overlay-fullvp');
    const slide = TUTORIAL_SLIDES[stepIndex];
    const isLast = stepIndex === TUTORIAL_SLIDES.length - 1;

    context.overlayContainer.innerHTML = `
        <div class="screen-overlay" style="justify-content: center; padding: 0.6em 1em; max-height: 100%; overflow-y: auto; background: rgba(9,7,18,0.68); display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
            <h2 style="font-size: 1.1em; margin-bottom: 0.1em; color: var(--color-base); font-family: var(--font-arcade); text-shadow: 2px 2px 0 #000;">HOW TO PLAY</h2>
            <div class="arcade-subtitle" style="font-size: 0.62em; margin-bottom: 0.5em;">Step ${stepIndex + 1} of ${TUTORIAL_SLIDES.length}</div>
            
            <div class="tutorial-container">
                <!-- Left Column: Instructions with Talking Billy Mascot -->
                <div class="tutorial-left-panel" id="tut-left-panel-clickable" style="cursor: pointer; position: relative;">
                    <!-- Title Row -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; pointer-events: none;">
                        <span class="tutorial-inline-icon">${slide.icon}</span>
                        <h3 style="margin: 0; font-family: var(--font-arcade); font-size: 1.12em; color: var(--color-base); text-shadow: 1px 1px 0 #000;">${slide.title}</h3>
                    </div>

                    <!-- Speech Bubble for Text -->
                    <div class="tut-speech-bubble" style="pointer-events: none; width: 100%;">
                        <div id="tut-animated-text" style="font-family: var(--font-ui); font-size: 0.80em; line-height: 1.5; color: rgba(255, 255, 255, 0.96); min-height: 110px;"></div>
                        <!-- Hint to click to skip typing -->
                        <div style="position: absolute; right: 8px; bottom: 4px; font-size: 7px; color: rgba(255,255,255,0.22); text-transform: uppercase; font-family: var(--font-arcade);">Click to fill text</div>
                    </div>

                    <!-- Billy Mascot at the bottom left -->
                    <div style="display: flex; align-items: flex-end; justify-content: flex-start; margin-top: auto; padding-left: 12px; pointer-events: none; gap: 8px;">
                        <img id="tut-mascot-img" src="/billy/1.png" style="width: 120px; height: 120px; image-rendering: pixelated; object-fit: contain; background: transparent; border: none; margin-bottom: -15px;" />
                        <div style="font-family: var(--font-arcade); font-size: 9px; color: var(--color-base); text-transform: uppercase; background: rgba(21,19,26,0.92); padding: 1.5px 6px; border: 1.5px solid var(--border-neon); border-radius: 3px; letter-spacing: 0.5px; margin-bottom: 15px; box-shadow: 0 0 6px rgba(0,210,211,0.25);">BILLY</div>
                    </div>
                </div>

                <!-- Right Column: Mockup/Graphic -->
                <div class="tutorial-right-panel">
                    ${slide.mockupHtml || ''}
                </div>
            </div>

            <!-- Progress dots indicators -->
            <div class="progress-dots">
                ${TUTORIAL_SLIDES.map((_, idx) => `
                    <div class="dot ${idx === stepIndex ? 'active' : ''}"></div>
                `).join('')}
            </div>

            <!-- Navigation buttons -->
            <div class="tutorial-nav">
                ${stepIndex > 0 ? `
                    <button id="btn-tut-back" class="screen-btn" style="background: #57606f; border-color: #2f3542; border-bottom-color: #1e2229; flex: 1;">
                        &lt; BACK
                    </button>
                ` : ''}
                
                <button id="btn-tut-next" class="screen-btn" style="flex: 2;">
                    ${isLast ? 'EMBARK ON PRO SEASON' : 'NEXT &gt;'}
                </button>
            </div>

            <button id="btn-tut-skip" class="skip-btn">
                Skip Tutorial
            </button>
        </div>
    `;

    // Start typewriter effect
    startTutorialTypewriter(slide.text);

    // Click left panel to instantly fill text
    document.getElementById('tut-left-panel-clickable')?.addEventListener('click', () => {
        if (tutTypingActive && tutTextElement) {
            tutTextElement.innerHTML = tutFullText;
            stopTutorialTypewriter();
        }
    });

    // Bind navigation actions
    document.getElementById('btn-tut-back')?.addEventListener('click', () => {
        audio.playTick();
        stopTutorialTypewriter();
        showHowToPlayScreen(stepIndex - 1);
    });

    document.getElementById('btn-tut-next')?.addEventListener('click', () => {
        stopTutorialTypewriter();
        if (isLast) {
            audio.playGate();
            context?.onComplete();
        } else {
            audio.playTick();
            showHowToPlayScreen(stepIndex + 1);
        }
    });

    document.getElementById('btn-tut-skip')?.addEventListener('click', () => {
        audio.playGate();
        stopTutorialTypewriter();
        context?.onComplete();
    });

    // Force layout refresh immediately to guarantee display consistency
    context.resizeCabinetLayout();
}
