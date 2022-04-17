//---------------------Sockets and calls and messages section---------------

const socket = io('/');
// Using peer library we can generate unique id's for each user using which we can connect multiple users
//So whenever a user visits our root that is '/' the peer server which is on port 3001 listens to it and generates a ID 
var myPeer = new Peer(undefined, {
  path: '/peerjs',
  //host: 'fierce-inlet-18150.herokuapp.com',
  port: 443,
  secure: true
});

const myVideo = document.createElement('video');
myVideo.muted = true;
let peers = {};


var myVideoStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  startVideoStream(myVideo, stream);
  myVideoStream = stream;
  myPeer.on('call', (call) => {
    //Here if there is already a user , then when the second user joins he will send his stream to the first one
    call.answer(stream);
    //Here the first person is sending his stream back to the second person so that his video is shown on the second peer's browser
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      startVideoStream(video, userVideoStream);
    })
  })

  socket.on('user-connected', (userID) => {
    connectToOtherUsers(userID, stream);
  })

});

socket.on("createMessage", (message, userid) => {
  $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
  scrollToBottom();
})

//This function scrolls to the bottom of the chat section
function scrollToBottom() {
  var d = $('.main-chat-section');
  d.scrollTop(d.prop("scrollHeight"));
}

//When the user exits the call we have to ensure that his call is removes from the screen
socket.on('user-disconnected', (userID) => {
  if (peers[userID]) {
    peers[userID].close();
  }
});

//Whenever the user enters the website this event is triggered
myPeer.on('open', (id) => {
  // This triggers the join-room event we have set up in the server
  socket.emit('join-room', room_ID, id);
});

function startVideoStream(video, stream) {

  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  })
  videoDisplay.append(video);

}

function connectToOtherUsers(userID, stream) {
  //Here we send our video stream to the user whose userID is passes to the function. 
  const call = myPeer.call(userID, stream);
  const newVideo = document.createElement('video');

  // After accepting our video the other user sends his tream which is accepted here
  call.on('stream', (sentVideoStream) => {
    startVideoStream(newVideo, sentVideoStream);
  });

  //Matches the userID with their respective calls. Is bascically used to rmove people from calls
  peers[userID] = call;

  // When a user leaves we have to remove his video
  call.on('close', () => {
    newVideo.remove();
  })
}


//--------------------controls section ----------------

const videoDisplay = document.querySelector('.video-display');
const chatSection = document.querySelector(".chat-section");
const chatControlButton = document.querySelector(".chat-controls");
const text = document.querySelector(".message-input");
const html = document.querySelector('html');

html.addEventListener('keydown', function (e) {
  if (e.which == 13 && text.value.length !== 0) {
    socket.emit('message', text.value);
    text.value = '';
  }
})

//This function handles the mute button
function muteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton()
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

function setUnmuteButton() {
  const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
  document.querySelector('.mute_button').innerHTML = html;
}

function setMuteButton() {
  const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
  document.querySelector('.mute_button').innerHTML = html;
}

//This function handles the video button
function playStop() {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

function setStopVideo() {
  const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
  document.querySelector('.video_button').innerHTML = html;
}

function setPlayVideo() {
  const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
  document.querySelector('.video_button').innerHTML = html;
}

chatControlButton.addEventListener('click', chatDisplay);

//This function hides the chat section by adding the remove-chat class.
function chatDisplay() {
  if (chatSection.classList.contains('removeChat')) {
    chatSection.classList.remove('removeChat');
  } else {
    chatSection.classList.add('removeChat');
  }
}