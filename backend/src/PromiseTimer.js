const PromiseTimer = (promise, timeout) => {
    const timer = new Promise((_, rej) => { setTimeout(() => { rej('timeout') }, timeout) });
    return Promise.race([promise, timer])
}

module.exports = {
    PromiseTimer
}