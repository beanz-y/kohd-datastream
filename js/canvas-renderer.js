// js/canvas-renderer.js

/**
 * This module is responsible for rendering the visual Kohd glyph onto an HTML5 canvas.
 * It takes the abstract glyph data and translates it into a physical layout.
 */

const NODE_DIAMETER = 28;
const CIRCUMFERENCE_GAP = 73;

const NODE_RADIUS = NODE_DIAMETER / 2;
const NODE_SPACING = CIRCUMFERENCE_GAP + NODE_DIAMETER;

const PADDING = 40;

const SUBNODE_RADIUS = 3;
const RING_SPACING = 4; // Consistent spacing for all rings

const SUBNODE_GROUP_START_OFFSET = 20;
const SUBNODE_SPACING = 6;
const SUBNODE_GROUP_GAP = 12;

let ctx;
let nodePositions = [];

function calculateNodePositions(canvas) {
    nodePositions = [];
    const canvasSize = NODE_SPACING * 2 + PADDING * 2;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * NODE_SPACING + PADDING;
        const y = row * NODE_SPACING + PADDING;
        nodePositions.push({ x, y });
    }
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

function getRadiusForLevel(level) {
    if (level === 0) return NODE_RADIUS;
    if (level === -1) return NODE_RADIUS - RING_SPACING;
    return NODE_RADIUS + (level * RING_SPACING);
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

function drawTrace(trace) {
    const startCenter = nodePositions[trace.fromNode];
    const endCenter = nodePositions[trace.toNode];

    const startRadius = getRadiusForLevel(trace.fromRingLevel);
    const endRadius = getRadiusForLevel(trace.toRingLevel);

    const startPoint = getCircumferencePoint(startCenter, endCenter, startRadius);
    const endPoint = getCircumferencePoint(endCenter, startCenter, endRadius);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const traceLength = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / traceLength;
    const uy = dy / traceLength;
    
    let currentOffset = SUBNODE_GROUP_START_OFFSET;

    trace.subnodeGroups.forEach(group => {
        for (let i = 0; i < group.subnodeCount; i++) {
            const distFromStart = currentOffset + (i * SUBNODE_SPACING);
            const subnodeX = startPoint.x + ux * distFromStart;
            const subnodeY = startPoint.y + uy * distFromStart;

            ctx.beginPath();
            ctx.arc(subnodeX, subnodeY, SUBNODE_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = '#00E5FF';
            ctx.fill();
        }
        currentOffset += (group.subnodeCount * SUBNODE_SPACING) + SUBNODE_GROUP_GAP;
    });
}

function drawIndicators(chargeNodeIndex, groundTraceData) {
    const chargePos = nodePositions[chargeNodeIndex];
    const groundPos = nodePositions[groundTraceData.fromNode];

    // Charge Indicator
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

    // --- Dynamic Ground Trace Sizing ---
    let requiredLength = SUBNODE_GROUP_START_OFFSET;
    groundTraceData.subnodeGroups.forEach(group => {
        requiredLength += (group.subnodeCount * SUBNODE_SPACING) + SUBNODE_GROUP_GAP;
    });
    // Add buffer for the symbol itself
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
    
    // Draw subnode groups on the now correctly-sized ground trace
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

    // Draw the ground symbol at the new end point
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
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    calculateNodePositions(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!glyphData) return;

    glyphData.traces.forEach(drawTrace);
    drawIndicators(glyphData.chargeNode, glyphData.groundTrace);
    glyphData.nodes.forEach(drawNode);
}