import React from 'react';
import GameRoom from './components/GameRoom';
import Homepage from './components/Homepage';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import io from 'socket.io-client';


const backend = 'localhost';
// const backend = '3.128.129.180'
const socket = io(`${backend}:4000/`);

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path='/room/:gameRoomId' render={() => <GameRoom socket={socket} />} />
        <Route path='/*' render={() => <Homepage socket={socket} />} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
