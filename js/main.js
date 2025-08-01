// js/main.js

import { appState } from './state.js';
import { cacheDOMElements, initializeEventListeners } from './ui.js';
import { initializeFirebaseListeners } from './firebase.js';

/**
 * The main application runner. It orchestrates the initialization of all modules.
 */
function runApp() {
    console.log("Kohd Datastream GM Encoder Initializing...");
    cacheDOMElements();
    initializeEventListeners();
    initializeFirebaseListeners();
    console.log("System Ready.");
}

/**
 * Asynchronously fetches Firebase config and initializes the application.
 * This is the primary entry point of the script.
 */
async function initializeApp() {
    let config;
    // Check if running locally (file://) or on a server
    if (window.location.protocol === 'file:') {
        // For local development, expects firebase-config.js to be loaded in HTML
        if (typeof firebaseConfig !== 'undefined') {
            config = firebaseConfig;
        } else {
             document.body.innerHTML = '<h1>FATAL ERROR: firebase-config.js not found for local execution.</h1>';
             return;
        }
    } else {
        try {
            // For deployed version, fetch config from the serverless function
            const response = await fetch('/config');
            if (!response.ok) throw new Error('Network response was not ok');
            config = await response.json();
        } catch (error) {
            console.error("Could not fetch live config, falling back to local.", error);
            if (typeof firebaseConfig !== 'undefined') {
                config = firebaseConfig;
            } else {
                document.body.innerHTML = '<h1>FATAL ERROR: Could not load configuration.</h1>';
                return;
            }
        }
    }

    // Initialize Firebase and the main application
    firebase.initializeApp(config);
    appState.database = firebase.database();
    runApp();
}

// Start the application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeApp);