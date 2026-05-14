import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import '../styles/Landing.css';

function Landing() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const nameRef = useRef('');

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    // Listen for server responses
    socket.on('room-created', (roomCode) => {
      navigate(`/room/${roomCode}`, { state: { userName: nameRef.current.trim() || 'You' } });
    });

    socket.on('room-joined', (roomCode) => {
      navigate(`/room/${roomCode}`, { state: { userName: nameRef.current.trim() || 'You' } });
    });

    socket.on('room-error', (message) => {
      setError(message);
      setLoading(false);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-error');
    };
  }, [navigate]);

  const createRoom = () => {
    if (!name.trim()) {
      setError('Please enter your name 🌸');
      return;
    }
    setLoading(true);
    setError('');
    socket.emit('create-room', name.trim());
  };

  const joinRoom = () => {
    if (!name.trim()) {
      setError('Please enter your name 🌸');
      return;
    }
    if (!code.trim()) {
      setError('Please enter a room code');
      return;
    }
    setLoading(true);
    setError('');
    socket.emit('join-room', { code: code.trim().toUpperCase(), name: name.trim() });
  };

  return (
    <div className="landing-screen">
      <h2 className="landing-title">let's sing 🎶</h2>

      <input
        className="code-input name-input"
        placeholder="your name... 🌸"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ maxWidth: '300px', margin: '0 auto 30px auto', display: 'block', textAlign: 'center' }}
      />

      <div className="landing-cards">
        <div className="room-card">
          <p className="card-emoji">🎤</p>
          <h3>create a room</h3>
          <p className="card-sub">start a session, share the code</p>
          <button
            className="enter-btn"
            onClick={createRoom}
            disabled={loading}
          >
            {loading ? 'creating...' : 'create'}
          </button>
        </div>

        <div className="room-card">
          <p className="card-emoji">🚪</p>
          <h3>join a room</h3>
          <p className="card-sub">got a code? come on in</p>
          <input
            className="code-input"
            placeholder="enter code..."
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          {error && <p style={{ color: '#f9a8c9', fontSize: '14px' }}>{error}</p>}
          <button
            className="enter-btn"
            onClick={joinRoom}
            disabled={loading}
          >
            {loading ? 'joining...' : 'join'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;