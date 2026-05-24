import type { TerrainType } from '../types/game';

export const TERRAIN_DEFS: Record<number, TerrainType> = {
    0: { id: 0, name: 'Tee Box', friction: 0.98, lieModifier: 1.5, color: '#2ecc71', description: 'Clean Lie (+50% Mult)' },
    1: { id: 1, name: 'Fairway', friction: 0.96, lieModifier: 1.0, color: '#27ae60', description: 'Standard Lie (1.0x)' },
    2: { id: 2, name: 'Heavy Rough', friction: 0.89, lieModifier: 0.6, color: '#1e3799', description: 'Choked Lie (0.6x)' },
    3: { id: 3, name: 'Sand Bunker', friction: 0.80, lieModifier: 0.4, color: '#f5cd79', description: 'Buried Lie (0.4x)' },
    4: { id: 4, name: 'Water Hazard', friction: 0.10, lieModifier: 0.0, color: '#4a69bd', description: 'Sinks (penalty) unless skimming fast!' },
    5: { id: 5, name: 'The Cup', friction: 0.50, lieModifier: 1.0, color: '#ffffff', description: 'Goal — sink it!' },
    6: { id: 6, name: 'Green', friction: 0.97, lieModifier: 1.3, color: '#78e08f', description: 'Smooth (1.3x, Putters best here)' },
    7: { id: 7, name: 'Boundary Wall', friction: 1.00, lieModifier: 1.0, color: '#60a3bc', description: 'Bounces ball back (+0.5x Mult)' },
    8: { id: 8, name: 'Arcade Bumper', friction: 1.00, lieModifier: 1.0, color: '#e84118', description: 'Bounces ball (+150 yds & +0.5x Mult!)' },
    9: { id: 9, name: 'Multiplier Gate', friction: 0.96, lieModifier: 1.0, color: '#82589f', description: 'Doubles current shot multiplier!' },
    10: { id: 10, name: 'Cursed Cobblestone', friction: 0.92, lieModifier: 0.8, color: '#636e72', description: 'Cursed stone path (0.8x Lie)' },
    11: { id: 11, name: 'Bone Dust', friction: 0.72, lieModifier: 0.3, color: '#dfe6e9', description: 'Ashen bone powder (0.3x Lie!)' },
};

const CHAR_MAP: Record<string, number> = {
    'W': 7,
    'T': 0,
    'F': 1,
    'R': 2,
    'B': 3,
    'H': 4,
    'C': 5,
    'G': 6,
    'O': 8,
    'X': 9,
    'K': 10,
    'D': 11,
};

function parseMap(layout: string): number[][] {
    const lines = layout.trim().split('\n').map(l => l.trim());
    const grid: number[][] = [];
    for (let r = 0; r < 12; r++) {
        const row: number[] = [];
        const line = lines[r] || 'WWWWWWWWWWWWWWWW';
        for (let c = 0; c < 16; c++) {
            const char = line[c] || 'W';
            row.push(CHAR_MAP[char] ?? 1);
        }
        grid.push(row);
    }
    return grid;
}

