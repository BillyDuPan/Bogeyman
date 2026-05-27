import type { PassiveBuff } from '../../types/game';

// The base definitions of the buffs. Rarity scaling will be applied dynamically when granted.
export const PASSIVE_BUFF_POOL: Omit<PassiveBuff, 'rarity'>[] = [
    {
        id: 'buff_base_yardage',
        name: 'Titanium Core',
        description: 'Increases the base yardage of all shots.',
        baseYardsBonus: 20, // Scaled by rarity
    },
    {
        id: 'buff_wall_bounce_mult',
        name: 'Rubberized Coating',
        description: 'Increases the multiplier gained from wall bounces.',
        wallBounceMultiplierBonus: 0.2, // Scaled by rarity
    },
    {
        id: 'buff_sand_rough_forgiveness',
        name: 'Tractor Treads',
        description: 'Reduces the lie penalty from sand and rough terrain.',
        sandRoughPenaltyReduction: 0.1, // Scaled by rarity
    },
    {
        id: 'buff_passive_cash',
        name: 'Ecto-Coin Magnet',
        description: 'Generates passive cash at the end of each hole.',
        cashPerHole: 10, // Scaled by rarity
    },
    {
        id: 'buff_projection_ray',
        name: 'Spectral Sight',
        description: 'Increases the length of the aiming projection ray.',
        projectionRayLengthBonus: 0.5, // Scaled by rarity
    }
];
