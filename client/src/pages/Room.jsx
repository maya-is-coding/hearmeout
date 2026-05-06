import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import beachImg from '../assets/doodles/room elements/beach.jpeg';
import dateImg from '../assets/doodles/room elements/date.jpeg';
import dormImg from '../assets/doodles/room elements/dorm.jpeg';
import shelfImg from '../assets/doodles/room elements/shelfs.jpeg';
import micImg from '../assets/doodles/room elements/mic.png';

// Beach elements
import beachJellyfish from '../assets/doodles/room elements/beach elemets/jellyfish.png';
import beachMic from '../assets/doodles/room elements/beach elemets/mic.png';
import beachShells from '../assets/doodles/room elements/beach elemets/shells.png';
import beachWaves from '../assets/doodles/room elements/beach elemets/waves.png';
import beachWhale from '../assets/doodles/room elements/beach elemets/whale.png';

// Date elements
import dateBall from '../assets/doodles/room elements/date elemets/ball.png';
import dateCards from '../assets/doodles/room elements/date elemets/cards.png';
import dateFlowers from '../assets/doodles/room elements/date elemets/flowers.png';
import dateMic from '../assets/doodles/room elements/date elemets/mic.png';
import datePhone from '../assets/doodles/room elements/date elemets/phone.png';

// Dorm elements


import dormMic from '../assets/doodles/room elements/dorm elements/mic.png';
import dormPlant from '../assets/doodles/room elements/dorm elements/plant.png';
import dormWindChime from '../assets/doodles/room elements/dorm elements/wind charm.png';

import songs from '../assets/songs/songList';
import parseLrc from '../parseLrc';
import '../styles/Room.css';
import '../styles/themes/dorm.css';
import '../styles/themes/beach.css';
import '../styles/themes/date.css';

const themes = [
    { id: 'beach', name: 'beach', img: beachImg, color: '#1d89b5', secondaryColor: '#f5d76e' },
    { id: 'dorm', name: 'dorm', img: dormImg, color: '#c4a8f0', secondaryColor: '#7ececa' },
    { id: 'date', name: 'date', img: dateImg, color: '#e04a5a', secondaryColor: '#f9a8c9' },
];

