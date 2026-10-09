import { randomInt } from 'crypto';
import {
    GameState,
    Player,
    MoveResult,
    PlayerColor,
    getBoardConfig,
    BOARD_CONFIG_4,
    BOARD_CONFIG_6,
    COLORS_4,
    COLORS_6,
    DICE_MAX,
    getPlayerBlockades,
    canPlayerMove,
    ROLL_TIMEOUT,
    MOVE_TIMEOUT,
    getPiecesAt,
    getStartPosition,
    GameStateManager,
    RuleEngine,
    GameLogEntry
} from '@parchis/shared';

export interface GameEngineOptions {
    onStateChange: (state: GameState) => void;
    onGameLog: (log: GameLogEntry) => void;
    onNotification: (playerId: string | 'all', message: string) => void;
    onStartingPlayerSelected: (color: PlayerColor, name: string) => void;
    onStatIncrement: (userId: number, stat: 'games_played' | 'games_won' | 'pieces_captured' | 'pieces_lost') => void;
    onGameFinished: (state: GameState) => void;
    config?: Partial<import('@parchis/shared').GameOptions>;
}

const createLog = (text: string, type: GameLogEntry['type'], playerColor?: PlayerColor): GameLogEntry => ({
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    timestamp: Date.now(),
    type,
    text,
    playerColor
});

export class GameEngine {
    private state: GameState;
    private config: import('@parchis/shared').BoardConfig;
    private options: GameEngineOptions;
    private timer: NodeJS.Timeout | null = null;

    constructor(roomId: string, playerCount: 4 | 6, options: GameEngineOptions, config?: Partial<import('@parchis/shared').GameOptions>) {
        this.options = options;
        this.config = playerCount === 6 ? BOARD_CONFIG_6 : BOARD_CONFIG_4;

        this.state = {
            roomId,
            status: 'waiting',
            players: [],
            currentTurn: 'yellow',
            dice: [],
            diceRolled: false,
            lastActionTimestamp: Date.now(),
            totalTurns: 0,
            turnTimeLeft: 30,
            turnExpireTimestamp: undefined,
            pendingBonus: undefined,
            consecutiveDoubles: 0,
            gameVersion: 0,
            piecesExitedCount: 0,
            spectators: [],
            options: {
                allowSpectators: true,
                spectatorCanReadChat: true,
                timeBonusOnCapture: 10,
                timeBonusOnGoal: 10,
                turnDuration: 30, // Default if not provided
                turnRollDuration: 15,
                ...(config || {}) // Spread passed config argument
            },
            restartVotes: []
        } as GameState;
    }

    public getState(): GameState {
        return this.state;
    }

    public setState(state: GameState): void {
        this.state = state;
        this.options.onStateChange(this.state);
    }

    private updateState(updater: (state: GameState) => GameState): void {
        this.state = updater(this.state);
        this.options.onStateChange(this.state);
    }

    public startGame() {
        if (this.state.status !== 'waiting' || this.state.players.length < 1) return;

        this.state.status = 'playing';
        this.state.startTime = Date.now();
        this.state.totalTurns = 0;

        // Initialize stats for all players
        this.state.players.forEach(p => {
            p.stats = {
                piecesCaptured: 0,
                piecesLost: 0,
                doublesRolled: 0,
                totalMoves: 0,
                totalDiceValue: 0,
                onesRolled: 0
            };
        });

        this.state.currentTurn = this.selectRandomStartingPlayer();

        const startingPlayer = this.state.players.find(p => p.color === this.state.currentTurn);
        this.options.onStartingPlayerSelected(this.state.currentTurn, startingPlayer?.name || 'Unknown');

        // Record "games_played" logic moved to gameHistoryService (End of Game)
        // to prevent ghost games on early disconnects.

        this.options.onGameLog(createLog('The game has started!', 'game_start'));
        this.options.onGameLog(createLog(`Initial turn of ${startingPlayer?.name || this.state.currentTurn}`, 'turn_change', this.state.currentTurn));

        // Delay timer start to allow client animation (approx 7s)
        setTimeout(() => {
            this.startTurnTimer(this.state.options.turnRollDuration * 1000);
            this.options.onStateChange(this.state);
        }, 7000);
    }

