import { GameCanvas } from './GameCanvas';
import { TOURNAMENT_DATA, CHAR_MAP, TERRAIN_DEFS } from '../config/terrain';
import { DataEngine } from '../engine/DataEngine';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { EvaluationEngine } from '../engine/EvaluationEngine';
import { DEFAULT_CLUBS, DRAFTABLE_CLUBS, DRAFTABLE_SLEEVES } from '../config/items';

export function setupMapMaker(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentTourIndex = 0;
    let currentHoleIndex = 0;
    let activeTileId = 1; // Default to Fairway
    let isDrawing = false;

    const mockState: any = {
        gameMode: 'play',
        currentTournamentIndex: currentTourIndex,
        currentHoleIndex: currentHoleIndex,
        scorecardList: Array(50).fill({}),
        ball: { 
            pos: { x: -100, y: -100 }, 
            velocity: { x: 0, y: 0 }, 
            isMoving: false, 
            inCup: false, 
            radius: 4 
        }, // Hide ball safely
        wind: { x: 0, y: 0 },
        activeSleeve: { windImmunity: false },
        placedBlocks: [],
        blockInventory: {},
        buildModeTileId: null,
    };

    const canvas = new GameCanvas();

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; font-family: var(--font-arcade); font-size: 14px;">
            <!-- Header -->
            <div style="background: #111; border-bottom: 2px solid #444; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 1.5em; color: #f1c40f;">BOGEYMAN MAP MAKER</div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="mm-tour-select" style="background: #222; color: #fff; border: 1px solid #444; padding: 5px;"></select>
                    <button id="mm-btn-prev" style="background: #333; color: #fff; border: 1px solid #555; padding: 5px 10px; cursor: pointer;">&lt;</button>
                    <select id="mm-hole-select" style="background: #222; color: #fff; border: 1px solid #444; padding: 5px; min-width: 150px;"></select>
                    <button id="mm-btn-next" style="background: #333; color: #fff; border: 1px solid #555; padding: 5px 10px; cursor: pointer;">&gt;</button>
                </div>
            </div>

            <!-- Main Body -->
            <div style="display: flex; flex: 1; overflow: hidden;">
                <!-- Tools Panel -->
                <div style="width: 200px; background: #1a1a1a; border-right: 2px solid #444; padding: 10px; overflow-y: auto;">
                    <div style="color: #aaa; margin-bottom: 10px;">TERRAIN TILES</div>
                    <div id="mm-palette" style="display: flex; flex-direction: column; gap: 5px;"></div>
                </div>

                <!-- Canvas Area -->
                <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #000;">
                    <div id="mm-canvas-mount" style="box-shadow: 0 0 20px rgba(0,0,0,0.5); border: 2px solid #333; position: relative;"></div>
                </div>

                <!-- Right Panel -->
                <div style="width: 320px; background: #1a1a1a; border-left: 2px solid #444; display: flex; flex-direction: column;">
                    <button id="mm-btn-test" style="width: 100%; padding: 12px; background: #9b59b6; color: #fff; border: none; border-bottom: 2px solid #8e44ad; cursor: pointer; font-family: var(--font-arcade); font-size: 1.1em;">TEST MAP</button>
                    <!-- Tabs -->
                    <div style="display: flex; border-bottom: 2px solid #333;">
                        <button id="mm-tab-inspector" style="flex: 1; padding: 10px; background: #222; color: #fff; border: none; border-right: 1px solid #333; cursor: pointer; font-family: var(--font-arcade);">INSPECTOR</button>
                        <button id="mm-tab-export" style="flex: 1; padding: 10px; background: #111; color: #aaa; border: none; cursor: pointer; font-family: var(--font-arcade);">EXPORT DB</button>
                    </div>

                    <!-- Inspector View -->
                    <div id="mm-view-inspector" style="flex: 1; padding: 10px; display: flex; flex-direction: column; overflow-y: auto;">
                        <div style="color: #f1c40f; margin-bottom: 5px;">TOURNAMENT</div>
                        <label style="display:block; margin-bottom: 5px; font-size: 0.8em; color: #aaa;">NAME: <input id="mm-inp-tour-name" style="width:100%; box-sizing: border-box; background:#111; color:#fff; border:1px solid #444; padding:4px;"/></label>
                        <label style="display:block; margin-bottom: 5px; font-size: 0.8em; color: #aaa;">CUT TARGET: <input type="number" id="mm-inp-tour-cut" style="width:100%; box-sizing: border-box; background:#111; color:#fff; border:1px solid #444; padding:4px;"/></label>
                        <label style="display:block; margin-bottom: 15px; font-size: 0.8em; color: #aaa;">REWARD CASH: <input type="number" id="mm-inp-tour-cash" style="width:100%; box-sizing: border-box; background:#111; color:#fff; border:1px solid #444; padding:4px;"/></label>
                        
                        <div style="color: #2ecc71; margin-bottom: 5px;">HOLE</div>
                        <label style="display:block; margin-bottom: 5px; font-size: 0.8em; color: #aaa;">NAME: <input id="mm-inp-hole-name" style="width:100%; box-sizing: border-box; background:#111; color:#fff; border:1px solid #444; padding:4px;"/></label>
                        <label style="display:block; margin-bottom: 15px; font-size: 0.8em; color: #aaa;">PAR: <input type="number" id="mm-inp-hole-par" style="width:100%; box-sizing: border-box; background:#111; color:#fff; border:1px solid #444; padding:4px;"/></label>
                        
                        <div style="color: #3498db; margin-bottom: 5px;">ASCII MAP PREVIEW</div>
                        <textarea id="mm-preview-text" style="flex: 1; background: #111; color: #3498db; border: 1px solid #333; padding: 10px; font-family: monospace; white-space: pre; resize: none; min-height: 200px; line-height:1.2;" readonly></textarea>
                    </div>

                    <!-- Test View -->
                    <div id="mm-view-test" style="flex: 1; padding: 10px; display: none; flex-direction: column;">
                        <div style="color: #9b59b6; margin-bottom: 5px;">TEST LOADOUT</div>
                        <label style="display:block; margin-bottom: 5px; font-size: 0.8em; color: #aaa;">CLUB <select id="mm-test-club" style="margin-bottom: 10px; width: 100%; background: #111; color: #fff; border: 1px solid #444; padding: 5px;"></select></label>
                        <label style="display:block; margin-bottom: 5px; font-size: 0.8em; color: #aaa;">BALL SLEEVE <select id="mm-test-sleeve" style="margin-bottom: 10px; width: 100%; background: #111; color: #fff; border: 1px solid #444; padding: 5px;"></select></label>
                        <div style="color: #f1c40f; margin-top: 20px;">LAST SHOT RESULT</div>
                        <div id="mm-test-result" style="background: #111; color: #fff; border: 1px solid #333; padding: 10px; font-family: monospace; min-height: 100px;">
                            No shot yet.
                        </div>
                    </div>

                    <!-- Export View -->
                    <div id="mm-view-export" style="flex: 1; padding: 10px; display: none; flex-direction: column;">
                        <button id="mm-btn-export" style="background: #2ecc71; color: #000; border: none; padding: 8px; cursor: pointer; margin-bottom: 10px; font-family: var(--font-arcade);">GENERATE FULL DB</button>
                        <textarea id="mm-export-text" style="flex: 1; background: #111; color: #2ecc71; border: 1px solid #333; padding: 10px; font-family: monospace; white-space: pre; resize: none;" readonly></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;

    const tourSelect = document.getElementById('mm-tour-select') as HTMLSelectElement;
    const holeSelect = document.getElementById('mm-hole-select') as HTMLSelectElement;
    const paletteDiv = document.getElementById('mm-palette') as HTMLDivElement;
    const canvasMount = document.getElementById('mm-canvas-mount') as HTMLDivElement;
    const exportBtn = document.getElementById('mm-btn-export') as HTMLButtonElement;
    const exportText = document.getElementById('mm-export-text') as HTMLTextAreaElement;
    const btnPrev = document.getElementById('mm-btn-prev') as HTMLButtonElement;
    const btnNext = document.getElementById('mm-btn-next') as HTMLButtonElement;

    // Tabs
    const tabInspector = document.getElementById('mm-tab-inspector') as HTMLButtonElement;
    const tabExport = document.getElementById('mm-tab-export') as HTMLButtonElement;
    const viewInspector = document.getElementById('mm-view-inspector') as HTMLDivElement;
    const viewExport = document.getElementById('mm-view-export') as HTMLDivElement;
    const viewTest = document.getElementById('mm-view-test') as HTMLDivElement;

    // Test UI
    const testClubSelect = document.getElementById('mm-test-club') as HTMLSelectElement;
    const testSleeveSelect = document.getElementById('mm-test-sleeve') as HTMLSelectElement;
    const testResult = document.getElementById('mm-test-result') as HTMLDivElement;

    [...DEFAULT_CLUBS, ...DRAFTABLE_CLUBS].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = `${c.name} (x${c.powerScalar})`;
        testClubSelect.appendChild(opt);
    });
    DRAFTABLE_SLEEVES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = `${s.name} (Elast: ${s.elasticity})`;
        testSleeveSelect.appendChild(opt);
    });

    // Inspector Inputs
    const inpTourName = document.getElementById('mm-inp-tour-name') as HTMLInputElement;
    const inpTourCut = document.getElementById('mm-inp-tour-cut') as HTMLInputElement;
    const inpTourCash = document.getElementById('mm-inp-tour-cash') as HTMLInputElement;
    const inpHoleName = document.getElementById('mm-inp-hole-name') as HTMLInputElement;
    const inpHolePar = document.getElementById('mm-inp-hole-par') as HTMLInputElement;
    const previewText = document.getElementById('mm-preview-text') as HTMLTextAreaElement;

    // Populate Tournament Select
    TOURNAMENT_DATA.forEach((tour, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = tour.name;
        tourSelect.appendChild(opt);
    });

    const updateHoleSelect = () => {
        holeSelect.innerHTML = '';
        TOURNAMENT_DATA[currentTourIndex].holes.forEach((hole, idx) => {
            const opt = document.createElement('option');
            opt.value = idx.toString();
            opt.textContent = "Hole " + (idx + 1) + ": " + hole.name;
            holeSelect.appendChild(opt);
        });
        holeSelect.value = currentHoleIndex.toString();
    };

    const reverseCharMap: Record<number, string> = {};
    Object.entries(CHAR_MAP).forEach(([char, id]) => {
        reverseCharMap[id] = char;
    });

    const updateASCII = () => {
        const hole = TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex];
        let out = '';
        for (let r = 0; r < 12; r++) {
            for (let c = 0; c < 16; c++) {
                const id = hole.map[r][c];
                out += reverseCharMap[id] || 'W';
            }
            out += '\n';
        }
        previewText.value = out;
    };

    const updateInspector = () => {
        const tour = TOURNAMENT_DATA[currentTourIndex];
        const hole = tour.holes[currentHoleIndex];
        inpTourName.value = tour.name;
        inpTourCut.value = tour.cutTarget.toString();
        inpTourCash.value = tour.rewardCash.toString();
        inpHoleName.value = hole.name;
        inpHolePar.value = hole.par.toString();
        updateASCII();
    };

    const changeHole = (delta: number) => {
        const max = TOURNAMENT_DATA[currentTourIndex].holes.length - 1;
        currentHoleIndex += delta;
        if (currentHoleIndex < 0) {
            currentTourIndex = (currentTourIndex - 1 + TOURNAMENT_DATA.length) % TOURNAMENT_DATA.length;
            currentHoleIndex = TOURNAMENT_DATA[currentTourIndex].holes.length - 1;
            tourSelect.value = currentTourIndex.toString();
            updateHoleSelect();
        } else if (currentHoleIndex > max) {
            currentTourIndex = (currentTourIndex + 1) % TOURNAMENT_DATA.length;
            currentHoleIndex = 0;
            tourSelect.value = currentTourIndex.toString();
            updateHoleSelect();
        }
        holeSelect.value = currentHoleIndex.toString();
        mockState.currentTournamentIndex = currentTourIndex;
        mockState.currentHoleIndex = currentHoleIndex;
    };

    btnPrev.addEventListener('click', () => changeHole(-1));
    btnNext.addEventListener('click', () => changeHole(1));

    // ...skip down to existing wiring...

    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
    overlay.style.zIndex = '10';

    const mountCanvas = () => {
        mockState.currentTournamentIndex = currentTourIndex;
        mockState.currentHoleIndex = currentHoleIndex;
        canvas.mount(canvasMount, () => {}, () => {});
        canvasMount.appendChild(overlay);
    };
    const updatePalette = () => {
        paletteDiv.innerHTML = '';
        Object.values(TERRAIN_DEFS).forEach(tile => {
            const btn = document.createElement('button');
            btn.style.width = '100%';
            btn.style.padding = '8px';
            btn.style.textAlign = 'left';
            btn.style.background = activeTileId === tile.id ? '#2ecc71' : '#222';
            btn.style.color = activeTileId === tile.id ? '#000' : '#fff';
            btn.style.border = '1px solid #444';
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '8px';

            const swatch = document.createElement('div');
            swatch.style.width = '16px';
            swatch.style.height = '16px';
            swatch.style.background = tile.color;
            swatch.style.border = '1px solid #000';

            btn.appendChild(swatch);
            btn.appendChild(document.createTextNode(tile.name));

            btn.onclick = () => {
                activeTileId = tile.id;
                updatePalette();
            };
            paletteDiv.appendChild(btn);
        });
    };

    const paintCell = (e: MouseEvent) => {
        const rect = overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const c = Math.floor(x / 32);
        const r = Math.floor(y / 32);

        if (r >= 0 && r < 12 && c >= 0 && c < 16) {
            TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex].map[r][c] = activeTileId;
            updateASCII();
        }
    };

    overlay.addEventListener('mousedown', (e) => {
        isDrawing = true;
        paintCell(e);
    });
    overlay.addEventListener('mousemove', (e) => {
        if (isDrawing) paintCell(e);
    });
    window.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    // Export Panel
    exportBtn.addEventListener('click', () => {
        let out = "export const TOURNAMENT_DATA: TournamentData[] = [\n";
        TOURNAMENT_DATA.forEach(tour => {
            out += "    {\n        name: '" + tour.name + "',\n        cutTarget: " + tour.cutTarget + ",\n        rewardCash: " + tour.rewardCash + ",\n        holes: [\n";
            tour.holes.forEach(hole => {
                out += "            {\n                name: '" + hole.name + "',\n                par: " + hole.par + ",\n                map: parseMap(`\n";
                for (let r = 0; r < 12; r++) {
                    out += "                    ";
                    for (let c = 0; c < 16; c++) {
                        const id = hole.map[r][c];
                        out += reverseCharMap[id] || 'W';
                    }
                    out += "\n";
                }
                out += "                `)\n            },\n";
            });
            out += "        ]\n    },\n";
        });
        out += "];\n";
        exportText.value = out;
        exportText.select();
        document.execCommand('copy');
    });

    const btnTestMap = document.getElementById('mm-btn-test') as HTMLButtonElement;

    // Map Testing Logic
    let isTesting = false;
    let testData: DataEngine | null = null;
    let testPhysics: PhysicsEngine | null = null;
    let testEval: EvaluationEngine | null = null;

    btnTestMap.addEventListener('click', () => {
        if (!isTesting) {
            // Validate map first
            const currentMap = TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex].map;
            let teeCount = 0;
            let cupCount = 0;
            for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 16; c++) {
                    if (currentMap[r][c] === 0) teeCount++;
                    if (currentMap[r][c] === 5) cupCount++;
                }
            }
            if (teeCount !== 1 || cupCount !== 1) {
                const prevText = btnTestMap.textContent;
                btnTestMap.textContent = `NEED 1 TEE, 1 CUP (Has ${teeCount}T, ${cupCount}C)`;
                btnTestMap.style.background = "#e74c3c";
                setTimeout(() => {
                    btnTestMap.textContent = prevText;
                    btnTestMap.style.background = "#9b59b6";
                }, 3000);
                return;
            }
        }

        isTesting = !isTesting;
        testResult.innerHTML = "No shot yet.";
        if (isTesting) {
            btnTestMap.textContent = "STOP TESTING";
            btnTestMap.style.background = "#e74c3c";
            btnTestMap.style.borderBottom = "2px solid #c0392b";
            
            tabInspector.style.background = '#111'; tabInspector.style.color = '#aaa';
            tabExport.style.background = '#111'; tabExport.style.color = '#aaa';
            viewInspector.style.display = 'none';
            viewExport.style.display = 'none';
            viewTest.style.display = 'flex';
            
            testData = new DataEngine();
            testPhysics = new PhysicsEngine();
            testEval = new EvaluationEngine();

            testData.initializeTournament(currentTourIndex);
            testData.loadHole(currentHoleIndex);
            testData.setGameMode('play');

            const updateTestSleeve = () => {
                if (testData) {
                    const slId = testSleeveSelect.value;
                    const sleeve = DRAFTABLE_SLEEVES.find(sl => sl.id === slId);
                    if (sleeve) testData.getState().activeSleeve = sleeve;
                }
            };
            testSleeveSelect.onchange = updateTestSleeve;
            updateTestSleeve();
            
            canvas.mount(canvasMount, (vel) => {
                const ts = testData!.getState();
                if (ts.gameMode !== 'play' || ts.ball.isMoving) return;
                testData!.saveMulliganSnapshot();
                ts.currentFrame = testEval!.initializeStrokeFrame(ts);
                
                const clubId = testClubSelect.value;
                const club = [...DEFAULT_CLUBS, ...DRAFTABLE_CLUBS].find(c => c.id === clubId);
                const power = club ? club.powerScalar : 1.0;

                testPhysics!.launchBall(ts.ball, { x: vel.x * power, y: vel.y * power });
                testResult.innerHTML = "Computing physics...";
            }, () => {});
            
            canvasMount.appendChild(overlay);
            overlay.style.pointerEvents = 'none'; // allow dragging

            testPhysics.setCallbacks({
                onWallBounce: () => canvas.triggerShake(6, 2),
                onBumperHit: () => canvas.triggerShake(12, 5),
                onGateCrossed: () => canvas.triggerShake(8, 2),
                onWaterSkim: () => canvas.triggerShake(6, 1.5),
                onWaterSink: () => canvas.triggerShake(15, 3),
            });
        } else {
            btnTestMap.textContent = "TEST MAP";
            btnTestMap.style.background = "#9b59b6";
            btnTestMap.style.borderBottom = "2px solid #8e44ad";
            testData = null; testPhysics = null; testEval = null;
            
            mountCanvas();
            overlay.style.pointerEvents = 'auto'; // intercept clicks
        }
    });

    // Tab Switching
    tabInspector.addEventListener('click', () => {
        tabInspector.style.background = '#222';
        tabInspector.style.color = '#fff';
        tabExport.style.background = '#111';
        tabExport.style.color = '#aaa';
        viewInspector.style.display = 'flex';
        viewExport.style.display = 'none';
    });
    tabExport.addEventListener('click', () => {
        tabExport.style.background = '#222';
        tabExport.style.color = '#fff';
        tabInspector.style.background = '#111';
        tabInspector.style.color = '#aaa';
        viewExport.style.display = 'flex';
        viewInspector.style.display = 'none';
    });

    // Inspector Updates
    inpTourName.addEventListener('change', (e) => {
        TOURNAMENT_DATA[currentTourIndex].name = (e.target as HTMLInputElement).value;
        tourSelect.options[currentTourIndex].textContent = TOURNAMENT_DATA[currentTourIndex].name;
    });
    inpTourCut.addEventListener('change', (e) => {
        TOURNAMENT_DATA[currentTourIndex].cutTarget = parseInt((e.target as HTMLInputElement).value);
    });
    inpTourCash.addEventListener('change', (e) => {
        TOURNAMENT_DATA[currentTourIndex].rewardCash = parseInt((e.target as HTMLInputElement).value);
    });
    inpHoleName.addEventListener('change', (e) => {
        TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex].name = (e.target as HTMLInputElement).value;
        holeSelect.options[currentHoleIndex].textContent = "Hole " + (currentHoleIndex + 1) + ": " + TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex].name;
    });
    inpHolePar.addEventListener('change', (e) => {
        TOURNAMENT_DATA[currentTourIndex].holes[currentHoleIndex].par = parseInt((e.target as HTMLInputElement).value);
    });

    // Wire Events
    tourSelect.addEventListener('change', () => {
        currentTourIndex = parseInt(tourSelect.value);
        currentHoleIndex = 0;
        updateHoleSelect();
        mockState.currentTournamentIndex = currentTourIndex;
        mockState.currentHoleIndex = currentHoleIndex;
        updateInspector();
    });

    holeSelect.addEventListener('change', () => {
        currentHoleIndex = parseInt(holeSelect.value);
        mockState.currentHoleIndex = currentHoleIndex;
        updateInspector();
    });

    // Render loop exclusively for the MapMaker
    const renderLoop = () => {
        if (isTesting && testData && testPhysics && testEval) {
            const ts = testData.getState();
            if (ts.ball.isMoving) {
                testPhysics.updateFrame(
                    ts.ball,
                    ts.currentFrame!,
                    testData.getActiveMapGrid(),
                    ts.activeSleeve.elasticity,
                    ts.wind,
                    ts.activeSleeve.windImmunity
                );
                if (!ts.ball.isMoving) {
                    const result = testEval.settleStroke(ts);
                    testResult.innerHTML = `
<div style="font-size:1.8em; font-weight:bold; margin-bottom:5px;">SUNK: <span style="color:${result.wasSunk ? '#2ecc71' : '#e74c3c'}">${result.wasSunk ? 'YES' : 'NO'}</span></div>
<div style="font-size:1.8em; font-weight:bold; margin-bottom:10px;">DNF: <span style="color:${result.wasDnf ? '#e74c3c' : '#2ecc71'}">${result.wasDnf ? 'YES' : 'NO'}</span></div>
<div style="font-size:2.5em; font-weight:bold; color:#f1c40f; margin-bottom:10px;">${result.points} YDS</div>
<div style="color:#aaa; white-space:pre-wrap; font-size:1.1em; line-height:1.4;">${result.logText}</div>
                    `;
                }
            }
            canvas.render(ts);
        } else {
            canvas.render(mockState);
        }
        requestAnimationFrame(renderLoop);
    };

    updateHoleSelect();
    updatePalette();
    updateInspector();
    mountCanvas();
    renderLoop();
}
