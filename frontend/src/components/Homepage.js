import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import logo from '../assets/png/fireballLogo.png';
import '../css/general.css';


const Homepage = ({ socket }) => {

    const [roomName, setRoomName] = useState('');
    const [message, setMessage] = useState('');
    let history = useHistory();

    const requestAvailableRoom = () => {
        socket.emit('request-name');
    }

    const checkAvailableRoom = () => {
        socket.emit('room-exists', { roomName });
    }

    useEffect(() => {
        const path = window.location.pathname;
        if (!(path.match(/\/room\/.*/)))
            history.replace('', null)

        socket.on('random-name', ({ name }) => {
            window.location.replace(`room/${name}`);
        });

        socket.on('room-doesnt-exist', ({ roomName }) => {
            setMessage(`Classroom ${roomName} does not exist!`);
            setRoomName('');
        });

        socket.on('room-does-exist', ({ roomName }) => {
            setMessage(`Woosh! Joining classroom ${roomName}...`);
            window.location.replace(`room/${roomName}`);
        })

    }, []);

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
        <br />
        <div style={{width: 'fit-content'}}>
            <button className='blue fade' onClick={requestAvailableRoom}>Create a new classroom</button>
            <br />OR< br /><br />
            <input type='text' placeholder='Classroom Name' value={roomName} onChange={e => e && e.target && setRoomName(e.target.value.toUpperCase())} />
            <button className='orange fade' onClick={checkAvailableRoom}>Join</button>
            <br />
            {message}
        </div>
    </div >
}

export default Homepage;