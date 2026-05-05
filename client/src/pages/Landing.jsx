import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import homeIcon from '../assets/doodles/home.png';
import sing1Icon from '../assets/doodles/sing1.png';
import sing2Icon from '../assets/doodles/sing2.png';
import '../styles/Landing.css';

function Landing() {
    const [code, setCode] = useState('');
    const navigate = useNavigate();

    const createRoom = () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        navigate(`/room/${newCode}`);
    };

    const joinRoom = () => {
        if (code.trim()) navigate(`/room/${code.trim().toUpperCase()}`);
    };

    return (
        <div className="landing-screen">
            <h2 className="landing-title">let's sing !</h2>

            <div className="landing-cards">
                <div className="room-card">
                    <img src={sing1Icon} alt="Create" className="card-image" />
                    <h3>create a room</h3>
                    <p className="card-sub">start a session, share the code</p>
                    <button className="enter-btn" onClick={createRoom}>create</button>
                </div>

                <div className="room-card">
                    <img src={sing2Icon} alt="Join" className="card-image" />
                    <h3>join a room</h3>
                    <p className="card-sub">got a code? come on in</p>
                    <input
                        className="code-input"
                        placeholder="enter code..."
                        value={code}
                        onChange={e => setCode(e.target.value)}
                    />
                    <button className="enter-btn" onClick={joinRoom}>join</button>
                </div>
            </div>

            <img src={homeIcon} alt="Go Home" className="home-icon-btn" onClick={() => navigate('/')} />
        </div>
    );
}

export default Landing;