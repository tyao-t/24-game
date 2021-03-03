const io = require("socket.io")('https://dry-anchorage-98179.herokuapp.com', {
  cors: {
    origin: "*",
  },
});

const users = {}

const nums = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const color = ['H','S', 'D', 'C']
const cards = []
for (let i=0;i<13;i++) {
    for (let j=0;j<4;j++) {
        cards.push(nums[i]+color[j]+'.png');
    }
}

function drawFourCards() {
    let four = []
    let tcards = cards;
    for (let i=0;i<4;i++) {
        let index = Math.floor(Math.random() * tcards.length)
        let tcard = tcards[index];
        tcards.splice(index,1);
        console.log(tcard);
        four.push(tcard)
    }
    console.log(four)
    return four;
}

drawFourCards();

var ts;
var te;

io.on('connection', socket => {
  socket.on('new-user', info => {
    users[socket.id] = {name: info.name, role: info.role, score: 0}
    //console.log(users)
    socket.broadcast.emit('user-connected', info)
  })
  socket.on('count-down', count => {
    socket.emit('count-down', {count: count})
    socket.broadcast.emit('count-down', { count: count })
    if (count == 0) {
        let four = drawFourCards()
        socket.emit('fourCards', four)
        socket.broadcast.emit('fourCards', four)
    }
  })
  socket.on('disconnect', () => {
    //console.log(users)
    socket.broadcast.emit('user-disconnected', users[socket.id])
    delete users[socket.id]
  })
  socket.on('start-counting', () => {
      ts = new Date().getTime();
      console.log(ts);
  })
  socket.on('end-counting', () => {
      te = new Date().getTime();
      console.log(te);
      console.log(users)
      socket.emit('got-it', {name: users[socket.id].name, count: te-ts})
      socket.broadcast.emit('got-it', {name: users[socket.id].name, count: te-ts})
  })
  socket.on('ready', () => {
      console.log(users[socket.id]);
      socket.broadcast.emit('ready', users[socket.id].name)
  })
  socket.on('set-user-list', () => {
      socket.emit('set-user-list', users)
      socket.broadcast.emit('set-user-list', users)
  })
  socket.on('inc', () => {
      users[socket.id].score ++;
      socket.emit('inc', users[socket.id].name)
      socket.broadcast.emit('inc', users[socket.id].name)
      socket.emit('set-user-list', users)
      socket.broadcast.emit('set-user-list', users)
  })
  socket.on('dec', () => {
      users[socket.id].score --;
      socket.emit('dec', users[socket.id].name)
      socket.broadcast.emit('dec', users[socket.id].name)
      socket.emit('set-user-list', users)
      socket.broadcast.emit('set-user-list', users)
  })
})


const express = require("express");

const app = express();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const path = __dirname;
app.use(express.static(path));

app.get("/", (req, res) => {
  res.sendFile(path + "index.html");
});

var lname, qname, qreac, lstreak;

app.get("/:name/:streak", (req, res) => {
  lname = req.params.name;
  lstreak = req.params.streak;
  res.write(lname + ' ' + lstreak)
  res.send()
});

app.get("/time/:name/:reac", (req, res) => {
  qname = req.params.name;
  qreac = req.params.reac;
  res.write(qname + ' ' + qreac)
  res.send()
});

app.get("/stats", (req, res) => {
    res.write('Quickest reaction -- ' + qname + ': ' + qreac + ' seconds!\n')
    res.write('Longest scoring streak -- ' + lname + ': ' + lstreak + ' rounds in a row!\n')
    res.send()
})
