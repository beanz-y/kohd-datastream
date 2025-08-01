// js/glyph-generator.js

/**
 * This module translates a string of text into a renderable data structure
 * representing a Kohd word glyph, based on PCB design principles.
 */

const NODE_MAP = {
    'A': 0, 'B': 0, 'C': 0, 'D': 1, 'E': 1, 'F': 1, 'G': 2, 'H': 2, 'I': 2,
    'J': 3, 'K': 3, 'L': 3, 'M': 4, 'N': 4, 'O': 4, 'P': 5, 'Q': 5, 'R': 5,
    'S': 6, 'T': 6, 'U': 6, 'V': 7, 'W': 7, 'X': 7, 'Y': 8, 'Z': 8
};

const NODE_LETTERS = [
    ['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I'],
    ['J', 'K', 'L'], ['M', 'N', 'O'], ['P', 'Q', 'R'],
    ['S', 'T', 'U'], ['V', 'W', 'X'], ['Y', 'Z']
];

export function generateGlyphData(text) {
    const upperText = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (upperText.length < 2) return null;

    const logicalNetlist = [];
    for (const char of upperText) {
        const nodeIndex = NODE_MAP[char];
        const subnodeCount = NODE_LETTERS[nodeIndex].indexOf(char) + 1;
        logicalNetlist.push({ char, nodeIndex, subnodeCount });
    }

    const nodeVisitCount = {};
    const nodes = [];
    [...new Set(logicalNetlist.map(item => item.nodeIndex))].forEach(index => {
        nodes.push({ index: index, rings: [] });
        nodeVisitCount[index] = 0;
    });

    const traces = [];
    let activeRingLevels = {}; // Tracks the current ring level for traces to connect to

    let i = 0;
    while (i < logicalNetlist.length) {
        const startNet = logicalNetlist[i];
        
        // Group all sequential letters on the same node
        let nextDifferentNetIndex = i + 1;
        while (nextDifferentNetIndex < logicalNetlist.length && logicalNetlist[nextDifferentNetIndex].nodeIndex === startNet.nodeIndex) {
            nextDifferentNetIndex++;
        }

        const subnodeGroups = [];
        for (let j = i; j < nextDifferentNetIndex; j++) {
            subnodeGroups.push({ subnodeCount: logicalNetlist[j].subnodeCount });
        }
        
        // This group of letters is for the outgoing connection. Mark the node as visited.
        nodeVisitCount[startNet.nodeIndex]++;

        // If this is the last group of letters, they belong to the ground trace.
        if (nextDifferentNetIndex >= logicalNetlist.length) {
            break; // Exit loop, remaining letters handled by groundTrace
        }

        const endNet = logicalNetlist[nextDifferentNetIndex];
        
        // Determine the ring level for the destination node
        const isReturnVisit = nodeVisitCount[endNet.nodeIndex] > 0;
        let toRingLevel = activeRingLevels[endNet.nodeIndex] || 0;

        if (isReturnVisit) {
            const node = nodes.find(n => n.index === endNet.nodeIndex);
            if (node) {
                const newRingLevel = node.rings.length === 0 ? -1 : Math.max(...node.rings, 0) + 1;
                if (!node.rings.includes(newRingLevel)) {
                    node.rings.push(newRingLevel);
                }
                toRingLevel = newRingLevel;
            }
        }
        
        traces.push({
            fromNode: startNet.nodeIndex,
            toNode: endNet.nodeIndex,
            subnodeGroups,
            fromRingLevel: activeRingLevels[startNet.nodeIndex] || 0,
            toRingLevel: toRingLevel,
        });

        // Update the active ring levels for the next iteration
        activeRingLevels[startNet.nodeIndex] = activeRingLevels[startNet.nodeIndex] || 0;
        activeRingLevels[endNet.nodeIndex] = toRingLevel;

        i = nextDifferentNetIndex;
    }
    
    // Process the final group of letters for the ground trace
    const finalSubnodeGroups = [];
    let lastSequenceIndex = logicalNetlist.length -1;
    while(lastSequenceIndex > 0 && logicalNetlist[lastSequenceIndex - 1].nodeIndex === logicalNetlist[lastSequenceIndex].nodeIndex){
        lastSequenceIndex--;
    }
    for(let j = lastSequenceIndex; j < logicalNetlist.length; j++){
        finalSubnodeGroups.push({subnodeCount: logicalNetlist[j].subnodeCount});
    }

    const finalNet = logicalNetlist[logicalNetlist.length - 1];
    const groundTrace = {
        fromNode: finalNet.nodeIndex,
        subnodeGroups: finalSubnodeGroups,
        fromRingLevel: activeRingLevels[finalNet.nodeIndex] || 0,
    };

    return {
        sourceWord: upperText,
        chargeNode: logicalNetlist[0].nodeIndex,
        nodes,
        traces,
        groundTrace,
    };
}