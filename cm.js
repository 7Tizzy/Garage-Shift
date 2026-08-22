const BACKGROUND = "#252525";

const COLLISION_PADDING = 20;

const PLAYER_SPEED = 300; // pixels per second
const DEBUG_COLLISIONS = true;
const DEBUG = true;

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

// ========================================
// ASSETS
// ========================================

const playerSprite = new Image();
playerSprite.src = "images/player.png";

const carSprite = new Image();
carSprite.src = "images/car.png";

const backgroundSprite = new Image();
backgroundSprite.src = "images/background.png";


// ========================================
// GAME STATE
// ========================================

let gameState = "walking";

// ========================================
// INPUT
// ========================================

const keys = {};

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    keys[key] = true;

    // Prevent the page from scrolling with movement keys
    if (
        key === "w" ||
        key === "a" ||
        key === "s" ||
        key === "d" ||
        key === "e" ||
        key === "escape"
    ) {
        e.preventDefault();
    }

    // Interaction
    if (key === "e" && !e.repeat) {

        if (gameState === "walking" && nearCar()) {
            gameState = "repairing";
            return;
        }
    }

    // Close repair menu
    if (key === "escape") {
        gameState = "walking";
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ========================================
// CANVAS
// ========================================

function resizeCanvas() {
    game.width = CANVAS_WIDTH;
    game.height = CANVAS_HEIGHT;

    updateMenuPosition();
    centerCar();
}

const ctx = game.getContext("2d");

ctx.imageSmoothingEnabled = false;

// ========================================
// PLAYER
// ========================================

const playerPosition = {
    x: 350,
    y: 364,
    width: 96,
    height: 96
};

let previousX = playerPosition.x;
let previousY = playerPosition.y;

// ========================================
// CAR
// ========================================

const car = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: 190,
    height: 315,

    engine: 40,
    battery: 100,
    tires: 70,
    oil: 10
};

function centerCar() {
    car.x = game.width / 2;
    car.y = game.height / 2;
}

// ========================================
// COLLISION OBJECTS
// ========================================

const collisionObjects = [

    // Outer walls
    {
        x: 235,
        y: 10,
        width: 1132,
        height: 95,
        name: "top wall"
    },

    {
        x: 235,
        y: 790,
        width: 1132,
        height: 20,
        name: "bottom wall"
    },

    {
        x: 215,
        y: 85,
        width: 20,
        height: 685,
        name: "left wall"
    },

    {
        x: 1381,
        y: 89,
        width: 20,
        height: 680,
        name: "right wall"
    },

    // Workbench
    {
        x: 275,
        y: 50,
        width: 198,
        height: 115,
        name: "workbench"
    },

    // Blue tool cabinet
    {
        x: 530,
        y: 83,
        width: 49,
        height: 75,
        name: "tool cabinet"
    },

    // Shelving
    {
        x: 1075,
        y: 69,
        width: 145,
        height: 105,
        name: "shelf"
    },

    // Red hydraulic jack
    {
        x: 1285,
        y: 145 - 95,
        width: 40,
        height: 110,
        name: "jack"
    },

    // Tires
    {
        x: 255,
        y: 700,
        width: 75,
        height: 50,
        name: "tires"
    },

    // Red toolbox
    {
        x: 371,
        y: 680,
        width: 46,
        height: 55,
        name: "toolbox"
    },

    // Bottom garage door
    {
        x: 587,
        y: 750,
        width: 430,
        height: 110,
        name: "garage door"
    }
];

// ========================================
// REPAIR MENU
// ========================================

const menuWidth = 320;
const menuHeight = 260;

const buttonHeight = 40;

let menuX = 0;
let menuY = 0;

function updateMenuPosition() {
    menuX = game.width / 2 - menuWidth / 2;
    menuY = game.height / 2 - menuHeight / 2;
}

// ========================================
// MOUSE
// ========================================

let mouseX = 0;
let mouseY = 0;

