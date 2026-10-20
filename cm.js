 // ========================================
 // SETTINGS
 // ========================================

const WIDTH = 1600;
const HEIGHT = 900;
const SPEED = 300;
const REPAIR_AMOUNT = 10;
const COLLISION_PADDING = 20;
const DEBUG = true;

// ========================================
// SPRITE ANIMATION SETTINGS
// ========================================

const FRAME_COUNT = 8;
const FRAME_DURATION = 0.5;

// Load the 8 separate images for each walking direction.
// Files are stored in images/player/ as down_01.png, etc.

function loadPlayerFrames(direction) {
    return Array.from({ length: FRAME_COUNT }, (_, index) => {
        const image = new Image();
        const frameNumber = String(index + 1).padStart(2, "0");
        image.src = `images/player/${direction}_${frameNumber}.png`;
        return image;
    });
}

const playerFrames = {
    down: loadPlayerFrames("down"),
    left: loadPlayerFrames("left"),
    right: loadPlayerFrames("right"),
    up: loadPlayerFrames("up")
};

const idleImage = new Image();
idleImage.src = "images/player/idle.png";

const playerAnimation = {
    frame: 0,
    direction: "down",
    timer: 0,
    moving: false
};

// ========================================
// CANVAS
// ========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH;
canvas.height = HEIGHT;

ctx.imageSmoothingEnabled = false;

// ========================================
// IMAGES
// ========================================

const carImage = new Image();
carImage.src = "images/car.png";

const backgroundImage = new Image();
backgroundImage.src = "images/background.png";

// ========================================
// PLAYER AND CAR
// ========================================

const player = {
    x: 350,
    y: 364,
    width: 96,
    height: 96
};

const car = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    width: 190,
    height: 315,

    engine: 40,
    battery: 100,
    tires: 70,
    oil: 10
};

// These arrays keep the repair menu simple.

const parts = ["engine", "battery", "tires", "oil"];

const partNames = ["ENGINE", "BATTERY", "TIRES", "OIL"];

// ========================================
// OBSTACLES
// ========================================

const obstacles = [
    { x: 235, y: 10, width: 1132, height: 95 },
    { x: 235, y: 790, width: 1132, height: 20 },
    { x: 215, y: 85, width: 20, height: 685 },
    { x: 1381, y: 89, width: 20, height: 680 },

    { x: 275, y: 50, width: 198, height: 115 },
    { x: 530, y: 83, width: 49, height: 75 },
    { x: 1075, y: 69, width: 145, height: 105 },
    { x: 1285, y: 50, width: 40, height: 110 },

    { x: 255, y: 700, width: 75, height: 50 },
    { x: 371, y: 680, width: 46, height: 55 },
    { x: 587, y: 750, width: 430, height: 110 }
];

// ========================================
// GAME STATE
// ========================================

let gameState = "walking";

const keys = {};

let mouseX = -1;
let mouseY = -1;

// ========================================
// KEYBOARD
// ========================================

document.addEventListener("keydown", function(event) {
    let key = event.key.toLowerCase();

    keys[key] = true;

    if (
        key === "w" ||
        key === "a" ||
        key === "s" ||
        key === "d" ||
        key === "e" ||
        key === "escape"
    ) {
        event.preventDefault();
    }

    if (key === "e" && !event.repeat) {
        if (gameState === "walking" && nearCar()) {
            gameState = "repairing";
        }
    }

    if (key === "escape") {
        gameState = "walking";
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});

// Stop movement when the game loses focus.

window.addEventListener("blur", function() {
    for (let key in keys) {
        keys[key] = false;
    }
});

// ========================================
// COLLISIONS
// ========================================

// Check if two rectangles overlap.
// x and y represent the top-left corner.

function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x1 + w1 <= x2) return false;
    if (x1 >= x2 + w2) return false;
    if (y1 + h1 <= y2) return false;
    if (y1 >= y2 + h2) return false;

    return true;
}

// Check if the player is touching something.

function collides() {
    let playerX = player.x - player.width / 2;
    let playerY = player.y - player.height / 2;

    // Check the walls and objects.

    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];

        if (rectanglesOverlap(
            playerX,
            playerY,
            player.width,
            player.height,
            obstacle.x - COLLISION_PADDING,
            obstacle.y - COLLISION_PADDING,
            obstacle.width + COLLISION_PADDING * 2,
            obstacle.height + COLLISION_PADDING * 2
        )) {
            return true;
        }
    }

    // Check the car.

    let carX = car.x - car.width / 2;
    let carY = car.y - car.height / 2;

    if (rectanglesOverlap(
        playerX,
        playerY,
        player.width,
        player.height,
        carX,
        carY,
        car.width,
        car.height
    )) {
        return true;
    }

    return false;
}

