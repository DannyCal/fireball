const capFirst = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

const generateRandomName = (existing) => {
    const names = ['WIZZ', 'ZBANG', 'POP', 'POOF', 'KAPOW', 'BOING', 'PEEW', 'KADOW', 'SIZZLE', 'DRIZZLE', 'WHIFF', 'SMOKE', 'BLAZE', 'FROST', 'DARK', 'LIGHT', 'MAGIC', 'MUSH', 'FLOP', 'FLIP', 'NIVZO',];
    let name = `${names[getRandomInt(0, names.length + 1)]}${getRandomInt(0, 9999)}`;
    while (existing.includes(name))
        name = `${names[getRandomInt(0, names.length + 1)]}${getRandomInt(0, 9999)}`;
    return name;
}

module.exports = {
    generateRandomName,
}