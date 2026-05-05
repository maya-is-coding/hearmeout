import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tulipEnvelope from '../assets/doodles/tulip-envelope.png';
import micDoodle from '../assets/doodles/mic.png';
import discoDoodle from '../assets/doodles/dicso.png';
import starsDoodle from '../assets/doodles/star.png';
import guitarDoodle from '../assets/doodles/gutiar.png';
import sparkleDoodle from '../assets/doodles/sparkle.png';
import '../styles/Intro.css';

function Intro() {
    const [envelopeOpen, setEnvelopeOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="intro-screen">

            {/* floating doodle spots — drop your PNGs here later */}
            <img src={micDoodle} alt="Mic" className="doodle d1" />
            <img src={discoDoodle} alt="Disco" className="doodle d2" />
            <img src={starsDoodle} alt="Stars" className="doodle d3" />
            <img src={guitarDoodle} alt="Guitar" className="doodle d4" />
            <img src={sparkleDoodle} alt="Sparkle" className="doodle d5" />

            {/* app title */}
            <div className="intro-top">
                <h1 className="intro-title">Hear Me Out</h1>
                <p className="intro-sub">a little place to sing together </p>
            </div>

            {/* envelope */}
            <div className="envelope-wrapper">
                <div
                    className={`envelope-btn ${envelopeOpen ? 'open' : ''}`}
                    onClick={() => setEnvelopeOpen(!envelopeOpen)}
                >
                    <img src={tulipEnvelope} alt="Envelope" className="envelope-img" />
                    {!envelopeOpen && <span className="envelope-hint-floating">click me 🌸</span>}
                </div>

                {/* letter slides out when open */}
                <div className={`letter ${envelopeOpen ? 'visible' : ''}`}>
                    <p>hi, I'm Maya 🌸</p>
                    <br />
                    <p>a small space for singing together online.</p>
                    <p>see each other, follow the lyrics, stay in sync.</p>
                    <br />
                    <p>have fun 🎶</p>
                    <br />
                    <p>— Maya 🎵</p>
                    <p className="letter-sign">made with love 🌊</p>
                    <p className="dedication">for a friend who stuck through every off-note and chorus.</p>
                </div>
            </div>

            {/* enter button */}
            <button className="enter-btn" onClick={() => navigate('/landing')}>
                enter
            </button>

        </div>
    );
}

export default Intro;