// Check if the player is close enough to the car.

function nearCar() {
    let playerX = player.x - player.width / 2;
    let playerY = player.y - player.height / 2;

    let carX = car.x - car.width / 2;
    let carY = car.y - car.height / 2;

    return rectanglesOverlap(
        playerX,
        playerY,
        player.width,
        player.height,
        carX - 64,
        carY - 64,
        car.width + 128,
        car.height + 128
    );
}

// ========================================
// PLAYER MOVEMENT AND ANIMATION
// ========================================

function movePlayer(dt) {
    if (gameState !== "walking") {
        playerAnimation.moving = false;
        playerAnimation.frame = 0;
        playerAnimation.timer = 0;
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Stop the walking animation when standing still.

    if (dx === 0 && dy === 0) {
        playerAnimation.moving = false;
        playerAnimation.frame = 0;
        playerAnimation.timer = 0;
        return;
    }

    playerAnimation.moving = true;

    // Select the correct set of walking frames.

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement.
        playerAnimation.direction = dx < 0 ? "left" : "right";
    } else {
        // Vertical movement.
        playerAnimation.direction = dy < 0 ? "up" : "down";
    }

    // Keep diagonal movement at the same speed.

    let length = Math.sqrt(dx * dx + dy * dy);

    dx = dx / length;
    dy = dy / length;

    let moveX = dx * SPEED * dt;
    let moveY = dy * SPEED * dt;

    // Move horizontally.

    player.x += moveX;

    if (collides()) {
        player.x -= moveX;
    }

    // Move vertically.

    player.y += moveY;

    if (collides()) {
        player.y -= moveY;
    }

    // Do not animate if the player cannot move at all.

    if (moveX === 0 && moveY === 0) {
        playerAnimation.moving = false;
        playerAnimation.frame = 0;
        playerAnimation.timer = 0;
        return;
    }

    // Advance the walking animation.

    playerAnimation.timer += dt;

    if (playerAnimation.timer >= FRAME_DURATION) {
        playerAnimation.timer -= FRAME_DURATION;

        playerAnimation.frame =
            (playerAnimation.frame + 1) % FRAME_COUNT;
    }
}

// ========================================
// REPAIR SYSTEM
// ========================================

function repairPart(part) {
    if (car[part] >= 100) return;

    car[part] += REPAIR_AMOUNT;

    if (car[part] > 100) {
        car[part] = 100;
    }
}

// ========================================
// MOUSE
// ========================================

function updateMouse(event) {
    let rect = canvas.getBoundingClientRect();

    mouseX = (event.clientX - rect.left) * canvas.width / rect.width;
    mouseY = (event.clientY - rect.top) * canvas.height / rect.height;
}

canvas.addEventListener("mousemove", function(event) {
    updateMouse(event);
});

canvas.addEventListener("mouseleave", function() {
    mouseX = -1;
    mouseY = -1;
});

// ========================================
// REPAIR BUTTONS
// ========================================

const menuWidth = 560;
const menuHeight = 360;

const buttonWidth = 220;
const buttonHeight = 40;
const rowHeight = 65;

const menuX = (WIDTH - menuWidth) / 2;
const menuY = (HEIGHT - menuHeight) / 2;

function clickRepairButton(index) {
    let buttonX = menuX + menuWidth - buttonWidth - 20;

    let rowY = menuY + 55 + index * rowHeight;
    let buttonY = rowY + (rowHeight - buttonHeight) / 2;

    if (
        mouseX >= buttonX &&
        mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY &&
        mouseY <= buttonY + buttonHeight
    ) {
        repairPart(parts[index]);
    }
}

canvas.addEventListener("click", function(event) {
    if (gameState !== "repairing") return;

    updateMouse(event);

    for (let i = 0; i < parts.length; i++) {
        clickRepairButton(i);
    }
});

// ========================================
// DRAW BACKGROUND
// ========================================

function drawBackground() {
    ctx.fillStyle = "#252525";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
    }
}

// ========================================
// DRAW IMAGES
// ========================================

function drawImage(image, x, y, width, height) {
    if (!image.complete || image.naturalWidth === 0) return;

    // Fit the image without stretching it.

    let scaleX = width / image.naturalWidth;
    let scaleY = height / image.naturalHeight;
    let scale = Math.min(scaleX, scaleY);

    let w = image.naturalWidth * scale;
    let h = image.naturalHeight * scale;

    ctx.drawImage(
        image,
        x - w / 2,
        y - h / 2,
        w,
        h
    );
}

