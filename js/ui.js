// js/ui.js

import { appState } from './state.js';
import { generateNoise, encodeMessage, generateNewCipher } from './kohd.js';
import { transmitDatastream, updateTerminalConfig } from './firebase.js';
import { generateGlyphData } from './glyph-generator.js';
import { renderGlyph } from './canvas-renderer.js';

let uiElements;

function cacheDOMElements() {
    uiElements = {
        playerMessageDisplay: document.getElementById('playerMessageDisplay'),
        messageInput: document.getElementById('messageInput'),
        noiseSlider: document.getElementById('noiseSlider'),
        noiseValue: document.getElementById('noiseValue'),
        encodeButton: document.getElementById('encodeButton'),
        outputBurst: document.getElementById('outputBurst'),
        templateButtons: document.getElementById('templateButtons'),
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
        newUsernameInput: document.getElementById('newUsername'),
        newPasswordInput: document.getElementById('newPassword'),
        createUserButton: document.getElementById('createUserButton'),
        userList: document.getElementById('userList'),
        glyphInput: document.getElementById('glyphInput'),
        generateGlyphButton: document.getElementById('generateGlyphButton'),
        glyphCanvas: document.getElementById('glyphCanvas'),
        playerStatus: document.getElementById('playerStatus'),
        tabs: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
    };
}

function saveToHistory(message) {
    let history = JSON.parse(localStorage.getItem(appState.GM_HISTORY_KEY)) || [];
    if (!history.includes(message)) {
        history.unshift(message);
    }
    if (history.length > 20) history.pop();
    localStorage.setItem(appState.GM_HISTORY_KEY, JSON.stringify(history));
    displayHistory();
}

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

function loadPresets() {
    const presets = JSON.parse(localStorage.getItem(appState.CONFIG_PRESETS_KEY)) || {};
    uiElements.presetButtonsContainer.innerHTML = '';
    Object.keys(presets).forEach(name => {
        const preset = presets[name];
        const container = document.createElement('div');
        container.className = 'preset-button-container';
        const loadBtn = document.createElement('button');
        loadBtn.textContent = name;
        loadBtn.onclick = () => {
            uiElements.systemNameInput.value = preset.systemName;
            uiElements.osNameInput.value = preset.osName;
            uiElements.scanCommandInput.value = preset.scanCommand;
            uiElements.connectCommandInput.value = preset.connectCommand;
            uiElements.dataNounInput.value = preset.dataNoun;
            uiElements.signalNounInput.value = preset.signalNoun;
            uiElements.themeSelect.value = preset.theme;
        };
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'X';
        deleteBtn.className = 'critical';
        deleteBtn.onclick = () => {
            if (confirm(`Delete preset "${name}"?`)) {
                delete presets[name];
                localStorage.setItem(appState.CONFIG_PRESETS_KEY, JSON.stringify(presets));
                loadPresets();
            }
        };
        container.appendChild(loadBtn);
        container.appendChild(deleteBtn);
        uiElements.presetButtonsContainer.appendChild(container);
    });
}

