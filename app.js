// Pokemon Type Guesser Application

// State
let attacks = [];
let possibleSingleTypes = [];
let possibleDualTypes = [];
let savedPokemon = [];

// Type names mapping (for display)
const typeNames = {
    bug: 'Bicho',
    dark: 'Siniestro',
    dragon: 'Dragón',
    electric: 'Eléctrico',
    fairy: 'Hada',
    fighting: 'Lucha',
    fire: 'Fuego',
    flying: 'Volador',
    ghost: 'Fantasma',
    grass: 'Planta',
    ground: 'Tierra',
    ice: 'Hielo',
    normal: 'Normal',
    poison: 'Veneno',
    psychic: 'Psíquico',
    rock: 'Roca',
    steel: 'Acero',
    water: 'Agua'
};

// Effectiveness labels
const effectivenessLabels = {
    0: { label: 'Neutral', class: 'neutral' },
    1: { label: 'Muy eficaz', class: 'very-effective' },
    2: { label: 'Poco eficaz', class: 'resistant' },
    3: { label: 'Inmune', class: 'immune' }
};

// Initialize
function init() {
    loadFromLocalStorage();
    populateTypeSelects();
    updatePossibleTypes();
    renderAttackHistory();
    renderSavedPokemon();
    renderTypeReference();
    setupEventListeners();
}

