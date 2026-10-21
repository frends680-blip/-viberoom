const songs = [
    {
        title: "ночной дом",
        artist: "grandsam",
        emoji: "❤️",
        audio: "audio/grandsam - Ночной город (mp3teka.com).mp3"
    },
    {
        title: "сладких снов",
        artist: "kristiee",
        emoji: "🥶",
        audio: "audio/kristiee - сладких снов (mp3teka.com).mp3"
    },
    {
        title: " Afterglow",
        artist: "N_Bespalov",
        emoji: "🌌",
        audio: "audio/NBSPLV - Afterglow (mp3teka.com).mp3"
    },
    {
        title: "Татарин",
        artist: "АИГЕЛ",
        emoji: "🖤",
      audio: "audio/АИГЕЛ - Татарин (mp3teka.com).mp3"
    },
    {
        title: "92",
        artist: "Валентин Стрыкало",
        emoji: "🎸",
        audio: "audio/Валентин Стрыкало - 92 (mp3teka.com).mp3"
    },
    {
        title: "Письмо домой",
        artist: "Guf",
        emoji: "✉️",
      audio: "audio/Guf - Письмо домой (mp3teka.com) — копия.mp3"
       }
];
const songsContainer = document.getElementById("songs");
const favoritesContainer = document.getElementById("favorites");
const searchInput = document.getElementById("search");
const noResults = document.getElementById("no-results");
const emptyFavorites = document.getElementById("empty-favorites");

const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const playerEmoji = document.getElementById("player-emoji");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("current-time");
const duration = document.getElementById("duration");

const audio = new Audio();

let currentSongIndex = -1;
let isPlaying = false;
let favorites = [];
let internetSongs = [];
let searchTimer;

function renderSongs(list, container) {
    container.innerHTML = "";

    list.forEach((song) => {
        const isInternet = song.isInternet === true;
        const originalIndex = songs.indexOf(song);
        const isFavorite = favorites.includes(originalIndex);

        const card = document.createElement("div");
        card.className = "song-card";

        card.innerHTML = `
            <div class="song-cover">${song.emoji || "🎧"}</div>
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
            <div class="song-actions">
                ${
                    isInternet
                        ? (song.audio
                            ? '<audio controls preload="none"></audio>'
                            : '<span>превью недоступно</span>')
                        : `
                            <button class="play-song" aria-label="Воспроизвести">▶️</button>
                            <button class="favorite-btn" aria-label="Избранное">
                                ${isFavorite ? "❤️" : "♡"}
                            </button>
                        `
                }
            </div>
        `;

        if (isInternet) {
            const preview = card.querySelector("audio");

            if (preview) {
                preview.src = song.audio;
            }

} else {
            card.querySelector(".play-song").addEventListener("click", () => {
                playSong(originalIndex);
            });

            card.querySelector(".favorite-btn").addEventListener("click", () => {
                toggleFavorite(originalIndex);
            });
        }

        container.appendChild(card);
    });
}
function renderAll() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredLocalSongs = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    const filteredInternetSongs = internetSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    renderSongs(
        [...filteredLocalSongs, ...filteredInternetSongs],
        songsContainer
    );

    noResults.hidden =
        filteredLocalSongs.length + filteredInternetSongs.length > 0;

    const favoriteSongs = favorites
        .map(index => songs[index])
        .filter(Boolean);

    renderSongs(favoriteSongs, favoritesContainer);
    emptyFavorites.hidden = favoriteSongs.length > 0;
}
function toggleFavorite(index) {
    if (favorites.includes(index)) {
        favorites = favorites.filter(item => item !== index);
    } else {
        favorites.push(index);
    }

    renderAll();
}

function playSong(index) {
    if (index < 0 || index >= songs.length) return;

    currentSongIndex = index;
    const song = songs[index];

    audio.src = song.audio;
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerEmoji.textContent = song.emoji;

    progress.value = 0;
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";

    audio.play()
        .then(() => {
            isPlaying = true;
            playBtn.textContent = "⏸️";
        })
        .catch((error) => {
            isPlaying = false;
            playBtn.textContent = "▶️";
            console.error("Ошибка воспроизведения:", error);
            alert("Не удалось включить песню. Проверь папку audio и точное название MP3-файла.");
        });
}

function togglePlay() {
    if (currentSongIndex === -1) {
        playSong(0);
        return;
    }

    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch((error) => {
            console.error("Ошибка воспроизведения:", error);
            alert("Не удалось включить песню. Проверь MP3-файл.");
        });
    }
}

function nextSong() {
    const nextIndex = currentSongIndex < 0
        ? 0
        : (currentSongIndex + 1) % songs.length;

    playSong(nextIndex);
}

function prevSong() {
    const prevIndex = currentSongIndex < 0
        ? 0
        : (currentSongIndex - 1 + songs.length) % songs.length;

    playSong(prevIndex);
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();

    clearTimeout(searchTimer);
    internetSongs = [];
    renderAll();

    if (query.length < 2) return;

    searchTimer = setTimeout(async () => {
        try {
            const url =
                "https://itunes.apple.com/search?term=" +
                encodeURIComponent(query) +
                "&entity=song&limit=15&country=KG";

            const response = await fetch(url);
            if (!response.ok) throw new Error("Ошибка поиска");

            const data = await response.json();

            if (searchInput.value.trim() !== query) return;

            internetSongs = data.results
                .filter(song => song.trackName)
                .map(song => ({
                    title: song.trackName,
                    artist: song.artistName,
                    emoji: "🎧",
                    audio: song.previewUrl || "",
                    isInternet: true
                }));

            renderAll();
        } catch (error) {
            console.error("Ошибка поиска в интернете:", error);
        }
    }, 500);
});
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

audio.addEventListener("play", () => {
    isPlaying = true;
    playBtn.textContent = "⏸️";
});

audio.addEventListener("pause", () => {
    isPlaying = false;
    playBtn.textContent = "▶️";
});

audio.addEventListener("timeupdate", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        progress.value = (audio.currentTime / audio.duration) * 100;
        currentTime.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (progress.value / 100) * audio.duration;
    }
});

audio.addEventListener("ended", nextSong);

audio.addEventListener("error", () => {
    console.error("Не удалось загрузить аудиофайл:", audio.src);
});

function renderAll() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredLocalSongs = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    const filteredInternetSongs = internetSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    renderSongs([...filteredLocalSongs, ...filteredInternetSongs], songsContainer);
    noResults.hidden =
        filteredLocalSongs.length + filteredInternetSongs.length > 0;

    const favoriteSongs = favorites
        .map(index => songs[index])
        .filter(Boolean);

    renderSongs(favoriteSongs, favoritesContainer);
    emptyFavorites.hidden = favoriteSongs.length > 0;
}
renderAll();