import React from 'react';
import { useParams } from "react-router-dom";
import SyncedSession from './SyncedSession';


/*
GameRoom is a middleman that holds a synced session between multiple players.
It receives the gameRoomId from the web address parameters, and uses it, along with the received socket to establish connection.

socket : the socket created on the frontend server, to connect to the many game rooms being operated.
*/
const GameRoom = ({ socket }) => {

    let { gameRoomId } = useParams();

    return (
        <div>
            <SyncedSession gameRoomId={gameRoomId} socket={socket} />
        </div>
    )
}

export default GameRoom;