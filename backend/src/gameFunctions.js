const shuffle = array => {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

const splitDeckToPlayers = ({ players, deck, turn }) => {
    let splitDeck = Object.fromEntries(deck.reduce((resultDeck, card, index) => {
        const chunkIndex = Math.floor(index / 4);
        if (!resultDeck[chunkIndex])
            resultDeck[chunkIndex] = [];
        resultDeck[chunkIndex].push(card);
        return resultDeck;
    }, []).map((cards, i) => [players[i], cards]));

    const unlucky = players[Math.floor(Math.random() * players.length)];
    popped = splitDeck[unlucky].pop();
    splitDeck[unlucky].push(0);
    splitDeck[turn].push(popped);
    return splitDeck;
}


const newGameState = (gameRoomObj) => {
    console.log(gameRoomObj);
    const turn = gameRoomObj.players[Math.floor(Math.random() * gameRoomObj.players.length)];

    const unshuffledDeck = shuffle(
        Object.keys([...Array(gameRoomObj.players.length)])
            .map(i => [Number(i) + 1, Number(i) + 1, Number(i) + 1, Number(i) + 1])
            .reduce((total, current) => total.concat(current), []));
    const deck = splitDeckToPlayers({ players: gameRoomObj.players, deck: unshuffledDeck, turn });

    return {
        deck,
        visible: {
            start: true,
            playingPlayers: [...gameRoomObj.players],
            turn,
        }
    };
}

module.exports = {
    newGameState,
}