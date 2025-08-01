// js/state.js

// This object will hold the shared state of the application,
// allowing different modules to access and modify data consistently.
const appState = {
    // Firebase database object, initialized in main.js
    database: null,
    // References to specific database paths for easy access
    dbRefs: {},
    // Configuration for the player terminal (theme, system names, etc.)
    terminalConfig: {},
    // The current cipher key for encoding/decoding messages
    encodingChart: {},
    // State of the decryption keys the player has unlocked
    decryptionKeys: {},
    // The virtual file system presented to the player
    fileSystem: {},
    // Active glitches or system overrides
    glitches: {},
    // Passwords for different access levels
    accessPasswords: {},
    // Custom commands created by the GM
    customCommands: {},
    // Player-specific resources (e.g., Exploits)
    playerResources: { name: "Resources", count: 0 },
    // List of registered user accounts for the player terminal
    users: {},
    // Default encoding chart as a fallback
    defaultEncodingChart: { 'A': '<>', 'B': '<%', 'C': '<^', 'D': '<&', 'E': '<*', 'F': '<-', 'G': '<+', 'H': '<@', 'I': '><', 'J': '>%', 'K': '>^', 'L': '>&', 'M': '>*', 'N': '>-', 'O': '>+', 'P': '>@', 'Q': '%<', 'R': '%>', 'S': '%^', 'T': '%&', 'U': '%*', 'V': '%-', 'W': '%+', 'X': '%@', 'Y': '^<', 'Z': '^>', '0': '^%', '1': '^&', '2': '^*', '3': '^-', '4': '^+', '5': '^@', '6': '&<', '7': '&>', '8': '&%', '9': '&^' },
    // Local storage key for GM message history
    GM_HISTORY_KEY: 'gmMessageHistory',
    // Local storage key for saved configuration presets
    CONFIG_PRESETS_KEY: 'gmConfigPresets'
};

// We export the state to be used by other modules.
// Using ES6 modules makes dependencies clear and manageable.
export { appState };