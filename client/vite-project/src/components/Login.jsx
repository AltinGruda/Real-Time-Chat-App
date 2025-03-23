import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim() || !room.trim()) {
      setError('Username and room name are required');
      return;
    }

    onLogin({ username: username.trim(), room: room.trim() });
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.5rem' }}>Join Chat</h2>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="room">Room Name</label>
          <input
            type="text"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
            style={{ width: '100%' }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>
          Join Room
        </button>
      </form>
    </div>
  );
};

export default Login; 