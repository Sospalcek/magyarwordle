import { rawDictionary, validWords } from './words.js';

const ROWS = 6;
const COLS = 5;


let currentMode = 'daily';


let dailyBoardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));
let dailyCurrentRow = 0;
let dailyCurrentCol = 0;
let dailyGameOver = false;


let practiceTargetWord = "";
let practiceBoardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));
let practiceCurrentRow = 0;
let practiceCurrentCol = 0;
let practiceGameOver = false;


let targetWord = "";
let boardState = [];
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let isRestarting = false;


function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}


function getDailyWord() {
    const today = getTodayDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = (hash << 5) - hash + today.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % rawDictionary.length;
    return rawDictionary[index];
}

const board = document.getElementById("board");
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.id = `tile-${r}-${c}`;

        const totalIndex = (r * COLS) + c;
        tile.style.animationDelay = `${totalIndex * 40}ms`;

        board.appendChild(tile);
    }
}

const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ő","Ó"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "É", "Á","Ú", "Ű"],
    ["Enter","Í", "Y", "X", "C", "V", "B", "N", "M", "Ö", "Ü", "⌫"]
];

const keyboardContainer = document.getElementById("keyboard-container");
const restartBtn = document.getElementById("restart-btn");
const gameTitleEl = document.getElementById("game-title");
const messageEl = document.getElementById("message");
const keyElements = {};

keyboardRows.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("keyboard-row");

    row.forEach(char => {
        const button = document.createElement("button");
        button.classList.add("key");
        button.textContent = char;

        if (char === "Enter" || char === "⌫") {
            button.classList.add("wide-key");
        }

        button.addEventListener("click", () => handleKeyPress(char));

        rowDiv.appendChild(button);
        keyElements[char] = button;
    });

    keyboardContainer.appendChild(rowDiv);
});


function loadDailyProgress() {
    targetWord = getDailyWord();
    const today = getTodayDateString();
    const savedData = JSON.parse(localStorage.getItem("magyar_wordle_daily_progress"));

    if (savedData && savedData.date === today) {
        dailyBoardState = savedData.boardState;
        dailyCurrentRow = savedData.currentRow;
        dailyCurrentCol = savedData.currentCol;
        dailyGameOver = savedData.gameOver;
    } else {
        dailyBoardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));
        dailyCurrentRow = 0;
        dailyCurrentCol = 0;
        dailyGameOver = false;
        saveDailyProgress();
    }

    boardState = dailyBoardState;
    currentRow = dailyCurrentRow;
    currentCol = dailyCurrentCol;
    gameOver = dailyGameOver;

    if (gameOver) {
        restartBtn.style.visibility = "hidden";
        restartBtn.style.pointerEvents = "none";
    } else {
        restartBtn.style.visibility = "visible";
        restartBtn.style.pointerEvents = "auto";
    }
}

function saveDailyProgress() {
    if (currentMode !== 'daily') return;
    const today = getTodayDateString();
    const data = {
        date: today,
        boardState: dailyBoardState,
        currentRow: dailyCurrentRow,
        currentCol: dailyCurrentCol,
        gameOver: dailyGameOver
    };
    localStorage.setItem("magyar_wordle_daily_progress", JSON.stringify(data));
}

function syncPointersToActiveMode() {
    if (currentMode === 'daily') {
        dailyBoardState = boardState;
        dailyCurrentRow = currentRow;
        dailyCurrentCol = currentCol;
        dailyGameOver = gameOver;
        saveDailyProgress();
    } else {
        practiceBoardState = boardState;
        practiceCurrentRow = currentRow;
        practiceCurrentCol = currentCol;
        practiceGameOver = gameOver;
    }
}

function colorizeRowFromSaved(rowIdx, guess) {
    const targetChars = targetWord.toLowerCase().split("");
    const guessChars = guess.split("");
    const rowColorStates = Array(COLS).fill("absent");

    for (let i = 0; i < COLS; i++) {
        if (guessChars[i] === targetChars[i]) {
            rowColorStates[i] = "correct";
            targetChars[i] = null;
            guessChars[i] = null;
        }
    }

    for (let i = 0; i < COLS; i++) {
        if (guessChars[i] === null) continue;
        const targetIndex = targetChars.indexOf(guessChars[i]);
        if (targetIndex !== -1) {
            rowColorStates[i] = "present";
            targetChars[targetIndex] = null;
        } else {
            rowColorStates[i] = "absent";
        }
    }

    for (let i = 0; i < COLS; i++) {
        const tile = document.getElementById(`tile-${rowIdx}-${i}`);
        tile.classList.add(rowColorStates[i]);

        const char = guess[i].toUpperCase();
        const keyEl = keyElements[char];
        if (keyEl) {
            if (rowColorStates[i] === "correct") {
                keyEl.className = "key correct";
            } else if (rowColorStates[i] === "present" && !keyEl.classList.contains("correct")) {
                keyEl.className = "key present";
            } else if (rowColorStates[i] === "absent" && !keyEl.classList.contains("correct") && !keyEl.classList.contains("present")) {
                keyEl.className = "key absent";
            }
        }
    }
}


