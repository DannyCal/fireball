import React, { useEffect, useState } from "react";
import Card from './Card';
import '../css/general.css';
import logo from '../assets/png/fireballLogo.png';


const SyncedSession = ({ gameRoomId, socket }) => {

    const [language, setLanguage] = useState('en')
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

        socket.on('heartbeat', () => { console.log('beating...'); socket.emit('heartbeat-ok') });
        socket.on('wrong-key', ({ gameState }) => {
            if (gameState) {
                setGameState(gameState);
            } else { window.location.reload(); }
        })
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
        socket.emit('card-offer', ({ gameRoomId, playerId, cardOffer, roomKey }));
        setRestrictedCards(prevDis => { const newDisOffer = cardOffer; return [...prevDis, newDisOffer] });
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
                return { en: 'FIRST', il: 'ראשונה' }[language];
            case 2:
                return { en: 'SECOND', il: 'שנייה' }[language];
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
            setCardOffer(null);
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
        textAlign: 'center',
        direction: ['il'].includes(language) ? 'rtl' : 'ltr',
    }}>

        <img src={logo} alt='Fireball' className='logo' />
        <text className='logo-title'>
            {{ en: 'FIREBALL', il: 'פיירבול' }[language]}
        </text>
        <text className='room-id-title'>
            {{ en: 'Classroom', il: 'כיתה' }[language]}:{gameRoomId}
        </text>
        <button onClick={() => {
            setLanguage(lang => lang === 'il' ? 'en' : 'il');
        }}>{{ en: 'עברית', il: 'English' }[language]}</button>
        {/* <a href="https://api.whatsapp.com/send?text=www.google.com" data-action="share/whatsapp/share">Share via Whatsapp</a> */}

        {/* Title */}
        <h1>
            {`${started ?
                { en: 'Whack \'em', il: 'שחק אותה' }[language] :
                { en: 'Hello', il: 'שלום' }[language]
                }, ${playerId ||
                { en: 'wizard', il: 'מכשף' }[language]}!`}
        </h1>

        {/* Join */}
        {!joined && <div>
            {{ en: 'Wizard Name:', il: 'שם המכשף:' }[language]} <input type='text' onChange={event => setPlayerId(event.target.value)} value={playerId}></input>
            <br />
            <button className='orange fade' onClick={joinRoom} disabled={!playerId || players.includes(playerId)}>{{ en: 'Enter classroom', il: 'כנס לכיתה' }[language]} {gameRoomId}!</button>
        </div>}

        {/* Players */}
        {joined && (players.length ? (<div>
            {{ en: 'Wizards in this classroom:', il: 'מכשפים בכיתה זו:' }[language]}
            <div style={{ width: 'fit-content', margin: 'auto' }}>
                <ul style={{ textAlign: 'start' }}>
                    {players.length && players.map(p => <li key={p}>
                        {p}
                        {playingPlayers && playingPlayers.includes(p) && { en: ' [Playing]', il: ' [משחק]' }[language]}
                        {p === sender && <b>{{ en: ' [Sender]', il: ' [שולח]' }[language]}</b>}
                        {p === receiver && <b>{{ en: ' [Receiver]', il: ' [מקבל]' }[language]}</b>}
                        {p === adminId && <b>{{ en: ' [Admin]', il: ' [מנהל]' }[language]}</b>}
                    </li>)}
                </ul>
            </div>

            {adminId === playerId && <button className={`${started ? 'blue' : 'red'} fade`} onClick={startGame} disabled={!(players && players.length >= 3)}>
                {started ?
                    { en: 'Restart Game', il: 'התחל מחדש' }[language] :
                    (players && players.length >= 3 ?
                        { en: 'Start Game!', il: 'התחל משחק!' } :
                        { en: 'Need at least 3 wizards to play', il: 'צריך לפחות 3 מכשפים בכדי לשחק' })[language]}
            </button>}
            <br />
        </div>) : { en: 'Loading...', il: 'טוען...' }[language])}

        {/* Cards */}
        {started && !victory && <div>
            <br />
            {{ en: 'Your tiles:', il: 'האבנים שלך:' }[language]}
            <br /><br />
            <span style={{ display: 'flex', flexDirection: 'row', margin: 'auto' }}>
                {playerCards.length && playerCards.map((card, i) =>
                    <Card key={i} className='card' value={card} onClick={
                        (sender === playerId && action === 'sender' && !restrictedCards.includes(i)) ?
                            () => { setCardOffer(prevOffer => prevOffer === i ? null : i); } : null
                    } offered={cardOffer === i} restricted={cardOffer !== i && action === 'sender' && sender === playerId && restrictedCards.includes(i)} />
                )}
            </span>
        </div>}

        {/* Victory */}
        {victory && <div>
            <br /><br />
            <i>Womp Womp!</i>
            <br />
            {victory[0]} assembled 4 matching tiles!
            <br />
            <b>{victory[1]} got FIREBALLED!</b>
        </div>}

        {/* Info and Controls */}
        {started && !victory && <div>
            {sender === playerId && action === 'sender' && <button className='blue fade' onClick={offerCardToReceiver} disabled={cardOffer === null}>
                {{ en: `Offer a tile to ${receiver}!`, il: `הצע אבן ל-${receiver}` }[language]}
            </button>}
            {receiver === playerId && (
                (action === 'receiver' && <>
                    {{ en: `This is ${sender}'s ${countToWord(offerCount)} [${offerCount}] offer.`, il: `זוהי ההצעה ה${countToWord(offerCount)} [${offerCount}] של ${sender}` }[language]}
                    <button className='blue fade' onClick={acceptOffer}>
                        {{ en: 'Accept!', il: 'קבל!' }[language]}
                    </button>
                    <button className='red fade' onClick={declineOffer}>
                        {{ en: 'Decline!', il: 'דחה!' }[language]}
                    </button>
                </>) ||
                (action === 'sender' && <>
                    {{ en: `Your'e about to receive a tile from ${sender}.`, il: `אתה עומד לקבל אבן מ-${sender}` }[language]}
                </>))}
            {![sender, receiver].includes(playerId) && <>
                {{ en: `${sender} is about to send ${receiver} a tile.`, il: `${sender} עומד לשלוח אבן ל-${receiver}` }[language]}
            </>}
        </div>}
    </div>


}

export default SyncedSession