// js/ui.js

import { appState } from './state.js';
import { generateNoise, encodeMessage, generateNewCipher } from './kohd.js';
import { transmitDatastream, updateTerminalConfig } from './firebase.js';

// --- DOM Element References ---
let uiElements;

/**
 * Caches all necessary DOM element references for quick access.
 */
function cacheDOMElements() {
    uiElements = {
        // Transmit Tab
        playerMessageDisplay: document.getElementById('playerMessageDisplay'),
        messageInput: document.getElementById('messageInput'),
        noiseSlider: document.getElementById('noiseSlider'),
        noiseValue: document.getElementById('noiseValue'),
        encodeButton: document.getElementById('encodeButton'),
        outputBurst: document.getElementById('outputBurst'),
        templateButtons: document.getElementById('templateButtons'),
        // Session Tab
        playerResourceNameInput: document.getElementById('playerResourceName'),
        playerResourceCountInput: document.getElementById('playerResourceCount'),
        setResourceButton: document.getElementById('setResourceButton'),
        customCommandNameInput: document.getElementById('customCommandName'),
        customCommandArgsInput: document.getElementById('customCommandArgs'),
        customCommandResponseInput: document.getElementById('customCommandResponse'),
        commandConsumesResourceCheckbox: document.getElementById('commandConsumesResource'),
        createCustomCommandButton: document.getElementById('createCustomCommandButton'),
        customCommandList: document.getElementById('customCommandList'),
        specialCommandNameInput: document.getElementById('specialCommandName'),
        createDecryptCommandButton: document.getElementById('createDecryptCommand'),
        traceCommandNameInput: document.getElementById('traceCommandName'),
        traceCommandResponseInput: document.getElementById('traceCommandResponse'),
        createTraceCommandButton: document.getElementById('createTraceCommand'),
        scrambleMessageButton: document.getElementById('scrambleMessageButton'),
        glitchCommandButton: document.getElementById('glitchCommandButton'),
        glitchCommandSelect: document.getElementById('glitchCommandSelect'),
        triggerLockoutButton: document.getElementById('triggerLockoutButton'),
        triggerWarningButton: document.getElementById('triggerWarningButton'),
        customWarningInput: document.getElementById('customWarningInput'),
        clearOverrideButton: document.getElementById('clearOverrideButton'),
        newFileNameInput: document.getElementById('newFileName'),
        fileAccessLevelSelect: document.getElementById('fileAccessLevel'),
        newFileContentInput: document.getElementById('newFileContent'),
        createFileButton: document.getElementById('createFileButton'),
        fileList: document.getElementById('fileList'),
        keyManagementGrid: document.getElementById('keyManagementGrid'),
        unlockAllButton: document.getElementById('unlockAllButton'),
        lockAllButton: document.getElementById('lockAllButton'),
        // SVG Elements
        svgFileInput: document.getElementById('svgFileInput'),
        createSvgFileButton: document.getElementById('createSvgFileButton'),
        sendSvgDatastreamButton: document.getElementById('sendSvgDatastreamButton'),
        // Setup Tab
        systemNameInput: document.getElementById('systemName'),
        osNameInput: document.getElementById('osName'),
        scanCommandInput: document.getElementById('scanCommand'),
        connectCommandInput: document.getElementById('connectCommand'),
        dataNounInput: document.getElementById('dataNoun'),
        signalNounInput: document.getElementById('signalNoun'),
        themeSelect: document.getElementById('themeSelect'),
        updateConfigButton: document.getElementById('updateConfigButton'),
        presetNameInput: document.getElementById('presetNameInput'),
        savePresetButton: document.getElementById('savePresetButton'),
        presetButtonsContainer: document.getElementById('presetButtonsContainer'),
        level2PasswordInput: document.getElementById('level2Password'),
        level3PasswordInput: document.getElementById('level3Password'),
        savePasswordsButton: document.getElementById('savePasswordsButton'),
        resetAccessButton: document.getElementById('resetAccessButton'),
        cipherContainer: document.getElementById('cipher-key-container'),
        generateCipherButton: document.getElementById('generateCipherButton'),
        resetCipherButton: document.getElementById('resetCipherButton'),
        historyContainer: document.getElementById('historyContainer'),
        clearHistoryButton: document.getElementById('clearHistoryButton'),
        // Admin Tab
        newUsernameInput: document.getElementById('newUsername'),
        newPasswordInput: document.getElementById('newPassword'),
        createUserButton: document.getElementById('createUserButton'),
        userList: document.getElementById('userList'),
        // Global
        playerStatus: document.getElementById('playerStatus'),
        tabs: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
    };
}

