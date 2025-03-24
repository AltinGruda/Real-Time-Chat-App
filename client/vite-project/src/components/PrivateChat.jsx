import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { IoCall, IoExitOutline, IoSend, IoClose, IoCloudOutline, IoCloudOfflineOutline } from 'react-icons/io5';
import './PrivateChat.css';
import AudioCall from './AudioCall';

const PrivateChat = ({ socket, username, otherUser, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState('');
  const [isPermanentStorage, setIsPermanentStorage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const audioCall = AudioCall({ 
    socket, 
    username,
    users: [otherUser],
    onEndCall: () => console.log('Call ended')
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.emit('get-storage-preference');

    socket.on('storage-preference', ({ isPermanent }) => {
      setIsPermanentStorage(isPermanent);
    });

    socket.on('private-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('private-message-history', (history) => {
      setMessages(history);
    });

    socket.on('private-typing', ({ username: typingUser, isTyping }) => {
      if (isTyping && typingUser === otherUser.username) {
        setTyping(`${typingUser} is typing...`);
      } else {
        setTyping('');
      }
    });

    socket.emit('get-private-history', { otherUserId: otherUser.id });

    return () => {
      socket.off('private-message');
      socket.off('private-message-history');
      socket.off('private-typing');
      socket.off('storage-preference');
    };
  }, [socket, otherUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.id = 'remoteAudio';
    document.body.appendChild(audio);
    audioCall.remoteAudioRef.current = audio;

    return () => {
      document.body.removeChild(audio);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('private-message', {
        to: otherUser.id,
        content: message
      });
      setMessage('');
      socket.emit('private-typing', { to: otherUser.id, isTyping: false });
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    socket.emit('private-typing', { to: otherUser.id, isTyping: true });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('private-typing', { to: otherUser.id, isTyping: false });
    }, 1000);
  };

  const handleStorageToggle = () => {
    const newValue = !isPermanentStorage;
    setIsPermanentStorage(newValue);
    socket.emit('set-storage-preference', { isPermanent: newValue });
  };

  const handleCallClick = () => {
    audioCall.initiateCall(otherUser);
  };

  const renderCallStatus = () => {
    if (audioCall.error) {
      console.log('Call error:', audioCall.error);
    }

    if (audioCall.callStatus === 'idle') return null;

    return (
      <div className="call-status">
        {audioCall.callStatus === 'calling' && (
          <div className="call-notification">
            <p>Calling {otherUser.username}...</p>
            <button onClick={audioCall.endCall} className="icon-button">
              <IoClose size={20} />
            </button>
          </div>
        )}
        {audioCall.callStatus === 'receiving' && (
          <div className="call-notification">
            <p>Incoming call from {audioCall.callerInfo?.name}</p>
            <div className="call-actions">
              <button onClick={audioCall.answerCall} className="accept-call">
                Accept
              </button>
              <button onClick={audioCall.rejectCall} className="reject-call">
                Reject
              </button>
            </div>
          </div>
        )}
        {audioCall.callStatus === 'ongoing' && (
          <div className="call-notification">
            <p>On call with {otherUser.username}</p>
            <button onClick={audioCall.endCall} className="icon-button">
              <IoClose size={20} />
            </button>
          </div>
        )}
        {audioCall.error && (
          <div className="call-error">
            {audioCall.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="private-chat">
      <div className="private-chat-header">
        <div className="user-info">
          <div className="user-avatar">
            {otherUser.username[0].toUpperCase()}
          </div>
          <h2>{otherUser.username}</h2>
        </div>
        <div className="header-actions">
          <button 
            className={`icon-button ${isPermanentStorage ? 'active' : ''}`}
            onClick={handleStorageToggle}
            title={isPermanentStorage ? 'Permanent Storage Enabled' : 'Temporary Storage Enabled'}
          >
            {isPermanentStorage ? <IoCloudOutline size={20} /> : <IoCloudOfflineOutline size={20} />}
          </button>
          <button 
            className={`icon-button ${audioCall.callStatus !== 'idle' ? 'active' : ''}`}
            onClick={handleCallClick}
            disabled={audioCall.callStatus !== 'idle'}
          >
            <IoCall size={20} />
          </button>
          <button onClick={onClose} className="close-button">
            <IoClose size={20} />
          </button>
        </div>
      </div>

      {renderCallStatus()}

      <div className="private-chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.from === username ? 'sent' : 'received'}`}
          >
            <div>
              <span className="timestamp">
                {format(new Date(msg.timestamp), 'HH:mm')}
              </span>
            </div>
            <div>{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typing && <div className="typing-indicator">{typing}</div>}

      <form className="message-input" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message..."
          />
          <button type="submit">
            <IoSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrivateChat; 