game.addEventListener("mousemove", (e) => {
    const rect = game.getBoundingClientRect();

    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

game.addEventListener("click", () => {

    if (gameState !== "repairing") {
        return;
    }

    const buttonX = menuX;
    const buttonY = menuY;

    const insideButton =
        mouseX >= buttonX &&
        mouseX <= buttonX + menuWidth &&
        mouseY >= buttonY &&
        mouseY <= buttonY + buttonHeight;

    if (insideButton) {
        repairEngine();
    }
});

// ========================================
// COLLISION HELPERS
// ========================================

function getPlayerBounds(player) {

    return {
        left: player.x - player.width / 2,
        right: player.x + player.width / 2,
        top: player.y - player.height / 2,
        bottom: player.y + player.height / 2
    };
}

function getCarBounds(car) {

    return {
        left: car.x - car.width / 2,
        right: car.x + car.width / 2,
        top: car.y - car.height / 2,
        bottom: car.y + car.height / 2
    };
}

function touchingObject(player, object) {

    const objectLeft =
        object.x - COLLISION_PADDING;

    const objectRight =
        object.x + object.width + COLLISION_PADDING;

    const objectTop =
        object.y - COLLISION_PADDING;

    const objectBottom =
        object.y + object.height + COLLISION_PADDING;

    const playerBounds = getPlayerBounds(player);

    return (
        playerBounds.right > objectLeft &&
        playerBounds.left < objectRight &&
        playerBounds.bottom > objectTop &&
        playerBounds.top < objectBottom
    );
}

function touchingCar(player, car) {

    const playerBounds = getPlayerBounds(player);
    const carBounds = getCarBounds(car);

    return (
        playerBounds.right > carBounds.left &&
        playerBounds.left < carBounds.right &&
        playerBounds.bottom > carBounds.top &&
        playerBounds.top < carBounds.bottom
    );
}

// ========================================
// COLLISION CHECK
// ========================================

function checkCollisions() {

    // Static collision objects
    for (const object of collisionObjects) {

        if (touchingObject(playerPosition, object)) {

            playerPosition.x = previousX;
            playerPosition.y = previousY;

            return true;
        }
    }

    // Car collision
    if (touchingCar(playerPosition, car)) {

        playerPosition.x = previousX;
        playerPosition.y = previousY;

        return true;
    }

    return false;
}

// ========================================
// PLAYER MOVEMENT
// ========================================

function updatePlayer(dt) {

    if (gameState !== "walking") {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys.w) {
        dy -= 1;
    }

    if (keys.s) {
        dy += 1;
    }

    if (keys.a) {
        dx -= 1;
    }

    if (keys.d) {
        dx += 1;
    }

    // No movement
    if (dx === 0 && dy === 0) {
        return;
    }

    // Normalize diagonal movement
    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    const movementX = dx * PLAYER_SPEED * dt;
    const movementY = dy * PLAYER_SPEED * dt;

    previousX = playerPosition.x;
    previousY = playerPosition.y;

    // ------------------------------------
    // Horizontal movement
    // ------------------------------------

    playerPosition.x += movementX;

    if (checkCollisions()) {
        playerPosition.x = previousX;
    }

    // ------------------------------------
    // Vertical movement
    // ------------------------------------

    previousX = playerPosition.x;
    previousY = playerPosition.y;

    playerPosition.y += movementY;

    if (checkCollisions()) {
        playerPosition.y = previousY;
    }
}

// ========================================
// CAR INTERACTION
// ========================================

function nearCar() {

    const playerBounds = getPlayerBounds(playerPosition);
    const carBounds = getCarBounds(car);

    const interactionPadding = 64;

    return (
        playerBounds.right >
        carBounds.left - interactionPadding &&

        playerBounds.left <
        carBounds.right + interactionPadding &&

        playerBounds.bottom >
        carBounds.top - interactionPadding &&

        playerBounds.top <
        carBounds.bottom + interactionPadding
    );
}

// ========================================
// REPAIR SYSTEM
// ========================================

function repairEngine() {

    if (car.engine >= 100) {
        return;
    }

    car.engine += 10;

    if (car.engine > 100) {
        car.engine = 100;
    }
}

// ========================================
// DRAWING HELPERS
// ========================================

function clear() {

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(
        0,
        0,
        game.width,
        game.height
    );

    if (
        backgroundSprite.complete &&
        backgroundSprite.naturalWidth > 0
    ) {

        ctx.drawImage(
            backgroundSprite,
            0,
            0,
            game.width,
            game.height
        );
    }
}

function drawImageContain(
    image,
    x,
    y,
    width,
    height
) {

    if (
        !image.complete ||
        image.naturalWidth === 0
    ) {
        return;
    }

    const imageRatio =
        image.naturalWidth /
        image.naturalHeight;

    const targetRatio =
        width / height;

    let drawWidth;
    let drawHeight;

    if (imageRatio > targetRatio) {

        drawWidth = width;
        drawHeight = width / imageRatio;

    } else {

        drawHeight = height;
        drawWidth = height * imageRatio;
    }

    ctx.drawImage(
        image,
        x - drawWidth / 2,
        y - drawHeight / 2,
        drawWidth,
        drawHeight
    );
}

// ========================================
// DRAW PLAYER
// ========================================

function drawPlayer(player) {

    drawImageContain(
        playerSprite,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

// ========================================
// DRAW CAR
// ========================================

function drawCar(car) {

    drawImageContain(
        carSprite,
        car.x,
        car.y,
        car.width,
        car.height
    );
}

// ========================================
// DEBUG COLLISION DRAWING
// ========================================

function drawCollisionDebug() {

    if (!DEBUG_COLLISIONS) {
        return;
    }

    // Static objects
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;

    for (const object of collisionObjects) {

        ctx.strokeRect(
            object.x - COLLISION_PADDING,
            object.y - COLLISION_PADDING,
            object.width +
            COLLISION_PADDING * 2,
            object.height +
            COLLISION_PADDING * 2
        );
    }

    // Player
    ctx.strokeStyle = "red";

    const playerBounds =
        getPlayerBounds(playerPosition);

    ctx.strokeRect(
        playerBounds.left,
        playerBounds.top,
        playerPosition.width,
        playerPosition.height
    );

    // Car
    ctx.strokeStyle = "blue";

    const carBounds = getCarBounds(car);

    ctx.strokeRect(
        carBounds.left,
        carBounds.top,
        car.width,
        car.height
    );
}

// ========================================
// HUD
// ========================================

function drawHUD() {

    // Menu background
    ctx.fillStyle = "#000000dd";

    ctx.fillRect(
        menuX,
        menuY,
        menuWidth,
        menuHeight
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 20px 'Press Start 2P', monospace";

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.fillText(
        "ENGINE " + car.engine + "%",
        menuX + 20,
        menuY + 70
    );

    ctx.fillText(
        "BATTERY " + car.battery + "%",
        menuX + 20,
        menuY + 105
    );

    ctx.fillText(
        "TIRES " + car.tires + "%",
        menuX + 20,
        menuY + 140
    );

    ctx.fillText(
        "OIL " + car.oil + "%",
        menuX + 20,
        menuY + 175
    );

    ctx.textBaseline = "alphabetic";
}

// ========================================
// REPAIR BUTTON
// ========================================

function drawButton() {

    const buttonHovered =
        mouseX >= menuX &&
        mouseX <= menuX + menuWidth &&
        mouseY >= menuY &&
        mouseY <= menuY + buttonHeight;

    ctx.fillStyle =
        buttonHovered
            ? "#202020"
            : "#050505";

    ctx.fillRect(
        menuX,
        menuY,
        menuWidth,
        buttonHeight
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 16px 'Press Start 2P', monospace";

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.fillText(
        car.engine >= 100
            ? "ENGINE FULL"
            : "REPAIR ENGINE",
        menuX + 20,
        menuY + buttonHeight / 2
    );

    ctx.textBaseline = "alphabetic";
}

// ========================================
// INTERACTION PROMPT
// ========================================

function drawInteractionPrompt() {

    if (
        gameState !== "walking" ||
        !nearCar()
    ) {
        return;
    }

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 14px 'Press Start 2P', monospace";

    ctx.textAlign = "center";

    ctx.fillText(
        "PRESS E",
        car.x,
        car.y - car.height / 2 - 20
    );

    ctx.textAlign = "left";
}

// ========================================
// UPDATE
// ========================================

function update(dt) {

    updatePlayer(dt);
}

// ========================================
// DRAW
// ========================================

function draw() {

    clear();

    drawInteractionPrompt();

    drawCar(car);
    drawPlayer(playerPosition);

	if (DEBUG === true) {
        drawCollisionDebug();
	}

    if (gameState === "repairing") {

        drawHUD();
        drawButton();
    }
}

// ========================================
// GAME LOOP
// ========================================

let lastTime = performance.now();

function gameLoop(currentTime) {

    let dt =
        (currentTime - lastTime) / 1000;

    lastTime = currentTime;

    // Prevent huge jumps after tab switching
    if (dt > 0.1) {
        dt = 0.1;
    }

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// ========================================
// START GAME
// ========================================

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

requestAnimationFrame(gameLoop);

