import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Intro() {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            navigate('/landing');
        }, 3500);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="intro-screen">
            <div className={`intro-content ${visible ? 'show' : ''}`}>
                <h1 className="intro-title">HearMeOut</h1>
                <p className="intro-tagline">ready to sing your heart out? 🎤</p>
            </div>
        </div>
    );
}

export default Intro;