function initializeEventListeners() {
    // Tab functionality
    uiElements.tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            const tabName = tab.dataset.tab;
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
    uiElements.noiseSlider.oninput = () => { uiElements.noiseValue.textContent = uiElements.noiseSlider.value; };
    const MESSAGE_TEMPLATES = ["CONNECTION UNSTABLE", "SIGNAL BOOSTED", "SECURITY ALERT", "TRACE DETECTED", "ACKNOWLEDGED", "STAND BY..."];
    MESSAGE_TEMPLATES.forEach(template => {
        const btn = document.createElement('button');
        btn.textContent = template;
        btn.onclick = () => uiElements.messageInput.value = template;
        uiElements.templateButtons.appendChild(btn);
    });

    // Glyph Generator listener
    uiElements.generateGlyphButton.onclick = () => {
        const inputText = uiElements.glyphInput.value;
        if (inputText) {
            const glyphData = generateGlyphData(inputText);
            renderGlyph(uiElements.glyphCanvas, glyphData);
        }
    };
    
    // Session Tab
    uiElements.setResourceButton.onclick = () => {
        const name = uiElements.playerResourceNameInput.value.trim() || 'Resources';
        const count = parseInt(uiElements.playerResourceCountInput.value, 10);
        appState.dbRefs.playerResources.set({ name: name, count: count });
    };
    uiElements.createCustomCommandButton.onclick = () => {
        const name = uiElements.customCommandNameInput.value.trim().toLowerCase();
        if (!name) return alert('Command name cannot be empty.');
        const commandData = {
            args: uiElements.customCommandArgsInput.value.trim().toLowerCase(),
            response: uiElements.customCommandResponseInput.value,
            consumesResource: uiElements.commandConsumesResourceCheckbox.checked
        };
        appState.dbRefs.customCommands.child(name).set(commandData);
        uiElements.customCommandNameInput.value = '';
        uiElements.customCommandArgsInput.value = '';
        uiElements.customCommandResponseInput.value = '';
        uiElements.commandConsumesResourceCheckbox.checked = false;
    };
    uiElements.createDecryptCommandButton.onclick = () => {
        const name = uiElements.specialCommandNameInput.value.trim().toLowerCase() || 'bruteforce';
        appState.dbRefs.customCommands.child(name).set({ special_action: 'bruteforce_decrypt' });
        uiElements.specialCommandNameInput.value = '';
    };
    uiElements.createTraceCommandButton.onclick = () => {
        const name = uiElements.traceCommandNameInput.value.trim().toLowerCase() || 'trace';
        const response = uiElements.traceCommandResponseInput.value;
        if (!response) return alert('Trace clue response cannot be empty.');
        appState.dbRefs.customCommands.child(name).set({ special_action: 'trace_signal', response: response });
        uiElements.traceCommandNameInput.value = '';
        uiElements.traceCommandResponseInput.value = '';
    };
    uiElements.scrambleMessageButton.onclick = () => {
        appState.dbRefs.glitches.child('scramble_next').set(true);
        alert('Next message will be scrambled!');
    };
    uiElements.glitchCommandButton.onclick = () => {
        const commandToGlitch = uiElements.glitchCommandSelect.value;
        appState.dbRefs.glitches.child('glitched_command').set(commandToGlitch);
        alert(`Command "${commandToGlitch}" will be glitched for 30 seconds.`);
        setTimeout(() => appState.dbRefs.glitches.child('glitched_command').remove(), 30000);
    };
    uiElements.triggerLockoutButton.onclick = () => { appState.dbRefs.glitches.child('override_state').set({ type: 'lockout', message: 'CONNECTION TERMINATED' }); };
    uiElements.triggerWarningButton.onclick = () => {
        const message = uiElements.customWarningInput.value.trim() || '!! INTRUSION DETECTED !!';
        appState.dbRefs.glitches.child('override_state').set({ type: 'warning', message: message });
        uiElements.customWarningInput.value = '';
    };
    uiElements.clearOverrideButton.onclick = () => { appState.dbRefs.glitches.child('override_state').remove(); };
    uiElements.createFileButton.onclick = () => {
        const fileName = uiElements.newFileNameInput.value.trim().toLowerCase();
        const accessLevel = parseInt(uiElements.fileAccessLevelSelect.value, 10);
        const fileContent = uiElements.newFileContentInput.value;
        if (!fileName || !fileContent) return alert('Filename and content cannot be empty.');
        if (!fileName.includes('.')) return alert('Filename must include an extension (e.g., .txt, .log)');
        const safeFileName = fileName.replace(/\./g, '·');
        appState.dbRefs.fileSystem.child(safeFileName).set({ content: fileContent, level: accessLevel });
        uiElements.newFileNameInput.value = '';
        uiElements.newFileContentInput.value = '';
    };
    uiElements.unlockAllButton.onclick = () => {
        const updates = {};
        Object.keys(appState.encodingChart).forEach(char => { updates[char] = true; });
        appState.dbRefs.keys.set(updates);
    };
    uiElements.lockAllButton.onclick = () => { appState.dbRefs.keys.set(null); };

    // Setup Tab
    uiElements.updateConfigButton.onclick = () => {
        const config = {
            systemName: uiElements.systemNameInput.value, osName: uiElements.osNameInput.value,
            scanCommand: uiElements.scanCommandInput.value.toLowerCase(), connectCommand: uiElements.connectCommandInput.value.toLowerCase(),
            dataNoun: uiElements.dataNounInput.value, signalNoun: uiElements.signalNounInput.value, theme: uiElements.themeSelect.value
        };
        updateTerminalConfig(config);
        alert('Terminal configuration updated!');
    };
    uiElements.savePresetButton.onclick = () => {
        const name = uiElements.presetNameInput.value.trim();
        if (!name) return alert('Please enter a name for the preset.');
        const presets = JSON.parse(localStorage.getItem(appState.CONFIG_PRESETS_KEY)) || {};
        presets[name] = {
            systemName: uiElements.systemNameInput.value, osName: uiElements.osNameInput.value,
            scanCommand: uiElements.scanCommandInput.value, connectCommand: uiElements.connectCommandInput.value,
            dataNoun: uiElements.dataNounInput.value, signalNoun: uiElements.signalNounInput.value, theme: uiElements.themeSelect.value
        };
        localStorage.setItem(appState.CONFIG_PRESETS_KEY, JSON.stringify(presets));
        uiElements.presetNameInput.value = '';
        loadPresets();
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
    uiElements.resetAccessButton.onclick = () => {
        if (confirm('Are you sure you want to reset the player\'s access level back to 1?')) {
            appState.dbRefs.glitches.child('reset_access_timestamp').set(firebase.database.ServerValue.TIMESTAMP);
            alert('Player access level has been reset.');
        }
    };
    uiElements.resetCipherButton.onclick = () => {
        if (!confirm('This will reset the cipher to its default state. Continue?')) return;
        appState.dbRefs.cipher.set(appState.defaultEncodingChart);
        appState.dbRefs.keys.remove();
        alert('Cipher has been reset to default.');
    };
    uiElements.generateCipherButton.onclick = () => {
        if (!confirm('This will generate a new cipher and may disrupt player decoding. Continue?')) return;
        const newChart = generateNewCipher();
        appState.dbRefs.cipher.set(newChart);
        appState.dbRefs.keys.remove();
        alert('New cipher generated and synced.');
    };
    uiElements.clearHistoryButton.onclick = () => {
        if (confirm('Are you sure you want to clear the transmission history for yourself and all players?')) {
            localStorage.removeItem(appState.GM_HISTORY_KEY);
            displayHistory();
            appState.dbRefs.historyClear.set(firebase.database.ServerValue.TIMESTAMP);
        }
    };

    // Admin Tab
    uiElements.createUserButton.onclick = () => {
        const username = uiElements.newUsernameInput.value.trim().toLowerCase();
        const password = uiElements.newPasswordInput.value.trim();
        if (!username || !password) return alert('Username and password cannot be empty.');
        appState.dbRefs.users.child(username).set({ password: password });
        uiElements.newUsernameInput.value = '';
        uiElements.newPasswordInput.value = '';
    };

    displayHistory();
    loadPresets();
}

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
            deleteButton.style.marginLeft = '15px';
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
    // This element is not in gm_encoder.html, so it won't be found.
    // This function is included for completeness but will not run in this context.
}

function handleAccessReset(timestamp) {
    if (timestamp) {
        alert('Player access level has been reset remotely.');
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