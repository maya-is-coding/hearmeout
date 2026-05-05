import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import beachImg from '../assets/doodles/room elements/beach.jpeg';
import dateImg from '../assets/doodles/room elements/date.jpeg';
import dormImg from '../assets/doodles/room elements/dorm.jpeg';
import shelfImg from '../assets/doodles/room elements/shelfs.jpeg';
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

    // Single click: select song, load lyrics, show in Now Playing — DON'T play yet
    const handleVinylSelect = useCallback(async (song) => {
        // Stop current audio if something else is playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setCurrentSong(song);
        setLyricIndex(0);
        setProgress(0);
        setIsPlaying(false);

        // Pre-fetch and parse LRC
        try {
            const res = await fetch(song.lrc);
            const text = await res.text();
            setParsedLyrics(parseLrc(text));
        } catch (e) {
            console.error('Failed to load lyrics', e);
            setParsedLyrics([]);
        }
    }, []);

    // Double click OR play button: actually start playing
    const startPlaying = useCallback((song) => {
        const target = song || currentSong;
        if (!target) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(target.audio);
        audioRef.current = audio;
        audio.play();
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
    }, [currentSong]);

    // Play/pause toggle (media controls button)
    const togglePlay = () => {
        if (!currentSong) return;
        if (!audioRef.current) {
            // First time pressing play — create the audio
            startPlaying(currentSong);
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

    // Lyric lines to display (active ± 1)
    const displayLyrics = parsedLyrics.length > 0
        ? parsedLyrics
        : [{ text: 'Click a vinyl to play 🎵', time: 0 }];

    return (
        <div className={`room-container theme-${currentTheme.id} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

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
                                        onClick={() => handleVinylSelect(song)}
                                        onDoubleClick={() => startPlaying(song)}
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
                    <div className="webcam-placeholder">{userName}</div>
                </div>
                <div className="video-half them-half">
                    <div className="webcam-placeholder">Them</div>
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
                    <button className="media-btn" onClick={togglePlay} disabled={!currentSong}>
                        {isPlaying ? '⏸' : '▶'}
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
