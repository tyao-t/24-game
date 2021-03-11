const socket = io.connect('https://dry-anchorage-98179.herokuapp.com', {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  },
  secure: true
})
const messageContainer = document.getElementById('message-container')
const gameInfoContainer = document.getElementById('game-info-container')
const gameLogContainer = document.getElementById('game-log-container')
const countContainer = document.getElementById("count");
const activePlayersContainer = document.getElementById('active-players');
const welcomeContainer = document.getElementById('welcome');
const roleTitleContainer = document.getElementById('role-title');
const adminAndSpecContainer = document.getElementById('admin-and-spec');
const scoreContainer = document.getElementById('scores');
const myScore = document.getElementById('my-score');

const btnStartRound = document.getElementById('startRound')
const btnReady = document.getElementById('ready')
const btnGotIt = document.getElementById('gotIt')
const btnInc = document.getElementById('inc')
const btnDec = document.getElementById('dec')


const name = prompt('What is your name?', 'Anonymous')
welcomeContainer.innerText = 'Welcome, ' + name
var role = prompt('You are joining as?', 's')

const bgm = document.getElementById("bgm"); bgm.volume = 0.33;
const gotItSound = new Audio("./sounds/gotit.mp3");
const readySound = new Audio("./sounds/ready.mp3"); readySound.volume = 0.5;
const incSound = new Audio("./sounds/inc.mp3"); incSound.volume = 0.7;
const decSound = new Audio("./sounds/dec.mp3"); decSound.volume = 0.3;
const countDownSound = new Audio("./sounds/count-down.wav"); countDownSound.volume = 0.5;
const sounds = [bgm, gotItSound, readySound, incSound, decSound, countDownSound]
sounds.forEach((sound) => {sound.muted = true})
//console.log(bgm.autoplay)


const enableSound = document.getElementById("enable-sound")

enableSound.onclick = function () {
    //console.log(enableSound.checked)
    if (enableSound.checked) {
        sounds.forEach((sound) => {sound.muted = false})
        bgm.play();
    } else {
        sounds.forEach((sound) => {sound.muted = true})
    }
}

if (role.toLowerCase().substring(0,1) == 'a') {
    roleTitleContainer.innerHTML = '';
    roleTitleContainer.innerText = 'As the admin, you are responsible for initiating rounds and keeping track of the scores of players.'
    role = 'admin';
    countContainer.innerText = 'Please start the next round if and only if all players are ready.'
    btnReady.remove();
    btnGotIt.remove();
} else if (role.toLowerCase().substring(0,1) == 'p') {
    btnStartRound.remove();
    role = 'player'
    countContainer.innerText = 'Please wait for the admin to start the next round.'
} else if (role.toLowerCase().substring(0,1) == 's') {
    role = 'spectator'
    roleTitleContainer.innerHTML = '';
    roleTitleContainer.innerText = 'Enjoy the game as a spectator!'
    countContainer.innerText = 'Please wait for the admin to start the next round.'
    btnStartRound.remove();
    btnReady.remove();
    btnGotIt.remove();
}

prependMessage(`You joined as ${role}`)

socket.emit('new-user', {name: name, role: role})
socket.emit('set-user-list');

socket.on('set-user-list', users => {
    resetUsers(users);
})

socket.on('user-connected', info => {
    prependMessage(`${info.name} connected as ${info.role}`)
})

socket.on('user-disconnected', info => {
    prependMessage(`${info.name} disconnected`)
    socket.emit('set-user-list');
})

socket.on('ready', name => {
    readySound.play()
    prependGameInfo(`${name} is ready`)
})

socket.on('count-down', count => {
    if (count.count == 4) {
        countDownSound.play()
        for (let i=1;i<=4;i++) {
            document.getElementById('card'+i).src = 'gray_back.png';
        }
    }
    gameInfoContainer.innerHTML = ""
    if (count.count > 0) countContainer.innerText = "Round starting in: " + count.count
    else {
        prependGameLog("Round Started!")
        countContainer.innerText = "Go!!!"
    }
})

socket.on('fourCards', four => {
    for (let i=1;i<=4;i++) {
        //console.log(four[i-1]);
        document.getElementById('card'+i).src = './cards/PNG/' + four[i-1];
        const textElement = document.createElement('div')
        textElement.id = 'text'+i;
        textElement.style.fontWeight = "bold"
        textElement.innerText = four[i-1].substring(0,1);
        document.getElementById('c'+i).append(textElement);
    }
})

socket.on('got-it', message => {
    gotItSound.play()
    //console.log(message);
    countContainer.innerText = role == 'admin'? 'Please start the next round if and only if all players are ready.'
    : 'Please wait for the admin to start the next round.';
    const gotItElement = document.createElement('div')
    gotItElement.innerText = (message.name == name? 'You' : message.name) + ' got it in ' + message.count / 1000 + ' seconds!'
    gotItElement.style.fontWeight = "bold"
    gotItElement.style.color = "red"
    gameInfoContainer.prepend(gotItElement);
})

socket.on('inc', name => {
    incSound.play()
    prependGameLog(name + ' receives 1 point!', 'red');
})

socket.on('dec', name => {
    decSound.play()
    prependGameLog(name + ' loses 1 point!', 'blue');
})

function prependMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageContainer.prepend(messageElement)
}

function prependGameInfo(message) {
    const gameInfoElement = document.createElement('div')
    gameInfoElement.innerText = message
    gameInfoElement.style.textDecoration = "underline"
    gameInfoContainer.prepend(gameInfoElement)
}

function prependGameLog(message, color = "black") {
    const gameLogElement = document.createElement('div')
    gameLogElement.innerText = message
    gameLogElement.style.color = color
    gameLogContainer.prepend(gameLogElement)
}

function resetUsers(users) {
    activePlayersContainer.innerHTML = ""
    scoreContainer.innerHTML = ""
    let admin = 'Admin:'
    let spec =  'Spectators:'
    let players = []
    for (let key in users) {
        if (users[key].role != 'player') {
            if (users[key].role == 'admin') admin += (' ' + users[key].name);
            else spec += (' ' + users[key].name);
            adminAndSpecContainer.innerText = admin + '; ' + spec;
            continue;
        };
        players.push({score: users[key].score, name: users[key].name});
    }
    players.sort((x, y) => x.score - y.score)
    //console.log(players);
    for (let player in players) {
        const activePlayerElement = document.createElement('div')
        activePlayerElement.innerText = players[player].name
        activePlayersContainer.prepend(activePlayerElement)
        const scoreElement = document.createElement('div')
        scoreElement.innerText = players[player].score + ' pts'
        scoreContainer.prepend(scoreElement)
    }
}

function updateMyScore(num) {
    myScore.innerText = num + parseInt(myScore.innerText);
}

btnStartRound.onclick = function () {
    socket.emit('count-down', 4)
    var count = 3;
    const itvl = setInterval(() => {
        //document.getElementById("count").innerText = count
        socket.emit('count-down', count)
        count --;
        if (count <0) {
                socket.emit('start-counting')
                clearInterval(itvl)
        }
    }, 1000);
};

btnReady.onclick = function () {
    readySound.play()
    prependGameInfo('You are ready')
    socket.emit('ready')
};

btnGotIt.onclick = function () {
    socket.emit('end-counting');
}

btnInc.onclick = function () {
    updateMyScore(1)
    socket.emit('inc')
};

btnDec.onclick = function () {
    updateMyScore(-1)
    socket.emit('dec')
};
