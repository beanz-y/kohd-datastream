// js/kohd.js

import { appState } from './state.js';

// --- Constants for Kohd Language Structure ---
const symbols = ['<', '>', '%', '^', '&', '*', '-', '+', '@'];
const groups = ['<', '>', '%', '^', '&'];
const doubledSymbols = ['<<', '>>', '%%', '^^', '&&', '**', '--', '++', '@@'];

/**
 * Generates a random string of noise symbols.
 * @param {number} length - The desired length of the noise string.
 * @returns {string} A random noise string.
 */
function generateNoise(length) {
    let noise = '';
    for (let i = 0; i < length; i++) {
        noise += symbols[Math.floor(Math.random() * symbols.length)];
    }
    return noise;
}

/**
 * Encodes a plain text message into a Kohd string using the current cipher.
 * @param {string} message - The message to encode.
 * @returns {string} The encoded message fragment.
 */
function encodeMessage(message) {
    let encoded = '';
    message = message.toUpperCase();
    for (const char of message) {
        if (char === ' ') {
            // Spaces are represented by a random doubled symbol
            encoded += doubledSymbols[Math.floor(Math.random() * doubledSymbols.length)];
        } else if (appState.encodingChart[char]) {
            encoded += appState.encodingChart[char];
        }
    }
    return encoded;
}

/**
 * Generates a new, randomized cipher chart for encoding.
 * @returns {object} A new encoding chart object.
 */
function generateNewCipher() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    let possiblePairs = [];
    groups.forEach(g => {
        symbols.forEach(s => {
            if (g !== s) possiblePairs.push(g + s);
        });
    });
    // Shuffle the pairs to create a random mapping
    possiblePairs.sort(() => 0.5 - Math.random());

    const newChart = {};
    chars.forEach((char, index) => {
        newChart[char] = possiblePairs[index];
    });
    return newChart;
}

export { generateNoise, encodeMessage, generateNewCipher };