// Populate type select dropdowns
function populateTypeSelects() {
    const attackTypeSelect = document.getElementById('attackType');
    const confirmedType1 = document.getElementById('confirmedType1');
    const confirmedType2 = document.getElementById('confirmedType2');
    
    const types = Object.keys(TypeChart);
    
    types.forEach(type => {
        const displayName = typeNames[type] || type;
        
        // Attack type select
        const option1 = document.createElement('option');
        option1.value = type;
        option1.textContent = displayName;
        attackTypeSelect.appendChild(option1);
        
        // Confirmed type 1
        const option2 = document.createElement('option');
        option2.value = type;
        option2.textContent = displayName;
        confirmedType1.appendChild(option2);
        
        // Confirmed type 2
        const option3 = document.createElement('option');
        option3.value = type;
        option3.textContent = displayName;
        confirmedType2.appendChild(option3);
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('attackForm').addEventListener('submit', handleAttackSubmit);
    document.getElementById('saveForm').addEventListener('submit', handleSaveSubmit);
    document.getElementById('clearAttacks').addEventListener('click', clearAttacks);
    document.getElementById('clearSaved').addEventListener('click', clearSavedPokemon);
}

// Handle attack form submission
function handleAttackSubmit(e) {
    e.preventDefault();
    
    const attackType = document.getElementById('attackType').value;
    const effectiveness = document.querySelector('input[name="effectiveness"]:checked')?.value;
    
    if (!attackType || effectiveness === undefined) {
        alert('Por favor, selecciona un tipo de ataque y su efectividad.');
        return;
    }
    
    // Add attack to history
    attacks.push({
        type: attackType,
        effectiveness: parseInt(effectiveness),
        timestamp: Date.now()
    });
    
    // Reset form
    document.getElementById('attackType').value = '';
    document.querySelectorAll('input[name="effectiveness"]').forEach(r => r.checked = false);
    
    // Update UI
    updatePossibleTypes();
    renderAttackHistory();
    saveToLocalStorage();
}

// Update possible types based on attacks
function updatePossibleTypes() {
    const allTypes = Object.keys(TypeChart);
    
    // Calculate possible single types
    possibleSingleTypes = allTypes.filter(type => {
        return attacks.every(attack => {
            const damageTaken = TypeChart[type].damageTaken[capitalize(attack.type)];
            return damageTaken === attack.effectiveness;
        });
    });
    
    // Calculate possible dual types
    possibleDualTypes = [];
    for (let i = 0; i < allTypes.length; i++) {
        for (let j = i + 1; j < allTypes.length; j++) {
            const type1 = allTypes[i];
            const type2 = allTypes[j];
            
            const isValid = attacks.every(attack => {
                const damage1 = TypeChart[type1].damageTaken[capitalize(attack.type)];
                const damage2 = TypeChart[type2].damageTaken[capitalize(attack.type)];
                const combinedEffectiveness = combineEffectiveness(damage1, damage2);
                return combinedEffectiveness === attack.effectiveness;
            });
            
            if (isValid) {
                possibleDualTypes.push([type1, type2]);
            }
        }
    }
    
    renderPossibleTypes();
}

// Combine effectiveness for dual types
function combineEffectiveness(eff1, eff2) {
    // Si alguno es inmune, resultado es inmune
    if (eff1 === 3 || eff2 === 3) return 3;
    // Convertir a multiplicador
    const mult1 = eff1 === 1 ? 2 : eff1 === 2 ? 0.5 : 1;
    const mult2 = eff2 === 1 ? 2 : eff2 === 2 ? 0.5 : 1;
    const total = mult1 * mult2;
    if (total > 1) return 1; // Muy eficaz
    if (total < 1) return 2; // Resistente
    return 0; // Neutro
}

// Render possible types
function renderPossibleTypes() {
    const container = document.getElementById('possibleTypes');
    const countBadge = document.getElementById('possibleCount');
    const singleTypeSection = document.getElementById('singleTypeSection');
    const dualTypeSection = document.getElementById('dualTypeSection');
    
    container.innerHTML = '';
    
    const allTypes = Object.keys(TypeChart);
    
    // Get all types that appear in possible dual type combinations
    const typesInDualCombos = new Set();
    possibleDualTypes.forEach(([t1, t2]) => {
        typesInDualCombos.add(t1);
        typesInDualCombos.add(t2);
    });
    
    // Show all types with visual indication of their status
    allTypes.forEach(type => {
        const isSinglePossible = possibleSingleTypes.includes(type);
        const isInDualCombo = typesInDualCombos.has(type);
        const isPossible = isSinglePossible || isInDualCombo;
        
        const badge = document.createElement('div');
        badge.className = `type-badge type-${type} possible-type ${!isPossible && attacks.length > 0 ? 'eliminated' : ''}`;
        
        // Add indicator for types that are only in dual combos
        if (!isSinglePossible && isInDualCombo && attacks.length > 0) {
            badge.style.border = '3px dashed #fff';
            badge.title = 'Este tipo solo aparece en combinaciones duales';
        }
        
        badge.textContent = typeNames[type] || type;
        container.appendChild(badge);
    });
    
    // Update count
    const totalPossible = possibleSingleTypes.length + possibleDualTypes.length;
    countBadge.textContent = totalPossible;
    
    // Show single type identification if only one possible
    const singleTypeTitle = singleTypeSection.querySelector('h6');
    const singleTypeText = singleTypeSection.querySelector('p');
    
    if (possibleSingleTypes.length === 1 && attacks.length > 0) {
        singleTypeSection.classList.remove('d-none');
        const identifiedType = document.getElementById('identifiedSingleType');
        const type = possibleSingleTypes[0];
        identifiedType.className = `type-badge-large type-${type}`;
        identifiedType.textContent = typeNames[type] || type;
        
        // Check if there are also dual type possibilities
        if (possibleDualTypes.length > 0) {
            singleTypeTitle.textContent = '🔍 ¡Tipo parcialmente identificado!';
            singleTypeText.textContent = 'El Pokémon tiene al menos este tipo (podría tener un segundo tipo):';
        } else {
            singleTypeTitle.textContent = '🎉 ¡Tipo identificado!';
            singleTypeText.textContent = 'El Pokémon es de tipo único:';
        }
    } else {
        singleTypeSection.classList.add('d-none');
    }
    
    // Show dual type possibilities
    const dualTypesContainer = document.getElementById('identifiedDualTypes');
    dualTypesContainer.innerHTML = '';
    
    if (possibleDualTypes.length > 0 && possibleDualTypes.length <= 10) {
        dualTypeSection.classList.remove('d-none');
        possibleDualTypes.forEach(([type1, type2]) => {
            const combo = document.createElement('div');
            combo.className = 'dual-type-combo';
            combo.innerHTML = `
                <span class="type-badge type-${type1}">${typeNames[type1] || type1}</span>
                <span class="type-badge type-${type2}">${typeNames[type2] || type2}</span>
            `;
            dualTypesContainer.appendChild(combo);
        });
    } else if (possibleDualTypes.length > 10) {
        dualTypeSection.classList.remove('d-none');
        dualTypesContainer.innerHTML = `<p class="text-muted">Demasiadas combinaciones posibles (${possibleDualTypes.length})</p>`;
    } else {
        dualTypeSection.classList.add('d-none');
    }
}

// Render attack history
function renderAttackHistory() {
    const container = document.getElementById('attackHistory');
    const clearBtn = document.getElementById('clearAttacks');
    
    if (attacks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center fst-italic">No hay ataques registrados</p>';
        clearBtn.disabled = true;
        return;
    }
    
    clearBtn.disabled = false;
    container.innerHTML = '';
    
    // Show attacks in reverse order (newest first)
    [...attacks].reverse().forEach((attack, index) => {
        const effInfo = effectivenessLabels[attack.effectiveness];
        const item = document.createElement('div');
        item.className = `attack-item ${effInfo.class}`;
        item.innerHTML = `
            <div class="attack-item-info">
                <span class="type-badge type-${attack.type}">${typeNames[attack.type] || attack.type}</span>
                <span class="attack-effectiveness ${effInfo.class}">${effInfo.label}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeAttack(${attacks.length - 1 - index})">✕</button>
        `;
        container.appendChild(item);
    });
}

// Remove a specific attack
function removeAttack(index) {
    attacks.splice(index, 1);
    updatePossibleTypes();
    renderAttackHistory();
    saveToLocalStorage();
}

// Clear all attacks
function clearAttacks() {
    if (attacks.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres borrar todos los ataques registrados?')) {
        attacks = [];
        updatePossibleTypes();
        renderAttackHistory();
        saveToLocalStorage();
    }
}

// Handle save form submission
function handleSaveSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('pokemonName').value.trim();
    const type1 = document.getElementById('confirmedType1').value;
    const type2 = document.getElementById('confirmedType2').value;
    
    if (!name || !type1) {
        alert('Por favor, introduce el nombre y al menos un tipo.');
        return;
    }
    
    if (type1 === type2) {
        alert('Los dos tipos no pueden ser iguales.');
        return;
    }
    
    const pokemon = {
        name: name,
        type1: type1,
        type2: type2 || null,
        timestamp: Date.now()
    };
    
    savedPokemon.push(pokemon);
    
    // Reset form
    document.getElementById('pokemonName').value = '';
    document.getElementById('confirmedType1').value = '';
    document.getElementById('confirmedType2').value = '';
    
    renderSavedPokemon();
    saveToLocalStorage();
    
    alert(`¡${name} guardado correctamente!`);
}

// Render saved Pokemon
function renderSavedPokemon() {
    const container = document.getElementById('savedPokemon');
    
    if (savedPokemon.length === 0) {
        container.innerHTML = '<p class="text-muted text-center fst-italic">No hay Pokémon guardados</p>';
        return;
    }
    
    container.innerHTML = '';
    
    savedPokemon.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.className = 'saved-pokemon-card';
        card.innerHTML = `
            <div class="saved-pokemon-name">${pokemon.name}</div>
            <div class="saved-pokemon-types">
                <span class="saved-pokemon-type type-${pokemon.type1}">${typeNames[pokemon.type1] || pokemon.type1}</span>
                ${pokemon.type2 ? `<span class="saved-pokemon-type type-${pokemon.type2}">${typeNames[pokemon.type2] || pokemon.type2}</span>` : ''}
            </div>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="deleteSavedPokemon(${index})">🗑️ Eliminar</button>
        `;
        container.appendChild(card);
    });
}

