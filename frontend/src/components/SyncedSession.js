import React, { useEffect, useState } from "react";
import Card from './Card';
import '../css/general.css';
import logo from '../assets/png/fireball_logo.png';


const SyncedSession = ({ gameRoomId, socket }) => {

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
    const [offerCount, setOfferCount] = useState(0);
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

    const countToWord = (count) => {
        switch (count) {
            case 1:
                return 'FIRST';
            case 2:
                return 'SECOND';
            default:
                return '';
        }
    }

    // On gameState change
    useEffect(() => {
        console.log(gameState);
        setVictory(gameState && gameState.victory && [gameState.victory.winner, gameState.victory.loser]);
        if (started) {
            setSender(gameState.sender);
            setReceiver(gameState.receiver);
            setAction(gameState.action);
            setOfferCount(gameState.offerCount);
        }
    }, [gameState]);
    useEffect(() => { requestCardsUpdate(); setRestrictedCards([]); }, [sender]);

    return <div className='app' style={{
        minHeight: '100%',
        minWidth: '100%',
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center'
    }}>

        <img src={logo} alt='Fireball' className='logo' />

        {/* Title */}
        <h1>{`${started ? 'Whack \'em' : 'Hello'}, ${playerId || 'wizard'}!`}</h1>

        {/* Join */}
        {!joined && <div>
            Wizard Name: <input type='text' onChange={event => setPlayerId(event.target.value)} value={playerId}></input>
            <br />
            <button className='orange fade' onClick={joinRoom} disabled={!playerId || players.includes(playerId)}>Enter classroom {gameRoomId}!</button>
        </div>}

        {/* Players */}
        {joined && (players.length ? (<div>
            Wizards in this classroom:
            <div style={{ width: 'fit-content', margin: 'auto' }}>
                <ul style={{ textAlign: 'start' }}>
                    {players.length && players.map(p => <li key={p}>
                        {p}
                        {playingPlayers && playingPlayers.includes(p) && ' [Playing]'}
                        {p === sender && <b>{' [Sender]'}</b>}
                        {p === receiver && <b>{' [Receiver]'}</b>}
                        {p === adminId && <b>{' [Admin]'}</b>}
                    </li>)}
                </ul>
            </div>

            {adminId === playerId && <button className={`${started ? 'blue' : 'red'} fade`} onClick={startGame} disabled={!(players && players.length >= 3)}>{started ? 'Restart Game' : (players && players.length >= 3 ? 'Start Game!' : 'Need at least 3 wizards to play')}</button>}
            <br />
        </div>) : 'Loading...')}

        {/* Cards */}
        {started && !victory && <div>
            <br />
            Your cards:
            <br /><br />
            <span style={{ display: 'flex', flexDirection: 'row', margin: 'auto' }}>
                {playerCards.length && playerCards.map((card, i) =>
                    <Card key={i} className='card' value={card} onClick={
                        (sender === playerId && action === 'sender' && !restrictedCards.includes(i)) ?
                            () => { setCardOffer(prevOffer => prevOffer === i ? null : i); } : null
                    } offered={cardOffer === i} restricted={action === 'sender' && restrictedCards.includes(i)} />
                )}
            </span>
        </div>}

        {/* Victory */}
        {victory && <div>
            <br /><br />
            Womp Womp! {victory[0]} assembled 4 matching gems! {victory[1]} got FIREBALLED!
        </div>}

        {/* Info and Controls */}
        {started && !victory && <div>
            {sender === playerId && action === 'sender' && <button className='blue fade' onClick={offerCardToReceiver} disabled={cardOffer === null}>Offer a card to {receiver}!</button>}
            {receiver === playerId && action === 'receiver' && <>
                This is {sender}'s {countToWord(offerCount)} [{offerCount}] offer!
                <button className='blue fade' onClick={acceptOffer}>Accept!</button>
                <button className='red fade' onClick={declineOffer}>Decline!</button>
            </>}
        </div>}
    </div>


}

export default SyncedSession