# Garage Shift

**Garage Shift** is a top-down garage/car-mechanic game built with vanilla JavaScript and HTML5 Canvas.

You play as a mechanic inside a garage, move around the environment, interact with your car, and repair its components.

## Current Features

- Top-down player movement with WASD
- Collision detection with garage objects
- Car collision detection
- Interaction system using **E**
- Repair menu
- Engine condition system
- Battery, tires, and oil condition values
- Mouse-controlled repair button
- Pixel-art style rendering
- Collision debug mode
- Delta-time based movement

## Controls

| Key | Action |
|---|---|
| `W` | Move up |
| `A` | Move left |
| `S` | Move down |
| `D` | Move right |
| `E` | Interact with car |
| `ESC` | Close repair menu |
| Mouse | Click repair button |

## Project Structure

```text
Garage-Shift/
├── index.html
├── script.js
├── images/
│   ├── player.png
│   ├── car.png
│   └── background.png
└── sounds/
    └── hit.wav