const CircularTextButton = ({ theme, onClick }) => {
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
    const location = useLocation();
    const userName = location.state?.userName || 'You';

    // UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isThemesOpen, setIsThemesOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(themes[1]);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [layoutMode, setLayoutMode] = useState('split'); // 'split' or 'pip'
    const [bubbles, setBubbles] = useState([]); // For beach theme
    const [hearts, setHearts] = useState([]); // For date theme

    // Audio + lyric state
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [lyricIndex, setLyricIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Tick: every second sync lyric index to audio.currentTime
    useEffect(() => {
        if (!isPlaying || parsedLyrics.length === 0) return;
        const interval = setInterval(() => {
            if (!audioRef.current) return;
            const t = audioRef.current.currentTime;

            // Find the last lyric whose time <= current time
            let idx = 0;
            for (let i = 0; i < parsedLyrics.length; i++) {
                if (parsedLyrics[i].time <= t) idx = i;
                else break;
            }
            setLyricIndex(idx);

            // Update progress bar
            const dur = audioRef.current.duration || 1;
            setProgress((t / dur) * 100);
        }, 500);
        return () => clearInterval(interval);
    }, [isPlaying, parsedLyrics]);

    // Handle theme-specific background effects (Confetti intervals, Bubbles, Hearts)
    useEffect(() => {
        if (!isPlaying) {
            setBubbles([]);
            setHearts([]);
            return;
        }

        let interval;
        const themeId = currentTheme.id;

        if (themeId === 'date') {
            // Generate 20 hearts
            const newHearts = [];
            for (let i = 0; i < 20; i++) {
                newHearts.push({
                    id: i,
                    left: Math.random() * 100 + '%',
                    size: (Math.random() * 20 + 15) + 'px',
                    duration: (Math.random() * 4 + 3) + 's',
                    delay: (Math.random() * 5) + 's'
                });
            }
            setHearts(newHearts);
        } else if (themeId === 'dorm') {
            interval = setInterval(() => {
                confetti({
                    particleCount: 1,
                    colors: ['#c4a8f0', '#7ececa', '#ffd700'],
                    shapes: ['star'],
                    gravity: 0.2,
                    drift: 0.3,
                    spread: 60,
                    origin: { y: 0.2, x: Math.random() },
                    ticks: 200
                });
            }, 800);
        } else if (themeId === 'beach') {
            // Generate 15 bubbles
            const newBubbles = [];
            for (let i = 0; i < 15; i++) {
                newBubbles.push({
                    id: i,
                    left: Math.random() * 100 + '%',
                    size: (Math.random() * 20 + 20) + 'px', // 20px-40px
                    duration: (Math.random() * 5 + 5) + 's', // 5s-10s
                    delay: (Math.random() * 8) + 's' // 0s-8s
                });
            }
            setBubbles(newBubbles);
        }

        return () => {
            if (interval) clearInterval(interval);
            setBubbles([]);
            setHearts([]);
        };
    }, [isPlaying, currentTheme.id]);

    // One-tap play/pause for vinyls
    const handleVinylClick = useCallback(async (song) => {
        // If clicking the same song that is already playing, toggle pause
        if (currentSong?.id === song.id && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
            return;
        }

        // Otherwise, stop current and start new song
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setCurrentSong(song);
        setLyricIndex(0);
        setProgress(0);
        setIsPlaying(true);

        // Load lyrics
        try {
            const res = await fetch(song.lrc);
            const text = await res.text();
            setParsedLyrics(parseLrc(text));
        } catch (e) {
            console.error('Failed to load lyrics', e);
            setParsedLyrics([]);
        }

        // Start Audio
        const audio = new Audio(song.audio);
        audioRef.current = audio;
        audio.play().catch(err => console.error("Playback failed:", err));
        
        audio.onended = () => {
            setIsPlaying(false);
            triggerThemeConfetti();
        };
    }, [currentSong, isPlaying]);

    // Play/pause toggle (central mic button)
    const togglePlay = () => {
        if (!currentSong) return;
        if (!audioRef.current) {
            handleVinylClick(currentSong);
        } else if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };


    // Lyric display style
    const getLyricStyle = (idx) => {
        const diff = idx - lyricIndex;

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
                textShadow: '0 0 15px color-mix(in srgb, var(--theme-secondary) 60%, transparent)',
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
    
    // Manual celebration burst
    const triggerThemeConfetti = () => {
        const themeId = currentTheme.id;
        
        const config = {
            particleCount: 80,
            spread: 100,
            origin: { y: 0.6 },
            ticks: 250,
            gravity: 0.8
        };

        if (themeId === 'beach') {
            confetti({
                ...config,
                colors: ['#7ececa', '#f5d76e', '#ffffff'],
                shapes: ['circle']
            });
        } else if (themeId === 'dorm') {
            confetti({
                ...config,
                colors: ['#c4a8f0', '#7ececa', '#ffd700'],
                shapes: ['circle', 'square']
            });
        } else { // date
            confetti({
                ...config,
                colors: ['#e04a5a', '#f9a8c9', '#ff6b8a'],
                shapes: ['circle']
            });
        }
    };

    const getThemeMic = () => {
        if (currentTheme.id === 'beach') return beachMic;
        if (currentTheme.id === 'date') return dateMic;
        if (currentTheme.id === 'dorm') return dormMic;
        return micImg;
    };

    // Lyric lines to display (active ± 1)
    const displayLyrics = parsedLyrics.length > 0
        ? parsedLyrics
        : [{ text: 'Click a vinyl to play 🎵', time: 0 }];


    return (
        <div className={`room-container theme-${currentTheme.id} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} layout-${layoutMode}`}>
            
            {/* Theme Specific Doodles */}
            <div className="theme-doodles-container">
                {currentTheme.id === 'beach' && (
                    <>
                        <img src={beachJellyfish} className="doodle-item beach-jelly-1" alt="" />
                        <img src={beachShells} className="doodle-item beach-shells" alt="" />
                        <img src={beachWaves} className="doodle-item beach-waves" alt="" />
                        <img src={beachWhale} className="doodle-item beach-whale" alt="" />
                    </>
                )}
                {currentTheme.id === 'date' && (
                    <>
                        <img src={datePhone} className="doodle-item date-phone" alt="" />
                        <img src={dateFlowers} className="doodle-item date-flowers" alt="" />
                        <img src={dateBall} className="doodle-item date-ball" alt="" />
                        <img src={dateCards} className="doodle-item date-cards" alt="" />
                    </>
                )}
                {currentTheme.id === 'dorm' && (
                    <>
                        <img src={dormWindChime} className="doodle-item dorm-windchime" alt="" />
                        <img src={dormPlant} className="doodle-item dorm-plant-1" alt="" />
                        <img src={dormPlant} className="doodle-item dorm-plant-2" alt="" />
                        <img src={dormMic} className="doodle-item dorm-can" alt="" />
                    </>
                )}
            </div>

            {/* Custom Bubbles for Beach Theme */}
            {currentTheme.id === 'beach' && isPlaying && (
                <div className="bubble-container">
                    {bubbles.map(b => (
                        <div 
                            key={b.id} 
                            className="bubble" 
                            style={{ 
                                left: b.left, 
                                width: b.size, 
                                height: b.size, 
                                animationDuration: b.duration,
                                animationDelay: b.delay
                            }} 
                        />
                    ))}
                </div>
            )}

            {/* Custom Hearts for Date Theme */}
            {currentTheme.id === 'date' && isPlaying && (
                <div className="heart-container">
                    {hearts.map(h => (
                        <div 
                            key={h.id} 
                            className="heart-particle" 
                            style={{ 
                                left: h.left, 
                                fontSize: h.size, 
                                animationDuration: h.duration,
                                animationDelay: h.delay
                            }} 
                        >
                            ❤️
                        </div>
                    ))}
                </div>
            )}

            {/* Themes Dropdown */}

            {/* Themes Dropdown */}
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
                <h4 style={{ fontFamily: 'Chillax, sans-serif', fontSize: '26px', color: 'var(--theme-primary)', marginBottom: '8px', fontWeight: 600, letterSpacing: '1px' }}>
                    Song Shelf
                </h4>

                {/* Now Playing */}
                {currentSong && (
                    <div className="now-playing">
                        <span className="now-playing-label">Now Playing</span>
                        <span className="now-playing-title">{currentSong.title}</span>
                        <span className="now-playing-artist">{currentSong.artist}</span>
                    </div>
                )}

                <div className="song-shelf">
                    <img className="shelf-bg-img" src={shelfImg} alt="Shelf" />
                    <div className="vinyl-grid">
                        {songs.map((song, i) => {
                            const groupIndex = i % 5;
                            return (
                                <React.Fragment key={song.id}>
                                    {groupIndex === 3 && <div className="grid-spacer" />}
                                    <div
                                        className={`vinyl-record ${currentSong?.id === song.id ? 'selected' : ''} ${currentSong?.id === song.id && isPlaying ? 'spinning' : ''}`}
                                        onClick={() => handleVinylClick(song)}
                                        title={song.title}
                                    >
                                        <img src={song.vinyl} alt={song.title} className="vinyl-img" />
                                    </div>
                                    {groupIndex === 4 && <div className="grid-spacer" />}
                                </React.Fragment>
                            );
                        })}

                        {/* Push Add button to bottom shelf if it would otherwise fit in a gap */}
                        {songs.length % 5 === 3 && <div className="grid-spacer" />}
                        {songs.length % 5 >= 3 && songs.length % 5 <= 4 && (
                            <>
                                {songs.length % 5 === 3 && <div style={{ gridColumn: 'span 4' }} />}
                                {songs.length % 5 === 4 && <div style={{ gridColumn: 'span 2' }} />}
                            </>
                        )}

                        <div className="vinyl-record add-vinyl" onClick={() => alert('Add song coming soon!')}>
                            <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)' }}>+</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle */}
            <button
                className={`sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? '<' : '>'}
            </button>

            {/* Main Area */}
            <div className="room-main">
                <div className="video-half you-half">
                    <div className="webcam-placeholder">
                        <img src={getThemeMic()} className="webcam-mic" alt="" />
                        <span className="webcam-name">{userName}</span>
                    </div>
                </div>
                <div className="video-half them-half">
                    <div className="webcam-placeholder">
                        <img src={getThemeMic()} className="webcam-mic" alt="" />
                        <span className="webcam-name">Them</span>
                    </div>
                </div>

                {/* Lyrics */}
                <div className="lyrics-container">
                    {displayLyrics.map((lyric, idx) => (
                        <div key={idx} className="lyric" style={getLyricStyle(idx)}>
                            {lyric.text}
                        </div>
                    ))}
                </div>

                {/* Media Controls */}
                <div className="media-controls">
                    {/* Home */}
                    <button className="media-btn" onClick={() => { if (audioRef.current) audioRef.current.pause(); navigate('/landing'); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                        </svg>
                    </button>

                    {/* Mic */}
                    <button className={`media-btn ${!isMicOn ? 'off' : ''}`} onClick={() => setIsMicOn(!isMicOn)}>
                        {isMicOn ? '🎙️' : '🔇'}
                    </button>

                    {/* Video */}
                    <button className={`media-btn ${!isVideoOn ? 'off' : ''}`} onClick={() => setIsVideoOn(!isVideoOn)}>
                        {isVideoOn ? '📹' : '🚫'}
                    </button>

                    {/* Play/Pause */}
                    <button className={`media-btn play-pause-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} disabled={!currentSong}>
                        <img src={micImg} alt="Play/Pause" className="play-pause-mic" />
                    </button>

                    {/* Layout Switch */}
                    <button className="media-btn" onClick={() => setLayoutMode(layoutMode === 'split' ? 'pip' : 'split')} title="Switch Layout">
                        {layoutMode === 'split' ? '🔲' : '🔳'}
                    </button>

                    {/* Visual Effect */}
                    <button className="media-btn effect-trigger" onClick={() => triggerThemeConfetti()} title="Celebrate!">
                        {currentTheme.id === 'dorm' ? '🎉' : currentTheme.id === 'beach' ? '🫧' : '💖'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%`, animation: 'none' }}></div>
            </div>
        </div>
    );
}

export default Room;
