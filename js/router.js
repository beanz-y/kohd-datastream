// js/router.js

import { PriorityQueue } from './priority-queue.js';

/**
 * Calculates the Manhattan distance heuristic for the A* algorithm.
 * It's a good estimate for grid-based movement cost.
 */
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Reconstructs the path from the 'cameFrom' map after A* finds the goal.
 */
function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(JSON.stringify(current))) {
        current = cameFrom.get(JSON.stringify(current));
        totalPath.unshift(current);
    }
    return totalPath;
}

/**
 * Finds the shortest path between two points on a grid using the A* search algorithm.
 * @param {Array<Array<number>>} grid - The 2D grid representing the routing area. 0 is open, 1 is an obstacle.
 * @param {object} start - The starting point {x, y}.
 * @param {object} end - The ending point {x, y}.
 * @returns {Array<object>|null} An array of {x, y} points representing the path, or null if no path is found.
 */
export function findPath(grid, start, end) {
    const openSet = new PriorityQueue();
    openSet.enqueue(start, 0);

    const cameFrom = new Map();
    const gScore = new Map(); // Cost from start to current node
    const fScore = new Map(); // gScore + heuristic

    // Initialize scores for all nodes to infinity
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            gScore.set(JSON.stringify({x, y}), Infinity);
            fScore.set(JSON.stringify({x, y}), Infinity);
        }
    }
    
    gScore.set(JSON.stringify(start), 0);
    fScore.set(JSON.stringify(start), heuristic(start, end));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentKey = JSON.stringify(current);

        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(cameFrom, current);
        }

        const neighbors = [
            { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 },
            // Add diagonal neighbors for smoother paths
            { x: current.x + 1, y: current.y + 1 }, { x: current.x - 1, y: current.y - 1 },
            { x: current.x + 1, y: current.y - 1 }, { x: current.x - 1, y: current.y + 1 },
        ];

        for (const neighbor of neighbors) {
            const neighborKey = JSON.stringify(neighbor);

            if (neighbor.x < 0 || neighbor.x >= grid[0].length || neighbor.y < 0 || neighbor.y >= grid.length) {
                continue; // Out of bounds
            }

            if (grid[neighbor.y][neighbor.x] === 1 && neighborKey !== JSON.stringify(end)) {
                continue; // Is an obstacle (unless it's the destination itself)
            }

            const tentativeGScore = gScore.get(currentKey) + (heuristic(current, neighbor)); // Cost is 1 for cardinal, 1.4 for diagonal

            if (tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
                openSet.enqueue(neighbor, fScore.get(neighborKey));
            }
        }
    }

    return null; // No path found
}