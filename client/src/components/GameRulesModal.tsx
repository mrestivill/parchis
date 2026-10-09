
import React from 'react';
import { DICE_MAX, HOME_PATH_LENGTH, ROLL_TIMEOUT, MOVE_TIMEOUT } from '@parchis/shared';

interface GameRulesModalProps {
    onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ onClose }) => {
    return (
        <div className="flex flex-col w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 max-h-[90vh]">
            <div className="p-6 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    📜 Game Rules
                </h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-slate-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-600 transition-all font-bold"
                >
                    ✕
                </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-gray-600">

                {/* 1. Objective */}
                <section>
                    <h3 className="text-lg font-black text-yellow-500 mb-2 uppercase tracking-wide">🏆 Objective</h3>
                    <p className="text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
                        Move all 4 of your pieces from the nest (Home) to the final goal. The first player to do so wins the game.
                    </p>
                </section>

                {/* 2. Turns and Movement */}
                <section>
                    <h3 className="text-lg font-black text-blue-500 mb-2 uppercase tracking-wide">🎲 Turns and Movement</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300 font-medium marker:text-blue-500">
                        <li>
                            You have <strong>{ROLL_TIMEOUT} seconds</strong> to roll and <strong>{MOVE_TIMEOUT} seconds</strong> to move. If time runs out, you lose your turn.
                        </li>
                        <li>
                            <strong>Two dice</strong> (from 1 to {DICE_MAX}) are rolled in each turn.
                        </li>
                        <li>
                            You must move the exact sum of the dice. You can split the values between two pieces or move a single one with the total sum.
                        </li>
                        <li>
                            If you roll a <strong>5</strong> (or the sum is 5) and you have pieces in the Nest, you are forced to move a piece to the starting square.
                        </li>
                    </ul>
                </section>

                {/* 3. Pairs (Doubles) */}
                <section>
                    <h3 className="text-lg font-black text-purple-500 mb-2 uppercase tracking-wide">✨ Pairs (Doubles)</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300 font-medium marker:text-purple-500">
                        <li>
                            If you roll doubles (e.g., 4-4), you take another turn after moving.
                        </li>
                        <li>
                            <strong>Watch out!</strong> If you roll doubles <strong>3 times in a row</strong>, the last piece moved is returned to the Nest (penalty), unless it is in the home stretch.
                        </li>
                    </ul>
                </section>

                {/* 4. Captures and Blockades */}
                <section>
                    <h3 className="text-lg font-black text-red-500 mb-2 uppercase tracking-wide">⚔️ Captures and Blockades</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300 font-medium marker:text-red-500">
                        <li>
                            <strong>Capture (Eat):</strong> If you land on a square occupied by an opponent (that is not a safe square), you send them to the Nest and gain a <strong>Bonus of 20 moves</strong>.
                        </li>
                        <li>
                            <strong>Blockades (Barriers):</strong> Two pieces of the same color on a safe square form a blockade. No one can pass through it.
                        </li>
                        <li>
                            <strong>Breaking a Blockade:</strong> If you have your own blockade and roll doubles, you are <strong>forced</strong> to break the blockade by moving one of the pieces.
                        </li>
                    </ul>
                </section>

                {/* 5. The Goal */}
                <section>
                    <h3 className="text-lg font-black text-green-500 mb-2 uppercase tracking-wide">🏁 The Goal</h3>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300 font-medium marker:text-green-500">
                        <li>
                            You must enter the goal with an exact roll. The final path has <strong>{HOME_PATH_LENGTH} squares</strong>.
                        </li>
                        <li>
                            When a piece reaches the goal, you gain a <strong>Bonus of 10 moves</strong> with another piece.
                        </li>
                    </ul>
                </section>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 text-center">
                <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    Parchis Royale v{__APP_VERSION__}
                </p>
            </div>
        </div>
    );
};
