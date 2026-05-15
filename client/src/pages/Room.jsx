import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import socket from '../socket';
import confetti from 'canvas-confetti';
import beachImg from '../assets/doodles/room elements/beach.jpeg';
import dateImg from '../assets/doodles/room elements/date.jpeg';
import dormImg from '../assets/doodles/room elements/dorm.jpeg';
import shelfImg from '../assets/doodles/room elements/shelfs.jpeg';
import micImg from '../assets/doodles/room elements/mic.png';
import cameraImg from '../assets/doodles/room elements/camera.png';

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
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const userName = location.state?.userName || 'You';

    // UI state
    const [partnerConnected, setPartnerConnected] = useState(false);
    const [partnerName, setPartnerName] = useState('');
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

    // Refs to hold latest state for stable socket callbacks (avoids re-render loops)
    const currentSongRef = useRef(null);
    const isPlayingRef = useRef(false);
    useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Keep refs of current state for socket callbacks without triggering reconnects
    const syncStateRef = useRef({ song: null, audio: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        syncStateRef.current = { song: currentSong, audio: audioRef.current };
    }, [currentSong, isPlaying]);

    // Tick: every second sync lyric index to audio.currentTime
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Handle Socket Connection
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        socket.emit('join-room', { code: roomCode, name: userName });

        socket.on('partner-joined', (pName) => {
            setPartnerConnected(true);
            setPartnerName(pName || 'Them');
            console.log('partner joined!', pName);
            
            // Sync current state to the joining partner
            const state = syncStateRef.current;
            if (state.audio && state.song) {
                socket.emit('sync-song', {
                    code: roomCode,
                    songId: state.song.id,
                    timestamp: state.audio.currentTime,
                    isPlaying: !state.audio.paused
                });
            }
        });

        socket.on('partner-left', () => {
            setPartnerConnected(false);
            setPartnerName('');
            console.log('partner left');
        });

        // Listen for theme changes from partner
        socket.on('theme-changed', (themeId) => {
            const newTheme = themes.find(t => t.id === themeId);
            if (newTheme) setCurrentTheme(newTheme);
        });

        socket.on('connect', () => {
            console.log('CONNECTED TO SOCKET SERVER:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('SOCKET CONNECTION ERROR:', err.message);
        });

        return () => {
            socket.off('partner-joined');
            socket.off('partner-left');
            socket.off('theme-changed');
            socket.off('connect');
            socket.off('connect_error');
        };
    }, [roomCode, userName]);

    // Handle theme-specific background effects (Confetti intervals, Bubbles, Hearts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    startVelocity: 15,
                    scalar: 0.8,
                    origin: { y: 0.2, x: Math.random() },
                    ticks: 200
                });
            }, 1200);
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

    // Stable play-song function that reads state from refs (never changes identity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const playSong = useCallback(async (song, fromSocket = false, timestamp = 0, autoPlay = true) => {
        // If clicking the same song that is already playing, toggle pause
        if (!fromSocket && currentSongRef.current?.id === song.id && audioRef.current) {
            if (isPlayingRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
                socket.emit('pause-song', { code: roomCode, timestamp: audioRef.current.currentTime });
            } else {
                audioRef.current.play().catch(err => console.error("Playback failed:", err));
                setIsPlaying(true);
                socket.emit('resume-song', { code: roomCode, timestamp: audioRef.current.currentTime });
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
        setIsPlaying(autoPlay);

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
        audio.currentTime = timestamp;

        if (autoPlay) {
            audio.play().catch(err => console.error("Playback failed:", err));
        }

        if (!fromSocket) {
            socket.emit('play-song', {
                code: roomCode,
                songId: song.id,
                timestamp: timestamp
            });
        }

        audio.onended = () => {
            setIsPlaying(false);
            triggerThemeConfetti();
        };
    }, [roomCode]); // Only depends on roomCode — stable across state changes

    // Wrapper that user-facing code calls (so vinyl onClick still works)
    const handleVinylClick = playSong;

    // Listen for partner playing or pausing a song (runs only once per mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const onPlaySong = ({ songId, timestamp }) => {
            const song = songs.find(s => s.id === songId);
            if (song) playSong(song, true, timestamp, true);
        };
        
        const onPauseSong = ({ timestamp }) => {
            if (audioRef.current) {
                if (timestamp !== undefined) audioRef.current.currentTime = timestamp;
                audioRef.current.pause();
                setIsPlaying(false);
            }
        };
        
        const onResumeSong = ({ timestamp }) => {
            if (audioRef.current) {
                if (timestamp !== undefined) audioRef.current.currentTime = timestamp;
                audioRef.current.play().catch(err => console.error("Playback failed:", err));
                setIsPlaying(true);
            }
        };

        const onSyncSong = ({ songId, timestamp, isPlaying: partnerPlaying }) => {
            const song = songs.find(s => s.id === songId);
            if (!song) return;
            console.log('sync-song received:', songId, 'ts:', timestamp, 'playing:', partnerPlaying);
            playSong(song, true, timestamp, partnerPlaying);
        };

        socket.on('play-song', onPlaySong);
        socket.on('pause-song', onPauseSong);
        socket.on('resume-song', onResumeSong);
        socket.on('sync-song', onSyncSong);
        
        return () => {
            socket.off('play-song', onPlaySong);
            socket.off('pause-song', onPauseSong);
            socket.off('resume-song', onResumeSong);
            socket.off('sync-song', onSyncSong);
        };
    }, [playSong]);

    // Request sync ONCE after mount — separate from song listeners to avoid re-triggering
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        // Small delay to ensure all listeners are registered first
        const timer = setTimeout(() => {
            socket.emit('request-sync', roomCode);
            console.log('request-sync emitted for room', roomCode);
        }, 300);
        return () => clearTimeout(timer);
    }, [roomCode]);

    // Play/pause toggle (central mic button)
    const togglePlay = () => {
        if (!currentSong) return;
        handleVinylClick(currentSong);
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
                fontSize: '24px',
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
            fontSize: '16px',
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
                                onClick={() => { setCurrentTheme(t); setIsThemesOpen(false); socket.emit('change-theme', { code: roomCode, themeId: t.id }); }}
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
                <div className="video-half them-half">
                    <div className="webcam-placeholder">
                        <span className="webcam-name">{partnerConnected ? partnerName : 'waiting...'}</span>
                    </div>
                    {partnerConnected && <img src={getThemeMic()} className="floating-mic left-mic" alt="" />}
                </div>
                <div className="video-half you-half">
                    <div className="webcam-placeholder">
                        <span className="webcam-name">{userName}</span>
                    </div>
                    {isMicOn && <img src={getThemeMic()} className="floating-mic right-mic" alt="" />}
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
                    <button className={`media-btn ${!isMicOn ? 'off' : ''}`} onClick={() => setIsMicOn(!isMicOn)} title="Toggle Microphone">
                        {isMicOn ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M19 11h-2c0 .91-.26 1.75-.69 2.48l1.46 1.46A6.921 6.921 0 0 0 19 11zM14.98 11.17c-.04.3-.12.58-.23.85l1.65 1.65c.34-.73.55-1.54.58-2.39l-1.98-.11zM11 5c0-.55.45-1 1-1s1 .45 1 1v5.17l1.82 1.82c.11-.31.18-.64.18-.99V5c0-1.66-1.34-3-3-3S9 3.34 9 5v1.17l2 2V5zM2.1 2.1L.69 3.51 5.17 8H4v3c0 3.53 2.61 6.43 6 6.92V21h4v-1.08l4.49 4.49 1.41-1.41L2.1 2.1zm8.9 14.82V14c-1.66 0-3-1.34-3-3V9.83l4 4A2.99 2.99 0 0 1 11 16.92z" />
                            </svg>
                        )}
                    </button>

                    {/* Video */}
                    <button className={`media-btn ${!isVideoOn ? 'off' : ''}`} onClick={() => setIsVideoOn(!isVideoOn)} title="Toggle Video">
                        {isVideoOn ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                            </svg>
                        )}
                    </button>

                    {/* Play/Pause */}
                    <button className={`media-btn play-pause-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} disabled={!currentSong} title="Play/Pause">
                        <img src={micImg} alt="Play/Pause" className="play-pause-mic" />
                    </button>

                    {/* Layout Switch */}
                    <button className="media-btn" onClick={() => setLayoutMode(layoutMode === 'split' ? 'pip' : 'split')} title="Switch Layout">
                        {layoutMode === 'split' ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M3 3v18h18V3H3zm8 16H5V5h6v14zm8 0h-6V5h6v14z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
                            </svg>
                        )}
                    </button>

                    {/* Visual Effect */}
                    <button className="media-btn effect-trigger" onClick={() => triggerThemeConfetti()} title="Celebrate!">
                        {currentTheme.id === 'dorm' ? '🎉' : currentTheme.id === 'beach' ? '🫧' : '💖'}
                    </button>
                </div>
            </div>

            {/* Photo Booth Button */}
            <div className="photo-booth-container">
                <svg className="photo-booth-text" viewBox="0 0 100 100">
                    <path id="photoPath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
                    <text fill="var(--theme-secondary)" fontSize="11" fontWeight="bold" letterSpacing="1.8">
                        <textPath href="#photoPath" startOffset="0%">
                            SAY CHEESE •  ☆*: .｡. o(≧▽≦)o .｡.:*☆
                        </textPath>
                    </text>
                </svg>
                <img
                    src={cameraImg}
                    alt="Camera"
                    className="photo-booth-btn"
                    onClick={() => alert('Snap! Photo saved!')}
                    title="Photo Booth"
                />
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%`, animation: 'none' }}></div>
            </div>
        </div>
    );
}

export default Room;
