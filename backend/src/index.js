const gameFunctions = require('./gameFunctions');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { newGameState } = require('./gameFunctions');

let db = {}

io.on('connection', socket => {

    socket.on('join-room', ({ gameRoomId, playerId }) => {
        socket.join(gameRoomId);
        if (db[gameRoomId]) {
            db[gameRoomId].players.push(playerId);
        } else {
            db[gameRoomId] = { players: [playerId] };
        }
        if (db[gameRoomId].players.length === 1)
            socket.emit('set-admin');
        console.log(`Player ${playerId} joined room ${gameRoomId}`);
        io.to(gameRoomId).emit('update-players', {
            msg: `Player ${playerId} joined room ${gameRoomId}`,
            players: db[gameRoomId].players
        });
    });

    socket.on('leave-room', ({ gameRoomId, playerId }) => {
        socket.leave(gameRoomId);
        if (db[gameRoomId] && db[gameRoomId].players) {
            const playerIndex = db[gameRoomId].players.indexOf(playerId);
            db[gameRoomId].players.splice(playerIndex, 1);
        } else {
            db[gameRoomId] = { players: [] };
        }
        console.log(`Player ${playerId} left room ${gameRoomId}`);
        io.to(gameRoomId).emit('update-players', {
            msg: `Player ${playerId} left room ${gameRoomId}`,
            players: db[gameRoomId].players
        });
    });

    socket.on('start-game', ({ gameRoomId }) => {
        if (db[gameRoomId] && db[gameRoomId].players) {
            db[gameRoomId].gameState = newGameState(db[gameRoomId]);
            io.to(gameRoomId).emit('game-started', ({ newGameState: db[gameRoomId].gameState.visible }));
        }
    });

    socket.on('request-cards-update', ({ gameRoomId, playerId }) => {
        socket.emit('cards-update', ({ cards: db[gameRoomId].gameState.deck[playerId] }));
    });

    socket.on('play-turn', ({ gameRoomId, playerId, cardIndex }) => {
        if (db[gameRoomId].gameState) {
            const currentPlayerIndex = db[gameRoomId].gameState.visible.playingPlayers.indexOf(playerId);
            const nextPlayerIndex = (currentPlayerIndex + 1) < db[gameRoomId].gameState.visible.playingPlayers.length ?
                currentPlayerIndex + 1 : 0;
            const nextPlayer = db[gameRoomId].gameState.visible.playingPlayers[nextPlayerIndex];
            const sentCard = db[gameRoomId].gameState.deck[playerId].splice(cardIndex, 1);
            db[gameRoomId].gameState.deck[nextPlayer].push(sentCard);
            db[gameRoomId].gameState.visible.turn = nextPlayer;
            io.to(gameRoomId).emit('update-game-state', ({
                msg: 'Pop', newGameState: db[gameRoomId].gameState.visible
            }))
        }
    })

    console.log("A new user has connected.");
});

http.listen(4000, () => {
    console.log('Server listening on port 4000');
});