/**
 * Saves a message to the GM's local history and updates the display.
 * @param {string} message - The message to save.
 */
function saveToHistory(message) {
    let history = JSON.parse(localStorage.getItem(appState.GM_HISTORY_KEY)) || [];
    if (!history.includes(message)) {
        history.unshift(message);
    }
    if (history.length > 20) history.pop();
    localStorage.setItem(appState.GM_HISTORY_KEY, JSON.stringify(history));
    displayHistory();
}

/**
 * Renders the GM's message history in the UI.
 */
function displayHistory() {
    let history = JSON.parse(localStorage.getItem(appState.GM_HISTORY_KEY)) || [];
    uiElements.historyContainer.innerHTML = '';
    if (history.length === 0) {
        uiElements.historyContainer.innerHTML = 'No history yet.';
    } else {
        history.forEach(message => {
            const item = document.createElement('div');
            item.className = 'historyItem';
            item.textContent = message;
            item.onclick = () => { uiElements.messageInput.value = message; };
            uiElements.historyContainer.appendChild(item);
        });
    }
}

/**
 * Sets up all the event listeners for the UI.
 */
function initializeEventListeners() {
    // Tab functionality
    uiElements.tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            const tabName = tab.getAttribute('onclick').match(/'([^']+)'/)[1];
            
            uiElements.tabContents.forEach(content => content.classList.remove('active'));
            uiElements.tabs.forEach(t => t.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.currentTarget.classList.add('active');
        });
    });

    // Transmit Tab
    uiElements.encodeButton.onclick = () => {
        const message = uiElements.messageInput.value;
        if (!message) return;
        saveToHistory(message);
        const noiseLength = parseInt(uiElements.noiseSlider.value, 10);
        const encodedPart = encodeMessage(message);
        const leadingNoise = generateNoise(Math.floor(noiseLength / 2));
        const trailingNoise = generateNoise(Math.ceil(noiseLength / 2));
        const finalBurst = `${leadingNoise}$:${encodedPart}:#${trailingNoise}`;
        uiElements.outputBurst.textContent = finalBurst;
        transmitDatastream(finalBurst);
    };
    uiElements.noiseSlider.oninput = () => {
        uiElements.noiseValue.textContent = uiElements.noiseSlider.value;
    };
    const MESSAGE_TEMPLATES = ["CONNECTION UNSTABLE", "SIGNAL BOOSTED", "SECURITY ALERT", "TRACE DETECTED", "ACKNOWLEDGED", "STAND BY..."];
    MESSAGE_TEMPLATES.forEach(template => {
        const btn = document.createElement('button');
        btn.textContent = template;
        btn.onclick = () => uiElements.messageInput.value = template;
        uiElements.templateButtons.appendChild(btn);
    });

    // Setup Tab Listeners
    uiElements.updateConfigButton.onclick = () => {
        const config = {
            systemName: uiElements.systemNameInput.value,
            osName: uiElements.osNameInput.value,
            scanCommand: uiElements.scanCommandInput.value.toLowerCase(),
            connectCommand: uiElements.connectCommandInput.value.toLowerCase(),
            dataNoun: uiElements.dataNounInput.value,
            signalNoun: uiElements.signalNounInput.value,
            theme: uiElements.themeSelect.value
        };
        updateTerminalConfig(config);
        alert('Terminal configuration updated!');
    };
    
    uiElements.clearHistoryButton.onclick = () => {
        if (confirm('Are you sure you want to clear the transmission history for yourself and all players?')) {
            localStorage.removeItem(appState.GM_HISTORY_KEY);
            displayHistory();
            appState.dbRefs.historyClear.set(firebase.database.ServerValue.TIMESTAMP);
        }
    };
    
    uiElements.savePasswordsButton.onclick = () => {
        const pass2 = uiElements.level2PasswordInput.value.trim();
        const pass3 = uiElements.level3PasswordInput.value.trim();
        const updates = {};
        if (pass2) updates['level2'] = pass2;
        if (pass3) updates['level3'] = pass3;
        appState.dbRefs.access.set(updates);
        alert('Access passwords saved.');
    };
    
    uiElements.resetCipherButton.onclick = () => {
        if (!confirm('This will reset the cipher to its default state. Continue?')) return;
        appState.dbRefs.cipher.set(appState.defaultEncodingChart);
        appState.dbRefs.keys.remove(); // Clear unlocked keys as well
        alert('Cipher has been reset to default.');
    };

    uiElements.generateCipherButton.onclick = () => {
        if (!confirm('This will generate a new cipher and may disrupt player decoding. Continue?')) return;
        const newChart = generateNewCipher();
        appState.dbRefs.cipher.set(newChart);
        appState.dbRefs.keys.remove();
        alert('New cipher generated and synced.');
    };

    // Session Tab listeners...
    uiElements.createFileButton.onclick = () => {
        const fileName = uiElements.newFileNameInput.value.trim().toLowerCase();
        const accessLevel = parseInt(uiElements.fileAccessLevelSelect.value, 10);
        const fileContent = uiElements.newFileContentInput.value;
        if (!fileName || !fileContent) { alert('Filename and content cannot be empty.'); return; }
        if (!fileName.includes('.')) { alert('Filename must include an extension (e.g., .txt, .log)'); return; }
        const safeFileName = fileName.replace(/\./g, '·');
        appState.dbRefs.fileSystem.child(safeFileName).set({ content: fileContent, level: accessLevel });
        uiElements.newFileNameInput.value = '';
        uiElements.newFileContentInput.value = '';
    };
    
    // SVG Handling Listeners
    const handleSvgUpload = (callback) => {
        const file = uiElements.svgFileInput.files[0];
        if (!file) {
            alert('Please select an SVG file first.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            callback(event.target.result, file.name);
        };
        reader.readAsText(file);
    };

    uiElements.createSvgFileButton.onclick = () => {
        handleSvgUpload((svgContent, fileName) => {
            const safeFileName = fileName.replace(/\./g, '·');
            // Use the same access level selector as text files for simplicity
            const accessLevel = parseInt(uiElements.fileAccessLevelSelect.value, 10);
            appState.dbRefs.fileSystem.child(safeFileName).set({
                content: svgContent,
                level: accessLevel,
                isSvg: true // Flag to identify SVG files
            });
            alert(`SVG file "${fileName}" created successfully.`);
            uiElements.svgFileInput.value = ''; // Clear the input
        });
    };

    uiElements.sendSvgDatastreamButton.onclick = () => {
        handleSvgUpload((svgContent) => {
            const finalBurst = `SVG::${svgContent}`;
            uiElements.outputBurst.textContent = "SVG Datastream Sent";
            transmitDatastream(finalBurst);
            uiElements.svgFileInput.value = ''; // Clear the input
        });
    };


    // Admin Tab listeners
    uiElements.createUserButton.onclick = () => {
        const username = uiElements.newUsernameInput.value.trim().toLowerCase();
        const password = uiElements.newPasswordInput.value.trim();
        if (!username || !password) {
            alert('Username and password cannot be empty.');
            return;
        }
        appState.dbRefs.users.child(username).set({ password: password });
        uiElements.newUsernameInput.value = '';
        uiElements.newPasswordInput.value = '';
    };

    // Load initial state for things not covered by Firebase listeners
    displayHistory();
}

