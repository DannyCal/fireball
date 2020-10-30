import React from 'react';
import { useParams } from "react-router-dom";
import SyncedSession from './SyncedSession';


const GameRoom = () => {

    let { gameRoomId } = useParams();

    return (
        <div>
            <SyncedSession gameRoomId={gameRoomId} />
        </div>
    )
}

export default GameRoom;