import React from 'react';
import SyncedSession from './components/SyncedSession';
import GameRoom from './components/GameRoom';
import { BrowserRouter, Route } from 'react-router-dom';


function App() {
  return (
    // <Editor />
    <BrowserRouter>
      <Route path='/' exact render={() => 'Home sweet home!'} />
      <Route path='/:gameRoomId' component={GameRoom} />
      {/* <SyncedSession /> */}
    </BrowserRouter>
  );
}

export default App;
