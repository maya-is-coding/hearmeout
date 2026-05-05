import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import beachImg from '../assets/doodles/room elements/beach.jpeg';
import dateImg from '../assets/doodles/room elements/date.jpeg';
import dormImg from '../assets/doodles/room elements/dorm.jpeg';
import shelfImg from '../assets/doodles/room elements/shelfs.jpeg';
import '../styles/Room.css';
import '../styles/themes/dorm.css';
import '../styles/themes/beach.css';
import '../styles/themes/date.css';

const lyricsData = [
    "I'm dancing in the dark",
    "With you between my arms",
    "Barefoot on the grass",
    "Listening to our favorite song",
    "When you said you looked a mess",
    "I whispered underneath my breath",
    "But you heard it",
    "Darling, you look perfect tonight"
];

const themes = [
    { id: 'beach', name: 'beach', img: beachImg, color: '#1d89b5', secondaryColor: '#f5d76e', bgColor: '#589bbaff' },
    { id: 'dorm', name: 'dorm', img: dormImg, color: '#c4a8f0', secondaryColor: '#7ececa', bgColor: '#493986ff' },
    { id: 'date', name: 'date', img: dateImg, color: '#e04a5a', secondaryColor: '#f9a8c9', bgColor: '#2a0a14' },
];

const CircularTextButton = ({ theme, onClick }) => {
    // Repeat text to wrap completely around the circle
    const textStr = `${theme.name.toUpperCase()} • `.repeat(3);

    return (
        <div className="theme-btn-wrapper" onClick={onClick}>
            <div className="theme-btn-img" style={{ backgroundImage: `url(${theme.img})` }}></div>
            <svg className="theme-btn-text" viewBox="0 0 100 100">
                <path id={`circlePath-${theme.id}`} d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
                <text fill={theme.color} fontSize="14" fontWeight="bold" letterSpacing="1.5">
                    <textPath href={`#circlePath-${theme.id}`} startOffset="0%">
                        {textStr}
                    </textPath>
                </text>
            </svg>
        </div>
    );
};

function Room() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [lyricIndex, setLyricIndex] = useState(0);
    const [isThemesOpen, setIsThemesOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(themes[1]); // Default to dorm
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setLyricIndex(prev => (prev + 1) % lyricsData.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const getLyricStyle = (idx) => {
        const n = lyricsData.length;
        let diff = (idx - lyricIndex) % n;
        if (diff > n / 2) diff -= n;
        if (diff < -n / 2) diff += n;

        if (Math.abs(diff) > 1) {
            return {
                opacity: 0,
                transform: `translateY(${diff > 0 ? 100 : -100}px) scale(0.8)`,
                filter: 'blur(4px)',
                pointerEvents: 'none'
            };
        }

        if (diff === 0) {
            return {
                opacity: 1,
                transform: 'translateY(0px) scale(1)',
                color: 'var(--theme-secondary)',
                fontSize: '32px',
                textShadow: '0 0 15px color-mix(in srgb, var(--theme-secondary) 60%, transparent), 0 0 30px color-mix(in srgb, var(--theme-secondary) 30%, transparent)',
                fontWeight: 600,
                filter: 'blur(0)',
                zIndex: 2
            };
        }

        return {
            opacity: 1,
            transform: `translateY(${diff * 50}px) scale(0.8)`,
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '24px',
            filter: 'blur(2px)',
            zIndex: 1
        };
    };

    return (
        <div
            className={`room-container theme-${currentTheme.id} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        >
            {/* Top Right Themes Dropdown */}
            <div
                className="themes-dropdown-container"
                onMouseEnter={() => setIsThemesOpen(true)}
                onMouseLeave={() => setIsThemesOpen(false)}
            >
                <div className="themes-toggle-btn">
                    Themes {isThemesOpen ? '▲' : '▼'}
                </div>
                {isThemesOpen && (
                    <div className="themes-dropdown-menu">
                        {themes.map(t => (
                            <CircularTextButton
                                key={t.id}
                                theme={t}
                                onClick={() => { setCurrentTheme(t); setIsThemesOpen(false); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className={`room-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <h4 style={{ fontFamily: 'Chillax, sans-serif', fontSize: '26px', color: 'var(--theme-primary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '1px' }}>Song Shelf</h4>
                <div className="song-shelf">
                    <img className="shelf-bg-img" src={shelfImg} alt="Shelf" />
                    <div className="vinyl-grid">
                        <div className="vinyl-record" style={{ backgroundColor: '#ffb3ba' }} onClick={() => setIsPlaying(!isPlaying)}>
                            <div className="vinyl-center">Perfect</div>
                        </div>
                        <div className="vinyl-record" style={{ backgroundColor: '#ffdfba' }} onClick={() => setIsPlaying(!isPlaying)}>
                            <div className="vinyl-center">Lover</div>
                        </div>
                        <div className="vinyl-record" style={{ backgroundColor: '#ffffba' }} onClick={() => setIsPlaying(!isPlaying)}>
                            <div className="vinyl-center">Until I</div>
                        </div>
                        <div className="vinyl-record" style={{ backgroundColor: '#baffc9' }} onClick={() => setIsPlaying(!isPlaying)}>
                            <div className="vinyl-center">Dandelion</div>
                        </div>
                        <div className="vinyl-record" style={{ backgroundColor: '#bae1ff' }} onClick={() => setIsPlaying(!isPlaying)}>
                            <div className="vinyl-center">Those Eyes</div>
                        </div>
                        
                        <div className="vinyl-record add-vinyl" onClick={() => alert('Add song clicked!')}>
                            <div className="vinyl-center">+ Your Vinyl</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                className={`sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? '<' : '>'}
            </button>

            {/* Main Area */}
            <div className="room-main">
                <div className="video-half you-half">
                    <div className="webcam-placeholder">You</div>
                </div>
                <div className="video-half them-half">
                    <div className="webcam-placeholder">Them</div>
                </div>

                {/* Lyrics Float */}
                <div className="lyrics-container">
                    {lyricsData.map((lyric, idx) => (
                        <div key={idx} className="lyric" style={getLyricStyle(idx)}>
                            {lyric}
                        </div>
                    ))}
                </div>

                {/* Media Controls Centered at Bottom */}
                <div className="media-controls">
                    {/* Home Button */}
                    <button className="media-btn" onClick={() => navigate('/landing')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                        </svg>
                    </button>

                    {/* Mic Toggle */}
                    <button 
                        className={`media-btn ${!isMicOn ? 'off' : ''}`}
                        onClick={() => setIsMicOn(!isMicOn)}
                    >
                        {isMicOn ? '🎙️' : '🔇'}
                    </button>

                    {/* Video Toggle */}
                    <button 
                        className={`media-btn ${!isVideoOn ? 'off' : ''}`}
                        onClick={() => setIsVideoOn(!isVideoOn)}
                    >
                        {isVideoOn ? '📹' : '🚫'}
                    </button>

                    {/* Play/Pause Toggle */}
                    <button 
                        className="media-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
            </div>
        </div>
    );
}

export default Room;