loadDailyProgress();
restoreBoardAndKeyboard();


const modeSwitchContainer = document.getElementById("mode-switch-container");
const modeLabels = document.querySelectorAll(".mode-label");

if (modeSwitchContainer) {
    modeSwitchContainer.addEventListener("click", () => {
        modeSwitchContainer.blur();


        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = document.getElementById(`tile-${r}-${c}`);
                tile.classList.add("fade-out");
            }
        }
        restartBtn.classList.add("fade-out");
        messageEl.classList.add("fade-out");

        setTimeout(() => {
            syncPointersToActiveMode();

            if (currentMode === 'daily') {
                currentMode = 'practice';
                modeSwitchContainer.classList.add("practice");
                modeLabels[0].classList.remove("active");
                modeLabels[1].classList.add("active");

                animateTitleChange("GYAKORLÁS");
                initPracticeMode(); // Mindig friss gyakorlójátékot indít átváltáskor
            } else {
                currentMode = 'daily';
                modeSwitchContainer.classList.remove("practice");
                modeLabels[1].classList.remove("active");
                modeLabels[0].classList.add("active");

                animateTitleChange("NAPI SZÓ");
                loadDailyProgress();
                restoreBoardAndKeyboard();
            }

            restartBtn.classList.remove("fade-out");
            messageEl.classList.remove("fade-out");
            triggerButtonPopUp();

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const tile = document.getElementById(`tile-${r}-${c}`);
                    tile.classList.remove("fade-out");
                    tile.style.animation = "none";
                    tile.offsetHeight;
                    const totalIndex = (r * COLS) + c;
                    tile.style.animation = `fadeInSlide 0.5s ease ${totalIndex * 40}ms forwards`;
                }
            }
        }, 300);
    });
}

function animateTitleChange(newText) {
    gameTitleEl.classList.remove("title-animate");
    void gameTitleEl.offsetWidth;
    gameTitleEl.textContent = newText;
    gameTitleEl.classList.add("title-animate");
}

function triggerButtonPopUp() {
    restartBtn.style.animation = "none";
    restartBtn.offsetHeight;
    restartBtn.style.animation = "fadeInSlide 0.4s ease forwards";
}

function initPracticeMode() {
    practiceTargetWord = rawDictionary[Math.floor(Math.random() * rawDictionary.length)];
    practiceBoardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));
    practiceCurrentRow = 0;
    practiceCurrentCol = 0;
    practiceGameOver = false;

    targetWord = practiceTargetWord;
    boardState = practiceBoardState;
    currentRow = practiceCurrentRow;
    currentCol = practiceCurrentCol;
    gameOver = practiceGameOver;

    restartBtn.style.visibility = "visible";
    restartBtn.style.pointerEvents = "auto";

    restoreBoardAndKeyboard();
    showMessage("");
}

function restoreBoardAndKeyboard() {
    // Reset key visuals first
    Object.values(keyElements).forEach(keyEl => {
        if (keyEl.textContent === "Enter" || keyEl.textContent === "⌫") {
            keyEl.className = "key wide-key";
        } else {
            keyEl.className = "key";
        }
    });

    if (gameOver && currentMode === 'daily') {
        restartBtn.style.visibility = "hidden";
        restartBtn.style.pointerEvents = "none";

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = document.getElementById(`tile-${r}-${c}`);
                tile.textContent = "";
                tile.className = "tile";
            }
        }

        const totalEntranceTime = (ROWS * COLS - 1) * 40 + 500;
        setTimeout(() => {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const tile = document.getElementById(`tile-${r}-${c}`);
                    tile.textContent = boardState[r][c];
                }
            }

            for (let r = 0; r < currentRow; r++) {
                const guess = boardState[r].join("").toLowerCase();
                colorizeRowFromSaved(r, guess);
            }

            showMessage(`A mai szó már teljesítve lett: <span class="highlight-word">${targetWord.toUpperCase()}</span>`);
        }, totalEntranceTime);

    } else {
        restartBtn.style.visibility = "visible";
        restartBtn.style.pointerEvents = "auto";

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = document.getElementById(`tile-${r}-${c}`);
                tile.textContent = boardState[r][c];
                tile.className = "tile";
            }
        }


        const totalEntranceTime = (ROWS * COLS - 1) * 40 + 400;
        setTimeout(() => {
            for (let r = 0; r < currentRow; r++) {
                const guess = boardState[r].join("").toLowerCase();
                colorizeRowFromSaved(r, guess);
            }
        }, totalEntranceTime);

        if (!gameOver) {
            showMessage("");
        }
        updateTileDisplay();
    }
}

