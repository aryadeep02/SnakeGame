// Game Configuration
const CONFIG = {
    blockHeight: 30,
    blockWidth: 30,
    speeds: {
        easy: 200,
        medium: 150,
        hard: 100
    },
    difficultyNames: {
        200: 'Easy',
        150: 'Medium',
        100: 'Hard'
    }
};

// DOM Elements
const board = document.querySelector('.board');
const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const pauseModal = document.getElementById('pauseModal');
const startButton = document.querySelector('.btn-start');
const pauseButton = document.getElementById('pauseBtn');
const resumeButton = document.querySelector('.btn-resume');
const quitButton = document.querySelector('.btn-quit');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const timeElement = document.getElementById('time');
const finalScoreElement = document.getElementById('finalScore');
const finalTimeElement = document.getElementById('finalTime');
const finalHighScoreElement = document.getElementById('finalHighScore');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const currentDifficultyElement = document.getElementById('currentDifficulty');

// Game Over Modal Elements
const difficultyQuestion = document.getElementById('difficultyQuestion');
const difficultySelector = document.getElementById('difficultySelector');
const btnChangeDifficulty = document.getElementById('btnChangeDifficulty');
const btnKeepDifficulty = document.getElementById('btnKeepDifficulty');
const btnDirectRestart = document.getElementById('btnDirectRestart');
const btnQuitGame = document.getElementById('btnQuitGame');
const btnRestartWithDifficulty = document.querySelector('.btn-restart-with-difficulty');
const difficultyButtonsRestart = document.querySelectorAll('.difficulty-btn-restart');

// Game State
let gameState = {
    cols: 0,
    rows: 0,
    blocks: {},
    snake: [],
    food: null,
    direction: 'right',
    nextDirection: 'right',
    intervalId: null,
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    gameSpeed: 150,
    isPaused: false,
    isGameOver: false,
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    currentDifficulty: 'Medium'
};

// Initialize Game
function initGame() {
    // Calculate board dimensions
    gameState.cols = Math.floor(board.clientWidth / CONFIG.blockWidth);
    gameState.rows = Math.floor(board.clientHeight / CONFIG.blockHeight);
    
    // Create board blocks
    board.innerHTML = '';
    gameState.blocks = {};
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const block = document.createElement('div');
            block.classList.add('block');
            board.appendChild(block);
            gameState.blocks[`${row}-${col}`] = block;
        }
    }
    
    // Initialize snake in the center
    const centerRow = Math.floor(gameState.rows / 2);
    const centerCol = Math.floor(gameState.cols / 2);
    
    gameState.snake = [
        { x: centerRow, y: centerCol },
        { x: centerRow, y: centerCol - 1 },
        { x: centerRow, y: centerCol - 2 }
    ];
    
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.elapsedTime = 0;
    
    // Update UI
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
    timeElement.textContent = '00:00';
    currentDifficultyElement.textContent = gameState.currentDifficulty;
    
    // Spawn food
    spawnFood();
    
    // Render initial state
    render();
}

// Spawn Food
function spawnFood() {
    let foodPosition;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        foodPosition = {
            x: Math.floor(Math.random() * gameState.rows),
            y: Math.floor(Math.random() * gameState.cols)
        };
        attempts++;
    } while (
        isPositionOnSnake(foodPosition) && 
        attempts < maxAttempts
    );
    
    // Remove previous food
    if (gameState.food) {
        const oldFoodBlock = gameState.blocks[`${gameState.food.x}-${gameState.food.y}`];
        if (oldFoodBlock) {
            oldFoodBlock.classList.remove('food');
        }
    }
    
    gameState.food = foodPosition;
    const foodBlock = gameState.blocks[`${foodPosition.x}-${foodPosition.y}`];
    if (foodBlock) {
        foodBlock.classList.add('food');
    }
}

// Check if position is on snake
function isPositionOnSnake(position) {
    return gameState.snake.some(
        segment => segment.x === position.x && segment.y === position.y
    );
}

// Render Game
function render() {
    // Clear all blocks
    Object.values(gameState.blocks).forEach(block => {
        block.classList.remove('fill');
    });
    
    // Render snake
    gameState.snake.forEach((segment, index) => {
        const block = gameState.blocks[`${segment.x}-${segment.y}`];
        if (block) {
            block.classList.add('fill');
            if (index === 0) {
                block.style.opacity = '1';
            } else {
                block.style.opacity = '0.9';
            }
        }
    });
}

// Game Loop
function gameLoop() {
    if (gameState.isPaused || gameState.isGameOver) return;
    
    // Update direction
    gameState.direction = gameState.nextDirection;
    
    // Calculate new head position
    const head = gameState.snake[0];
    let newHead;
    
    switch (gameState.direction) {
        case 'left':
            newHead = { x: head.x, y: head.y - 1 };
            break;
        case 'right':
            newHead = { x: head.x, y: head.y + 1 };
            break;
        case 'up':
            newHead = { x: head.x - 1, y: head.y };
            break;
        case 'down':
            newHead = { x: head.x + 1, y: head.y };
            break;
    }
    
    // Check wall collision
    if (
        newHead.x < 0 || 
        newHead.x >= gameState.rows || 
        newHead.y < 0 || 
        newHead.y >= gameState.cols
    ) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (isPositionOnSnake(newHead)) {
        gameOver();
        return;
    }
    
    // Add new head
    gameState.snake.unshift(newHead);
    
    // Check food collision
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        // Increase score
        gameState.score += 10;
        scoreElement.textContent = gameState.score;
        
        // Update high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            highScoreElement.textContent = gameState.highScore;
            localStorage.setItem('snakeHighScore', gameState.highScore);
        }
        
        // Spawn new food
        spawnFood();
        
        // Increase speed slightly
        if (gameState.score % 50 === 0 && gameState.gameSpeed > 50) {
            gameState.gameSpeed -= 5;
            clearInterval(gameState.intervalId);
            gameState.intervalId = setInterval(gameLoop, gameState.gameSpeed);
        }
    } else {
        // Remove tail
        const tail = gameState.snake.pop();
        const tailBlock = gameState.blocks[`${tail.x}-${tail.y}`];
        if (tailBlock) {
            tailBlock.classList.remove('fill');
        }
    }
    
    // Render
    render();
}

