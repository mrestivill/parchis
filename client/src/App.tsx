import { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';

import { ThemeProvider, useUITheme } from './context/ThemeContext';

function AppContent() {
  const { } = useUITheme(); // Keep hook call for side-effects if any, or just remove if only using classes
  const {
    isConnected,
    currentRoom,
    gameState,
    playerColor,
    error,
    notification,
    user,
    login,
    register,
    logout,
    createRoom,
    joinRoom,
    socket,
    rollDice,
    movePiece,
    restartGame,
    kickPlayer,
    startGameManually,
    messages,
    gameLog,
    sendMessage,
    isKicked,
    activeEmotes,
    sendEmote,
    getRoomDetails,
    isSpectator,
    updateGameOptions,
    leaveRoom,
    startingSelection,
    clearStartingSelection,
    voteRestart,
    adminStats,
    adminUsers,
    fetchAdminStats,
    fetchAdminUsers,
    performAdminAction,
    adminSettings,
    fetchAdminSettings,
    saveAdminSettings,
    pauseGame,
    resumeGame,
    changeColor,
    publicLeaderboards,
    fetchLeaderboards,
    userStats,
    fetchUserStats,
    statsLoading
  } = useGameSocket();

  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Deep Link Support for /admin
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setShowAdmin(true);
    }

    // Ensure Guest ID exists
    if (!localStorage.getItem('parchis_guest_id')) {
      const newId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('parchis_guest_id', newId);
      console.log('[APP] Generated new Guest ID:', newId);
    }
  }, []);

  // Auto-close auth modal when user logs in
  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  const [connTimeout, setConnTimeout] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => setConnTimeout(true), 8000);
      return () => clearTimeout(timer);
    } else {
      setConnTimeout(false);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950 relative transition-colors duration-300 safe-pt">

      {/* Reconnection Overlay - Shows only when disconnected but preserves game state visibility */}
      {!isConnected && (
        <div className="fixed inset-0 z-[150] pointer-events-none flex flex-col items-center justify-start pt-20 animate-in fade-in duration-300">
          {/* Main Status Toast */}
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span className="font-bold tracking-wide uppercase text-xs">Reconnecting...</span>
          </div>

          {/* Extended Diagnostics (Only after timeout) */}
          {connTimeout && (
            <div className="mt-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl border border-red-500/30 shadow-2xl max-w-xs w-full text-center pointer-events-auto animate-in slide-in-from-top-2">
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
                The connection is unstable. Attempting to recover session...
              </p>
              {error && <p className="text-[10px] font-mono text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 p-2 rounded">Error: {error}</p>}
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      )}

      {isKicked && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border-2 border-red-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">👢</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Kicked!</h2>
            <p className="text-slate-600 dark:text-gray-300 mb-6">You have been removed from the room by the host.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors uppercase tracking-wider shadow-lg"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-full flex items-center justify-center border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 z-10 shadow-lg"
            >
              ✕
            </button>
            <AuthModal
              onLogin={login}
              onRegister={register}
              error={error}
            />
          </div>
        </div>
      )}

      {/* RENDER CONTENT EVEN IF DISCONNECTED - The overlay above handles the warning */}
      {!currentRoom ? (
        <Lobby
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          getRoomDetails={getRoomDetails}
          user={user}
          onLogout={logout}
          onShowAuth={() => setShowAuth(true)}
          onShowAdmin={() => setShowAdmin(true)}
          error={error}
          publicLeaderboards={publicLeaderboards}
          onFetchLeaderboards={fetchLeaderboards}
          userStats={userStats}
          fetchUserStats={fetchUserStats}
          statsLoading={statsLoading}
        />
      ) : (
        <Game
          gameState={gameState}
          playerColor={playerColor}
          isSpectator={isSpectator}
          onRollDice={rollDice}
          onMovePiece={movePiece}
          onRestartGame={restartGame}
          onVoteRestart={voteRestart}
          isHost={!!gameState && gameState.players.length > 0 && gameState.players[0].id === socket?.id}
          onStartGame={startGameManually}
          onUpdateOptions={updateGameOptions}
          onKickPlayer={kickPlayer}
          onLeaveRoom={leaveRoom}
          messages={messages}
          gameLog={gameLog}
          onSendMessage={sendMessage}
          notification={notification}
          activeEmotes={activeEmotes}
          onSendEmote={sendEmote}
          startingSelection={startingSelection}
          clearStartingSelection={clearStartingSelection}
          onPauseGame={pauseGame}
          onResumeGame={resumeGame}
          onSelectColor={(color) => {
            if (currentRoom) {
              changeColor(color);
            }
          }}
        />
      )}

      {showAdmin && user?.role === 'admin' && (
        <AdminDashboard
          stats={adminStats}
          users={adminUsers}
          onFetchStats={fetchAdminStats}
          onFetchUsers={fetchAdminUsers}
          onAction={performAdminAction}
          onFetchSettings={fetchAdminSettings}
          onSaveSettings={saveAdminSettings}
          settings={adminSettings}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
