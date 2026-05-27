export interface BlockModifier {
    tileId: number;
    name: string;
    description: string;
    cost: number;
}

// Purchaseable Map Blocks
export const DRAFTABLE_BLOCKS: BlockModifier[] = [
    {
        tileId: 8,
        name: 'Arcade Bumper',
        description: 'Bounces ball & adds +150 yds & +0.5x multiplier.',
        cost: 45
    },
    {
        tileId: 9,
        name: 'Multiplier Gate',
        description: 'Sensor gate that doubles current shot multiplier.',
        cost: 60
    },
    {
        tileId: 6,
        name: 'Green Patch',
        description: 'Smooth putting terrain. Best for putter (1.3x lie).',
        cost: 25
    },
    {
        tileId: 1,
        name: 'Fairway Patch',
        description: 'Fills sand/rough/water with standard fairway (1.0x lie).',
        cost: 15
    },
    {
        tileId: 12,
        name: 'Diagonal Wall',
        description: 'Diagonal wall deflecting ball at an angle. Press R to rotate when placing.',
        cost: 40
    }
];
