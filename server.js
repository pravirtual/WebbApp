const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const server = require('http').Server(app);
//An http server must be passes to the socket because the webrtc socket is initiaited by a http request.
const io = require('socket.io')(server);
const {
  ExpressPeerServer
} = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
//uuid is used to generate dynamc id's which we use as room id.
const {
  v4: uuidv4
} = require('uuid');

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('intro');
});

app.get("/:roomId", function (req, res) {
  res.render('home', {
    roomId: req.params.roomId
  });
});

app.post('/', (req, res) => {
  if (req.body.button === 'create') {
    res.redirect(`/${uuidv4()}`);
  } else {
    res.render('join');
  }
});

//This helps the user to join a room with a given room id
app.post("/join", (req, res) => {
  let roomId = req.body.joinRoomId;
  res.redirect('/' + roomId);
});

app.post('/exit', (req, res) => {
  res.redirect("/");
})


io.on('connection', function (socket) {
  //When a user joins the room this event is triggered.
  socket.on('join-room', function (roomID, userID) {
    socket.join(roomID)
    socket.to(roomID).emit('user-connected', userID);

    socket.on('message', (messageValue) => {
      io.to(roomID).emit('createMessage', messageValue, userID);
    });

    //  When the user leaves the room this event is triggered
    socket.on('disconnect', () => {
      console.log("disconnect");
      socket.to(roomID).emit('user-disconnected', userID);
    });

  });
});

let port = 3000;
server.listen(process.env.PORT || port, () => {
  console.log("Server is running on port 3000");
})