import type { ClubModifier } from '../../types/game';

// Base Starting Clubs (Cursed hand-me-downs from fallen golfers)
export const DEFAULT_CLUBS: ClubModifier[] = [
    {
        id: 'std_9iron',
        name: '9-Iron',
        description: 'Short-distance iron. 1.1x Power.',
        clubType: 'Iron',
        powerScalar: 1.1,
        cost: 0,
        rarity: 'Common'
    },
    {
        id: 'std_putter',
        name: 'Multiplier Putter',
        description: 'Green only. Smooth roller. 0.8x Power. Starts shot with +0.5x multiplier.',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 0,
        rarity: 'Rare',
        hooks: {
            onAddress: (frame) => {
                frame.accumulatedMultiplier += 0.5;
            }
        }
    }
];

// Cursed Relic Clubs (unearthed from the Bogeyman's course)
export const DRAFTABLE_CLUBS: ClubModifier[] = [
    {
        id: 'illegal_1iron',
        name: 'Power 1-Iron',
        description: 'Superpowered 2.5x shot. Wall bounces reset multiplier to 1.0x.',
        clubType: 'Iron',
        powerScalar: 2.5,
        cost: 120
    },
    {
        id: 'sand_wedge_60',
        name: 'Sand Wedge',
        description: 'Sand Wedge. Bunker multiplier counts as 5.0x instead of 0.3x.',
        clubType: 'Wedge',
        powerScalar: 0.9,
        cost: 85
    },
    {
        id: 'beryllium_putter',
        name: 'Bounce Putter',
        description: 'Green only. Bounces add +100 yards base distance.',
        clubType: 'Putter',
        powerScalar: 0.8,
        cost: 100
    },
    {
        id: 'titanium_driver',
        name: 'Tee-Box Driver',
        description: 'High-power 2.3x driver. Adds +100 yards base on the Tee Box.',
        clubType: 'Driver',
        powerScalar: 2.3,
        cost: 130
    },
    {
        id: 'golden_putter',
        name: 'Multiplier Putter',
        description: 'Green only. Doubles final points earned on this shot.',
        clubType: 'Putter',
        powerScalar: 0.7,
        cost: 140
    },
    {
        id: 'heavy_hybrid',
        name: 'Rough-Bypass Hybrid',
        description: 'Versatile 1.5x hybrid. Ignores rough penalty (Rough Lie = 1.0x).',
        clubType: 'Iron',
        powerScalar: 1.5,
        cost: 110
    },
    {
        id: 'trick_wedge',
        name: 'Bounce Wedge',
        description: 'Trick Wedge. Bounces add +1.0x multiplier instead of +0.5x.',
        clubType: 'Wedge',
        powerScalar: 1.0,
        cost: 95
    }
];