// --- Functions to update UI from Firebase state ---

function displayPlayerMessage(snapshot) {
    const message = snapshot.val();
    uiElements.playerMessageDisplay.textContent = message || 'Awaiting message from player terminal...';
}

function updatePlayerStatus(snapshot) {
    const status = snapshot.val();
    if (status && status.isConnected) {
        uiElements.playerStatus.textContent = 'ONLINE';
        uiElements.playerStatus.className = 'online';
    } else {
        uiElements.playerStatus.textContent = 'OFFLINE';
        uiElements.playerStatus.className = 'offline';
    }
}

function displayCipherKey(chart) {
    const symbols = ['<', '>', '%', '^', '&', '*', '-', '+', '@'];
    const groups = ['<', '>', '%', '^', '&'];
    const reversedChart = Object.fromEntries(Object.entries(chart).map(a => a.reverse()));
    let tableHTML = '<table><thead><tr><th></th>';
    symbols.forEach(s => tableHTML += `<th>${s}</th>`);
    tableHTML += '</tr></thead><tbody>';
    groups.forEach(group => {
        tableHTML += `<tr><th>${group}</th>`;
        symbols.forEach(pos => {
            const pair = group + pos;
            let cellContent = reversedChart[pair] || '[BLANK]';
            if (group === pos) cellContent = '[SPACE]';
            let cellClass = (cellContent === '[SPACE]' || cellContent === '[BLANK]') ? 'class="space"' : '';
            tableHTML += `<td ${cellClass}>${cellContent}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    uiElements.cipherContainer.innerHTML = tableHTML;
}

function generateKeySwitches(keys) {
    uiElements.keyManagementGrid.innerHTML = '';
    const allChars = Object.keys(appState.encodingChart).sort();
    allChars.forEach(char => {
        const isChecked = keys[char] === true;
        const switchWrapper = document.createElement('div');
        switchWrapper.className = 'key-switch';
        switchWrapper.innerHTML = `<label for="key-${char}">${char}</label><label class="switch"><input type="checkbox" id="key-${char}" ${isChecked ? 'checked' : ''}><span class="slider"></span></label>`;
        uiElements.keyManagementGrid.appendChild(switchWrapper);
        document.getElementById(`key-${char}`).addEventListener('change', (e) => {
            appState.dbRefs.keys.child(char).set(e.target.checked);
        });
    });
}

function displayFiles(files) {
    uiElements.fileList.innerHTML = '';
    if (files) {
        Object.keys(files).forEach(safeFileName => {
            const originalFileName = safeFileName.replace(/·/g, '.');
            const fileData = files[safeFileName];
            const li = document.createElement('li');
            let displayText = originalFileName;
            if (fileData.level > 1) {
                li.classList.add('locked');
                displayText += ` [LEVEL ${fileData.level}]`;
            }
            if (fileData.isSvg) {
                 displayText += ` [SVG]`;
            }
            li.textContent = displayText;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'secondary';
            deleteButton.onclick = () => {
                if (confirm(`Are you sure you want to delete ${originalFileName}?`)) {
                    appState.dbRefs.fileSystem.child(safeFileName).remove();
                }
            };
            li.appendChild(deleteButton);
            uiElements.fileList.appendChild(li);
        });
    }
}

function displayCustomCommands(commands) {
    uiElements.customCommandList.innerHTML = '';
    if (commands) {
        Object.keys(commands).forEach(name => {
            const command = commands[name];
            const li = document.createElement('li');
            let displayText = `${name} ${command.args || ''}`;
            if (command.consumesResource || command.special_action) {
                displayText += ` (Consumes Resource)`;
            }
            li.textContent = displayText;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'secondary';
            deleteButton.onclick = () => appState.dbRefs.customCommands.child(name).remove();
            li.appendChild(deleteButton);
            uiElements.customCommandList.appendChild(li);
        });
    }
}

function updatePlayerResources(resources) {
    uiElements.playerResourceNameInput.value = resources?.name || 'Exploits';
    uiElements.playerResourceCountInput.value = resources?.count || 0;
}

function displayUsers(users) {
    uiElements.userList.innerHTML = '';
    if (users) {
        Object.keys(users).forEach(username => {
            const li = document.createElement('li');
            li.textContent = username;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'critical';
            deleteButton.onclick = () => {
                if (confirm(`Are you sure you want to delete user "${username}"?`)) {
                    appState.dbRefs.users.child(username).remove();
                }
            };
            li.appendChild(deleteButton);
            uiElements.userList.appendChild(li);
        });
    }
}

function handleSystemOverride(override) {
    const overlay = document.getElementById('system-override-overlay');
    if (override) {
        overlay.textContent = override.message;
        overlay.className = override.type; // 'lockout' or 'warning'
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

function handleAccessReset(timestamp) {
    if (timestamp) {
        alert('Player access level has been reset remotely.');
        // The player terminal handles the actual logic, this is just a notification for the GM
        appState.dbRefs.glitches.child('reset_access_timestamp').remove();
    }
}

export {
    cacheDOMElements,
    initializeEventListeners,
    displayPlayerMessage,
    updatePlayerStatus,
    displayCipherKey,
    generateKeySwitches,
    displayFiles,
    displayCustomCommands,
    updatePlayerResources,
    displayUsers,
    handleSystemOverride,
    handleAccessReset
};