// Delete saved Pokemon
function deleteSavedPokemon(index) {
    if (confirm('¿Eliminar este Pokémon guardado?')) {
        savedPokemon.splice(index, 1);
        renderSavedPokemon();
        saveToLocalStorage();
    }
}

// Clear all saved Pokemon
function clearSavedPokemon() {
    if (savedPokemon.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres borrar todos los Pokémon guardados?')) {
        savedPokemon = [];
        renderSavedPokemon();
        saveToLocalStorage();
    }
}

// Render type reference
function renderTypeReference() {
    const container = document.getElementById('typeReference');
    const types = Object.keys(TypeChart);
    
    types.forEach(type => {
        const item = document.createElement('div');
        item.className = `type-ref-item type-${type}`;
        item.textContent = typeNames[type] || type;
        container.appendChild(item);
    });
}

// Helper: Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Save to localStorage
function saveToLocalStorage() {
    const data = {
        attacks: attacks,
        savedPokemon: savedPokemon
    };
    localStorage.setItem('pokemonTypeGuesser', JSON.stringify(data));
}

// Load from localStorage
function loadFromLocalStorage() {
    const data = localStorage.getItem('pokemonTypeGuesser');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            attacks = parsed.attacks || [];
            savedPokemon = parsed.savedPokemon || [];
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
