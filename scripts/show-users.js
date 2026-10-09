#!/usr/bin/env node

/**
 * Script to extract and display all registered users from the database
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/parchis.db');

try {
    const db = new Database(dbPath, { readonly: true });

    // Query all users with their statistics
    const users = db.prepare(`
        SELECT 
            id,
            username,
            role,
            is_banned,
            games_played,
            games_won,
            pieces_captured,
            pieces_lost,
            total_dice_sum,
            total_dice_rolls,
            total_doubles,
            created_at
        FROM users
        ORDER BY games_played DESC, pieces_captured DESC
    `).all();

    console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              REGISTERED USERS STATISTICS                                       ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

    if (users.length === 0) {
        console.log('No registered users found in the database.\n');
        db.close();
        process.exit(0);
    }

    console.log(`Total Users: ${users.length}\n`);

    // Table header
    console.log('┌──────┬────────────────┬────────┬────────┬────────┬──────────┬──────────┬─────────┬──────────┬─────────┐');
    console.log('│  ID  │   Username     │  Role  │ Banned │ Played │   Won    │ Captured │  Lost   │  Avg Die │ Doubles │');
    console.log('├──────┼────────────────┼────────┼────────┼────────┼──────────┼──────────┼─────────┼──────────┼─────────┤');

    // Table rows
    users.forEach(user => {
        const avgDie = user.total_dice_rolls > 0
            ? (user.total_dice_sum / user.total_dice_rolls).toFixed(2)
            : '0.00';

        const doublesPercent = user.total_dice_rolls > 0
            ? ((user.total_doubles / user.total_dice_rolls) * 100).toFixed(1)
            : '0.0';

        const winRate = user.games_played > 0
            ? ((user.games_won / user.games_played) * 100).toFixed(0)
            : '0';

        console.log(
            `│ ${String(user.id).padStart(4)} │ ${user.username.padEnd(14).substring(0, 14)} │ ${user.role.padEnd(6)} │ ${user.is_banned ? ' Yes  ' : '  No  '} │ ${String(user.games_played).padStart(6)} │ ${String(user.games_won).padStart(4)}(${String(winRate).padStart(2)}%) │ ${String(user.pieces_captured).padStart(8)} │ ${String(user.pieces_lost).padStart(7)} │ ${String(avgDie).padStart(8)} │ ${String(doublesPercent).padStart(5)}% │`
        );
    });

    console.log('└──────┴────────────────┴────────┴────────┴────────┴──────────┴──────────┴─────────┴──────────┴─────────┘\n');

    // Summary statistics
    const totalGames = users.reduce((sum, u) => sum + u.games_played, 0);
    const totalCaptures = users.reduce((sum, u) => sum + u.pieces_captured, 0);
    const totalLosses = users.reduce((sum, u) => sum + u.pieces_lost, 0);
    const avgGamesPerUser = users.length > 0 ? (totalGames / users.length).toFixed(1) : 0;

    console.log('Summary:');
    console.log(`  • Total Games Played: ${totalGames}`);
    console.log(`  • Total Pieces Captured: ${totalCaptures}`);
    console.log(`  • Total Pieces Lost: ${totalLosses}`);
    console.log(`  • Average Games per User: ${avgGamesPerUser}`);
    console.log(`  • Active Users (played ≥1 game): ${users.filter(u => u.games_played > 0).length}`);
    console.log(`  • Banned Users: ${users.filter(u => u.is_banned).length}\n`);

    db.close();

} catch (error) {
    console.error('Error reading database:', error.message);
    console.error('\nMake sure the database exists at:', dbPath);
    process.exit(1);
}
