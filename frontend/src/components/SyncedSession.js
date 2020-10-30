import React, { useEffect, useState } from "react";
import io from 'socket.io-client';
import Card from './Card';

const socket = io(`http://localhost:4000/`);


const SyncedSession = ({ gameRoomId }) => {

    const [playerId, setPlayerId] = useState('')
    const [players, setPlayers] = useState([]);
    const [joined, setJoined] = useState(false);
    const [started, setStarted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [gameState, setGameState] = useState({});
    const [playerCards, setPlayerCards] = useState([]);
    const [turn, setTurn] = useState('');
    const [cardOffers, setCardOffers] = useState([]);


    useEffect(() => {

        socket.on('update-players', ({ msg, players }) => { console.log(msg); setPlayers(players); });
        socket.on('update-game-state', ({ msg, newGameState }) => { console.log(msg); setGameState(newGameState); });
        socket.on('cards-update', ({ cards }) => { setPlayerCards(cards) })

        socket.on('game-started', ({ newGameState }) => { setGameState(newGameState); setStarted(true); setTurn(newGameState.turn); });
        socket.once('set-admin', () => { setIsAdmin(true) });

        return () => {
            leaveRoom();
        }
    }, []);


    useEffect(() => {
        joined && window.addEventListener("beforeunload", (event) => { event.preventDefault(); leaveRoom(); });
    }, [joined])

    const leaveRoom = () => {
        socket.emit('leave-room', ({ gameRoomId, playerId }));
    }

    const joinRoom = () => {
        socket.emit('join-room', ({ gameRoomId, playerId }));
        setJoined(true);
    }

    const startGame = () => {
        socket.emit('start-game', ({ gameRoomId }));
    }

    const playTurn = () => {
        socket.emit('play-turn', ({ gameRoomId, playerId, cardIndex: 1 }));
    }

    const requestCardsUpdate = () => {
        started && socket.emit('request-cards-update', ({ gameRoomId, playerId }))
    }

    useEffect(() => { if (started) { setTurn(gameState.turn); } }, [gameState]);
    useEffect(requestCardsUpdate, [turn]);

    return <>
        <h1>Hey {playerId}</h1>
        {joined && <div>
            Player List
            <ol>
                {players.length && players.map(p => <li>{p}</li>)}
            </ol>
            <br />
            {isAdmin && !started && <button onClick={startGame}>Start Game!</button>}

        </div>}
        {!joined && <div>
            Player Name: <input type='text' onChange={event => setPlayerId(event.target.value)}></input>
            <button onClick={joinRoom} disabled={!playerId}>Join Room {gameRoomId} !</button>
        </div>}

        {started && <div>
            Your cards:
            <br />
            {playerCards.length && playerCards.map((card, i) =>
                <Card value={card} onClick={() => {
                    alert(i);
                    if (cardOffers.includes(i)) { setCardOffers(prevOffers => prevOffers.splice(prevOffers.indexOf(i), 1)); }
                }} selectionNumber={cardOffers.indexOf(i)} />
            )}
        </div>}

        {started && <div>
            This is {turn !== playerId && 'NOT '} your turn.
            <br />
            {turn === playerId && <button onClick={playTurn}>Play Turn</button>}
        </div>}
    </>


}

export default SyncedSession