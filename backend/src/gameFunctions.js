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

const checkTriple = deck => Object.values(deck).some(
    cards => {
        counter = {};
        cards.forEach(x => counter[x] = (counter[x] || 0) + 1);
        return [3, 4].some(n => Object.values(counter).includes(n));
    });


const splitDeckToPlayers = ({ players, deck, sender }) => {
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
    splitDeck[sender].push(popped);
    return splitDeck;
}


const newGameState = (gameRoomObj) => {
    console.log(gameRoomObj);
    const sender = gameRoomObj.players[Math.floor(Math.random() * gameRoomObj.players.length)];
    const receiver = gameRoomObj.players[(gameRoomObj.players.indexOf(sender) + 1) % gameRoomObj.players.length];

    const shuffledDeck = shuffle(
        Object.keys([...Array(gameRoomObj.players.length)])
            .map(i => [Number(i) + 1, Number(i) + 1, Number(i) + 1, Number(i) + 1])
            .reduce((total, current) => total.concat(current), []));
    let deck = splitDeckToPlayers({ players: gameRoomObj.players, deck: shuffledDeck, sender });
    while (checkTriple(deck)) {
        deck = splitDeckToPlayers({ players: gameRoomObj.players, deck: shuffle(shuffledDeck), sender });
    }

    return {
        deck,
        visible: {
            start: true,
            playingPlayers: [...gameRoomObj.players],
            sender,
            receiver,
            cardOffer: null,
            offerCount: 0,
            action: 'sender',
        }
    };
}

const checkVictory = (deck) => {
    let victory = false;
    if (deck) {
        const won = (cards) => cards.length === 4 && cards.every(value => value === cards[0]);
        const winner = (pair => pair && pair[0])(Object.entries(deck).filter(([_player, cards]) => won(cards))[0]);
        const loser = (pair => pair && pair[0])(Object.entries(deck).filter(([_player, cards]) => cards.includes(0))[0])
        if (winner && loser) {
            victory = { winner, loser };
        }
    }
    return victory;
}

module.exports = {
    newGameState,
    checkVictory,
}