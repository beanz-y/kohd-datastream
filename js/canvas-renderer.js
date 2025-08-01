// js/canvas-renderer.js

import { findPath } from './router.js';

const NODE_DIAMETER = 28;
const CIRCUMFERENCE_GAP = 73;
const NODE_RADIUS = NODE_DIAMETER / 2;
const NODE_SPACING = CIRCUMFERENCE_GAP + NODE_DIAMETER;
const PADDING = 40;
const SUBNODE_RADIUS = 3;
const RING_SPACING = 4;
const SUBNODE_GROUP_START_OFFSET = 20;
const SUBNODE_SPACING = 6;
const SUBNODE_GROUP_GAP = 12;
const GRID_RESOLUTION = 5;

let ctx;
let nodePositions = [];
let canvasWidth, canvasHeight;

function calculateNodePositions(canvas) {
    nodePositions = [];
    const canvasSize = NODE_SPACING * 2 + PADDING * 2;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * NODE_SPACING + PADDING;
        const y = row * NODE_SPACING + PADDING;
        nodePositions.push({ x, y });
    }
}

function getRadiusForLevel(level) {
    if (level === 0) return NODE_RADIUS;
    if (level === -1) return NODE_RADIUS - RING_SPACING;
    return NODE_RADIUS + (level * RING_SPACING);
}

function getCircumferencePoint(center, target, radius) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const angle = Math.atan2(dy, dx);
    return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
    };
}

function getGridCoordinates(nodeIndex, targetNodeIndex, ringLevel) {
    const center = nodePositions[nodeIndex];
    const targetCenter = nodePositions[targetNodeIndex];
    // This is the radius of the physical keep-out zone around the node.
    const obstacleRadius = getRadiusForLevel(0) + (RING_SPACING * 2);

    const dx = targetCenter.x - center.x;
    const dy = targetCenter.y - center.y;
    const angle = Math.atan2(dy, dx);

    // Position the router's start/end point safely outside the obstacle zone.
    const x = center.x + (obstacleRadius + GRID_RESOLUTION) * Math.cos(angle);
    const y = center.y + (obstacleRadius + GRID_RESOLUTION) * Math.sin(angle);
    
    return {
        x: Math.round(x / GRID_RESOLUTION),
        y: Math.round(y / GRID_RESOLUTION)
    };
}

function createRoutingGrid() {
    const gridWidth = Math.ceil(canvasWidth / GRID_RESOLUTION);
    const gridHeight = Math.ceil(canvasHeight / GRID_RESOLUTION);
    const grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
    const obstacleRadius = getRadiusForLevel(0) + (RING_SPACING * 2);
    const gridRadius = Math.ceil(obstacleRadius / GRID_RESOLUTION);

    nodePositions.forEach(pos => {
        const gridX = Math.round(pos.x / GRID_RESOLUTION);
        const gridY = Math.round(pos.y / GRID_RESOLUTION);
        for (let y = gridY - gridRadius; y <= gridY + gridRadius; y++) {
            for (let x = gridX - gridRadius; x <= gridX + gridRadius; x++) {
                if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
                    if (Math.sqrt((x - gridX)**2 + (y - gridY)**2) <= gridRadius) {
                        grid[y][x] = 1;
                    }
                }
            }
        }
    });
    return grid;
}

function drawNode(node) {
    const pos = nodePositions[node.index];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    node.rings.forEach(level => {
        const radius = getRadiusForLevel(level);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = (level === -1) ? '#00E5FF' : '#E8772E';
        ctx.lineWidth = (level === -1) ? 1.5 : 2;
        ctx.stroke();
    });
}

function drawRoutedPath(trace, subnodeGroups) {
    if (!trace || !trace.path) {
        console.warn("A trace path was not found by the router, skipping render.");
        return;
    }
    
    const startCenter = nodePositions[trace.fromNode];
    const endCenter = nodePositions[trace.toNode];
    const startRadius = getRadiusForLevel(trace.fromRingLevel);
    const endRadius = getRadiusForLevel(trace.toRingLevel);
    
    // Get the true start/end points on the node circumferences
    const pathStartPoint = { x: trace.path[0].x * GRID_RESOLUTION, y: trace.path[0].y * GRID_RESOLUTION };
    const pathEndPoint = { x: trace.path[trace.path.length - 1].x * GRID_RESOLUTION, y: trace.path[trace.path.length - 1].y * GRID_RESOLUTION };
    const trueStartPoint = getCircumferencePoint(startCenter, pathStartPoint, startRadius);
    const trueEndPoint = getCircumferencePoint(endCenter, pathEndPoint, endRadius);

    // --- Draw the full, connected path ---
    ctx.beginPath();
    ctx.moveTo(trueStartPoint.x, trueStartPoint.y); // Start on the circumference
    for (let i = 0; i < trace.path.length; i++) { // Draw the A* path
        ctx.lineTo(trace.path[i].x * GRID_RESOLUTION, trace.path[i].y * GRID_RESOLUTION);
    }
    ctx.lineTo(trueEndPoint.x, trueEndPoint.y); // End on the circumference
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // --- Draw Subnodes along the path ---
    // The subnode placement logic now works on the composite path and should be correct
    const compositePath = [trueStartPoint, ...trace.path.map(p => ({ x: p.x * GRID_RESOLUTION, y: p.y * GRID_RESOLUTION })), trueEndPoint];
    let currentOffset = SUBNODE_GROUP_START_OFFSET;
    subnodeGroups.forEach(group => {
        for (let i = 0; i < group.subnodeCount; i++) {
            const targetDistance = currentOffset + (i * SUBNODE_SPACING);
            let distAlongPath = 0;
            for (let j = 0; j < compositePath.length - 1; j++) {
                const p1 = compositePath[j];
                const p2 = compositePath[j+1];
                const segmentLength = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
                if (distAlongPath + segmentLength >= targetDistance) {
                    const t = (targetDistance - distAlongPath) / segmentLength;
                    const subnodeX = p1.x + t * (p2.x - p1.x);
                    const subnodeY = p1.y + t * (p2.y - p1.y);
                    ctx.beginPath();
                    ctx.arc(subnodeX, subnodeY, SUBNODE_RADIUS, 0, 2 * Math.PI);
                    ctx.fillStyle = '#00E5FF';
                    ctx.fill();
                    break;
                }
                distAlongPath += segmentLength;
            }
        }
        currentOffset += (group.subnodeCount * SUBNODE_SPACING) + SUBNODE_GROUP_GAP;
    });
}

