import React from 'react';
import { useParams } from "react-router-dom";
import SyncedSession from './SyncedSession';


const GameRoom = ({ socket }) => {

    let { gameRoomId } = useParams();

    return (
        <div>
            <SyncedSession gameRoomId={gameRoomId} socket={socket} />
        </div>
    )
}

export default GameRoom;