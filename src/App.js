import './App.css';
import { io } from "socket.io-client";
// import {useState} from 'react'
import { Peer } from 'peerjs'
import { useEffect, useState } from 'react';
const myPeer = new Peer()
let videoGrid
let myVideo
const socket = io("https://audio-call-demo.herokuapp.com/");
const peers = {}
let idUser
function App() {

  const [id,setId] = useState("")
  const [newPeer,setNewPeer] = useState("")
  const [myStream,setMyStream] =useState()

  window.onload = () => {
    mainFunction();
  };
  const mainFunction = () => {
    videoGrid = document.getElementById('video-grid')
    myVideo = document.createElement('video')
    myVideo.muted = true
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      addVideoStream(myVideo, stream)
      setMyStream(stream)
      myPeer.on('close', () => {
        myVideo.remove()
      })
      myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        // call.on('stream', userVideoStream => {
        //   addVideoStream(video, userVideoStream)
        // })
      })
      myPeer.on('open', id => {
        //console.log("id ",id)
       setId(id)
        idUser =id
        socket.emit('join-room', "1", id)
      })

      socket.on('user-connected', (userId,roomVoice) => {
        if(userId === idUser){
          roomVoice.map((value,key)=>{
            if (value !== idUser){
              console.log("new user connect",userId)
              connectToNewUser(value, stream)
            }
          })
        }
        else {
          connectToNewUser(userId, stream)
      }}
      )
    
      socket.on('user-update', (userId,status) => {
        
        if (peers[userId]){ 
          //console.log("okee : ",userId)
          peers[userId].getVideoTracks()[0].enabled = status
          peers[userId].getAudioTracks()[0].enabled = status
        }
      })
    })
  }


  function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })

    peers[userId] = call
    setNewPeer(call)
  }

  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }

  //console.log("new peer ",peers)

  //console.log("id ",id)

 // console.log("peer id ",peers[id])

  return (
    <>
    <button onClick={()=>{socket.emit("user-update","1",id,false);myStream.getVideoTracks()[0].enabled = false;myStream.getAudioTracks()[0].enabled = false ;console.log("off")}}>off</button>
    <button onClick={()=>{socket.emit("user-update","1",id,true);myStream.getVideoTracks()[0].enabled = true ;myStream.getAudioTracks()[0].enabled = true;console.log("on")}}>on</button>
    <div id="video-grid"></div>
    </>
  )


}

export default App;
