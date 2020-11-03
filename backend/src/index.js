const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { pingInterval: 10000, pingTimeout: 30000 });
const pouchdb = require('pouchdb');
const { newGameState, checkVictory } = require('./gameFunctions');

let db = new pouchdb('fireballdb');
const idleTimeout = 600000; // 10 Minutes

// if (process.argv.includes('--reset-db'))
//     db.destroy().then(() => { db = new pouchdb('fireballdb'); setup(db); });
// else
//     setup(db);

const setup = (db) => io.on('connection', socket => {

    const updateGameState = ({ gameRoomId, gameRoom, msg }) => {
        io.to(gameRoomId).emit('update-game-state', ({
            msg, newGameState: gameRoom.gameState.visible
        }))
    }

    const sendWrongKeyError = () => {
        socket.emit('wrong-key');
        socket.disconnect();
    }

    const timestamp = () => String(new Date().getTime());

    const verifiedGetGameRoom = gameRoomId => new Promise((res, _rej) => {
        db.get(gameRoomId, (err, doc) => {
            if (err) { res(null); }
            else if (doc && doc.timestamp && (Number(timestamp()) - Number(doc.timestamp) > idleTimeout)) {
                console.log(`Room ${gameRoomId} has been idle for too long, restarting...`);
                db.remove(gameRoomId, doc._rev).then(() => { res(null); });
            }
            else {
                let gameRoom = null;
                if (doc) { gameRoom = doc; }
                res(gameRoom);
            }
        })
    });

    const updateGameRoom = (gameRoom, onResOk) => {
        if (gameRoom && gameRoom.players && gameRoom.players.length) {
            db.put({ _id: gameRoom._id, ...(gameRoom ? { _rev: gameRoom._rev } : {}), timestamp: timestamp(), ...gameRoom }, { force: true }, (err, res) => {
                if (err) { return console.log(err); }
                if (res && res.ok) {
                    onResOk();
                }
            });
        } else {
            db.remove(gameRoom).then(res => { console.log(`Removing room ${gameRoom._id}... [${res.ok}]`); });
        }

    }

    socket.on('join-room', ({ gameRoomId, playerId }) => {
        socket.join(gameRoomId);
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom) {
                gameRoom.players.push(playerId);
            } else {
                gameRoom = { _id: gameRoomId, players: [playerId], roomKey: timestamp() };
            }
            if (!gameRoom.admin) {
                gameRoom.admin = playerId;
                io.to(gameRoomId).emit('set-admin', ({ adminId: playerId }));
                console.log(`Admin of room ${gameRoomId} is now ${gameRoom.admin}`);
            }
            updateGameRoom(gameRoom, () => {
                console.log(`Player ${playerId} joined room ${gameRoomId}`);
                io.to(gameRoomId).emit('update-players', {
                    msg: `Player ${playerId} joined room ${gameRoomId}. [ADMIN: ${gameRoom.admin}] [KEY: ${gameRoom.roomKey}]`,
                    players: gameRoom.players,
                    playingPlayers: gameRoom.gameState && gameRoom.gameState.visible && gameRoom.gameState.visible.playingPlayers,
                    newAdminId: gameRoom.admin,
                    roomKey: gameRoom.roomKey
                });
            });
        });
    });

    socket.on('leave-room', ({ gameRoomId, playerId, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.players && gameRoom.players.includes(playerId) && gameRoom.roomKey === roomKey) {
                if (gameRoom && gameRoom.players) {
                    const playerIndex = gameRoom.players.indexOf(playerId);
                    gameRoom.players.splice(playerIndex, 1);
                    if ((gameRoom.admin === playerId) && (gameRoom.players.length >= 0))
                        gameRoom.admin = gameRoom.players[0];
                } else {
                    gameRoom = null;
                }
                updateGameRoom(gameRoom, () => {
                    console.log(`Player ${playerId} left room ${gameRoomId}`);
                    gameRoom && io.to(gameRoomId).emit('update-players', {
                        msg: `Player ${playerId} left room ${gameRoomId}, [ADMIN: ${gameRoom.admin}]`,
                        players: gameRoom.players,
                        newAdminId: gameRoom.admin
                    });
                });
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [LEAVE]`); sendWrongKeyError(); }
        });
        socket.leave(gameRoomId);
    });

    socket.on('start-game', ({ gameRoomId, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.roomKey === roomKey) {
                if (gameRoom && gameRoom.players) {
                    gameRoom.gameState = newGameState(gameRoom);
                    updateGameRoom(gameRoom, () => {
                        console.log(`Game starting on room ${gameRoomId} [PLAYING: ${gameRoom && gameRoom.gameState && gameRoom.gameState.visible && gameRoom.gameState.visible.playingPlayers}]`);
                        io.to(gameRoomId).emit('game-started', ({ newGameState: gameRoom.gameState.visible }));
                    });

                }
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [START]`); sendWrongKeyError(); }
        });

    });

    socket.on('request-cards-update', ({ gameRoomId, playerId, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.roomKey === roomKey) {
                updateGameRoom(gameRoom, () => {
                    socket.emit('cards-update', ({ cards: gameRoom.gameState.deck[playerId] }));
                });
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [REQUEST]`); sendWrongKeyError(); }
        });
    });

    socket.on('card-offer', ({ gameRoomId, playerId, cardOffer, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.roomKey === roomKey) {
                if (gameRoom.gameState) {
                    gs = gameRoom.gameState;
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
                        gsv.victory = checkVictory(gs.deck);;
                        gsv.sender = nextPlayer;
                        gsv.receiver = nextReceiver;
                        gsv.offerCount = 0;
                        gsv.action = 'sender';
                        gs.cardOffer = null;
                        // gsv.scores = gsv.victory ? Object.fromEntries(Object.entries(gsv.scores).map(([player, score]) => [player, score + (gsv.victory.loser === player ? -1 : 1)])) : gsv.scores;
                    }
                    updateGameRoom(gameRoom, () => {
                        updateGameState({ gameRoomId, gameRoom });
                    });
                }
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [OFFER]`); sendWrongKeyError(); }
        });
    })

    socket.on('accept-offer', ({ gameRoomId, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.roomKey === roomKey) {
                if (gameRoom && gameRoom.gameState) {
                    gs = gameRoom.gameState;
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
                    // gsv.scores = gsv.victory ? Object.fromEntries(Object.entries(gsv.scores).map(([player, score]) => [player, (score || 0) + (gsv.victory.loser === player ? -1 : 1)])) : gsv.scores;
                    updateGameRoom(gameRoom, () => {
                        updateGameState({ gameRoomId, gameRoom });
                    });
                }
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [ACCEPT]`); sendWrongKeyError(); }
        });
    });

    socket.on('decline-offer', ({ gameRoomId, roomKey }) => {
        verifiedGetGameRoom(gameRoomId).then(gameRoom => {
            if (gameRoom && gameRoom.roomKey === roomKey) {
                if (gameRoom && gameRoom.gameState) {
                    gs = gameRoom.gameState;
                    console.log(gs)
                    gsv = gs.visible;
                    console.log(`Card offer no. ${gsv.offerCount} made by ${gsv.sender} to ${gsv.receiver} is DECLINED`);
                    gsv.action = 'sender';
                    gsv.offerCount++;
                    updateGameRoom(gameRoom, () => {
                        updateGameState({ gameRoomId, gameRoom });
                    });
                }
            } else { console.error(`Wrong key [${roomKey}] used in ${gameRoomId} [DECLINE]`); sendWrongKeyError(); }
        });
    });

    console.log("A new user has connected.");
});

setup(db);

http.listen(4000, '192.168.137.1', () => {
    console.log('Server listening on port 4000');
});