// js/ui.js

import { appState } from './state.js';
import { generateNoise, encodeMessage, generateNewCipher } from './kohd.js';
import { transmitDatastream, updateTerminalConfig } from './firebase.js';

// --- DOM Element References ---
let uiElements;

// --- Helper function for Presets ---
function displayPresets() {
    const presets = JSON.parse(localStorage.getItem(appState.CONFIG_PRESETS_KEY)) || {};
    uiElements.presetButtonsContainer.innerHTML = '';
    Object.keys(presets).forEach(name => {
        const preset = presets[name];
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.onclick = () => {
            uiElements.systemNameInput.value = preset.systemName;
            uiElements.osNameInput.value = preset.osName;
            uiElements.scanCommandInput.value = preset.scanCommand;
            uiElements.connectCommandInput.value = preset.connectCommand;
            uiElements.dataNounInput.value = preset.dataNoun;
            uiElements.signalNounInput.value = preset.signalNoun;
            uiElements.themeSelect.value = preset.theme;
        };
        uiElements.presetButtonsContainer.appendChild(btn);
    });
}


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
        transmitDecodedButton: document.getElementById('transmitDecodedButton'),
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
        svgFileNameInput: document.getElementById('svgFileNameInput'),
        createSvgFileButton: document.getElementById('createSvgFileButton'),
        sendSvgDatastreamButton: document.getElementById('sendSvgDatastreamButton'),
        // Edit Modal Elements
        fileEditModal: document.getElementById('fileEditModal'),
        editModalTitle: document.getElementById('editModalTitle'),
        editModalFileName: document.getElementById('editModalFileName'),
        editModalAccessLevel: document.getElementById('editModalAccessLevel'),
        editModalTextarea: document.getElementById('editModalTextarea'),
        editModalSave: document.getElementById('editModalSave'),
        editModalCancel: document.getElementById('editModalCancel'),
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
        resetUserSelect: document.getElementById('resetUserSelect'),
        resetNewPasswordInput: document.getElementById('resetNewPassword'),
        resetPasswordButton: document.getElementById('resetPasswordButton'),
        // Global
        playerStatus: document.getElementById('playerStatus'),
        tabs: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
    };
}


/**
 * Renders the GM's message history in the UI.
 */
function displayHistory(history) { // <-- Function now accepts the history object
    uiElements.historyContainer.innerHTML = '';
    if (!history) {
        uiElements.historyContainer.innerHTML = 'No history yet.';
        return;
    }

    // Create a list to hold the history items
    const historyList = document.createElement('ul');
    historyList.style.paddingLeft = '0';
    historyList.style.listStyle = 'none';

    Object.entries(history).forEach(([key, message]) => {
        const item = document.createElement('li');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.marginBottom = '5px';
        item.style.padding = '5px';
        item.style.border = '1px solid var(--border-color)';
        item.style.borderRadius = '3px';

        const messageText = document.createElement('span');
        messageText.textContent = message.length > 50 ? message.substring(0, 50) + '...' : message;
        messageText.style.cursor = 'pointer';
        messageText.onclick = () => { uiElements.messageInput.value = message; };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'critical';
        deleteButton.style.padding = '2px 8px';
        deleteButton.style.fontSize = '0.8em';
        deleteButton.onclick = () => {
            if (confirm('Are you sure you want to delete this message?')) {
                appState.dbRefs.datastreamHistory.child(key).remove();
            }
        };

        item.appendChild(messageText);
        item.appendChild(deleteButton);
        historyList.appendChild(item);
    });

    uiElements.historyContainer.appendChild(historyList);
}

/**
 * Sets up all the event listeners for the UI.
 */
