import type { GameState, StrokeFrame } from '../types/game';
import { TERRAIN_DEFS } from '../config/terrain';
import { audio } from './AudioSynthesizer';

export class EvaluationEngine {
    
    initializeStrokeFrame(state: GameState): StrokeFrame {
        const currentTile = state.ball.currentTileId;
        const terrain = TERRAIN_DEFS[currentTile] || TERRAIN_DEFS[1];
        
        let initialMultiplier = terrain.lieModifier;

        // Apply Club Passive address hooks (like Sand Wedge or Heavy Hybrid overrides)
        const selectedClub = state.activeBag.find(c => c.id === state.selectedClubId);
        if (selectedClub) {
            if (selectedClub.id === 'sand_wedge_60' && currentTile === 3) { // Sand Wedge in Bunker
                initialMultiplier = 5.0; // sets bunker lie modifier to 5.0x instead of 0.3x
            } else if (selectedClub.id === 'heavy_hybrid' && currentTile === 2) { // Heavy Hybrid in Rough
                initialMultiplier = 1.0; // sets rough lie modifier to 1.0x instead of 0.5x
            }
        }

        return {
            strokeIndex: state.strokeIndex,
            initialLieType: currentTile,
            startingPos: { ...state.ball.pos },
            accumulatedBaseYards: 0,
            accumulatedMultiplier: initialMultiplier,
            collisionLog: [],
            bankShotCount: 0,
            bumperHitCount: 0,
            gateCrossedCount: 0,
            waterSkimCount: 0,
            clubUsedId: state.selectedClubId
        };
    }

    settleStroke(state: GameState): { points: number; wasSunk: boolean; wasDnf: boolean; logText: string } {
        const frame = state.currentFrame;
        if (!frame) return { points: 0, wasSunk: false, wasDnf: false, logText: '' };

        let wasSunk = state.ball.currentTileId === 5; // Sunk in Cup
        let wasDnf = false;
        let logText = '';

        // 1. Process Club Passive Settle Hooks
        const clubId = frame.clubUsedId;

        // Illegal 1-Iron: wall bounces reset multiplier to 1.0x
        if (clubId === 'illegal_1iron' && frame.bankShotCount > 0) {
            frame.accumulatedMultiplier = 1.0;
            logText += 'Illegal 1-Iron penalty! Mult reset to 1.0x. ';
        }

        // Beryllium Putter: wall bounces add +100 yards flat yardage
        if (clubId === 'beryllium_putter') {
            frame.accumulatedBaseYards += frame.bankShotCount * 100;
        }

        // Titanium Driver: adds +100 yards base on Tee Box
        if (clubId === 'titanium_driver' && frame.initialLieType === 0) {
            frame.accumulatedBaseYards += 100;
        }

        // Trick Wedge: bounces grant +1.0x multiplier instead of +0.5x
        if (clubId === 'trick_wedge') {
            // Physics already added +0.5x per bounce. Add the remaining +0.5x per bounce here
            frame.accumulatedMultiplier += frame.bankShotCount * 0.5;
        }

        // 2. Calculate Final Shot Points
        let finalPoints = Math.floor(frame.accumulatedBaseYards * frame.accumulatedMultiplier);

        // Golden Putter: Doubles final shot points
        if (clubId === 'golden_putter') {
            finalPoints *= 2;
            logText += 'Golden Putter: x2 Points! ';
        }

        // Commit points to scorecard
        const scorecard = state.scorecardList[state.currentHoleIndex];
        scorecard.strokesTaken++;
        scorecard.pointsPerShot.push(finalPoints);
        scorecard.totalPoints += finalPoints;

        // Add to running tournament points
        state.cumulativeTournamentPoints += finalPoints;

        logText += `Shot ${state.strokeIndex}: Earned +${finalPoints.toLocaleString()} pts!`;

        // 3. Check Hole Resolution (Did the ball enter the cup?)
        if (wasSunk) {
            // Success! Sunk in the cup. Compute Par Bonus
            audio.playCupSink();
            
            const parDiff = scorecard.strokesTaken - scorecard.par;
            let parBonusMult = 1.0;
            let bonusName = 'Bogey';
            let holeInOneCash = 0;

            if (scorecard.strokesTaken === 1) {
                parBonusMult = 3.0;
                bonusName = 'HOLE IN ONE!!!';
                holeInOneCash = 100;
                state.money += holeInOneCash;
            } else if (parDiff <= -2) {
                parBonusMult = 2.0;
                bonusName = 'Eagle or Better (Albatross)';
            } else if (parDiff === -1) {
                parBonusMult = 1.5;
                bonusName = 'Birdie';
            } else if (parDiff === 0) {
                parBonusMult = 1.2;
                bonusName = 'Par';
            } else if (parDiff === 1) {
                parBonusMult = 1.0;
                bonusName = 'Bogey';
            } else {
                parBonusMult = 0.8;
                bonusName = 'Double Bogey or Worse';
            }

            const pointsBeforeBonus = scorecard.totalPoints;
            scorecard.totalPoints = Math.floor(scorecard.totalPoints * parBonusMult);
            
            // Adjust cumulative totals
            const bonusDifference = scorecard.totalPoints - pointsBeforeBonus;
            state.cumulativeTournamentPoints += bonusDifference;

            if (scorecard.strokesTaken === 1) {
                logText = `Sunk! HOLE IN ONE!!! 3.0x Bonus & +$100 cash! Hole total: ${scorecard.totalPoints.toLocaleString()} pts!`;
            } else {
                logText = `Sunk! ${bonusName} Bonus (${parBonusMult}x). Hole total: ${scorecard.totalPoints.toLocaleString()} pts!`;
            }
        } else {
            // Ball did not sink. Check remaining strokes
            state.allowedStrokes--;
            if (state.allowedStrokes <= 0) {
                // Out of strokes -> Dreaded DNF!
                wasDnf = true;
                scorecard.dnf = true;
                scorecard.totalPoints = 0; // strip points for the hole
                
                // Deduct points earned on this hole from the tournament cumulative total
                const holeEarned = scorecard.pointsPerShot.reduce((a, b) => a + b, 0);
                state.cumulativeTournamentPoints = Math.max(0, state.cumulativeTournamentPoints - holeEarned);

                // Strip 50% of player's currency cash balance!
                const cashBefore = state.money;
                state.money = Math.floor(state.money * 0.5);
                const lostCash = cashBefore - state.money;
                
                logText = `Dreaded DNF! Run out of strokes. Lost all hole points & 50% cash (-$${lostCash})!`;
            } else {
                // Next shot setup
                state.strokeIndex++;
            }
        }

        // Reset frame
        state.currentFrame = null;

        return {
            points: finalPoints,
            wasSunk,
            wasDnf,
            logText
        };
    }
}