function drawIndicators(chargeNodeIndex, groundTraceData) {
    const chargePos = nodePositions[chargeNodeIndex];
    const chargeRadius = getRadiusForLevel(0);
    const chargeIndicatorStartX = chargePos.x + chargeRadius;
    ctx.beginPath();
    ctx.moveTo(chargeIndicatorStartX, chargePos.y);
    ctx.lineTo(chargeIndicatorStartX + 10, chargePos.y);
    ctx.rect(chargeIndicatorStartX + 10, chargePos.y - 4, 12, 8);
    ctx.moveTo(chargeIndicatorStartX + 22, chargePos.y);
    ctx.lineTo(chargeIndicatorStartX + 32, chargePos.y);
    ctx.strokeStyle = '#E8772E';
    ctx.lineWidth = 1;
    ctx.stroke();

    const groundPos = nodePositions[groundTraceData.fromNode];
    let requiredLength = SUBNODE_GROUP_START_OFFSET;
    groundTraceData.subnodeGroups.forEach(group => {
        requiredLength += (group.subnodeCount * SUBNODE_SPACING) + SUBNODE_GROUP_GAP;
    });
    const groundSymbolHeight = 12;
    requiredLength += groundSymbolHeight;
    const groundStartRadius = getRadiusForLevel(groundTraceData.fromRingLevel);
    const groundStartPoint = { x: groundPos.x, y: groundPos.y + groundStartRadius };
    const groundEndPoint = { x: groundPos.x, y: groundStartPoint.y + requiredLength };
    ctx.beginPath();
    ctx.moveTo(groundStartPoint.x, groundStartPoint.y);
    ctx.lineTo(groundEndPoint.x, groundEndPoint.y);
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    let currentOffset = SUBNODE_GROUP_START_OFFSET;
    groundTraceData.subnodeGroups.forEach(group => {
        for (let i = 0; i < group.subnodeCount; i++) {
            const distFromStart = currentOffset + (i * SUBNODE_SPACING);
            const subnodeY = groundStartPoint.y + distFromStart;
            ctx.beginPath();
            ctx.arc(groundStartPoint.x, subnodeY, SUBNODE_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = '#00E5FF';
            ctx.fill();
        }
        currentOffset += (group.subnodeCount * SUBNODE_SPACING) + SUBNODE_GROUP_GAP;
    });

    ctx.beginPath();
    ctx.moveTo(groundEndPoint.x - 10, groundEndPoint.y);
    ctx.lineTo(groundEndPoint.x + 10, groundEndPoint.y);
    ctx.moveTo(groundEndPoint.x - 6, groundEndPoint.y + 4);
    ctx.lineTo(groundEndPoint.x + 6, groundEndPoint.y + 4);
    ctx.moveTo(groundEndPoint.x - 2, groundEndPoint.y + 8);
    ctx.lineTo(groundEndPoint.x + 2, groundEndPoint.y + 8);
    ctx.stroke();
}

export function renderGlyph(canvas, glyphData) {
    if (!canvas || !glyphData) {
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    ctx = canvas.getContext('2d');
    calculateNodePositions(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const routingGrid = createRoutingGrid();

    glyphData.traces.forEach(trace => {
        const startCoords = getGridCoordinates(trace.fromNode, trace.toNode, trace.fromRingLevel);
        const endCoords = getGridCoordinates(trace.toNode, trace.fromNode, trace.toRingLevel);
        trace.path = findPath(routingGrid, startCoords, endCoords);
        if (trace.path) {
            drawRoutedPath(trace, trace.subnodeGroups);
            trace.path.forEach(p => { if (routingGrid[p.y]) routingGrid[p.y][p.x] = 1; });
        } else {
            drawRoutedPath(null, []);
        }
    });

    drawIndicators(glyphData.chargeNode, glyphData.groundTrace);
    glyphData.nodes.forEach(drawNode);
}