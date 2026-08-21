const fps = 60;
const COLLISION_PADDING = 20;
const BACKGROUND = "#252525";
const playerColor = "#ff5050";
const carColor = "#5050ff";

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


const backgroundSprite = new Image();
backgroundSprite.src = "images/background.png";

const hitSound = new Audio("sounds/hit.wav");

let touchingCar = false;
let touchingWall = false;
let interacting = false;
let gameState = "walking";

let playerPosition = {
	x: 350,
	y: 364,
	width: 96,
	height: 96
};

let car = {
	x: game.width / 2,
	y: game.height / 2,
	width: 190,
	height: 315,
	engine: 40,
	battery: 100,
	tires: 70,
	oil: 10
};
const collisionObjects = [

	// Outer walls
	{ x: 235, y: 10, width: 1132, height: 95, name: "top wall" },
	{ x: 235, y: 790, width: 1132, height: 0, name: "bottom wall" },
	{ x: 215, y: 85, width: 0, height: 685, name: "left wall" },
	{ x: 1381, y: 89, width: 0, height: 680, name: "right wall" },

	// Workbench
	{ x: 275, y: 50, width: 198, height: 115, name: "workbench" },

	// Blue tool cabinet
	{ x: 530, y: 83, width: 49, height: 75, name: "tool cabinet" },

	// Shelving
	{ x: 1075, y: 69, width: 145, height: 105, name: "shelf" },

	// Red hydraulic jack
	{ x: 1285, y: 145-95, width: 40, height: 110, name: "jack" },

	// Tires
	{ x: 255, y: 700, width: 75, height: 50, name: "tires" },

	// Red toolbox
	{ x: 371, y: 680, width: 46, height: 55, name: "toolbox" },

	// Bottom garage door
	{ x: 587, y: 750, width: 430, height: 110, name: "garage door" }
];

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
	game.width = 1600;
	game.height = 900;

	centerCar();
}

function centerCar() {
	car.x = game.width / 2;
	car.y = game.height / 2;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const ctx = game.getContext("2d");

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
		distanceX < car.width / 2 + 64 &&
		distanceY < car.height / 2 + 64
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


function touchingObject(player, object) {

	const objectLeft =
		object.x - COLLISION_PADDING;

	const objectRight =
		object.x + object.width + COLLISION_PADDING;

	const objectTop =
		object.y - COLLISION_PADDING;

	const objectBottom =
		object.y + object.height + COLLISION_PADDING;

	const playerLeft =
		player.x - player.width / 2;

	const playerRight =
		player.x + player.width / 2;

	const playerTop =
		player.y - player.height / 2;

	const playerBottom =
		player.y + player.height / 2;

	return (
		playerRight > objectLeft &&
		playerLeft < objectRight &&
		playerBottom > objectTop &&
		playerTop < objectBottom
	);
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

function checkCollisions() {

	for (const object of collisionObjects) {

		if (touchingObject(playerPosition, object)) {

			playerPosition.x = previousX;
			playerPosition.y = previousY;

			return true;
		}
	}

	// Car collision
	if (touching(playerPosition, car)) {

		playerPosition.x = previousX;
		playerPosition.y = previousY;

		return true;
	}

	return false;
}

function drawCollisionDebug() {

	ctx.strokeStyle = "lime";
	ctx.lineWidth = 2;

	for (const object of collisionObjects) {

		ctx.strokeRect(
			object.x - COLLISION_PADDING,
			object.y - COLLISION_PADDING,
			object.width + COLLISION_PADDING * 2,
			object.height + COLLISION_PADDING * 2
		);
	}

	// Player hitbox
	ctx.strokeStyle = "red";

	ctx.strokeRect(
		playerPosition.x - playerPosition.width / 2,
		playerPosition.y - playerPosition.height / 2,
		playerPosition.width,
		playerPosition.height
	);

	// Car hitbox
	ctx.strokeStyle = "blue";

	ctx.strokeRect(
		car.x - car.width / 2,
		car.y - car.height / 2,
		car.width,
		car.height
	);
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
	if (backgroundSprite.complete && backgroundSprite.naturalWidth > 0) {
		ctx.drawImage(
			backgroundSprite,
			0,
			0,
			game.width,
			game.height
		);
	}

}

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

	ctx.fillStyle = "#000000dd";

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

	ctx.fillStyle = "#050505";

	ctx.fillRect(
		menuX,
		menuY,
		menuWidth,
		buttonHeight
	);

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


function draw() {

	clear();

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

	checkCollisions();

	drawCar(car);
	drawPlayer(playerPosition);

	drawCollisionDebug();
	if (gameState === "repairing") {
		drawHUD();
		drawButton();
	}

	requestAnimationFrame(draw);
}

draw();
