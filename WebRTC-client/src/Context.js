import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:5000');
// const socket = io('https://warm-wildwood-81069.herokuapp.com');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callReceiver, SetCallReceiver] = useState('');
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });

    // get the id from server n set it for this user
    socket.on('me', (id) => setMe(id));

    // listen to 'callUser' req n set the calling info
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    // listen to 'refuseCall' req
    socket.on('callRefused', () => {
      setCall({});
      console.log('callRefused on useEffect()');
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    // init peer (answer a call -> no initiator)
    const peer = new Peer({ initiator: false, trickle: false, stream });

    // once peer receive a signal from others, trigger 'answerCall' to server
    peer.on('signal', (peerSignal) => {
      socket.emit('answerCall', { signal: peerSignal, to: call.from, name });
    });
    // receive their stream n display it
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    // set the current peer signal
    peer.signal(call.signal);

    // set this peer is the current connection
    connectionRef.current = peer;
  };

  const refuseCall = () => {
    setCallAccepted(false);
    socket.emit('refuseCall');
    if (connectionRef.current) connectionRef.current.destroy();
    window.location.reload();
  };

  const callUser = (id) => {
    // init peer (call a user -> have initiator)
    const peer = new Peer({ initiator: true, trickle: false, stream });

    // once peer receive a signal from others, trigger 'callUser' to server
    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });
    // receive their stream n display it
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    // if the call is accepted -> set the current peer signal
    socket.on('callAccepted', (signal, receiverName) => {
      setCallAccepted(true);
      SetCallReceiver(receiverName);
      peer.signal(signal);
    });

    // listen to 'refuseCall' req
    socket.on('refuseCall', () => {
      setCall({});
      console.log('callRefused on callUser()');
    });

    // set this peer is the current connection
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        callReceiver,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        refuseCall,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