// Start Game
function startGame() {
    startModal.style.display = 'none';
    initGame();
    
    // Start game loop
    gameState.intervalId = setInterval(gameLoop, gameState.gameSpeed);
    
    // Start timer
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

// Update Timer
function updateTimer() {
    if (gameState.isPaused || gameState.isGameOver) return;
    
    gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
    timeElement.textContent = `${minutes}:${seconds}`;
}

// Game Over
function gameOver() {
    gameState.isGameOver = true;
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timerInterval);
    
    // Update final stats
    finalScoreElement.textContent = gameState.score;
    finalHighScoreElement.textContent = gameState.highScore;
    
    const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
    finalTimeElement.textContent = `${minutes}:${seconds}`;
    
    // Reset game over modal to initial state
    difficultyQuestion.style.display = 'flex';
    difficultySelector.style.display = 'none';
    btnDirectRestart.style.display = 'none';
    
    // Show game over modal
    setTimeout(() => {
        gameOverModal.style.display = 'flex';
    }, 500);
}

// Pause Game
function pauseGame() {
    if (gameState.isGameOver) return;
    
    gameState.isPaused = true;
    pauseModal.style.display = 'flex';
}

// Resume Game
function resumeGame() {
    gameState.isPaused = false;
    pauseModal.style.display = 'none';
    gameState.startTime = Date.now() - (gameState.elapsedTime * 1000);
}

// Restart Game (Direct - Same Difficulty)
function restartGame() {
    gameOverModal.style.display = 'none';
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timerInterval);
    startGame();
}

// Restart Game with New Difficulty
function restartGameWithDifficulty() {
    gameOverModal.style.display = 'none';
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timerInterval);
    startGame();
}

// Quit Game
function quitGame() {
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timerInterval);
    pauseModal.style.display = 'none';
    gameOverModal.style.display = 'none';
    startModal.style.display = 'flex';
    
    // Reset board
    Object.values(gameState.blocks).forEach(block => {
        block.classList.remove('fill', 'food');
    });
}

// Quit to Main Menu from Game Over
function quitToMainMenu() {
    clearInterval(gameState.intervalId);
    clearInterval(gameState.timerInterval);
    gameOverModal.style.display = 'none';
    startModal.style.display = 'flex';
    
    // Reset board
    Object.values(gameState.blocks).forEach(block => {
        block.classList.remove('fill', 'food');
    });
}

// Handle Keyboard Input
function handleKeyPress(e) {
    if (gameState.isGameOver) return;
    
    // Pause on Space or Escape
    if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
        return;
    }
    
    // Prevent default for arrow keys
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
    }
    
    // Change direction (prevent 180-degree turns)
    switch (e.key) {
        case 'ArrowLeft':
            if (gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
            if (gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            }
            break;
        case 'ArrowUp':
            if (gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
            if (gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            }
            break;
    }
}

// Event Listeners - Start Screen
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
quitButton.addEventListener('click', quitGame);
document.addEventListener('keydown', handleKeyPress);

// Event Listeners - Game Over Screen
btnChangeDifficulty.addEventListener('click', () => {
    difficultyQuestion.style.display = 'none';
    difficultySelector.style.display = 'flex';
});

btnKeepDifficulty.addEventListener('click', () => {
    difficultyQuestion.style.display = 'none';
    btnDirectRestart.style.display = 'flex';
});

btnDirectRestart.addEventListener('click', restartGame);
btnRestartWithDifficulty.addEventListener('click', restartGameWithDifficulty);
btnQuitGame.addEventListener('click', quitToMainMenu);

// Difficulty Selection - Start Screen
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Set game speed and difficulty name
        gameState.gameSpeed = parseInt(button.dataset.speed);
        gameState.currentDifficulty = button.dataset.name;
        currentDifficultyElement.textContent = gameState.currentDifficulty;
    });
});

// Difficulty Selection - Game Over Screen (Restart)
difficultyButtonsRestart.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        difficultyButtonsRestart.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Set game speed and difficulty name
        gameState.gameSpeed = parseInt(button.dataset.speed);
        gameState.currentDifficulty = button.dataset.name;
    });
});

// Initialize high score display
highScoreElement.textContent = gameState.highScore;
currentDifficultyElement.textContent = gameState.currentDifficulty;

// Touch Controls for Mobile
let touchStartX = 0;
let touchStartY = 0;

board.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

board.addEventListener('touchend', (e) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            } else if (deltaX < 0 && gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            } else if (deltaY < 0 && gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
        }
    }
}, { passive: true });

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (!gameState.intervalId) {
            initGame();
        }
    }, 250);
});

// Initialize the board on load
initGame();