import type { GameState } from '../types/game';
import { TOURNAMENT_DATA } from '../config/terrain';
import { audio } from '../engine/AudioSynthesizer';

export interface TournamentSelectContext {
    onPlay: () => void;
    onBack: () => void;
}

export function createTournamentSelect(containerId: string): {
    update: (state: GameState) => void;
    show: () => void;
    hide: () => void;
    setContext: (ctx: TournamentSelectContext) => void;
} {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);

    let currentContext: TournamentSelectContext | null = null;
    let cachedState: GameState | null = null;
    let viewedTournamentIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'ts-hub';
    overlay.style.display = 'none';

    overlay.innerHTML = `
        <div class="ts-header">
            <div class="ts-header-title">TOURNAMENT MAP</div>
        </div>

        <div class="ts-body">
            <!-- Left Column: Details -->
            <div class="ts-col ts-col--details">
                <div class="ts-col-hdr">TOUR INTEL</div>
                <div class="ts-details" id="ts-details-container">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- Right Column: Tour List -->
            <div class="ts-col ts-col--list">
                <div class="ts-col-hdr">CAMPAIGN ROUTE</div>
                <div class="ts-tour-list" id="ts-tour-list">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>

        <button id="ts-btn-back" class="ts-abs-btn ts-btn-back">BACK TO LOCKER</button>
        <button id="ts-btn-play" class="ts-abs-btn ts-btn-play">TEE OFF</button>
    `;

    container.appendChild(overlay);

    const detailsContainer = overlay.querySelector('#ts-details-container') as HTMLElement;
    const tourListContainer = overlay.querySelector('#ts-tour-list') as HTMLElement;
    const btnBack = overlay.querySelector('#ts-btn-back') as HTMLButtonElement;
    const btnPlay = overlay.querySelector('#ts-btn-play') as HTMLButtonElement;

    btnBack.addEventListener('click', () => {
        audio.playTick();
        currentContext?.onBack();
    });

    btnPlay.addEventListener('click', () => {
        audio.playGate();
        currentContext?.onPlay();
    });

    function renderDetails() {
        if (!cachedState) return;
        const tourney = TOURNAMENT_DATA[viewedTournamentIndex];
        if (!tourney) return;

        const isCurrent = viewedTournamentIndex === cachedState.currentTournamentIndex;
        const isPast = viewedTournamentIndex < cachedState.currentTournamentIndex;

        let statusText = isCurrent ? '<span class="ts-details-val--green">CURRENT TARGET</span>' :
                         isPast ? '<span style="color: #95a5a6">COMPLETED</span>' :
                         '<span style="color: #e74c3c">LOCKED</span>';

        let html = `
            <div class="ts-details-title">${tourney.name}</div>
            <div class="ts-details-row">
                <span>STATUS</span>
                <span>${statusText}</span>
            </div>
            <div class="ts-details-row">
                <span>CUT TARGET</span>
                <span class="ts-details-val">${tourney.cutTarget} PTS</span>
            </div>
            <div class="ts-details-row">
                <span>PURSE</span>
                <span class="ts-details-val--green">$${tourney.rewardCash}</span>
            </div>
            <div class="ts-details-row" style="margin-top: 16px;">
                <span>COURSE MAP (${tourney.holes.length} HOLES)</span>
            </div>
            <div class="ts-holes-list">
        `;

        tourney.holes.forEach((hole, idx) => {
            html += `
                <div class="ts-hole-item">
                    <span>${idx + 1}. ${hole.name}</span>
                    <span class="ts-hole-par">PAR ${hole.par}</span>
                </div>
            `;
        });

        html += `</div>`;
        detailsContainer.innerHTML = html;
    }

    function renderTourList() {
        if (!cachedState) return;
        tourListContainer.innerHTML = '';

        TOURNAMENT_DATA.forEach((tourney, idx) => {
            const btn = document.createElement('button');
            const isCurrent = idx === cachedState!.currentTournamentIndex;
            const isPast = idx < cachedState!.currentTournamentIndex;
            const isActiveView = idx === viewedTournamentIndex;

            btn.className = 'ts-tour-btn';
            if (isActiveView) btn.classList.add('active');
            if (isCurrent) btn.classList.add('current');

            let status = '';
            if (isCurrent) status = 'NEXT';
            else if (isPast) status = 'DONE';

            btn.innerHTML = `
                <span>${idx + 1}. ${tourney.name}</span>
                ${status ? `<span class="ts-tour-status">${status}</span>` : ''}
            `;

            btn.addEventListener('click', () => {
                audio.playTick();
                viewedTournamentIndex = idx;
                renderTourList();
                renderDetails();
            });

            tourListContainer.appendChild(btn);
        });
    }

    return {
        setContext(ctx: TournamentSelectContext) {
            currentContext = ctx;
        },
        update(state: GameState) {
            cachedState = state;
            // When updating, if viewed index isn't set properly or we just arrived, default to current
            if (!overlay.style.display || overlay.style.display === 'none') {
                viewedTournamentIndex = state.currentTournamentIndex;
            }
            renderTourList();
            renderDetails();
        },
        show() {
            if (cachedState) {
                viewedTournamentIndex = cachedState.currentTournamentIndex;
                renderTourList();
                renderDetails();
            }
            container.style.display = 'flex';
            overlay.style.display = 'flex';
        },
        hide() {
            container.style.display = 'none';
            overlay.style.display = 'none';
        }
    };
}