    private selectRandomStartingPlayer(): PlayerColor {
        const randomIndex = Math.floor(Math.random() * this.state.players.length);
        return this.state.players[randomIndex].color;
    }

    public rollDice(playerId: string) {
        if (this.state.status === 'paused') {
            this.options.onNotification(playerId, 'The game is paused.');
            return;
        }

        const player = this.state.players.find(p => p.id === playerId);
        if (!player || player.color !== this.state.currentTurn || this.state.diceRolled) return;

        this.state.lastActionTimestamp = Date.now();

        // Use CSPRNG for fair dice rolls
        const d1 = randomInt(1, DICE_MAX + 1);
        const d2 = randomInt(1, DICE_MAX + 1);

        // Use GameStateManager for immutable state update
        let newState = GameStateManager.rollDice(this.state, d1, d2);

        // Stats Tracking
        const updatedPlayer = newState.players.find(p => p.id === playerId);
        if (updatedPlayer?.stats) {
            updatedPlayer.stats.totalDiceValue += (d1 + d2);
            if (d1 === 1) updatedPlayer.stats.onesRolled++;
            if (d2 === 1) updatedPlayer.stats.onesRolled++;
            if (d1 === d2) updatedPlayer.stats.doublesRolled++;
        }

        this.setState(newState);
        this.startTurnTimer(this.state.options.turnDuration * 1000);

        // Delay log to allow dice animation to finish (approx 1s)
        setTimeout(() => {
            this.options.onGameLog(createLog(`${player.name} rolled [${d1}, ${d2}]`, 'dice_roll', player.color));
        }, 1500);

        // Handle 3 consecutive doubles penalty
        if (newState.consecutiveDoubles === 3) {
            const turnSnapshot = `${this.state.currentTurn}-${this.state.totalTurns}`;
            setTimeout(() => {
                const currentTurn = `${this.state.currentTurn}-${this.state.totalTurns}`;
                if (currentTurn !== turnSnapshot || this.state.status !== 'playing') return;

                this.options.onNotification(playerId, 'Three consecutive doubles! Last piece to the nest.');
            }, 150);

            setTimeout(() => {
                const currentTurn = `${this.state.currentTurn}-${this.state.totalTurns}`;
                if (currentTurn !== turnSnapshot || this.state.status !== 'playing') return;

                if (this.state.lastMovedPieceId) {
                    const currentPlayer = this.state.players.find(p => p.id === playerId);
                    const lastPiece = currentPlayer?.pieces.find(p => p.id === this.state.lastMovedPieceId);
                    if (lastPiece && lastPiece.status !== 'home_path' && lastPiece.status !== 'goal') {
                        // Send piece back to nest
                        this.updateState(state => {
                            const player = state.players.find(p => p.id === playerId);
                            if (!player) return state;

                            return {
                                ...state,
                                players: state.players.map(p => {
                                    if (p.id !== playerId) return p;
                                    return {
                                        ...p,
                                        pieces: p.pieces.map(piece => {
                                            if (piece.id !== state.lastMovedPieceId) return piece;
                                            return {
                                                ...piece,
                                                status: 'nest' as const,
                                                position: -1,
                                                distanceFromStart: 0
                                            };
                                        })
                                    };
                                })
                            };
                        });

                        if (currentPlayer?.stats) currentPlayer.stats.piecesLost++;
                    }
                }
                this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));
                this.options.onGameLog(createLog(`Turn lost! 3 consecutive doubles.`, 'turn_change', player.color));
            }, 3000);
            return;
        }

        // Check for blockade break requirement
        if (newState.consecutiveDoubles > 0) {
            const blockades = getPlayerBlockades(newState, player);
            newState.blockadeBreakRequired = blockades.length > 0;
            if (newState.blockadeBreakRequired) {
                setTimeout(() => {
                    this.options.onNotification(playerId, 'Doubles rolled! You must break your blockade.');
                }, 150);
            }
        } else {
            newState.blockadeBreakRequired = false;
        }

        // Check dynamic start blockage
        const config = this.config;
        const startPos = getStartPosition(player.color, config.spacesPerSegment, config.playerCount);
        const piecesAtStart = getPiecesAt(newState, startPos, 'active');
        const myPiecesAtStart = piecesAtStart.filter(p => p.color === player.color);

        if (myPiecesAtStart.length >= 2) {
            newState.initialTurnStartBlocked = true;
        } else {
            newState.initialTurnStartBlocked = false;
        }

        this.setState(newState);

        // Check if player can move
        if (!canPlayerMove(this.state)) {
            const turnSnapshot = `${this.state.currentTurn}-${this.state.totalTurns}`;
            setTimeout(() => {
                const currentTurn = `${this.state.currentTurn}-${this.state.totalTurns}`;
                if (currentTurn !== turnSnapshot || this.state.status !== 'playing') return;

                if (this.state.currentTurn === player.color && this.state.diceRolled) {
                    if (this.state.consecutiveDoubles > 0) {
                        // Re-roll on doubles
                        this.startTurnTimer(this.state.options.turnRollDuration * 1000);
                        this.updateState(state => ({
                            ...state,
                            dice: [],
                            diceRolled: false
                        }));
                        this.options.onNotification(playerId, 'Doubles with no moves! Roll again.');
                    } else {
                        this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));
                        this.options.onGameLog(createLog(`Turn passed: No possible moves.`, 'turn_change', player.color));
                    }
                }
            }, 2000);
        } else {
            this.checkAutoMove();
        }
    }

    public movePiece(playerId: string, pieceIndex: number, dieValue: number, dieIndex: number = -1): MoveResult {
        // Validate piece index
        if (pieceIndex < 0 || pieceIndex >= 4) return { valid: false, reason: 'Invalid piece index' };

        if (this.state.status === 'paused') {
            return { valid: false, reason: 'The game is paused.' };
        }

        if (this.state.status !== 'playing') return { valid: false, reason: 'Game not started' };

        this.state.lastActionTimestamp = Date.now();

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return { valid: false, reason: 'Player not found' };

        if (player.color !== this.state.currentTurn) return { valid: false, reason: 'It is not your turn' };

        // Check for 3 consecutive doubles penalty
        if (this.state.consecutiveDoubles >= 3) {
            return { valid: false, reason: 'Turn lost: 3 consecutive doubles' };
        }

        if (!this.state.diceRolled && !this.state.pendingBonus) return { valid: false, reason: 'You must roll the dice first' };

        // Validate die usage
        let usedDiceIndices: number[] = [];
        let targetDieIndex = dieIndex;

        // If dieIndex not provided, find by value
        if (targetDieIndex === -1) {
            targetDieIndex = this.state.dice.indexOf(dieValue);
        }

        if (this.state.pendingBonus) {
            if (this.state.pendingBonus.playerId !== player.id) {
                return { valid: false, reason: 'Waiting for bonus move' };
            }
            usedDiceIndices = [-1];
        } else {
            if (targetDieIndex !== -1) {
                // Validate index exists
                if (targetDieIndex < 0 || targetDieIndex >= this.state.dice.length || this.state.dice[targetDieIndex] === 0) {
                    return { valid: false, reason: 'Die not available' };
                }
                usedDiceIndices = [targetDieIndex];
            } else {
                const piece = player.pieces[pieceIndex];
                const activeDiceIndices = this.state.dice.map((d, i) => d !== 0 ? i : -1).filter(i => i !== -1);

                if (piece.status === 'nest' && dieValue === 5 && activeDiceIndices.length === 2) {
                    if (this.state.dice[0] + this.state.dice[1] === 5) {
                        usedDiceIndices = [0, 1];
                    }
                }
            }
            if (usedDiceIndices.length === 0) {
                return { valid: false, reason: 'Die value not available' };
            }
        }

        // Determine move amount from the SOURCE OF TRUTH (Index -> Value)
        let moveAmount = dieValue;
        if (this.state.pendingBonus) {
            moveAmount = this.state.pendingBonus.amount;
        } else if (usedDiceIndices.length === 1 && usedDiceIndices[0] !== -1) {
            // If using a specific single die, use its actual value from state
            moveAmount = this.state.dice[usedDiceIndices[0]];
        } else if (usedDiceIndices.length === 2) {
            // Special case for 5 composed of 2 dice? (Usually 2+3 or 1+4)
            // If we used 2 dice for entering nest, the value IS 5.
            moveAmount = 5;
        }
        const result = RuleEngine.validateMove(this.state, pieceIndex, moveAmount);

        if (result.valid && (result.newPosition !== undefined || result.enteredGoal)) {
            // Apply move using GameStateManager
            let newState = GameStateManager.applyMove(this.state, pieceIndex, result);

            // Update stats
            const updatedPlayer = newState.players.find(p => p.id === playerId);
            if (updatedPlayer?.stats) {
                updatedPlayer.stats.totalMoves++;
            }

            // Handle dice usage
            const isBonusExecution = usedDiceIndices.length === 1 && usedDiceIndices[0] === -1;
            if (!isBonusExecution) {
                newState = GameStateManager.useDice(newState, usedDiceIndices);
            } else {
                if (!(result.enteredGoal || result.capturedPieceId)) {
                    newState = GameStateManager.clearBonus(newState);
                }
            }

            // Helper to match client-side visual numbering (Starts at 55 for Yellow -> 1)
            const getVisualPosition = (pos: number) => {
                const totalSpaces = 68;
                // Client formula: (i - 55 + 68) % 68 + 1
                return (pos - 55 + totalSpaces) % totalSpaces + 1;
            };

            const visualPos = result.newPosition !== undefined ? getVisualPosition(result.newPosition) : '?';
            this.options.onGameLog(createLog(`${player.name} moved piece ${pieceIndex + 1} to space ${visualPos}${result.enteredGoal ? ' (Goal)' : ''}`, result.enteredGoal ? 'goal' : 'move', player.color));

            // Accumulate time bonus to apply AFTER setState
            // (extendTurnTimer modifies this.state, but setState overwrites it with newState)
            let pendingTimeBonusMs = 0;

            // Handle captures
            if (result.capturedPieceId) {
                // Track stats in player.stats (persisted to DB at game end by gameHistoryService)
                const victimPlayer = newState.players.find(p =>
                    p.pieces.some(pc => pc.id === result.capturedPieceId)
                );
                // Only update stats if it's a multiplayer game (>= 2 human players)
                const humanPlayerCount = this.state.players.filter(p => !!p.userId || !!p.guestId).length;
                const isMultiplayer = humanPlayerCount >= 2;

                if (victimPlayer?.stats) {
                    victimPlayer.stats.piecesLost++;
                    // REAL-TIME DB UPDATE
                    if (isMultiplayer && victimPlayer.userId) {
                        this.options.onStatIncrement(victimPlayer.userId, 'pieces_lost');
                    }
                }

                if (updatedPlayer?.stats) {
                    updatedPlayer.stats.piecesCaptured++;
                    // REAL-TIME DB UPDATE
                    if (isMultiplayer && updatedPlayer.userId) {
                        this.options.onStatIncrement(updatedPlayer.userId, 'pieces_captured');
                    }
                }

                // ANALYTICS: Log capture for Rivalry tracking
                if (victimPlayer) {
                    if (!newState.captureHistory) newState.captureHistory = [];
                    newState.captureHistory.push({
                        capturerId: player.id,
                        victimId: victimPlayer.id,
                        timestamp: Date.now()
                    });
                }

                newState = GameStateManager.grantBonus(newState, player.id, 20);
                this.options.onGameLog(createLog(`${player.name} captured a piece! Bonus of 20.`, 'capture', player.color));

                // TIME BONUS (deferred until after setState)
                if (this.state.options.timeBonusOnCapture > 0) {
                    pendingTimeBonusMs += this.state.options.timeBonusOnCapture * 1000;
                }

                // Check if bonus is playable
                if (!canPlayerMove(newState)) {
                    this.options.onNotification(playerId, 'Bonus of 20 lost! No valid moves.');
                    newState = GameStateManager.clearBonus(newState);
                }
            }

            // Handle goal entry
            if (result.enteredGoal) {
                const piecesInGoal = updatedPlayer?.pieces.filter(p => p.status === 'goal').length || 0;
                if (piecesInGoal === 4) {
                    newState = {
                        ...newState,
                        status: 'finished',
                        winner: player.color
                    };

                    // Stats: 'games_won' handled by gameHistoryService at end of game
                    this.options.onGameFinished(newState);
                    this.options.onGameLog(createLog(`${player.name} has won the game! 🏆`, 'game_end', player.color));
                } else {
                    newState = GameStateManager.grantBonus(newState, player.id, 10);
                    this.options.onGameLog(createLog(`${player.name} moved a piece into the goal! Bonus of 10.`, 'goal', player.color));

                    // TIME BONUS (deferred until after setState)
                    if (this.state.options.timeBonusOnGoal > 0) {
                        pendingTimeBonusMs += this.state.options.timeBonusOnGoal * 1000;
                    }

                    // Check if bonus is playable
                    if (!canPlayerMove(newState)) {
                        this.options.onNotification(playerId, 'Bonus of 10 lost! No valid moves.');
                        newState = GameStateManager.clearBonus(newState);
                    }
                }
            }

            this.setState(newState);

            // Apply deferred time bonus AFTER setState so it doesn't get overwritten
            if (pendingTimeBonusMs > 0 && this.state.status === 'playing') {
                this.extendTurnTimer(pendingTimeBonusMs);
            }

            // Check for turn progression
            if (this.state.status === 'playing' && !this.state.pendingBonus) {
                if (this.state.dice.every(d => d === 0)) {
                    if (this.state.consecutiveDoubles > 0) {
                        // Re-roll on doubles
                        // Re-roll on doubles
                        this.startTurnTimer(this.state.options.turnRollDuration * 1000);
                        this.updateState(state => ({
                            ...state,
                            diceRolled: false
                        }));
                        // Notification removed as redundant (Client UI shows "Doubles! Roll again" status)
                    } else {
                        this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));
                    }
                } else if (!canPlayerMove(this.state)) {
                    const turnSnapshot = `${this.state.currentTurn}-${this.state.totalTurns}`;
                    setTimeout(() => {
                        const currentTurn = `${this.state.currentTurn}-${this.state.totalTurns}`;
                        if (currentTurn !== turnSnapshot || this.state.status !== 'playing') return;

                        if (this.state.currentTurn === player.color && this.state.dice.some(d => d !== 0) && !this.state.pendingBonus) {
                            // Check if doubles were rolled - if so, grant re-roll instead of ending turn
                            // Force re-roll if they have doubles but no moves
                            if (this.state.consecutiveDoubles > 0) {
                                this.startTurnTimer(this.state.options.turnRollDuration * 1000);
                                this.updateState(state => ({
                                    ...state,
                                    diceRolled: false
                                }));
                                this.options.onNotification(player.id, 'Doubles with no moves! Roll again.');
                            } else {
                                this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));
                                this.options.onGameLog(createLog(`Turn passed: Blocked with dice remaining.`, 'turn_change', player.color));
                            }
                        }
                    }, 2000);
                } else {
                    this.checkAutoMove();
                }
            }
        }

        if (!result.valid) {
            // Logs removed for clean production build
        }
        return result;
    }

    public nextTurn() {
        // Clear RuleEngine cache when changing turns
        RuleEngine.clearCache();

        // Use GameStateManager for immutable turn transition
        this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));

        const nextPlayer = this.state.players.find(p => p.color === this.state.currentTurn);
        if (nextPlayer) {
            this.options.onGameLog(createLog(`Turn of ${nextPlayer.name}`, 'turn_change', nextPlayer.color));
        }

        // 1. CHECK: Is there any player connected?
        const connectedPlayers = this.state.players.filter(p => !p.hasLeft && p.isConnected);

        if (connectedPlayers.length === 0) {
            // No players connected - pause game
            this.state.status = 'waiting';
            this.stopTimer();
            this.options.onNotification('all', 'All players have disconnected. Game paused.');
            this.options.onStateChange(this.state);
            return;
        }

        // 2. ITERATIVE: Skip disconnected players
        const maxSkips = this.state.players.length;
        let skips = 0;

        while (skips < maxSkips) {
            const current = this.state.players.find(p => p.color === this.state.currentTurn);
            if (current && !current.hasLeft && current.isConnected) {
                break; // Found a valid player
            }

            this.options.onNotification('all', `${current?.name} is not connected. Skipping turn...`);
            this.updateState(state => GameStateManager.nextTurn(state, this.state.options.turnRollDuration));
            skips++;
        }

        this.startTurnTimer(this.state.options.turnRollDuration * 1000);
    }

    private checkAutoMove() {
        if (!canPlayerMove(this.state)) return;

        // Capture turn version to prevent race conditions
        const turnSnapshot = `${this.state.currentTurn}-${this.state.totalTurns}`;

        // Use a slight delay to allow client to react/animate
        setTimeout(() => {
            // Verify turn hasn't changed
            const currentTurnId = `${this.state.currentTurn}-${this.state.totalTurns}`;
            if (this.state.status !== 'playing' || turnSnapshot !== currentTurnId) return;

            const movable = RuleEngine.getMovablePieces(this.state);
            // ... rest of logic

            // If only 1 piece is movable
            if (movable.length === 1) {
                const m = movable[0];
                const player = this.state.players.find(p => p.color === this.state.currentTurn);
                if (!player) return;

                // Check if it's a mandatory action (Nest Exit or Blockade Break)
                const priorityRules = RuleEngine.getPriorityRules({
                    gameState: this.state,
                    player,
                    dice: this.state.dice,
                    pendingBonus: this.state.pendingBonus,
                    turnId: currentTurnId, // Use verified turnId
                    stateHash: ''
                });

                const isMandatory = priorityRules.some(r => r !== 'NONE');

                if (isMandatory) {
                    // Determine move value
                    let moveValue = -1;
                    let dieIndex = -1;

                    // If sum of 5 (-2) or single die
                    if (m.validDice.length === 1) {
                        const dIndex = m.validDice[0];
                        if (dIndex === -2) {
                            moveValue = 5; // Sum of 5
                            dieIndex = -1; // Special handling in movePiece
                        } else if (dIndex >= 0) {
                            moveValue = this.state.dice[dIndex];
                            dieIndex = dIndex;
                        }
                    }

                    if (moveValue !== -1) {
                        console.log(`[AutoMove] Executing mandatory move for ${player.color} piece ${m.index} val ${moveValue}`);
                        this.movePiece(player.id, m.index, moveValue, dieIndex);
                    }
                }
            }
        }, 800); // 0.8s delay for UX (Snappier but visible)
    }

    private grantBonus(playerId: string, amount: number) {
        this.updateState(state => GameStateManager.grantBonus(state, playerId, amount));
        this.checkAutoMove();
    }

    public restartGame() {
        this.state.status = 'waiting';
        this.state.winner = undefined;
        this.state.dice = [];
        this.state.diceRolled = false;
        this.state.pendingBonus = undefined;
        this.state.consecutiveDoubles = 0;
        this.state.lastMovedPieceId = undefined;
        this.state.blockadeBreakRequired = false;
        this.state.gameVersion = (this.state.gameVersion || 0) + 1;
        this.state.piecesExitedCount = 0;
        this.state.initialTurnStartBlocked = false;
        this.state.totalTurns = 0;
        this.state.startTime = undefined;

        this.state.players.forEach(p => {
            p.stats = undefined; // Reset stats
            p.pieces.forEach(piece => {
                piece.position = -1;
                piece.status = 'nest';
                piece.distanceFromStart = 0;
            });
        });

        // We do NOT start the turn here. We return to waiting room.
        this.stopTimer();
        this.options.onStateChange(this.state);
        this.options.onNotification('all', 'The room has been reset. Waiting for the host to start.');
    }

    public pauseGame(requesterId: string) {
        // Only host can pause
        const isHost = this.state.players.length > 0 && this.state.players[0].id === requesterId;
        if (!isHost) {
            this.options.onNotification(requesterId, 'Only the host can pause the game.');
            return;
        }

        if (this.state.status !== 'playing') {
            this.options.onNotification(requesterId, 'The game is not in progress.');
            return;
        }

        // Stop timer and change status
        this.stopTimer();
        this.state.status = 'paused';
        this.options.onStateChange(this.state);
        this.options.onNotification('all', '⏸️ Game paused by host.');
    }

    public resumeGame(requesterId: string) {
        // Only host can resume
        const isHost = this.state.players.length > 0 && this.state.players[0].id === requesterId;
        if (!isHost) {
            this.options.onNotification(requesterId, 'Only the host can resume the game.');
            return;
        }

        if (this.state.status !== 'paused') {
            this.options.onNotification(requesterId, 'The game is not paused.');
            return;
        }

        // Resume game and restart timer
        this.state.status = 'playing';

        // Restart appropriate timer based on game state
        // Restart appropriate timer based on game state
        if (this.state.diceRolled) {
            this.startTurnTimer(this.state.options.turnDuration * 1000); // Use configured duration
        } else {
            // Use configured roll duration
            this.startTurnTimer(this.state.options.turnRollDuration * 1000);
        }

        this.options.onStateChange(this.state);
        this.options.onNotification('all', '▶️ Game resumed.');
    }

    public shortenTurnTimer(newDurationMs: number) {
        // Only shorten if currently running
        if (!this.timer) return;

        console.log(`[GameEngine] Shortening turn timer to ${newDurationMs}ms`);
        this.startTurnTimer(newDurationMs);
        this.options.onStateChange(this.state);
        this.options.onNotification('all', '⏱️ Turn time reduced due to disconnection.');
    }

    public extendTurnTimer(additionalMs: number) {
        if (!this.timer || !this.state.turnExpireTimestamp) return;

        const now = Date.now();
        const remaining = this.state.turnExpireTimestamp - now;
        if (remaining <= 0) return;

        this.stopTimer();
        const newDuration = remaining + additionalMs;
        console.log(`[GameEngine] Extending turn timer by ${additionalMs}ms. New duration: ${newDuration}ms`);
        this.startTurnTimer(newDuration);
        this.options.onStateChange(this.state);

        // Notify the current player (find socket ID from color)
        const currentPlayer = this.state.players.find(p => p.color === this.state.currentTurn);
        if (currentPlayer) {
            this.options.onNotification(currentPlayer.id, `⏱️ +${additionalMs / 1000}s`);
        }
    }

    private startTurnTimer(duration: number) {
        if (this.timer) clearTimeout(this.timer);
        this.state.turnExpireTimestamp = Date.now() + duration;
        this.state.turnTimeLeft = Math.ceil(duration / 1000); // Update legacy field just in case

        this.timer = setTimeout(() => {
            const player = this.state.players.find(p => p.color === this.state.currentTurn);
            const reason = this.state.diceRolled ? 'No moves in time' : 'Did not roll dice in time';
            if (player) {
                this.options.onGameLog(createLog(`Time out! ${reason}.`, 'turn_change', player.color));
            }
            this.options.onNotification('all', 'Time out! Turn change.');
            this.nextTurn();
            this.options.onStateChange(this.state);
        }, duration);
    }

    public stopTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