function initializeEventListeners() {
    // Transmit Tab
    uiElements.encodeButton.onclick = () => {
        const message = uiElements.messageInput.value;
        if (!message) return;
        const noiseLength = parseInt(uiElements.noiseSlider.value, 10);
        const encodedPart = encodeMessage(message);
        const leadingNoise = generateNoise(Math.floor(noiseLength / 2));
        const trailingNoise = generateNoise(Math.ceil(noiseLength / 2));
        const finalBurst = `${leadingNoise}$:${encodedPart}:#${trailingNoise}`;
        uiElements.outputBurst.textContent = finalBurst;
        transmitDatastream(finalBurst);
    };

    uiElements.transmitDecodedButton.onclick = () => {
        const message = uiElements.messageInput.value;
        if (!message) return;
        const noiseLength = parseInt(uiElements.noiseSlider.value, 10);
        const leadingNoise = generateNoise(Math.floor(noiseLength / 2));
        const trailingNoise = generateNoise(Math.ceil(noiseLength / 2));
        const finalBurst = `${leadingNoise}$:${message}:#${trailingNoise}`;
        uiElements.outputBurst.textContent = `DECODED: ${finalBurst}`;
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

    uiElements.savePresetButton.onclick = () => {
        const name = uiElements.presetNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the preset.');
            return;
        }
        const preset = {
            systemName: uiElements.systemNameInput.value,
            osName: uiElements.osNameInput.value,
            scanCommand: uiElements.scanCommandInput.value.toLowerCase(),
            connectCommand: uiElements.connectCommandInput.value.toLowerCase(),
            dataNoun: uiElements.dataNounInput.value,
            signalNoun: uiElements.signalNounInput.value,
            theme: uiElements.themeSelect.value
        };
        const presets = JSON.parse(localStorage.getItem(appState.CONFIG_PRESETS_KEY)) || {};
        presets[name] = preset;
        localStorage.setItem(appState.CONFIG_PRESETS_KEY, JSON.stringify(presets));
        displayPresets();
        uiElements.presetNameInput.value = '';
    };

    uiElements.resetAccessButton.onclick = () => {
        if (confirm('This will reset the player\'s access to Level 1 and clear saved passwords. Are you sure?')) {
            appState.dbRefs.access.remove();
            appState.dbRefs.glitches.child('reset_access_timestamp').set(firebase.database.ServerValue.TIMESTAMP);
            alert('Player access has been reset.');
        }
    };

    uiElements.clearHistoryButton.onclick = () => {
        if (confirm('Are you sure you want to clear the ENTIRE transmission history for yourself and all players?')) {
            // This now correctly targets the database path for history
            appState.dbRefs.datastreamHistory.remove(); // <-- UPDATED LINE
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

    // Session Tab listeners
    uiElements.setResourceButton.onclick = () => {
        const name = uiElements.playerResourceNameInput.value.trim();
        const count = parseInt(uiElements.playerResourceCountInput.value, 10);
        if (!name) {
            alert('Resource name cannot be empty.');
            return;
        }
        appState.dbRefs.playerResources.set({ name, count });
        alert('Player resources updated.');
    };

    uiElements.createCustomCommandButton.onclick = () => {
        const name = uiElements.customCommandNameInput.value.trim().toLowerCase();
        const args = uiElements.customCommandArgsInput.value.trim();
        const response = uiElements.customCommandResponseInput.value;
        const consumesResource = uiElements.commandConsumesResourceCheckbox.checked;
        if (!name || !response) {
            alert('Command name and response cannot be empty.');
            return;
        }
        const command = { response, consumesResource };
        if (args) command.args = args;
        appState.dbRefs.customCommands.child(name).set(command);
    };

    uiElements.createDecryptCommandButton.onclick = () => {
        const name = uiElements.specialCommandNameInput.value.trim().toLowerCase();
        if (!name) {
            alert('Special command name cannot be empty.');
            return;
        }
        appState.dbRefs.customCommands.child(name).set({
            special_action: 'bruteforce_decrypt',
            consumesResource: true
        });
    };

    uiElements.createTraceCommandButton.onclick = () => {
        const name = uiElements.traceCommandNameInput.value.trim().toLowerCase();
        const response = uiElements.traceCommandResponseInput.value;
        if (!name || !response) {
            alert('Trace command name and response cannot be empty.');
            return;
        }
        appState.dbRefs.customCommands.child(name).set({
            special_action: 'trace_signal',
            response: response,
            consumesResource: true
        });
    };

    uiElements.scrambleMessageButton.onclick = () => {
        appState.dbRefs.glitches.child('scramble_next').set(true);
        alert('Next message will be scrambled.');
    };

    uiElements.glitchCommandButton.onclick = () => {
        const commandToGlitch = uiElements.glitchCommandSelect.value;
        appState.dbRefs.glitches.child('glitched_command').set(commandToGlitch);
        alert(`Command '${commandToGlitch}' will now appear offline for the player for 30 seconds.`);

        // Set a timer to remove the glitch after 30 seconds
        setTimeout(() => {
            appState.dbRefs.glitches.child('glitched_command').remove();
        }, 30000);
    };


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

    // System Override Listeners
    uiElements.triggerLockoutButton.onclick = () => {
        appState.dbRefs.glitches.child('override_state').set({
            type: 'lockout',
            message: 'SYSTEM LOCKOUT IN EFFECT'
        });
    };

    uiElements.triggerWarningButton.onclick = () => {
        const message = uiElements.customWarningInput.value.trim() || 'SECURITY ALERT: UNUSUAL ACTIVITY DETECTED';
        appState.dbRefs.glitches.child('override_state').set({
            type: 'warning',
            message: message
        });
    };

    uiElements.clearOverrideButton.onclick = () => {
        appState.dbRefs.glitches.child('override_state').remove();
    };

    // Decryption Key Listeners
    uiElements.unlockAllButton.onclick = () => {
        if (!confirm('Are you sure you want to unlock all decryption keys for the player?')) return;
        const updates = {};
        const allChars = Object.keys(appState.encodingChart);
        allChars.forEach(char => {
            updates[char] = true;
        });
        appState.dbRefs.keys.update(updates);
    };

    uiElements.lockAllButton.onclick = () => {
        if (!confirm('Are you sure you want to lock all decryption keys for the player?')) return;
        appState.dbRefs.keys.remove();
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
        handleSvgUpload((svgContent, originalFileName) => {
            let newFileName = uiElements.svgFileNameInput.value.trim();
            if (!newFileName) {
                newFileName = originalFileName;
            }

            if (newFileName.toLowerCase().includes('.')) {
                newFileName = newFileName.substring(0, newFileName.lastIndexOf('.')) + '.kohd';
            } else {
                newFileName = newFileName + '.kohd';
            }

            const safeFileName = newFileName.replace(/\./g, '·');
            const accessLevel = parseInt(uiElements.fileAccessLevelSelect.value, 10);
            appState.dbRefs.fileSystem.child(safeFileName).set({
                content: svgContent,
                level: accessLevel,
                isSvg: true
            });
            alert(`SVG file "${newFileName}" created successfully.`);
            uiElements.svgFileInput.value = '';
            uiElements.svgFileNameInput.value = '';
        });
    };


    uiElements.sendSvgDatastreamButton.onclick = () => {
        handleSvgUpload((svgContent) => {
            // THIS is the corrected line.
            const finalBurst = `SVG::${svgContent}`;
            uiElements.outputBurst.textContent = "SVG Datastream Sent";
            transmitDatastream(finalBurst);
            uiElements.svgFileInput.value = '';
            uiElements.svgFileNameInput.value = '';
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

    uiElements.resetPasswordButton.onclick = () => {
        const username = uiElements.resetUserSelect.value;
        const newPassword = uiElements.resetNewPasswordInput.value.trim();

        if (!username || username === 'Select a user...') {
            alert('Please select a user.');
            return;
        }
        if (!newPassword) {
            alert('Please enter a new password.');
            return;
        }

        // Update the password in Firebase
        appState.dbRefs.users.child(username).child('password').set(newPassword)
            .then(() => {
                alert(`Password for "${username}" has been successfully updated.`);
                uiElements.resetNewPasswordInput.value = '';
                uiElements.resetUserSelect.selectedIndex = 0;
            })
            .catch((error) => {
                alert('An error occurred while resetting the password.');
                console.error('Password reset error:', error);
            });
    };

    // File Edit Modal Listeners
    uiElements.editModalCancel.onclick = () => {
        uiElements.fileEditModal.style.display = 'none';
        uiElements.editModalSave.removeAttribute('data-editing-file');
    };

    uiElements.editModalSave.onclick = () => {
        const originalSafeName = uiElements.editModalSave.getAttribute('data-editing-file');
        if (!originalSafeName) return;

        const newFileName = uiElements.editModalFileName.value.trim();
        if (!newFileName) {
            alert('Filename cannot be empty.');
            return;
        }

        const newSafeName = newFileName.replace(/\./g, '·');
        const newContent = uiElements.editModalTextarea.value;
        const newLevel = parseInt(uiElements.editModalAccessLevel.value, 10);

        appState.dbRefs.fileSystem.child(originalSafeName).once('value', (snapshot) => {
            const originalData = snapshot.val();
            if (!originalData) {
                alert('Error: Original file not found!');
                return;
            }

            const updatedFile = {
                ...originalData,
                content: newContent,
                level: newLevel,
            };

            if (originalSafeName === newSafeName) {
                appState.dbRefs.fileSystem.child(originalSafeName).update(updatedFile);
            } else {
                appState.dbRefs.fileSystem.child(newSafeName).set(updatedFile);
                appState.dbRefs.fileSystem.child(originalSafeName).remove();
            }

            uiElements.fileEditModal.style.display = 'none';
            uiElements.editModalSave.removeAttribute('data-editing-file');
        });
    };

    displayPresets();
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
        const isChecked = keys && keys[char] === true;
        const switchWrapper = document.createElement('div');
        switchWrapper.className = 'key-switch';
        switchWrapper.innerHTML = `
            <label class="switch">
                <input type="checkbox" id="key-${char}" ${isChecked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <label for="key-${char}">${char}</label>`;
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

            const textSpan = document.createElement('span');
            textSpan.style.flexGrow = '1';
            let displayText = originalFileName;

            if (fileData.isSvg) {
                let baseName = originalFileName.split('.').slice(0, -1).join('.') || originalFileName;
                displayText = baseName + '.kohd';
            }

            if (fileData.level > 1) {
                li.classList.add('locked');
                displayText += ` [LEVEL ${fileData.level}]`;
            }
            textSpan.textContent = displayText;
            li.appendChild(textSpan);

            const buttonContainer = document.createElement('div');

            const editButton = document.createElement('button');
            editButton.textContent = 'View/Edit';
            editButton.onclick = () => {
                uiElements.editModalTitle.textContent = `Editing File`;
                uiElements.editModalFileName.value = fileData.isSvg ? displayText.split(' ')[0] : originalFileName;
                uiElements.editModalAccessLevel.value = fileData.level;
                uiElements.editModalTextarea.value = fileData.content;
                uiElements.fileEditModal.style.display = 'block';
                uiElements.editModalSave.setAttribute('data-editing-file', safeFileName);
            };
            buttonContainer.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'secondary';
            deleteButton.onclick = () => {
                if (confirm(`Are you sure you want to delete ${originalFileName}?`)) {
                    appState.dbRefs.fileSystem.child(safeFileName).remove();
                }
            };
            buttonContainer.appendChild(deleteButton);

            li.appendChild(buttonContainer);
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
    uiElements.resetUserSelect.innerHTML = ''; // Clear the dropdown first

    if (users) {
        // Add a default, disabled option to the dropdown
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select a user...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        uiElements.resetUserSelect.appendChild(defaultOption);

        Object.keys(users).forEach(username => {
            // This part populates the existing user list
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

            // This new part populates the password reset dropdown
            const option = document.createElement('option');
            option.value = username;
            option.textContent = username;
            uiElements.resetUserSelect.appendChild(option);
        });
    }
}

function handleSystemOverride(override) {
    const overlay = document.getElementById('system-override-overlay');
    if (!overlay) {
        return;
    }

    if (override) {
        overlay.textContent = override.message;
        overlay.className = override.type;
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
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
    displayHistory,
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