import { rawDictionary, validWords } from './words.js';

const targetWords = rawDictionary;

const ROWS = 6;
const COLS = 5;
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let isRestarting = false;

let targetWord = targetWords[Math.floor(Math.random() * targetWords.length)];
console.log("target word:", targetWord);

const boardState = Array(ROWS).fill().map(() => Array(COLS).fill(""));

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
updateTileDisplay();

const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ő","Ó"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "É", "Á","Ú", "Ű"],
    ["Enter","Í", "Y", "X", "C", "V", "B", "N", "M", "Ö", "Ü", "⌫"]
];

const keyboardContainer = document.getElementById("keyboard-container");
const restartBtn = document.getElementById("restart-btn");
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

function handleKeyPress(key) {
    if (gameOver) return;

    const messageEl = document.getElementById("message");
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
        }
        return;
    }

    const letter = key.toUpperCase();
    if (/^[A-ZÁÉÍÓÖŐÚÜŰ]$/.test(letter)) {
        if (currentCol < COLS) {
            boardState[currentRow][currentCol] = letter;
            currentCol++;
            updateTileDisplay();
        }
    }
}

document.addEventListener("keydown", (e) => {
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
        currentRow = 0;
        currentCol = 0;
        gameOver = false;

        let newWord;
        do {
            newWord = targetWords[Math.floor(Math.random() * targetWords.length)];
        } while (newWord === targetWord && targetWords.length > 1);
        targetWord = newWord;
        console.log("New secret target word:", targetWord);

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                boardState[r][c] = "";
                const tile = document.getElementById(`tile-${r}-${c}`);
                tile.textContent = "";
                tile.className = "tile";

                tile.style.animation = "none";
                tile.offsetHeight;
                const totalIndex = (r * COLS) + c;
                tile.style.animation = `fadeInSlide 0.5s ease ${totalIndex * 40}ms forwards`;
            }
        }

        Object.values(keyElements).forEach(keyEl => {
            if (keyEl.textContent === "Enter" || keyEl.textContent === "⌫") {
                keyEl.className = "key wide-key";
            } else {
                keyEl.className = "key";
            }
        });

        showMessage("");
        isRestarting = false;
        updateTileDisplay();
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
    const messageEl = document.getElementById("message");
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


    if (isWin) {
        recordWin(guessedRow);

        setTimeout(() => {
            showMessage("Gratulálok! Kitaláltad a szót!");

            if (typeof confetti === "function") {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            // Pop up the stats modal 2 seconds AFTER the confetti/message appears
            setTimeout(() => {
                updateStatsDisplay();
                statsModal.style.display = "flex";
            }, 3000);

        }, COLS * 200);

        gameOver = true;
        return;
    }


    currentRow++;
    currentCol = 0;
    updateTileDisplay();


    if (currentRow >= ROWS) {
        recordLoss();

        setTimeout(() => {
            showMessage(`Kifogytál próbálkozásokból! A szó: <span style="color: white; font-weight: bold;">${targetWord.toUpperCase()}</span> volt!`);

            // Pop up the stats modal 2 seconds AFTER the loss message appears
            setTimeout(() => {
                updateStatsDisplay();
                statsModal.style.display = "flex";
            }, 30008);

        }, COLS * 200);

        gameOver = true;
    }
}

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

let stats = JSON.parse(localStorage.getItem("wordle_stats")) || {
    gamesPlayed: 0,
    wins: 0,
    guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
};

function saveStats() {
    localStorage.setItem("wordle_stats", JSON.stringify(stats));
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
    stats.gamesPlayed++;
    stats.wins++;
    stats.guesses[rowNum + 1]++;
    saveStats();
}

function recordLoss() {
    stats.gamesPlayed++;
    saveStats();
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