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
    // When running locally on localhost, always use the firebase-config.js file.
    // The fetch('/config') method is for a deployed environment with serverless functions.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (typeof firebaseConfig !== 'undefined') {
            config = firebaseConfig;
        } else {
            document.body.innerHTML = '<h1>FATAL ERROR: firebase-config.js not found for local execution.</h1>';
            return;
        }
    } else {
        // Deployed environment logic
        try {
            const response = await fetch('/config');
            if (!response.ok) throw new Error('Network response was not ok');
            config = await response.json();
        } catch (error) {
            console.error("Could not fetch live config.", error);
            document.body.innerHTML = '<h1>FATAL ERROR: Could not load configuration.</h1>';
            return;
        }
    }

    // Initialize Firebase and the main application
    firebase.initializeApp(config);
    appState.database = firebase.database();
    runApp();
}

// Start the application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeApp);