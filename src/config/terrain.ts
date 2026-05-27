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
    12: { id: 12, name: 'Diagonal Wall (TL)', friction: 1.00, lieModifier: 1.0, color: '#60a3bc', description: 'Bounces ball (+0.5x Mult)' },
    13: { id: 13, name: 'Diagonal Wall (TR)', friction: 1.00, lieModifier: 1.0, color: '#60a3bc', description: 'Bounces ball (+0.5x Mult)' },
    14: { id: 14, name: 'Diagonal Wall (BL)', friction: 1.00, lieModifier: 1.0, color: '#60a3bc', description: 'Bounces ball (+0.5x Mult)' },
    15: { id: 15, name: 'Diagonal Wall (BR)', friction: 1.00, lieModifier: 1.0, color: '#60a3bc', description: 'Bounces ball (+0.5x Mult)' },
};

export const CHAR_MAP: Record<string, number> = {
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
    '1': 12, // TL
    '2': 13, // TR
    '3': 14, // BL
    '4': 15, // BR
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
        name: string;
        par: number;
        map: number[][];
    }[];
}

export const TOURNAMENT_DATA: TournamentData[] = [
    {
        name: 'The Foggy Hollow Open',
        cutTarget: 1000,
        rewardCash: 120,
        holes: [
            {
                name: 'Straight Shot',
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFOFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGGCGGW
                    WFFFFFFFFGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'The L-Bend',
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFF2WWWW
                    WFTFFFFFFOFF2WWW
                    WFFFFFFFFFFFF2WW
                    WWWWWWWW3FFFFFWW
                    WWWWWWWWWFFFFFWW
                    WWWWWWWWWFFFFFWW
                    WWWWWWWWWGGOGGWW
                    WWWWWWWWWGGGGGWW
                    WWWWWWWWWGGCGGWW
                    WWWWWWWWWGGGGGWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'U-Turn',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFF2WWWW
                    WFTFFFFFFOFF2WWW
                    WFFFFFFFFFFFFWWW
                    WWWWWWWW3FFFFWWW
                    WWWWWWWWWFFFFWWW
                    WWWWWWWWWFFFFWWW
                    WWWWWWWW1FFFFWWW
                    WGGGGGFFFFOFFWWW
                    WGCGGOFFFFFF4WWW
                    WGGGGGFFFFF4WWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'Bone Bunker Classic',
        cutTarget: 2500,
        rewardCash: 180,
        holes: [
            {
                name: 'Sand Tomb',
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFWWWWWWW
                    WFTFFFFFFFFWWWWW
                    WFFFFFFFFFFFFFFW
                    WFFFFFBBBGGGGGGW
                    WFFFFFBBBGGCGGGW
                    WFFFFFBBBGGGGGGW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'The Grinder',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWFFBXXBWWWW
                    WWWWWWFFBXXBWWWW
                    WWWWWWFFBOOBWWWW
                    WWWWWWFFFFFFFFFW
                    WWWWWWFFGGGGGGWW
                    WWWWWWFFGGCGGWWW
                    WWWWWWFFGGGGGGWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Dune Serpent',
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFBBBBBBFFFW
                    WWWWWFFBXXBFFFFW
                    WWWWWFFBOOBFFFFW
                    WFFFFFFBBBBBBFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WFFFFFFFFGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'The Ecto-Pond Pro-Am',
        cutTarget: 6000,
        rewardCash: 280,
        holes: [
            {
                name: 'Island Haunt',
                par: 3,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFHHHHHHHHHW
                    WFFFFFHHHGGGHHHW
                    WFFFFFHHHGCGHHHW
                    WFFFFFHHHGGGHHHW
                    WFFFFFHHHHHHHHHW
                    WFFFFFHHHHHHHHHW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'The Skim',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WHHHHHHHHHHHHHHW
                    WXXXXXXXXXXXXXFW
                    WHHHHHHHHHHHHHHW
                    WHHHHHHHHHHHHHHW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Bog Maze',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFHHHHHFFFFW
                    WWWWWFFHHHFFFFFW
                    WWWWWFFHHHFFFFFW
                    WFFFFFFHHHHHHFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WFFFFFFFFGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'Spirit Gate Gauntlet',
        cutTarget: 12000,
        rewardCash: 450,
        holes: [
            {
                name: 'The Arch',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFXFFXFFFXFFFW
                    WFFFXFFXFFFXFFFW
                    WFFFXFFXFFFXFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WFFFFFFFFGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Spirit Corridor',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFFXXXXXXFFW
                    WFFFFFOWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WFFFFFFFFGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Grand Portal',
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFFXFFFFFFFW
                    WFFFFFFXFFFFFFFW
                    WFFFFFFXFFFFFFFW
                    WXXXXXXXXXXXXXXW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'Wraith Bumper Masters',
        cutTarget: 22000,
        rewardCash: 650,
        holes: [
            {
                name: 'The Triangle',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFOFFFFFFWWW
                    WFFFFOFOFFFFFFFW
                    WFFFOFFFFFOFFFFW
                    WFFFFOFOFFFFFFFW
                    WFFFFFOFFFFFFWWW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Chain Reaction',
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFOFOFOFOFOFOFFW
                    WFFFFFFFFFFFFFFW
                    WFXXXXXXXXXXXXFW
                    WFOFOFOFOFOFOFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Pinball Crypt',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFXFOFOOFXFFFFW
                    WFXFFOFFXFFXFFFW
                    WFFXFOFOOFXFFFFW
                    WFFFXFFOFFXFFFFW
                    WFFFFFFFFFFFFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'Haunted Hazard Archipelago',
        cutTarget: 40000,
        rewardCash: 900,
        holes: [
            {
                name: 'The Archipelago',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WHHHHFOFFFHHWWWW
                    WHHHHHHHHHHHHWWW
                    WHHHFFFFFFFHHWWW
                    WHHHFFFFFFFHHWWW
                    WHHHHHHHHHHHHWWW
                    WHHHHFFFFFGGGGGW
                    WHHHHFFFFFGGCGGW
                    WHHHHFFFFFGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Bone Swamp',
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFKKKKKKKKKKKFW
                    WFFRRRHHHHRRFFFW
                    WFFKKKHHHHKKKFFW
                    WFFRRRHHHHRRFFFW
                    WFFFFFFFFXXFFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'The Gauntlet',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFHHHHWWWWWWWW
                    WFFFHHHHWWWWWWWW
                    WWWWWWWWWBBBOOOW
                    WWWWWWWWWKKKFFFW
                    WWWWWWWWWFXXFFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: 'Specter Gorge Championship',
        cutTarget: 65000,
        rewardCash: 1300,
        holes: [
            {
                name: 'The Gorge',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFOFFWWWWWWWWWW
                    WFFFFFWWWWWWWWWW
                    WFFFFWWWWWWWWWWW
                    WFFFFWWWWWWWWWWW
                    WFFFFWWWWWWWWWWW
                    WFFFFXFFFFGGGGGW
                    WFFFFFFFFFGGCGGW
                    WFFFFFFFFFGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Catacombs',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFOBBBOOHHHHWW
                    WFFFFFFFOBHHHWWW
                    WFFFFFFXXXXXXXXW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFFFFFFFFGGGGGGW
                    WFFFFFFFFGGCGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: "Specter's Bridge",
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WHHHHHHHHHHKKKFW
                    WHHOHOHOHHHKKKFW
                    WFFFFFFFFFFFKKKW
                    WFFFFOOFOOFFFFFW
                    WFFFFFXXXXXXXFFW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWGGCGGGW
                    WWWWWWWWWGGGGGGW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
    {
        name: "Bogeyman's Final Haunt",
        cutTarget: 120000,
        rewardCash: 3000,
        holes: [
            {
                name: 'Death March',
                par: 4,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFFFFFFKKKFFFFFF
                    WFFFFFFKDKFFFFFF
                    WFFFFFFKDKFFFFFF
                    WHHHHHHXXXHHHHFW
                    WHHHHFFKKKFHHHHW
                    WHHHHFFGGGGGHHHW
                    WHHHHFFGGCGGHHHW
                    WHHHHFFGGGGGHHHW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: 'Soul Grinder',
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFDDXDDXDDXDDDDW
                    WFDDKDDKDDKDDDDW
                    WFFKKKKKKKKKKKKW
                    WFFBBBBBBBBBBBFW
                    WFFBBBBBBBBBBBFW
                    WWWWWWWWGGGGGGWW
                    WWWWWWWWGGCGGGWW
                    WWWWWWWWGGGGGGWW
                    WWWWWWWWWWWWWWWW
                `)
            },
            {
                name: "Bogeyman's Throne",
                par: 5,
                map: parseMap(`
                    WWWWWWWWWWWWWWWW
                    WFFFFFFFFFFFFFFW
                    WFTFFFFFFFFFFFFW
                    WFOFOFOFOFOFOFOW
                    WFOFOFOFOFOFOFWW
                    WFXXXXXXXXXXFFW
                    WFDDDDDDDDDDDFFW
                    WWWWWWWWFFGGGGGW
                    WWWWWWWWFFGGCGGW
                    WWWWWWWWFFGGGGGW
                    WWWWWWWWWWWWWWWW
                    WWWWWWWWWWWWWWWW
                `)
            },
        ]
    },
];