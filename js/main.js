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
    
    // Check if running locally (as a file or on localhost)
    const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) { 
        // For local development, expect a global firebaseConfig object from firebase-config.js
        if (typeof firebaseConfig !== 'undefined') {
            config = firebaseConfig;
        } else {
             document.body.innerHTML = '<h1>FATAL ERROR: firebase-config.js not found. This file is required for local development and must be created manually.</h1>';
             return;
        }
    } else { 
        // For a deployed site, fetch the config from the /config endpoint.
        try {
            const response = await fetch('/config');
            if (!response.ok) {
                throw new Error(`Network response was not ok (${response.status})`);
            }
            config = await response.json();
        } catch (error) {
            console.error("FATAL: Could not fetch configuration from the /config endpoint.", error);
            document.body.innerHTML = '<h1>FATAL ERROR: Could not load server configuration. Ensure the /config function is deployed and working correctly.</h1>';
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