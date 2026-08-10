const fps = 60;
const BACKGROUND = "#252525";
const playerColor = "#ff5050";
const carColor = "#5050ff";
const doorColor = "#ffff50";

const playerSize = 32;
const PLAYER_SPEED = 5;

const buttonX = 300;
const buttonY = 300;
const buttonWidth = 150;
const buttonHeight = 40;

const playerSprite = new Image();
playerSprite.src = "images/player.png";

const carSprite = new Image();
carSprite.src = "images/car.png";

const doorSprite = new Image();
doorSprite.src = "images/door.png";

const hitSound = new Audio("sounds/hit.wav");

let touchingCar = false;
let touchingWall = false;
let interacting = false;
let gameState = "walking";

let playerPosition = {
	x: 100,
	y: 100,
	width: 32,
	height: 32
};

let car = {
	x: 500,
	y: 500,
	width: 120,
	height: 220,
	engine: 40,
	battery: 100,
	tires: 70,
	oil: 10
};

let previousX = playerPosition.x;
let previousY = playerPosition.y;

let lastMoveX = 0;
let lastMoveY = 0;

let menuX = 0;
let menuY = 0;
let menuWidth = 320;
let menuHeight = 260;

let mouseX = 0;
let mouseY = 0;

game.addEventListener("mousemove", (e) => {
	const rect = game.getBoundingClientRect();

	mouseX = e.clientX - rect.left;
	mouseY = e.clientY - rect.top;
});

game.addEventListener("click", () => {

	// Repair engine button
	if (
		gameState === "repairing" &&
		mouseX > menuX &&
		mouseX < menuX + menuWidth &&
		mouseY > menuY &&
		mouseY < menuY + buttonHeight
	) {
		repairEngine();
	}
});

function resizeCanvas() {

	// Keep the game resolution consistent.
	// CSS can scale the canvas without changing the internal resolution.
	game.width = 1920;
	game.height = 1080;

	centerCar();
}

function centerCar() {
	car.x = game.width / 2;
	car.y = game.height / 2;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const ctx = game.getContext("2d");

// Better image rendering
ctx.imageSmoothingEnabled = false;

document.addEventListener("keyup", (e) => {

	if (e.key === "e" && gameState === "walking") {
		interacting = false;
	}
});

document.addEventListener("keydown", (e) => {

	if (gameState === "walking") {

		previousX = playerPosition.x;
		previousY = playerPosition.y;

		lastMoveX = 0;
		lastMoveY = 0;

		if (e.key === "w") {
			playerPosition.y -= PLAYER_SPEED;
			lastMoveY = -1;
		}

		if (e.key === "s") {
			playerPosition.y += PLAYER_SPEED;
			lastMoveY = 1;
		}

		if (e.key === "a") {
			playerPosition.x -= PLAYER_SPEED;
			lastMoveX = -1;
		}

		if (e.key === "d") {
			playerPosition.x += PLAYER_SPEED;
			lastMoveX = 1;
		}
	}

	if (e.key === "e") {

		if (nearCar()) {
			interacting = true;
			gameState = "repairing";
		}
	}

	if (e.key === "Escape") {
		gameState = "walking";
		interacting = false;
	}
});

function nearCar() {

	const distanceX = Math.abs(playerPosition.x - car.x);
	const distanceY = Math.abs(playerPosition.y - car.y);

	return (
		distanceX < car.width / 2 + 32 &&
		distanceY < car.height / 2 + 32
	);
}

function knockback(what) {

	if (what === "car") {

		playerPosition.x = previousX;
		playerPosition.y = previousY;

	} else if (what === "wall") {

		playerPosition.x -= lastMoveX * 50;
		playerPosition.y -= lastMoveY * 50;

		hitSound.currentTime = 0;
		hitSound.play();
	}
}

function bounce() {

	let hitWall = false;

	if (playerPosition.x > game.width - playerSize / 2) {
		playerPosition.x = game.width - playerSize / 2;
		hitWall = true;
	}

	if (playerPosition.x < playerSize / 2) {
		playerPosition.x = playerSize / 2;
		hitWall = true;
	}

	if (playerPosition.y > game.height - playerSize / 2) {
		playerPosition.y = game.height - playerSize / 2;
		hitWall = true;
	}

	if (playerPosition.y < playerSize / 2) {
		playerPosition.y = playerSize / 2;
		hitWall = true;
	}

	if (hitWall) {
		knockback("wall");
	}
}

function touching(player, car) {

	const collided =
		player.x + player.width / 2 > car.x - car.width / 2 &&
		player.x - player.width / 2 < car.x + car.width / 2 &&
		player.y + player.height / 2 > car.y - car.height / 2 &&
		player.y - player.height / 2 < car.y + car.height / 2;

	if (collided) {
		knockback("car");
	}

	return collided;
}

function repairEngine() {

	if (car.engine < 100) {
		car.engine += 10;

		if (car.engine > 100) {
			car.engine = 100;
		}
	}
}

function clear() {

	ctx.fillStyle = BACKGROUND;
	ctx.fillRect(
		0,
		0,
		game.width,
		game.height
	);
}

/*
 * Draw an image while preserving its aspect ratio.
 */
function drawImageContain(image, x, y, width, height) {

	if (!image.complete || image.naturalWidth === 0) {
		return;
	}

	const imageRatio = image.naturalWidth / image.naturalHeight;
	const targetRatio = width / height;

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

function drawPlayer({ x, y, width, height }) {

	drawImageContain(
		playerSprite,
		x,
		y,
		width,
		height
	);
}

function drawCar({ x, y, width, height }) {

	drawImageContain(
		carSprite,
		x,
		y,
		width,
		height
	);
}

function drawHUD() {

	// HUD background
	ctx.fillStyle = "#000000dd";

	ctx.fillRect(
		menuX,
		menuY,
		menuWidth,
		menuHeight
	);

	// Text
	ctx.fillStyle = "#ffffff";

	ctx.font = "bold 20px 'Press Start 2P', monospace";
	ctx.textBaseline = "middle";

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

function drawButton() {

	// Button
	ctx.fillStyle = "#050505";

	ctx.fillRect(
		menuX,
		menuY,
		menuWidth,
		buttonHeight
	);

	// Button text
	ctx.fillStyle = "#ffffff";

	ctx.font = "bold 16px 'Press Start 2P', monospace";
	ctx.textBaseline = "middle";

	ctx.fillText(
		"REPAIR ENGINE",
		menuX + 20,
		menuY + buttonHeight / 2
	);

	ctx.textBaseline = "alphabetic";
}

function drawDoor() {

	if (!doorSprite.complete || doorSprite.naturalWidth === 0) {
		return;
	}

	/*
	 * Preserve the door sprite's original aspect ratio.
	 * The width is 64, and the height is calculated automatically.
	 */
	const width = 64;
	const height =
		width *
		(doorSprite.naturalHeight / doorSprite.naturalWidth);

	ctx.drawImage(
		doorSprite,
		0,
		0,
		width,
		height
	);
}

function draw() {

	clear();

	// Interaction text
	if (gameState === "walking" && nearCar()) {

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 14px 'Press Start 2P', monospace";
		ctx.textAlign = "center";

		ctx.fillText(
			"PRESS E",
			car.x,
			car.y - car.height / 2 - 20
		);

		ctx.textAlign = "left";
	}

	touching(playerPosition, car);
	bounce();

	drawCar(car);
	drawDoor();
	drawPlayer(playerPosition);

	if (gameState === "repairing") {
		drawHUD();
		drawButton();
	}

	requestAnimationFrame(draw);
}

draw();
