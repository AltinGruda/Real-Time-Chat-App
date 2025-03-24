import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer/simplepeer.min.js';

const AudioCall = ({ socket, username, users, onEndCall }) => {
  const [callStatus, setCallStatus] = useState('idle');
  const [callerInfo, setCallerInfo] = useState(null);
  const [error, setError] = useState(null);
  const myStream = useRef();
  const peerConnection = useRef();
  const remoteAudioRef = useRef();

  useEffect(() => {
    cleanup();
    setCallStatus('idle');
    setCallerInfo(null);
    setError(null);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ signal, from, callerName }) => {
      console.log('Received incoming call from:', callerName);
      setCallStatus('receiving');
      setCallerInfo({ id: from, name: callerName, signal });
    };

    const handleCallAccepted = (signal) => {
      console.log('Call was accepted, processing signal');
      if (peerConnection.current) {
        try {
          peerConnection.current.signal(signal);
          setCallStatus('ongoing');
        } catch (err) {
          console.error('Error in call-accepted:', err);
          cleanup();
        }
      }
    };

    const handleCallRejected = () => {
      console.log('Call was rejected');
      cleanup();
      setCallStatus('idle');
      setError('Call was rejected');
    };

    const handleCallEnded = () => {
      console.log('Call was ended');
      cleanup();
      setCallStatus('idle');
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      cleanup();
    };
  }, [socket]);

  const cleanup = () => {
    console.log('Cleaning up call resources');
    if (myStream.current) {
      myStream.current.getTracks().forEach(track => track.stop());
      myStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.destroy();
      peerConnection.current = null;
    }
  };

  const initiateCall = async (userToCall) => {
    try {
      console.log('Initiating call to user:', userToCall);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      myStream.current = stream;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (signalData) => {
        console.log('Generated signal data for peer');
        socket.emit('call-user', {
          userToCall: userToCall.id,
          signalData,
        });
      });

      peer.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(err => console.error('Error playing audio:', err));
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        cleanup();
        setCallStatus('idle');
        setError('Call failed: ' + err.message);
      });

      peer.on('connect', () => {
        console.log('Peer connection established');
      });

      peerConnection.current = peer;
      setCallStatus('calling');
    } catch (err) {
      console.error('Error in initiateCall:', err);
      setError('Could not access microphone');
      cleanup();
    }
  };

  const answerCall = async () => {
    try {
      console.log('Answering call from:', callerInfo?.name);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      myStream.current = stream;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (signal) => {
        console.log('Generated answer signal');
        socket.emit('answer-call', {
          signal,
          to: callerInfo.id,
        });
      });

      peer.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(err => console.error('Error playing audio:', err));
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        cleanup();
        setCallStatus('idle');
        setError('Call failed: ' + err.message);
      });

      peer.on('connect', () => {
        console.log('Peer connection established');
      });

      console.log('Signaling to peer with caller signal');
      peer.signal(callerInfo.signal);
      peerConnection.current = peer;
      setCallStatus('ongoing');
    } catch (err) {
      console.error('Error in answerCall:', err);
      setError('Could not access microphone');
      cleanup();
    }
  };

  const rejectCall = () => {
    console.log('Rejecting call from:', callerInfo?.name);
    socket.emit('reject-call', { to: callerInfo.id });
    cleanup();
    setCallStatus('idle');
  };

  const endCall = () => {
    if (peerConnection.current) {
      console.log('Ending call');
      socket.emit('end-call', { to: callerInfo?.id });
      cleanup();
      setCallStatus('idle');
      if (onEndCall) onEndCall();
    }
  };

  return {
    callStatus,
    callerInfo,
    error,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    remoteAudioRef,
  };
};

export default AudioCall; 