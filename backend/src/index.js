const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { newGameState, checkVictory } = require('./gameFunctions');

let db = {};

io.on('connection', socket => {

    const updateGameState = ({ gameRoomId, msg }) => {
        io.to(gameRoomId).emit('update-game-state', ({
            msg, newGameState: db[gameRoomId].gameState.visible
        }))
    }

    const sendWrongKeyError = () => {
        socket.emit('wrong-key');
        socket.disconnect();
    }

    socket.on('join-room', ({ gameRoomId, playerId }) => {
        socket.join(gameRoomId);
        console.log(db[gameRoomId]);
        if (db[gameRoomId]) {
            db[gameRoomId].players.push(playerId);
        } else {
            db[gameRoomId] = { players: [playerId], roomKey: String(new Date().getTime()) };
        }
        if (!db[gameRoomId].admin) {
            db[gameRoomId].admin = playerId;
            io.to(gameRoomId).emit('set-admin', ({ adminId: playerId }));
            console.log(`Admin of room ${gameRoomId} is now ${db[gameRoomId].admin}`);
        }
        console.log(`Player ${playerId} joined room ${gameRoomId}`);
        io.to(gameRoomId).emit('update-players', {
            msg: `Player ${playerId} joined room ${gameRoomId}. [ADMIN: ${db[gameRoomId].admin}] [KEY: ${db[gameRoomId].roomKey}]`,
            players: db[gameRoomId].players,
            playingPlayers: db[gameRoomId].gameState && db[gameRoomId].gameState.visible && db[gameRoomId].gameState.visible.playingPlayers,
            newAdminId: db[gameRoomId].admin,
            roomKey: db[gameRoomId].roomKey
        });
    });

    socket.on('leave-room', ({ gameRoomId, playerId, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].players && db[gameRoomId].players.includes(playerId) && db[gameRoomId].roomKey === roomKey) {
            if (db[gameRoomId] && db[gameRoomId].players) {
                const playerIndex = db[gameRoomId].players.indexOf(playerId);
                db[gameRoomId].players.splice(playerIndex, 1);
                if ((db[gameRoomId].admin === playerId) && (db[gameRoomId].players.length >= 0))
                    db[gameRoomId].admin = db[gameRoomId].players[0];
            } else {
                db[gameRoomId] = null;
            }
            console.log(`Player ${playerId} left room ${gameRoomId}`);
            db[gameRoomId] && io.to(gameRoomId).emit('update-players', {
                msg: `Player ${playerId} left room ${gameRoomId}, [ADMIN: ${db[gameRoomId].admin}]`,
                players: db[gameRoomId].players,
                newAdminId: db[gameRoomId].admin
            });
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [LEAVE]`); sendWrongKeyError(); }
        socket.leave(gameRoomId);
    });

    socket.on('start-game', ({ gameRoomId, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].roomKey === roomKey) {
            if (db[gameRoomId] && db[gameRoomId].players) {
                db[gameRoomId].gameState = newGameState(db[gameRoomId]);
                console.log(db[gameRoomId].gameState)
                console.log(`Game starting on room ${gameRoomId} [PLAYING: ${db[gameRoomId] && db[gameRoomId].gameState && db[gameRoomId].gameState.visible && db[gameRoomId].gameState.visible.playingPlayers}]`);
                io.to(gameRoomId).emit('game-started', ({ newGameState: db[gameRoomId].gameState.visible }));
            }
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [START]`); sendWrongKeyError(); }
    });

    socket.on('request-cards-update', ({ gameRoomId, playerId, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].roomKey === roomKey) {
            socket.emit('cards-update', ({ cards: db[gameRoomId].gameState.deck[playerId] }));
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [REQUEST]`); sendWrongKeyError(); }
    });

    socket.on('card-offer', ({ gameRoomId, playerId, cardOffer, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].roomKey === roomKey) {

            if (db[gameRoomId] && db[gameRoomId].gameState) {
                gs = db[gameRoomId].gameState;
                gsv = gs.visible;
                gs.cardOffer = cardOffer;
                console.log(`Card offer no. ${gsv.offerCount} made by ${gsv.sender} to ${gsv.receiver} (Card index ${cardOffer})`);
                const nPlayers = gsv.playingPlayers.length;
                const currentPlayerIndex = gsv.playingPlayers.indexOf(playerId);
                const nextPlayer = gsv.playingPlayers[(currentPlayerIndex + 1) % nPlayers];
                const nextReceiver = gsv.playingPlayers[(currentPlayerIndex + 2) % nPlayers];
                const offerCount = gsv.offerCount;
                if (offerCount < 3) {
                    // Send Accept/Reject
                    gsv.action = 'receiver';
                    gsv.offerCount++;
                } else {
                    // Send Replace
                    const sentCard = gs.deck[playerId].splice(cardOffer, 1);
                    gs.deck[nextPlayer].push(sentCard);
                    gsv.victory = checkVictory(gs.deck);
                    gsv.sender = nextPlayer;
                    gsv.receiver = nextReceiver;
                    gsv.offerCount = 0;
                    gsv.action = 'sender';
                    gs.cardOffer = null;
                }
                updateGameState({ gameRoomId });
            }
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [OFFER]`); sendWrongKeyError(); }
    })

    socket.on('accept-offer', ({ gameRoomId, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].roomKey === roomKey) {
            if (db[gameRoomId] && db[gameRoomId].gameState) {
                gs = db[gameRoomId].gameState;
                console.log(gs)
                gsv = gs.visible;
                const nPlayers = gsv.playingPlayers.length;
                console.log(`Card offer no. ${gsv.offerCount} made by ${gsv.sender} to ${gsv.receiver} is ACCEPTED`);
                const sentCard = gs.deck[gsv.sender].splice(gs.cardOffer, 1)[0];
                console.log(sentCard);
                gs.deck[gsv.receiver].push(sentCard);
                gsv.victory = checkVictory(gs.deck);
                gsv.sender = gsv.receiver;
                gsv.receiver = gsv.playingPlayers[((gsv.playingPlayers.indexOf(gsv.receiver) + 1) % nPlayers)];
                gsv.action = 'sender';
                gsv.offerCount = 0;
                updateGameState({ gameRoomId });
            }
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [ACCEPT]`); sendWrongKeyError(); }
    });

    socket.on('decline-offer', ({ gameRoomId, roomKey }) => {
        if (db[gameRoomId] && db[gameRoomId].roomKey === roomKey) {
            if (db[gameRoomId] && db[gameRoomId].gameState) {
                gs = db[gameRoomId].gameState;
                console.log(gs)
                gsv = gs.visible;
                console.log(`Card offer no. ${gsv.offerCount} made by ${gsv.sender} to ${gsv.receiver} is DECLINED`);
                gsv.action = 'sender';
                gsv.offerCount++;
                updateGameState({ gameRoomId });
            }
        } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [DECLINE]`); sendWrongKeyError(); }
    });

    console.log("A new user has connected.");
});

http.listen(4000, () => {
    console.log('Server listening on port 4000');
});