function handleKeyPress(key) {
    if (gameOver) {
        if (currentMode === 'daily') {
            showMessage("A mai napi szó már le lett játszva!");
        }
        return;
    }

    messageEl.textContent = "";

    if (key === "Enter") {
        if (currentCol < COLS) {
            showMessage("Nem elég hosszú szó!");
            return;
        }
        checkGuess();
        return;
    }

    if (key === "⌫") {
        if (currentCol > 0) {
            currentCol--;
            boardState[currentRow][currentCol] = "";
            updateTileDisplay();
            syncPointersToActiveMode();
        }
        return;
    }

    const letter = key.toUpperCase();
    if (/^[A-ZÁÉÍÓÖŐÚÜŰ]$/.test(letter)) {
        if (currentCol < COLS) {
            boardState[currentRow][currentCol] = letter;
            currentCol++;
            updateTileDisplay();
            syncPointersToActiveMode();
        }
    }
}

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "Enter") {
        handleKeyPress("Enter");
    } else if (e.key === "Backspace") {
        handleKeyPress("⌫");
    } else {
        const letter = e.key.toUpperCase();
        if (/^[A-ZÁÉÍÓÖŐÚÜŰ]$/.test(letter)) {
            handleKeyPress(letter);
        }
    }
});

restartBtn.addEventListener("click", () => {
    if (currentMode === 'daily' && gameOver) return;
    if (isRestarting) return;
    isRestarting = true;
    restartBtn.blur();

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = document.getElementById(`tile-${r}-${c}`);
            tile.classList.add("fade-out");
        }
    }

    setTimeout(() => {
        if (currentMode === 'practice') {
            initPracticeMode();
        } else {
            dailyBoardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));
            dailyCurrentRow = 0;
            dailyCurrentCol = 0;
            dailyGameOver = false;
            boardState = dailyBoardState;
            currentRow = dailyCurrentRow;
            currentCol = dailyCurrentCol;
            gameOver = dailyGameOver;
            saveDailyProgress();
            restoreBoardAndKeyboard();
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = document.getElementById(`tile-${r}-${c}`);
                tile.classList.remove("fade-out");
                tile.style.animation = "none";
                tile.offsetHeight;
                const totalIndex = (r * COLS) + c;
                tile.style.animation = `fadeInSlide 0.5s ease ${totalIndex * 40}ms forwards`;
            }
        }

        isRestarting = false;
    }, 1000);
});

function updateTileDisplay() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = document.getElementById(`tile-${r}-${c}`);
            tile.textContent = boardState[r][c];

            if (!gameOver && r === currentRow && c === currentCol) {
                tile.classList.add("active-tile");
            } else {
                tile.classList.remove("active-tile");
            }
        }
    }
}

function showMessage(text) {
    messageEl.innerHTML = text;

    messageEl.style.animation = "none";
    messageEl.offsetHeight;
    messageEl.style.animation = "appear 0.5s ease forwards";
}

