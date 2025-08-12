// js/firebase.js

import { appState } from './state.js';
import {
    displayCipherKey,
    generateKeySwitches,
    displayFiles,
    displayCustomCommands,
    updatePlayerResources,
    displayUsers,
    handleSystemOverride,
    handleAccessReset,
    displayHistory,
    displayConnectedPlayers,
    updatePlayerRepliesView
} from './ui.js';

/**
 * Initializes database references and sets up listeners for data changes.
 */
function initializeFirebaseListeners() {
    appState.dbRefs = {
        config: appState.database.ref('terminal_config'),
        datastream: appState.database.ref('kohd_datastream'),
        playerConnections: appState.database.ref('player_connections'),
        playerReplies: appState.database.ref('player_replies'),
        directMessages: appState.database.ref('direct_messages'),
        datastreamHistory: appState.database.ref('datastream_history'),
        keys: appState.database.ref('decryption_keys'),
        historyClear: appState.database.ref('history_cleared_timestamp'),
        fileSystem: appState.database.ref('file_system'),
        glitches: appState.database.ref('glitches'),
        cipher: appState.database.ref('cipher_config'),
        access: appState.database.ref('access_control'),
        customCommands: appState.database.ref('custom_commands'),
        playerResources: appState.database.ref('player_resources'),
        users: appState.database.ref('users')
    };

    // --- Set up listeners ---
    appState.dbRefs.datastreamHistory.on('value', (snapshot) => {
        displayHistory(snapshot.val());
    });

    appState.dbRefs.playerConnections.on('value', (snapshot) => {
        displayConnectedPlayers(snapshot.val());
    });
    
    // UPDATED: This listener no longer tries to access UI elements directly.
    appState.dbRefs.playerReplies.on('value', (snapshot) => {
        updatePlayerRepliesView(snapshot.val());
    });

    appState.dbRefs.cipher.on('value', (snapshot) => {
        if (snapshot.exists()) {
            appState.encodingChart = snapshot.val();
        } else {
            appState.encodingChart = appState.defaultEncodingChart;
            appState.dbRefs.cipher.set(appState.defaultEncodingChart);
        }
        displayCipherKey(appState.encodingChart);
        appState.dbRefs.keys.once('value', (keySnapshot) => {
            generateKeySwitches(keySnapshot.val() || {});
        });
    });

    appState.dbRefs.keys.on('value', (snapshot) => {
        appState.decryptionKeys = snapshot.val() || {};
        generateKeySwitches(appState.decryptionKeys);
    });

    appState.dbRefs.fileSystem.on('value', (snapshot) => {
        appState.fileSystem = snapshot.val() || {};
        displayFiles(appState.fileSystem);
    });

    appState.dbRefs.customCommands.on('value', (snapshot) => {
        appState.customCommands = snapshot.val() || {};
        displayCustomCommands(appState.customCommands);
    });

    appState.dbRefs.playerResources.on('value', (snapshot) => {
        const resources = snapshot.val();
        updatePlayerResources(resources);
    });

    appState.dbRefs.users.on('value', (snapshot) => {
        appState.users = snapshot.val() || {};
        displayUsers(appState.users);
    });

    appState.dbRefs.glitches.on('value', (snapshot) => {
        appState.glitches = snapshot.val() || {};
        handleSystemOverride(appState.glitches.override_state);
        handleAccessReset(appState.glitches.reset_access_timestamp);
    });
}

/**
 * Transmits the final encoded datastream to Firebase.
 * @param {string} datastream - The full string to send.
 * @param {string} target - The target player's username or 'all' for broadcast.
 */
function transmitDatastream(datastream, target) {
    if (target === 'all') {
        // Broadcast to everyone
        appState.dbRefs.datastream.set(datastream);
        // Add broadcast messages to the main history
        appState.dbRefs.datastreamHistory.push(datastream);
    } else {
        // Send a direct message to a specific player
        appState.dbRefs.directMessages.child(target).set(datastream);
    }
}

/**
 * Updates the terminal configuration in Firebase.
 */
function updateTerminalConfig(config) {
    appState.dbRefs.config.set(config);
}

export { initializeFirebaseListeners, transmitDatastream, updateTerminalConfig };