// ========================================
// DRAW ANIMATED PLAYER
// ========================================

function drawPlayer() {
    // Use idle.png whenever the player is not walking.

    const image = playerAnimation.moving
        ? playerFrames[playerAnimation.direction][playerAnimation.frame]
        : idleImage;

    // Wait until the selected image has loaded.

    if (!image || !image.complete || image.naturalWidth === 0) {
        return;
    }

    // These are drawing dimensions, not collision dimensions.

    const drawWidth = 96;
    const drawHeight = 118;

    // player.x and player.y are the character's center.

    ctx.drawImage(
        image,
        player.x - drawWidth / 2,
        player.y - drawHeight / 2,
        drawWidth,
        drawHeight
    );
}

// ========================================
// DEBUG OUTLINES
// ========================================

function drawDebug() {
    if (!DEBUG) return;

    // Green outlines for obstacles.

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;

    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];

        ctx.strokeRect(
            obstacle.x - COLLISION_PADDING,
            obstacle.y - COLLISION_PADDING,
            obstacle.width + COLLISION_PADDING * 2,
            obstacle.height + COLLISION_PADDING * 2
        );
    }

    // Red outline for player collision box.

    ctx.strokeStyle = "red";

    ctx.strokeRect(
        player.x - player.width / 2,
        player.y - player.height / 2,
        player.width,
        player.height
    );

    // Blue outline for car.

    ctx.strokeStyle = "blue";

    ctx.strokeRect(
        car.x - car.width / 2,
        car.y - car.height / 2,
        car.width,
        car.height
    );
}

// ========================================
// DRAW REPAIR MENU
// ========================================

function drawRepairButton(index) {
    let x = menuX + menuWidth - buttonWidth - 20;

    let rowY = menuY + 55 + index * rowHeight;
    let y = rowY + (rowHeight - buttonHeight) / 2;

    let part = parts[index];
    let full = car[part] >= 100;

    let hovered =
        mouseX >= x &&
        mouseX <= x + buttonWidth &&
        mouseY >= y &&
        mouseY <= y + buttonHeight;

    if (full) {
        ctx.fillStyle = "#333333";
    } else if (hovered) {
        ctx.fillStyle = "#276749";
    } else {
        ctx.fillStyle = "#174a35";
    }

    ctx.fillRect(x, y, buttonWidth, buttonHeight);

    ctx.strokeStyle = full ? "#666666" : "#63c995";
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);

    ctx.fillStyle = full ? "#aaaaaa" : "white";
    ctx.font = "bold 13px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (full) {
        ctx.fillText("FULL", x + buttonWidth / 2, y + buttonHeight / 2);
    } else {
        ctx.fillText(
            "REPAIR +" + REPAIR_AMOUNT,
            x + buttonWidth / 2,
            y + buttonHeight / 2
        );
    }
}

function drawRepairMenu() {
    ctx.fillStyle = "#000000ee";
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    ctx.fillStyle = "white";
    ctx.font = "bold 20px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillText("CAR REPAIRS", menuX + 24, menuY + 28);

    for (let i = 0; i < parts.length; i++) {
        let rowY = menuY + 55 + i * rowHeight;
        let labelY = rowY + rowHeight / 2;

        ctx.fillStyle = "white";
        ctx.font = "bold 15px 'Press Start 2P', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillText(
            partNames[i] + ": " + car[parts[i]] + "%",
            menuX + 24,
            labelY
        );

        drawRepairButton(i);
    }

    ctx.textBaseline = "alphabetic";
}

// ========================================
// PRESS E PROMPT
// ========================================

function drawPrompt() {
    if (gameState !== "walking") return;
    if (!nearCar()) return;

    ctx.fillStyle = "white";
    ctx.font = "bold 14px 'Press Start 2P', monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        "PRESS E",
        car.x,
        car.y - car.height / 2 - 20
    );

    ctx.textAlign = "left";
}

// ========================================
// DRAW EVERYTHING
// ========================================

function draw() {
    drawBackground();

    drawImage(
        carImage,
        car.x,
        car.y,
        car.width,
        car.height
    );

    // Draw the currently selected player image.

    drawPlayer();

    drawPrompt();
    drawDebug();

    if (gameState === "repairing") {
        drawRepairMenu();
    }
}

// ========================================
// GAME LOOP
// ========================================

let lastTime = performance.now();

function gameLoop(time) {
    let dt = (time - lastTime) / 1000;
    lastTime = time;

    if (dt > 0.1) {
        dt = 0.1;
    }

    movePlayer(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
