import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { IoCall, IoVideocam, IoSettings, IoExitOutline } from 'react-icons/io5';

const Chat = ({ socket, username, room, onLogout }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('messageHistory', (history) => {
      setMessages(history);
    });

    socket.on('roomUsers', (roomUsers) => {
      setUsers(roomUsers);
    });

    socket.on('userTyping', ({ username: typingUser, isTyping }) => {
      if (isTyping) {
        setTyping(`${typingUser} is typing...`);
      } else {
        setTyping('');
      }
    });

    return () => {
      socket.off('message');
      socket.off('messageHistory');
      socket.off('roomUsers');
      socket.off('userTyping');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('chatMessage', message);
      setMessage('');
      socket.emit('typing', false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    socket.emit('typing', true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header" style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            {room}
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            opacity: 0.7 
          }}>
            {users.length} members
          </p>
        </div>
        
        <div className="user-list">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Members</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.map((user) => (
              <li
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                }}
              >
                <div style={{ 
                  position: 'relative',
                }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#2c2c2c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e', // green color for active status
                      border: '2px solid #1a1a1a', // border color matching background
                      boxSizing: 'content-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <span>{user.username}</span>
                  {user.username === username && (
                    <span style={{ 
                      color: 'var(--text-secondary)',
                      opacity: 0.7 
                    }}>
                      (you)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="main-content">
        <div className="chat-header" style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="icon-button" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}>
              <IoCall size={20} />
            </button>
            <button className="icon-button" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}>
              <IoVideocam size={20} />
            </button>
          </div>
          <button
            onClick={onLogout}
            className="leave-button"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ff4d4d',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s',
              ':hover': {
                backgroundColor: 'rgba(255, 77, 77, 0.1)'
              }
            }}
          >
            <IoExitOutline size={20} />
            <span>Leave Room</span>
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.user === username ? 'sent' : 'received'
              }`}
            >
              <div style={{ marginBottom: '0.25rem' }}>
                {msg.type === 'info' ? (
                  <em>{msg.content}</em>
                ) : (
                  <>
                    <strong>{msg.user === username ? 'You' : msg.user}</strong>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                  </>
                )}
              </div>
              {msg.type !== 'info' && <div>{msg.content}</div>}
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
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 