export interface TournamentData {
    name: string;
    cutTarget: number;
    rewardCash: number;
    holes: {
        par: number;
        map: number[][];
    }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 Tournaments × 3 holes each — all maps use the full 12-row × 16-col grid.
//
// Grid key:
//   W=Wall  T=Tee  F=Fairway  R=Rough  B=Sand  H=Water
//   C=Cup   G=Green  O=Bumper  X=Gate  K=Cobblestone  D=BoneDust
// ─────────────────────────────────────────────────────────────────────────────
export const TOURNAMENT_DATA: TournamentData[] = [

    // ═══════════════════════════════════════════════════════════════
    // T1 — The Foggy Hollow Open  (Intro / Setup your economy)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'The Foggy Hollow Open',
        cutTarget: 850,
        rewardCash: 120, // Slightly more cash to buy early passive powerups
        holes: [
            {
                // H1 — Par 3 — "Coffin Corner"
                // Balanced: Added a corner Bumper (O) at the bend so players can 
                // pull off a cool trick-shot to double their multiplier early.
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFWWWWWWW
                    WFFFFFFFFWWWWWWW
                    WFFFFFFFFFOWFFFF
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 4 — "Ghost Trail"
                // Balanced: Added a central Multiplier Gate (X) in the main fairway channel
                // to reward accurate straight-driving.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWTTFFFFF
                    WWWWWWWWWFFFFFFF
                    WWWWWWWWWFFFFFFF
                    WFFFFFFFXFFFFFFW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WFFGCGGWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 4 — "The Boomerang"
                // Balanced: Placed safety Bumpers (O) on the outer wall of the U-turn
                // to encourage a fun bank-shot strategy that speeds up progress.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFFFFFFW
                    WWWWWWWWWWWWFFOW
                    WWWWWWWWWWWWFFFW
                    WWWWWWWWWWWWFFFW
                    WFFFFFFFFFFFFWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WFFGCGGWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T2 — Bone Bunker Classic  (Sand hazards with high-reward escapes)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'Bone Bunker Classic',
        cutTarget: 1400,
        rewardCash: 180,
        holes: [
            {
                // H1 — Par 3 — "Sand Tomb"
                // Balanced: Double multiplier gates in the bottom fairway corridor 
                // to turn recovery shots into high-scoring turnarounds.
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFWWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WFBBBFWWWWWWWWWW
                    WFBBBBWWWWWWWWWW
                    WFOBBFWWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WFFFFXFFFFFFFFFW
                    WWWWWFFFFFFFFFGW
                    WWWWWFFFFFFFFFCW
                    WWWWWFFFFFFFFFGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 4 — "The Grinder"
                // Balanced: Added a clean pathway flanked by Bumpers, making
                // it easier to bounce out of trouble if you misjudge the sand.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFBBBFFFFW
                    WFFFFFFBOBFFFFFW
                    WFFFFFFBXBFFFFFW
                    WFFFFFFBOBFFFFFW
                    WFFFFFFFFFFFFWWW
                    WFFFFFFFFFFFFWWW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFGGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWFFGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 5 — "Dune Serpent"
                // Balanced: Additional gates (X) and bumpers (O) on the bends
                // reward bold shortcuts through the sand.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFBBBBBBBBBFFW
                    WFFFBBBBBBBBBFFW
                    WFFFBBOBBBBFFFWW
                    WFFFFFFFFXFFFFFW
                    WWWWWWWWWFBBBFFW
                    WWWWWWWWWFBBBFFW
                    WWWWWWWWWFFFFFWW
                    WFFFFFFFFFFFFFFW
                    WXFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T3 — The Ecto-Pond Pro-Am  (Water hazard balance — No more run-killing)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'The Ecto-Pond Pro-Am',
        cutTarget: 3200, // Slightly reduced cut target to help players transition
        rewardCash: 280,
        holes: [
            {
                // H1 — Par 3 — "Island Haunt"
                // Balanced: Added floating Bumpers (O) in the water moat. 
                // Now, if you hit a bad angle, you have a chance to bounce onto the green 
                // with a massive bonus score instead of just hitting water.
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WTFFFFFFFFHHHHWW
                    WFFFFHHHXHHGGGWW
                    WFFFFHHOHHGGCGWW
                    WWWFFHHHXHHGGGWW
                    WWWFFFFFFFHHHHWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 4 — "The Skim"
                // Balanced: Placed Multiplier Gates (X) straight across the lake center. 
                // Skimming through the center of the lake is now incredibly rewarding and scores huge.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WHHHHHHHHHHHHHFW
                    WXXXXXXXXXXXXXFW
                    WHHHHHHHHHHHHHFW
                    WHHHHHHHHHHHHHFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWFFFGGGG
                    WWWWWWWWWFFFGGCG
                    WWWWWWWWWFFFGGGG
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 4 — "Bog Maze"
                // Balanced: Added strategic Bumpers (O) on the tight fairway corners 
                // to allow players to safely bank shots around water channels.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFHHHHHFFFWWW
                    WFFFWHHHHHWFFFWW
                    WFFFWHHHHHWFFFWW
                    WFFFFFFHHHFFFFWW
                    WFOFFFFHHHFFOFFW
                    WHHHHHHFFFFFFFFW
                    WFFFFFHHHFFFFFGW
                    WFFFFFHHHFFFFGGW
                    WWWWWWFFFFGGGGGW
                    WWWWWWFFFFGGCGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T4 — Spirit Gate Gauntlet  (Unleash the multiplier combos!)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'Spirit Gate Gauntlet',
        cutTarget: 6000,
        rewardCash: 450,
        holes: [
            {
                // H1 — Par 4 — "The Arch"
                // Balanced: Added helper bumpers at the start to line up perfect 
                // triple-gate shots with surgical accuracy.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFXFFXFFFXFFFG
                    WFFFXFFXFFFXFFFG
                    WFFFXFFXFFFXFFFC
                    WFFFXFFXFFFXFFFG
                    WTTFXFFXFFFXFFFG
                    WFFFOFFFFFFFFWWW
                    WFFFFFFFFFFFFWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 4 — "Spirit Corridor"
                // Balanced: Added corner guide-bumpers to make navigating the 
                // tight Z-turn satisfying and explosive.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWTTFFFFF
                    WWWWWWWWWFFFFFFF
                    WWWWWWWWWFFFFFFW
                    WFFFFFFXXXXXXXFW
                    WFFFFFOWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WFFGCGGWWWWWWWWW
                    WFFFGGGWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 5 — "Grand Portal"
                // Balanced: Placed crossway gates and bumpers at the final approach 
                // to guarantee high multiplier scoring before sinking.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFXFFFFWWWW
                    WFFFFFFXFFFFWWWW
                    WFFFFFFXFFFFWWWW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWFFFFFWWWW
                    WWWWWWWXXXXXWWWW
                    WWWWWWWFFFFFWWWW
                    WWWWWWWFFFFFFOOF
                    WWWWWWWFFFFFOFGW
                    WWWWWWWFFFFGCGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T5 — Wraith Bumper Masters  (Pure Pinball / Huge Dopamine)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'Wraith Bumper Masters',
        cutTarget: 10000,
        rewardCash: 650,
        holes: [
            {
                // H1 — Par 4 — "The Triangle"
                // Balanced: Added a side corridor with Multiplier Gates to reward 
                // players who slice through the pinball cluster.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFFFFFFW
                    WFFFFFOFFFFFFWWW
                    WFFFFOFOFFFFFFFW
                    WFFFOFFFFFOFFFFW
                    WFFFFOFOFFFFFFFW
                    WFFFFFOFFFFFFWWW
                    WWWWWWWWWXXXXXFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 5 — "Chain Reaction"
                // Balanced: Alternated Gate-Bumper rows so players can chain 
                // back and forth to reach over 100x multiplier values.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFOFOFOFOFOFOFFW
                    WFFFFFFFFFFFFFFW
                    WFXXXXXXXXXXXXFW
                    WFOFOFOFOFOFOFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 4 — "Pinball Crypt"
                // Balanced: More dense configurations of Bumpers and Gates 
                // to turn the entire screen into an explosive score cascade.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFXFFOFFXFFFFW
                    WFFXFOFOOFXFFFFW
                    WFXFFOFFXFFXFFFW
                    WFFXFOFOOFXFFFFW
                    WFFFXFFOFFXFFFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWFFFFFFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T6 — Haunted Hazard Archipelago  (Balanced survival test)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'Haunted Hazard Archipelago',
        cutTarget: 18000,
        rewardCash: 900,
        holes: [
            {
                // H1 — Par 4 — "The Archipelago"
                // Balanced: Added stepping-stone bumpers in the water gaps 
                // so off-target shots bounce safely to the next island.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFHHHHHHHHHWWW
                    WFFFHFFFFFHHWWWW
                    WHHHHFOFFFHHWWWW
                    WHHHHHHHHHHHHWWW
                    WHHHFFFFFFFHHWWW
                    WHHHFFFFFFFHHWWW
                    WHHHHHHHHHHHHWWW
                    WHHHHFFFFFFHHWWW
                    WHHHHFFFFGCGHHWW
                    WHHHHFFFFFFHHWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 5 — "Bone Swamp"
                // Balanced: Cobblestone routes are wider and lead directly into 
                // double multiplier gates, turning the slow ground into a launcher.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTKKKKKKKKKKKKW
                    WFFRRRHHHHRRFFFW
                    WFFKKKHHHHKKKFFW
                    WFFKKKHHHHKKKFFW
                    WFFRRRHHHHRRFFFW
                    WFFFFFFFFXXFFFFW
                    WWWWWWWWWBBBBBBW
                    WWWWWWWWWBBBBBBW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 4 — "The Gauntlet"
                // Balanced: Water channels are flanked by buffer gates 
                // to give high-skimming balls a huge extra boost.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFHHHHWWWWWWWW
                    WFFFHHHHWWWWWWWW
                    WFFFHHHHWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWBBBOOOW
                    WWWWWWWWWBBBFFFW
                    WWWWWWWWWFXXFFFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWFFFFGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T7 — Specter Gorge Championship  (Precision with bumpers)
    // ═══════════════════════════════════════════════════════════════
    {
        name: 'Specter Gorge Championship',
        cutTarget: 28000, // Balanced target down slightly
        rewardCash: 1300,
        holes: [
            {
                // H1 — Par 4 — "The Gorge"
                // Balanced: Since wall bounces are unavoidable here, we've lined the gorge 
                // with occasional bumpers to catapult the ball down the tight canyon.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFWWWWWWWWWW
                    WFFOFFWWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWFOFFFWW
                    WWWWWWWWWFFFFFWW
                    WWWWWWWWWFFFFFWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 4 — "Catacombs"
                // Balanced: Re-arranged bumpers around chamber doorways so players 
                // can make high-speed bank shots into the next rooms.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFHHHWWW
                    WFFFOBBBOOHHHHWW
                    WFFFFFFFOBHHHWWW
                    WFFFFFFXXXXXXXXW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WFFFFGGWWWWWWWWW
                    WFFFGCGWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 5 — "Specter's Bridge"
                // Balanced: Added an exciting "Bumper Bridge" across the water hazard 
                // for satisfying direct trick-shots.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WHHHHHHHHHHKKKFW
                    WHHOHOHOHHHKKKFW
                    WFFFFFFFFFFFKKKW
                    WFFFFFFFFFFFKKKW
                    WFFFFOOFOOFFFFFW
                    WFFFFFXXXXXXXFFW
                    WWWWWWWWWFFFGGGW
                    WWWWWWWWWFFGCGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // T8 — Bogeyman's Final Haunt  (The ultimate endgame puzzle)
    // ═══════════════════════════════════════════════════════════════
    {
        name: "Bogeyman's Final Haunt",
        cutTarget: 50000,
        rewardCash: 3000,
        holes: [
            {
                // H1 — Par 4 — "Death March"
                // Balanced: Added central Multiplier Gates inside the skull's "nose" 
                // to make the critical final approach highly explosive.
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFHHHHHHHHHFFW
                    WFFFHFFFFFHFHFFW
                    WFFFHFFFFFHFHFFW
                    WFFFFFFKKKFFFFFF
                    WFFFFFFKDKFFFFFF
                    WFFFFFFKDKFFFFFF
                    WHHHHHHXXXHHHHFW
                    WHHHHFFKKKFHHHHW
                    WHHHHFFGGGFHHHHW
                    WHHHHFFGCGFHHHHW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H2 — Par 5 — "Soul Grinder"
                // Balanced: Added supportive bumper paths that bounce players out of 
                // bone dust pits and directly through multiplier lanes.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTDDDDDDDDDDDFW
                    WFFDDDDDDDDDDDFW
                    WFDDXDDXDDXDDDDW
                    WFDDKDDKDDKDDDDW
                    WFFKKKKKKKKKKKKW
                    WFFBBBBBBBBBBBFW
                    WFFBBBBBBBBBBBFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWOFOGGGWW
                    WWWWWWWWOFGCGGWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                // H3 — Par 5 — "Bogeyman's Throne"
                // Balanced: The ultimate level. Added helper bumpers in the corners of 
                // the final water moat and multiplier gates along the bone dust finish 
                // to allow players to construct 100,000+ score turns if played with skill.
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WTTFHHHHHHHHHHFW
                    WFFFHHHHHHHHHHFW
                    WFFFHHHHHHHHHHFW
                    WFFFFFFFFFFFFFFW
                    WFOFOFOFOFOFOFOW
                    WFOFOFOFOFOFOFWW
                    WFXXXXXXXXXXFFW
                    WFDDDDDDDDDDDFFW
                    WWWWWWWWWFFGGGFW
                    WWWWWWWWWFGCGGFW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
];