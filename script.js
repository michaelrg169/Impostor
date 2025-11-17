document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appContainer = document.getElementById('app');
    const homeScreen = document.getElementById('home-screen');
    const configScreen = document.getElementById('config-screen');
    const roleRevealScreen = document.getElementById('role-reveal-screen');
    const customizeScreen = document.getElementById('customize-screen');
    const debateScreen = document.getElementById('debate-screen');
    const voteScreen = document.getElementById('vote-screen');
    const resultsScreen = document.getElementById('results-screen'); // New

    const showConfigBtn = document.getElementById('show-config-btn');
    const backToHomeFromConfigBtn = document.getElementById('back-to-home-from-config-btn');

    // Settings Dropdown Elements
    const settingsMenuBtn = document.getElementById('settings-menu-btn');
    const settingsDropdownContent = document.getElementById('settings-dropdown-content');
    const dropdownNewGameBtn = document.getElementById('dropdown-new-game-btn');
    const dropdownCustomizeWordsBtn = document.getElementById('dropdown-customize-words-btn');
    const dropdownRevealImpostorBtn = document.getElementById('dropdown-reveal-impostor-btn');

    const playAgainFromResultsBtn = document.getElementById('play-again-from-results-btn');

    const numPlayersInput = document.getElementById('num-players');
    const numImpostorsInput = document.getElementById('num-impostors');
    const playerNamesContainer = document.getElementById('player-names-container');
    const startGameBtn = document.getElementById('start-game-btn');

    const currentPlayerTitle = document.getElementById('current-player-title');
    const roleImage = document.getElementById('role-image');
    const revealMessage = document.getElementById('reveal-message');
    const revealRoleBtn = document.getElementById('reveal-role-btn');
    const roleInfoDiv = document.getElementById('role-info');
    const roleNameH3 = document.getElementById('role-name');
    const roleWordP = document.getElementById('role-word');
    const roleInstructionP = document.querySelector('.role-instruction');
    const nextPlayerBtn = document.getElementById('next-player-btn');

    // Debate Screen Elements
    const debateStarterInfo = document.getElementById('debate-starter-info'); // New
    const timerDisplay = document.getElementById('timer');                   // New
    const startDebateBtn = document.getElementById('start-debate-btn');       // New
    const voteBtn = document.getElementById('vote-btn');                     // New

    // Vote Screen Elements
    const voteOptionsContainer = document.getElementById('vote-options-container'); // New
    const voteResult = document.getElementById('vote-result');                     // New
    const voteResultMessage = document.getElementById('vote-result-message');       // New
    const nextRoundBtn = document.getElementById('next-round-btn');                 // New
    const playAgainBtn = document.getElementById('play-again-btn');                 // New

    // Results Screen Elements
    const finalResultMessage = document.getElementById('final-result-message');     // New
    const finalWordInfo = document.getElementById('final-word-info');               // New

    const wordsTableBody = document.querySelector('#words-table tbody');
    const addWordRowBtn = document.getElementById('add-word-row-btn');
    const saveWordsBtn = document.getElementById('save-words-btn');
    const cancelCustomizeBtn = document.getElementById('cancel-customize-btn');

    // --- Game State Variables ---
    let gameSettings = {};
    let roles = []; // Stores assigned roles for all players
    let playerNames = []; // Stores all player names
    let activePlayers = []; // Stores indices of players still in the game
    let currentPlayerIndex = 0; // Index for role revelation
    let currentWordPair = null;
    let customWordPairs = []; // Will be loaded from localStorage
    let timerInterval; // For debate timer
    let impostorPlayerIndex = -1; // Store the index of the impostor

    const DEFAULT_WORD_PAIRS = [
        { civil: "Perro", impostor: "Gato" },
        { civil: "Casa", impostor: "Edificio" },
        { civil: "Árbol", impostor: "Planta" },
        { civil: "Coche", impostor: "Bicicleta" },
        { civil: "Sol", impostor: "Luna" },
        { civil: "Agua", impostor: "Hielo" },
        { civil: "Libro", impostor: "Revista" },
        { civil: "Café", impostor: "Té" },
        { civil: "Teléfono", impostor: "Radio" },
        { civil: "Música", impostor: "Ruido" },
        { civil: "Arepa", impostor: "Harina PAN" },
        { civil: "Cachapa", impostor: "Jojoto" },
        { civil: "Hallaca", impostor: "Navidad" },
        { civil: "Tequeño", impostor: "Queso" },
        { civil: "Pabellón", impostor: "Caraotas" },
        { civil: "Guayaba", impostor: "Fruta" },
        { civil: "Cotufa", impostor: "Cine" },
        { civil: "Patilla", impostor: "Sandía" },
        { civil: "Chamo", impostor: "Pana" },
        { civil: "Chevere", impostor: "Fino" },
        { civil: "Coroto", impostor: "Cosa" },
        { civil: "Burda", impostor: "Mucho" }
    ];

    // --- Persistence (localStorage) ---
    function loadWordPairs() {
        const storedWords = localStorage.getItem('impostorGameCustomWords');
        if (storedWords) {
            try {
                customWordPairs = JSON.parse(storedWords);
            } catch (e) {
                console.error("Error parsing custom words from localStorage:", e);
                customWordPairs = []; // Fallback to empty if corrupted
            }
        } else {
            customWordPairs = []; // No custom words yet
        }
        // Ensure default words are always available if no custom ones are set
        if (customWordPairs.length === 0) {
            return DEFAULT_WORD_PAIRS;
        }
        return customWordPairs;
    }

    function saveWordPairs(words) {
        localStorage.setItem('impostorGameCustomWords', JSON.stringify(words));
        customWordPairs = words; // Update in-memory list
        alert("¡Palabras guardadas con éxito!");
    }

    // --- Screen Management ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // --- Utility Functions ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    // --- Game Logic ---
    function updatePlayerNameInputs() {
        const numPlayers = parseInt(numPlayersInput.value);
        playerNamesContainer.innerHTML = ''; // Clear existing inputs

        for (let i = 1; i <= numPlayers; i++) {
            const div = document.createElement('div');
            div.className = 'setting';
            div.innerHTML = `
                <label for="player-${i}">Nombre Jugador ${i}:</label>
                <input type="text" id="player-${i}" class="player-name-input" value="Jugador ${i}">
            `;
            playerNamesContainer.appendChild(div);
        }
    }

    function assignRoles(numPlayers, numImpostors) {
        roles = [];
        // Assign Impostors
        for (let i = 0; i < numImpostors; i++) {
            roles.push("Impostor");
        }
        // Assign Civilians
        const numCivils = numPlayers - roles.length;
        for (let i = 0; i < numCivils; i++) {
            roles.push("Civil");
        }
        shuffleArray(roles);
        console.log("Roles Asignados:", roles);

        // Store impostor's original index
        impostorPlayerIndex = roles.findIndex(role => role === "Impostor");
    }

    function selectWordPair() {
        const availableWords = loadWordPairs(); // Use custom words if available
        if (availableWords.length === 0) {
            alert("No hay palabras disponibles. Por favor, añade algunas en 'Personalizar Palabras'.");
            return null;
        }
        currentWordPair = availableWords[getRandomInt(availableWords.length)];
        return currentWordPair;
    }

    function startGame() {
        const numPlayers = parseInt(numPlayersInput.value);
        const numImpostors = parseInt(numImpostorsInput.value);

        playerNames = Array.from(document.querySelectorAll('.player-name-input')).map(input => input.value.trim());

        if (playerNames.some(name => name === "")) {
            alert("Por favor, ingresa el nombre para todos los jugadores.");
            return;
        }
        if (numPlayers < 3 || numImpostors < 1 || numImpostors >= numPlayers) {
            alert("Ajustes inválidos. Asegúrate de tener al menos 3 jugadores, al menos 1 impostor, y menos impostores que jugadores.");
            return;
        }

        gameSettings = { numPlayers, numImpostors };
        const selectedWordPair = selectWordPair();
        if (!selectedWordPair) return; // If no words, stop game start

        assignRoles(numPlayers, numImpostors);
        currentPlayerIndex = 0;
        activePlayers = Array.from({ length: playerNames.length }, (_, i) => i); // Initialize activePlayers here

        setupRoleRevealForPlayer();
        showScreen('role-reveal-screen');
        updateSettingsMenuState(); // Call to update button state
    }

    function setupRoleRevealForPlayer() {
        currentPlayerTitle.textContent = playerNames[currentPlayerIndex];
        roleImage.src = "images/1.png"; // Use a generic image from the provided range
        revealMessage.style.display = 'block';
        revealRoleBtn.style.display = 'block';
        roleInfoDiv.classList.add('hidden');
        nextPlayerBtn.style.display = 'none';
    }

    function revealRole() {
        const role = roles[currentPlayerIndex];
        let roleText = "";
        let wordText = "";
        let instructionText = "";
        let imageSrc = "";
        let textColorClass = ""; // For dynamic text color if needed

        switch (role) {
            case "Civil":
                roleText = "Civil";
                wordText = `Tu palabra es: "${currentWordPair.civil}"`;
                instructionText = "Da pistas reales sin revelar la palabra secreta a nadie.";
                imageSrc = "images/2.png"; // Placeholder for Civil image (e.g., a generic civil image)
                textColorClass = "civil-color"; // Define in CSS
                break;
            case "Impostor":
                roleText = "Impostor";
                wordText = `Tu pista es: "${currentWordPair.impostor}"`;
                instructionText = "¡Eres el Impostor! Tu palabra es diferente. Debes improvisar y descubrir la palabra del Civil.";
                imageSrc = "images/3.png"; // Placeholder for Impostor image
                textColorClass = "impostor-color"; // Define in CSS
                break;
            // Add Mr. White if implemented
            default:
                roleText = "Desconocido";
                wordText = "";
                instructionText = "Error en la asignación de rol.";
                imageSrc = "images/4.png"; // Generic error/default image
        }

        roleNameH3.textContent = roleText;
        roleNameH3.className = textColorClass; // Apply class for styling
        roleWordP.innerHTML = wordText;
        roleInstructionP.textContent = instructionText;
        roleImage.src = imageSrc;

        revealMessage.style.display = 'none';
        revealRoleBtn.style.display = 'none';
        roleInfoDiv.classList.remove('hidden');
        nextPlayerBtn.style.display = 'block';
    }

    function moveToNextPlayer() {
        currentPlayerIndex++;
        if (currentPlayerIndex < playerNames.length) {
            setupRoleRevealForPlayer();
        } else {
            // All roles have been assigned, move to debate screen
            setupDebateScreen();
            showScreen('debate-screen');
        }
    }

    // --- Debate Logic ---
    let debateTimerSeconds = 0; // Global variable to hold remaining seconds

    function setupDebateScreen() {
        // Reset timer display
        timerDisplay.textContent = "02:00"; // 2 minutes per player
        startDebateBtn.classList.remove('hidden');
        voteBtn.classList.add('hidden');

        // Select a random player from activePlayers to start the debate
        const startingPlayerIndex = activePlayers[getRandomInt(activePlayers.length)]; // Select from active players

        // activePlayers should NOT be re-initialized here. It's managed by handleVote.
    }

    function startDebateTimer(durationInSeconds) {
        debateTimerSeconds = durationInSeconds; // Set initial duration

        if (timerInterval) clearInterval(timerInterval); // Clear any existing timer

        timerInterval = setInterval(() => {
            debateTimerSeconds--;
            timerDisplay.textContent = formatTime(debateTimerSeconds);

            if (debateTimerSeconds <= 0) {
                clearInterval(timerInterval);
                alert("¡Tiempo Agotado! Pasen a la Votación.");
                // Automatically trigger voting if time runs out
                showVotingScreen();
            }
        }, 1000);
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function resetGame() {
        if (!confirm("¿Estás seguro de que quieres iniciar una nueva partida? Se perderá todo el progreso actual.")) {
            return; // User cancelled
        }

        gameSettings = {};
        roles = [];
        playerNames = [];
        activePlayers = [];
        currentPlayerIndex = 0;
        currentWordPair = null;
        if (timerInterval) clearInterval(timerInterval);
        impostorPlayerIndex = -1;

        // Reset UI elements
        numPlayersInput.value = 4;
        numImpostorsInput.value = 1;
        updatePlayerNameInputs(); // Reset player name inputs
        showScreen('home-screen');
        updateSettingsMenuState(); // Call to update button state
    }

    // --- UI State Management ---
    function updateSettingsMenuState() {
        const gameInProgress = playerNames.length > 0 && impostorPlayerIndex !== -1;

        if (gameInProgress) {
            dropdownRevealImpostorBtn.removeAttribute('disabled');
            dropdownRevealImpostorBtn.classList.remove('disabled-button'); // Add a CSS class for styling disabled state
        } else {
            dropdownRevealImpostorBtn.setAttribute('disabled', 'true');
            dropdownRevealImpostorBtn.classList.add('disabled-button');
        }
    }

    // --- Voting Logic ---
    function showVotingScreen() {
        if (timerInterval) clearInterval(timerInterval); // Stop any active timer
        showScreen('vote-screen');
        voteOptionsContainer.innerHTML = ''; // Clear previous buttons
        voteResult.classList.add('hidden');
        nextRoundBtn.classList.add('hidden');
        playAgainBtn.classList.add('hidden');

        // Ensure voteOptionsContainer is visible
        voteOptionsContainer.classList.remove('hidden'); // Explicitly make it visible

        if (activePlayers.length === 0) {
            alert("Error: No hay jugadores activos para votar. Por favor, inicia una nueva partida.");
            resetGame(); // Force a reset if state is invalid
            return;
        }

        activePlayers.forEach(playerIndex => {
            const button = document.createElement('button');
            button.textContent = playerNames[playerIndex];
            button.classList.add('vote-btn');
            button.addEventListener('click', () => handleVote(playerIndex));
            voteOptionsContainer.appendChild(button);
        });
    }

    function handleVote(votedPlayerOriginalIndex) {
        // Find the role of the voted player using their original index
        const votedPlayerRole = roles[votedPlayerOriginalIndex];
        const votedPlayerName = playerNames[votedPlayerOriginalIndex];

        voteOptionsContainer.classList.add('hidden'); // Hide vote buttons
        voteResult.classList.remove('hidden'); // Show result area

        if (votedPlayerRole === "Impostor") {
            // Civilians win!
            finalResultMessage.textContent = `¡Correcto! ${votedPlayerName} era el Impostor. ¡Los Civiles ganan!`;
            finalResultMessage.style.color = '#4CAF50'; // Green for win
            finalWordInfo.classList.remove('hidden');
            finalWordInfo.innerHTML = `Palabra clave: "${currentWordPair.civil}"<br>Pista del Impostor: "${currentWordPair.impostor}"`;
            showScreen('results-screen');
        } else {
            // Voted a Civil
            voteResultMessage.textContent = `¡Incorrecto! ${votedPlayerName} era un Civil. El Impostor sigue entre ustedes.`;
            voteResultMessage.style.color = '#f44336'; // Red for incorrect vote

            // Remove the eliminated civil from active players
            activePlayers = activePlayers.filter(index => index !== votedPlayerOriginalIndex);

            // Check win condition for Impostor (only 2 players left)
            if (activePlayers.length <= 2) {
                finalResultMessage.textContent = `¡El Impostor ha ganado! Solo quedan ${activePlayers.length} jugadores.`;
                finalResultMessage.style.color = '#f44336'; // Red for loss
                finalWordInfo.classList.remove('hidden');
                finalWordInfo.innerHTML = `Palabra clave: "${currentWordPair.civil}"<br>Pista del Impostor: "${currentWordPair.impostor}"`;
                showScreen('results-screen');
            } else {
                // Continue to next round
                nextRoundBtn.classList.remove('hidden');
            }
        }
    }

    // --- Word Customization Logic ---
    function renderWordTable() {
        wordsTableBody.innerHTML = ''; // Clear existing rows
        const wordsToDisplay = loadWordPairs();

        if (wordsToDisplay.length === 0) {
            const noWordsRow = wordsTableBody.insertRow();
            const cell = noWordsRow.insertCell();
            cell.colSpan = 3;
            cell.textContent = "No hay palabras personalizadas. Añade algunas o se usarán las predeterminadas.";
            cell.style.textAlign = "center";
            return;
        }

        wordsToDisplay.forEach((pair, index) => {
            const row = wordsTableBody.insertRow();
            row.innerHTML = `
                <td contenteditable="true">${pair.civil}</td>
                <td contenteditable="true">${pair.impostor}</td>
                <td><button class="delete-row-btn" data-index="${index}">🗑️</button></td>
            `;
        });

        document.querySelectorAll('.delete-row-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToDelete = parseInt(event.target.dataset.index);
                deleteWordRow(indexToDelete);
            });
        });
    }

    function addWordRow(civil = '', impostor = '') {
        const row = wordsTableBody.insertRow();
        row.innerHTML = `
            <td contenteditable="true">${civil}</td>
            <td contenteditable="true">${impostor}</td>
            <td><button class="delete-row-btn">🗑️</button></td>
        `;
        // Re-attach event listeners for all delete buttons after adding a new row
        document.querySelectorAll('.delete-row-btn').forEach(button => {
            button.onclick = (event) => {
                event.target.closest('tr').remove(); // Remove the parent row
                // Re-render table to update data-index attributes if needed, or just save
            };
        });
    }

    function deleteWordRow(index) {
        const currentWords = loadWordPairs();
        currentWords.splice(index, 1); // Remove word at index
        saveWordPairs(currentWords);
        renderWordTable(); // Re-render to reflect changes and update indices
    }

    function saveCustomWords() {
        const newWords = [];
        const rows = wordsTableBody.querySelectorAll('tr');
        let hasError = false;

        rows.forEach(row => {
            const civilCell = row.children[0];
            const impostorCell = row.children[1];
            const civilWord = civilCell.textContent.trim();
            const impostorHint = impostorCell.textContent.trim();

            if (civilWord && impostorHint) {
                newWords.push({ civil: civilWord, impostor: impostorHint });
            } else if (civilWord || impostorHint) {
                alert("Ambos campos (Palabra Clave y Pista) deben estar llenos en cada fila.");
                hasError = true;
            }
        });

        if (hasError) return;
        if (newWords.length === 0) {
            alert("Debes tener al menos un par de palabras (Civil y Pista).");
            return;
        }

        saveWordPairs(newWords);
        showScreen('home-screen'); // Go back to home after saving
    }

    function revealImpostor() {
        if (playerNames.length === 0 || impostorPlayerIndex === -1) {
            alert("No hay una partida en curso para revelar al impostor.");
            return;
        }

        const impostorName = playerNames[impostorPlayerIndex];
        const impostorRole = roles[impostorPlayerIndex]; // Should be "Impostor"
        const civilWord = currentWordPair.civil;
        const impostorHint = currentWordPair.impostor;

        finalResultMessage.textContent = `¡El impostor ha sido revelado! Era ${impostorName}.`;
        finalResultMessage.style.color = '#f44336'; // Red color for revelation
        finalWordInfo.classList.remove('hidden');
        finalWordInfo.innerHTML = `Palabra clave: "${civilWord}"<br>Pista del Impostor: "${impostorHint}"`;

        // Clear any active timers
        if (timerInterval) clearInterval(timerInterval);

        showScreen('results-screen');
        settingsDropdownContent.classList.add('hidden'); // Close dropdown
        updateSettingsMenuState(); // Call to update button state
    }

    // --- Event Listeners ---
    // Settings Dropdown Toggle
    settingsMenuBtn.addEventListener('click', (event) => {
        settingsDropdownContent.classList.toggle('hidden');
        event.stopPropagation(); // Prevent document click from immediately closing
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!settingsDropdownContent.contains(event.target) && !settingsMenuBtn.contains(event.target)) {
            settingsDropdownContent.classList.add('hidden');
        }
    });

    showConfigBtn.addEventListener('click', () => {
        updatePlayerNameInputs(); // Ensure inputs are correct for default players
        showScreen('config-screen');
    });
    // Removed: showCustomizeBtn.addEventListener('click', ...);

    backToHomeFromConfigBtn.addEventListener('click', () => resetGame()); // Still needed for config screen

    // Dropdown menu item listeners
    dropdownNewGameBtn.addEventListener('click', () => resetGame());
    dropdownCustomizeWordsBtn.addEventListener('click', () => {
        renderWordTable();
        showScreen('customize-screen');
        settingsDropdownContent.classList.add('hidden'); // Close dropdown after click
    });
    dropdownRevealImpostorBtn.addEventListener('click', () => {
        revealImpostor();
    });

    playAgainFromResultsBtn.addEventListener('click', () => resetGame()); // Still needed for results screen


    numPlayersInput.addEventListener('input', updatePlayerNameInputs);
    numImpostorsInput.addEventListener('input', () => {
        // Ensure impostor count doesn't exceed player count - 1
        const numPlayers = parseInt(numPlayersInput.value);
        let numImpostors = parseInt(numImpostorsInput.value);
        if (numImpostors >= numPlayers) {
            numImpostorsInput.value = numPlayers - 1;
        }
        if (numImpostors < 1) {
            numImpostorsInput.value = 1;
        }
    });

    startGameBtn.addEventListener('click', startGame);

    revealRoleBtn.addEventListener('click', revealRole);
    nextPlayerBtn.addEventListener('click', moveToNextPlayer);

    // Debate screen buttons
    startDebateBtn.addEventListener('click', () => {
        startDebateBtn.classList.add('hidden');
        voteBtn.classList.remove('hidden');
        startDebateTimer(120); // 2 minutes = 120 seconds
    });
    voteBtn.addEventListener('click', () => {
        if (timerInterval) clearInterval(timerInterval); // Stop debate timer
        showVotingScreen();
    });

    addWordRowBtn.addEventListener('click', () => addWordRow());
    saveWordsBtn.addEventListener('click', saveCustomWords);
    cancelCustomizeBtn.addEventListener('click', () => showScreen('home-screen'));

    // Initial setup
    showScreen('home-screen');
    loadWordPairs(); // Load custom words on startup
    updateSettingsMenuState(); // Set initial state of settings menu buttons

    // Add nextRoundBtn listener once
    nextRoundBtn.addEventListener('click', () => {
        setupDebateScreen(); // Restart debate with remaining players
        showScreen('debate-screen');
    });
});