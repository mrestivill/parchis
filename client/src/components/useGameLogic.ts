import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { GameState, PlayerColor, Piece } from '@parchis/shared';
import { RuleEngine } from '@parchis/shared';
import { soundManager } from '../utils/soundManager';

interface UseGameLogicProps {
    gameState: GameState | null;
    playerColor: PlayerColor | null;
    isSpectator: boolean;
    settings: any;
    notification: string | null;
    startingSelection: any;
    onRollDice: () => void;
    onMovePiece: (pieceIndex: number, dieValue: number) => void;
    isUIBlocked: boolean;
}

export const useGameLogic = ({
    gameState,
    playerColor,
    isSpectator,
    settings,
    notification,
    startingSelection,
    onRollDice,
    onMovePiece,
    isUIBlocked
}: UseGameLogicProps) => {
    const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(15);

    // Derived selected ID for visualization
    const selectedPieceId = (gameState && selectedPieceIndex !== null && playerColor)
        ? gameState.players.find(p => p.color === playerColor)?.pieces[selectedPieceIndex]?.id ?? null
        : null;

    // Derived: Is it my turn?
    const isMyTurn = !isSpectator && gameState?.status === 'playing' && gameState?.currentTurn === playerColor;

    // Timer Logic
    useEffect(() => {
        if (!gameState?.turnExpireTimestamp) return;

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.ceil((gameState.turnExpireTimestamp! - now) / 1000));
            setTimeLeft(diff);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 200);
        return () => clearInterval(interval);
    }, [gameState?.turnExpireTimestamp]);

    // Sound Effects & Turn Notifications
    const prevTurn = useRef(gameState?.currentTurn);
    const prevDice = useRef(gameState?.dice || []);
    const prevNotification = useRef(notification);

    useEffect(() => {
        if (!gameState) return;

        // Turn Change
        if (prevTurn.current !== gameState.currentTurn) {
            if (gameState.currentTurn === playerColor) {
                soundManager.playTurn();
            }
            prevTurn.current = gameState.currentTurn;
        }

        // Dice Roll
        if (prevDice.current.length === 0 && gameState.dice.length > 0) {
            soundManager.playDiceRoll();
        }
        prevDice.current = gameState.dice;

        // Notifications
        if (notification && notification !== prevNotification.current) {
            if (notification.toLowerCase().includes('invalid') || notification.toLowerCase().includes('forced') || notification.toLowerCase().includes('error')) {
                soundManager.playError();
            } else {
                soundManager.playChat();
            }
        }
        prevNotification.current = notification;
    }, [gameState, playerColor, notification]);

    // Turn Notification (Tab title, vibration)
    useEffect(() => {
        if (!isMyTurn) {
            document.title = 'Parchis Royale';
            return;
        }

        let isVisible = true;
        const titleInterval = setInterval(() => {
            document.title = isVisible ? '🎲 YOUR TURN!' : 'Parchis Royale';
            isVisible = !isVisible;
        }, 1000);

        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        return () => {
            clearInterval(titleInterval);
            document.title = 'Parchis Royale';
        };
    }, [isMyTurn]);

    // Move Validation Logic - Memoized
    const getValidDiceForPiece = useCallback((pIndex: number) => {
        if (!gameState) return [];
        // Pending Bonus
        if (gameState.pendingBonus) {
            const valid = RuleEngine.validateMove(gameState, pIndex, gameState.pendingBonus.amount).valid;
            return valid ? [0] : [];
        }

        if (!gameState.diceRolled) return [];
        const validIndices: number[] = [];

        gameState.dice.forEach((d, i) => {
            const res = RuleEngine.validateMove(gameState, pIndex, d);
            if (d !== 0 && res.valid) {
                validIndices.push(i);
            }
        });

        // Sum of 5 check
        const piece = gameState.players.find(p => p.color === playerColor)?.pieces[pIndex];
        const activeDice = gameState.dice.filter(d => d !== 0);
        if (piece?.status === 'nest' && activeDice.length === 2 && (activeDice[0] + activeDice[1] === 5)) {
            // Basic check if 5 is valid move
            if (RuleEngine.validateMove(gameState, pIndex, 5).valid) {
                gameState.dice.forEach((d, i) => {
                    if (d !== 0) validIndices.push(i);
                });
            }
        }

        return validIndices;
    }, [gameState, playerColor]);

    // Track processed dice to prevents premature move hints before animation starts
    // Use State instead of Ref to force re-render when latch updates
    const [processedDice, setProcessedDice] = useState<string>('');

    // Update state when dice change (Effect runs AFTER render)
    useEffect(() => {
        if (gameState?.dice) {
            setProcessedDice(gameState.dice.join(','));
        }
    }, [gameState?.dice]);

    // Optimization: Deconstruct state to primitives for stable memoization
    const diceStr = gameState?.dice.join(',') || '';
    const playerPiecesStr = useMemo(() => {
        if (!gameState || !playerColor) return '';
        const p = gameState.players.find(pl => pl.color === playerColor);
        return p ? JSON.stringify(p.pieces) : '';
    }, [gameState, playerColor]);
    const currentTurn = gameState?.currentTurn;
    const gameStatus = gameState?.status;
    const blockadeRequired = gameState?.blockadeBreakRequired;

    const movablePieceIndices = useMemo(() => {
        if (!gameState || !isMyTurn || isUIBlocked) return [];

        // If dice have changed but Effect hasn't updated state yet, it means this is the FIRST render
        // with new dice. We must block to allow UI to enter "Blocking" state (animation).
        // Note: We use the local primitive 'diceStr' which comes from gameState
        if (gameState.diceRolled && diceStr !== processedDice) {
            return [];
        }

        const player = gameState.players.find(p => p.color === playerColor);
        if (!player) return [];

        // We use RuleEngine with the full state, but we only trigger this calculation 
        // when the relevant primitives (dice, pieces, turn, status) change.
        return RuleEngine.getMovablePieces(gameState).map(mp => mp.index);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diceStr, playerPiecesStr, currentTurn, gameStatus, isMyTurn, isUIBlocked, processedDice, blockadeRequired]);

    // Auto Roll & Auto Move Logic
    useEffect(() => {
        if (!isMyTurn || !gameState || gameState.diceRolled || isUIBlocked || !settings.game.autoRoll || startingSelection) return;
        const timer = setTimeout(onRollDice, 800);
        return () => clearTimeout(timer);
    }, [isMyTurn, gameState?.diceRolled, isUIBlocked, settings.game.autoRoll, startingSelection, onRollDice]);

    useEffect(() => {
        if (!isMyTurn || isUIBlocked || !gameState) return;
        const movablePieces = RuleEngine.getMovablePieces(gameState);
        if (movablePieces.length === 0) return;

        const player = gameState.players.find(p => p.color === playerColor);
        if (player) {
            const nestMovable = movablePieces.find(mp => player.pieces[mp.index].status === 'nest');
            if (nestMovable) {
                const timer = setTimeout(() => {
                    onMovePiece(nestMovable.index, 5);
                    soundManager.playMove();
                }, 800);
                return () => clearTimeout(timer);
            }
        }

        if (movablePieces.length === 1 && !gameState.pendingBonus) {
            const activeDice = gameState.dice.filter(d => d !== 0);
            const isDoubles = activeDice.length === 2 && activeDice[0] === activeDice[1];
            if (activeDice.length === 1 || isDoubles) {
                const timer = setTimeout(() => {
                    onMovePiece(movablePieces[0].index, activeDice[0]);
                    soundManager.playMove();
                }, 800);
                return () => clearTimeout(timer);
            }
        }
    }, [isMyTurn, isUIBlocked, gameState, playerColor, onMovePiece]);

    // Action Handlers
    const handlePieceClick = useCallback((piece: Piece) => {
        console.log(`[DEBUG] Clicked piece ${piece.id}`);
        if (isSpectator) { console.log('[DEBUG] Spectator ignore'); return; }
        if (!gameState) return;
        if (!isMyTurn) { console.log('[DEBUG] Not my turn'); return; }
        if (gameState.dice.length === 0) { console.log('[DEBUG] No dice'); return; }
        if (isUIBlocked) { console.log('[DEBUG] UI Blocked'); return; }

        const pieceIndex = parseInt(piece.id.split('-')[1]);
        if (!movablePieceIndices.includes(pieceIndex)) {
            console.log('[DEBUG] Piece not in movable indices, ignoring click');
            return;
        }

        // User wants "Select Piece -> Select Die" flow always.
        // If piece is not selected, select it first.
        if (selectedPieceIndex !== pieceIndex) {
            console.log(`[DEBUG] Selecting piece ${pieceIndex}`);
            setSelectedPieceIndex(pieceIndex);
            soundManager.playClick();
            return;
        }

        // Calculate valid dice only if already selected
        const validDiceIndices = getValidDiceForPiece(pieceIndex);
        console.log(`[DEBUG] Valid dice for selected piece ${pieceIndex}:`, validDiceIndices);

        if (validDiceIndices.length === 0) {
            console.log('[DEBUG] No valid dice found for selected piece');
            return;
        }

        // If piece is ALREADY selected, and we click it again, AND there is only 1 valid move, execute it.
        // OR if there are multiple, clicking it again does nothing (waiting for die click).
        if (validDiceIndices.length === 1) {
            console.log(`[DEBUG] Confirming single move for ${pieceIndex}`);
            const pieceObj = gameState.players.find(p => p.color === playerColor)?.pieces[pieceIndex];
            if (pieceObj?.status === 'nest' && gameState.dice.length === 2 && (gameState.dice[0] + gameState.dice[1] === 5)) {
                onMovePiece(pieceIndex, 5);
                soundManager.playMove();
            } else if (gameState.pendingBonus) {
                onMovePiece(pieceIndex, gameState.pendingBonus.amount);
                soundManager.playMove();
            } else {
                onMovePiece(pieceIndex, gameState.dice[validDiceIndices[0]]);
                soundManager.playMove();
            }
            setSelectedPieceIndex(null);
        } else {
            console.log(`[DEBUG] Multiple dice enable selection`);
            setSelectedPieceIndex(pieceIndex);
        }
    }, [isSpectator, gameState, isMyTurn, isUIBlocked, playerColor, movablePieceIndices, selectedPieceIndex, onMovePiece, getValidDiceForPiece]);

    const handleDieClick = useCallback((_dieIndex: number, dieValue: number) => {
        if (isSpectator || !gameState || selectedPieceIndex === null || isUIBlocked) return;
        const piece = gameState.players.find(p => p.color === playerColor)?.pieces[selectedPieceIndex];
        if (piece?.status === 'nest' && (gameState.dice[0] + gameState.dice[1] === 5)) {
            onMovePiece(selectedPieceIndex, 5);
        } else {
            onMovePiece(selectedPieceIndex, dieValue);
        }
        soundManager.playMove();
        setSelectedPieceIndex(null);
    }, [isSpectator, gameState, selectedPieceIndex, isUIBlocked, playerColor, onMovePiece]);

    const clearSelection = () => setSelectedPieceIndex(null);

    // Reset selection when turn changes
    useEffect(() => {
        setSelectedPieceIndex(null);
    }, [gameState?.currentTurn, gameState?.diceRolled]);

    return {
        selectedPieceIndex,
        selectedPieceId,
        timeLeft,
        isMyTurn,
        movablePieceIndices,
        validDiceIndices: selectedPieceIndex !== null ? getValidDiceForPiece(selectedPieceIndex) : [],
        handlePieceClick,
        handleDieClick,
        clearSelection
    };
};