function checkGuess() {
    const currentGuess = boardState[currentRow].join("").toLowerCase();

    if (!validWords.includes(currentGuess)) {
        showMessage("Nincs ilyen szó a szótárban!");
        return;
    }

    const targetChars = targetWord.toLowerCase().split("");
    const guessChars = currentGuess.split("");
    const rowColorStates = Array(COLS).fill("absent");

    for (let i = 0; i < COLS; i++) {
        if (guessChars[i] === targetChars[i]) {
            rowColorStates[i] = "correct";
            targetChars[i] = null;
            guessChars[i] = null;
        }
    }

    for (let i = 0; i < COLS; i++) {
        if (guessChars[i] === null) continue;

        const targetIndex = targetChars.indexOf(guessChars[i]);
        if (targetIndex !== -1) {
            rowColorStates[i] = "present";
            targetChars[targetIndex] = null;
        } else {
            rowColorStates[i] = "absent";
        }
    }

    const isWin = (currentGuess === targetWord.toLowerCase());
    const guessedRow = currentRow;

    for (let i = 0; i < COLS; i++) {
        const tile = document.getElementById(`tile-${guessedRow}-${i}`);
        setTimeout(() => {
            tile.classList.add(rowColorStates[i]);
        }, i * 200);
    }

    setTimeout(() => {
        for (let i = 0; i < COLS; i++) {
            const originalChar = currentGuess[i].toUpperCase();
            const currentState = rowColorStates[i];
            const keyEl = keyElements[originalChar];

            if (keyEl) {
                if (currentState === "correct") {
                    keyEl.className = "key correct";
                } else if (currentState === "present" && !keyEl.classList.contains("correct")) {
                    keyEl.className = "key present";
                } else if (currentState === "absent" && !keyEl.classList.contains("correct") && !keyEl.classList.contains("present")) {
                    keyEl.className = "key absent";
                }
            }
        }
    }, COLS * 200);

    currentRow++;
    currentCol = 0;
    gameOver = isWin || (currentRow >= ROWS);

    syncPointersToActiveMode();
    updateTileDisplay();

    if (isWin) {
        if (currentMode === 'daily') {
            recordWin(guessedRow);
        }

        setTimeout(() => {
            showMessage("Gratulálok! Kitaláltad a szót!");

            if (typeof confetti === "function") {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            if (currentMode === 'daily') {
                restartBtn.style.visibility = "hidden";
                restartBtn.style.pointerEvents = "none";
                setTimeout(() => {
                    updateStatsDisplay();
                    statsModal.style.display = "flex";
                }, 2000);
            }

        }, COLS * 200);
        return;
    }

    if (currentRow >= ROWS) {
        if (currentMode === 'daily') {
            recordLoss();
        }

        setTimeout(() => {
            showMessage(`Kifogytál próbálkozásokból! A szó: <span class="highlight-word">${targetWord.toUpperCase()}</span> volt!`);
            if (currentMode === 'daily') {
                restartBtn.style.visibility = "hidden";
                restartBtn.style.pointerEvents = "none";
            }
        }, COLS * 200);
    }
}

// Help Modal
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const closeModal = document.getElementById("close-modal");

helpBtn.addEventListener("click", () => {
    helpModal.style.display = "flex";
    helpBtn.blur();
});

closeModal.addEventListener("click", () => {
    helpModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === helpModal) {
        helpModal.style.display = "none";
    }
});

// Statistics
let stats = JSON.parse(localStorage.getItem("magyar_wordle_daily_stats")) || {
    gamesPlayed: 0,
    wins: 0,
    guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
};

function saveStats() {
    localStorage.setItem("magyar_wordle_daily_stats", JSON.stringify(stats));
}

function updateStatsDisplay() {
    document.getElementById("stat-games").textContent = stats.gamesPlayed;
    const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
    document.getElementById("stat-winrate").textContent = winRate + "%";
    document.getElementById("stat-wins").textContent = stats.wins;

    const maxVal = Math.max(...Object.values(stats.guesses), 1);

    for (let i = 1; i <= 6; i++) {
        const count = stats.guesses[i];
        const bar = document.getElementById(`bar-${i}`);
        bar.textContent = count > 0 ? count : "‎";
        const percentage = Math.max((count / maxVal) * 100, count > 0 ? 8 : 0);
        bar.style.width = percentage + "%";
    }
}

function recordWin(rowNum) {
    const today = getTodayDateString();
    const lastCountedDate = localStorage.getItem("magyar_wordle_last_win_date");
    if (lastCountedDate === today) return;

    stats.gamesPlayed++;
    stats.wins++;
    stats.guesses[rowNum + 1]++;
    saveStats();
    localStorage.setItem("magyar_wordle_last_win_date", today);
}

function recordLoss() {
    const today = getTodayDateString();
    const lastCountedDate = localStorage.getItem("magyar_wordle_last_loss_date");
    if (lastCountedDate === today) return;

    stats.gamesPlayed++;
    saveStats();
    localStorage.setItem("magyar_wordle_last_loss_date", today);
}

const statsBtn = document.getElementById("stats-btn");
const statsModal = document.getElementById("stats-modal");
const closeStats = document.getElementById("close-stats");

statsBtn.addEventListener("click", () => {
    updateStatsDisplay();
    statsModal.style.display = "flex";
    statsBtn.blur();
});

closeStats.addEventListener("click", () => {
    statsModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === statsModal) {
        statsModal.style.display = "none";
    }
});


const themeBtn = document.getElementById("theme-btn");
const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeBtn.innerHTML = moonSvg;
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");

    themeBtn.innerHTML = isLight ? moonSvg : sunSvg;
    localStorage.setItem("theme", isLight ? "light" : "dark");

    localStorage.setItem('themeTipClicked', 'true');
    const tooltip = document.getElementById('theme-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s ease';
        setTimeout(() => tooltip.remove(), 300);
    }

    themeBtn.blur();
});

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('themeTipClicked') === 'true') {
        const tooltip = document.getElementById('theme-tooltip');
        if (tooltip) tooltip.remove();
    }
});