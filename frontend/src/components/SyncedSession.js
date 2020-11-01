import React, { useEffect, useState } from "react";
import io from 'socket.io-client';
import Card from './Card';

const socket = io(`http://localhost:4000/`);


const SyncedSession = ({ gameRoomId }) => {

    const [playerId, setPlayerId] = useState('')
    const [players, setPlayers] = useState([]);
    const [playingPlayers, setPlayingPlayers] = useState([]);
    const [joined, setJoined] = useState(false);
    const [started, setStarted] = useState(false);
    const [adminId, setAdminId] = useState('');
    const [roomKey, setRoomKey] = useState(null);

    const [gameState, setGameState] = useState({});
    const [playerCards, setPlayerCards] = useState([]);
    const [sender, setSender] = useState('');
    const [receiver, setReceiver] = useState('');
    const [action, setAction] = useState('sender');
    const [cardOffer, setCardOffer] = useState(null);
    const [restrictedCards, setRestrictedCards] = useState([]);
    const [victory, setVictory] = useState(false);


    useEffect(() => {

        socket.on('wrong-key', () => { window.location.reload(); })
        socket.on('update-players', ({ msg, players, playingPlayers, newAdminId, roomKey }) => {
            console.log(msg);
            setPlayers(players);
            setPlayingPlayers(playingPlayers);
            setAdminId(newAdminId);
            setRoomKey(roomKey);
        });
        socket.on('update-game-state', ({ msg, newGameState }) => { msg && console.log(msg); setGameState(newGameState); });
        socket.on('cards-update', ({ cards }) => { setPlayerCards(cards) });
        socket.on('set-admin', ({ newAdminId }) => { setAdminId(newAdminId) });
        socket.on('game-started', ({ newGameState }) => {
            setStarted(true);
            setGameState(newGameState);
            setSender(newGameState.sender);
            setReceiver(newGameState.receiver);
            setAction(newGameState.action);
            setPlayingPlayers(newGameState.playingPlayers);
        });



        return () => {
            leaveRoom();
        }
    }, []);

    useEffect(() => {
        roomKey && window.addEventListener("beforeunload", leaveRoom);
    }, [roomKey])

    const leaveRoom = () => {
        socket.emit('leave-room', ({ gameRoomId, playerId, roomKey }));
    }

    const joinRoom = () => {
        socket.emit('join-room', ({ gameRoomId, playerId }));
        setJoined(true);
    }

    const startGame = () => {
        socket.emit('start-game', ({ gameRoomId, roomKey }));
    }

    const offerCardToReceiver = () => {
        setRestrictedCards(prevDis => { const newDisOffer = cardOffer; return [...prevDis, newDisOffer] });
        socket.emit('card-offer', ({ gameRoomId, playerId, cardOffer, roomKey }));
        setCardOffer(null);
    }

    const acceptOffer = () => {
        socket.emit('accept-offer', ({ gameRoomId, roomKey }));
    }

    const declineOffer = () => {
        socket.emit('decline-offer', ({ gameRoomId, roomKey }));
    }

    const requestCardsUpdate = () => {
        started && socket.emit('request-cards-update', ({ gameRoomId, playerId, roomKey }))
    }

    // On gameState change
    useEffect(() => {
        console.log(gameState);
        setVictory(gameState && gameState.victory && [gameState.victory.winner, gameState.victory.loser]);
        if (started) {
            setSender(gameState.sender);
            setReceiver(gameState.receiver);
            setAction(gameState.action);
        }
    }, [gameState]);
    useEffect(() => { requestCardsUpdate(); setRestrictedCards([]); }, [sender]);

    return <>
        <h1>Heyo {playerId}</h1>
        {joined && (players.length ? (<div>
            Player List:
            <ol>
                {players.length && players.map(p => <li key={p}>{p}{playingPlayers && playingPlayers.includes(p) && ' [Playing]'}{p === adminId && <b>{' [Admin]'}</b>}</li>)}
            </ol>
            <br />
            {adminId === playerId && <button onClick={startGame}>{started ? 'Restart Game' : 'Start Game!'}</button>}

        </div>) : 'Loading...')}
        {!joined && <div>
            Player Name: <input type='text' onChange={event => setPlayerId(event.target.value)}></input>
            <button onClick={joinRoom} disabled={!playerId || players.includes(playerId)}>Join Room {gameRoomId}!</button>
        </div>}

        {started && !victory && <div>
            Your cards:
            <br />
            <span style={{ display: 'flex', flexDirection: 'row' }}>
                {playerCards.length && playerCards.map((card, i) =>
                    <Card key={i} value={card} onClick={
                        (sender === playerId && action === 'sender' && !restrictedCards.includes(i)) ?
                            () => { setCardOffer(prevOffer => prevOffer === i ? null : i); } : null
                    } offered={cardOffer === i} restricted={action === 'sender' && restrictedCards.includes(i)} />
                )}
            </span>
        </div>}

        {victory && <div>
            Womp Womp! {victory[0]} assembled 4 matching gems! {victory[1]} got FIREBALLED!
        </div>}

        {started && !victory && <div>
            {sender === playerId ? "Your'e the sender." : ""}
            {receiver === playerId ? "Your'e the receiver." : ""}
            <br />
            {sender === playerId && action === 'sender' && <button onClick={offerCardToReceiver} disabled={!(cardOffer >= 0)}>Offer card to {receiver}!</button>}
            {receiver === playerId && action === 'receiver' && <button onClick={acceptOffer}>Accept!</button>}
            {receiver === playerId && action === 'receiver' && <button onClick={declineOffer}>Decline!</button>}
        </div>}
    </>


}

export default SyncedSession