// Script pour remplir automatiquement un formulaire avec des données JSON
// À exécuter dans la console du navigateur sur la page du formulaire de création
// Version adaptée pour le formulaire de création

// Variable globale pour stocker les données - à modifier avec vos données JSON
let formDataToFill = {};

// Fonction pour vérifier si un champ existe dans le formulaire
function fieldExists(fieldName, fieldType = null) {
    if (fieldType) {
        return document.querySelector(`${fieldType}[name="${fieldName}"]`) !== null;
    } else {
        return document.querySelector(`[name="${fieldName}"]`) !== null;
    }
}

// Fonction pour remplir les inputs text, hidden, email, tel, url, number, password
function fillTextInputs(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        // Si c'est une valeur simple (string)
        if (typeof fieldValue === 'string') {
            const element = document.querySelector(`input[name="${fieldName}"]`);
            if (element && ['text', 'hidden', 'email', 'tel', 'url', 'number', 'password'].includes(element.type)) {
                element.value = fieldValue;
                console.log(`✅ Rempli input[${fieldName}] = "${fieldValue}"`);
            } else if (!element) {
                console.log(`⚠️ Champ input[${fieldName}] non trouvé dans le formulaire de création`);
            }
        }
    });
}

// Fonction pour remplir les textareas
function fillTextareas(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        if (typeof fieldValue === 'string') {
            const element = document.querySelector(`textarea[name="${fieldName}"]`);
            if (element) {
                element.value = fieldValue;
                console.log(`✅ Rempli textarea[${fieldName}] = "${fieldValue.substring(0, 50)}..."`);
            }
        }
    });
}

// Fonction pour gérer les descriptions multilingues
function fillMultiLanguageDescriptions(data) {
    // Pour le formulaire de création, on utilise le champ "description" principal
    // On prend la première description non vide disponible
    const descriptionFields = ['text_desc[1]', 'text_desc[3]', 'text_desc[4]', 'text_desc[5]', 'text_desc[6]', 'text_desc[14]'];
    
    const descriptionElement = document.querySelector('textarea[name="description"]');
    if (descriptionElement && !descriptionElement.value) { // Ne pas écraser si déjà rempli
        for (let fieldName of descriptionFields) {
            if (data[fieldName] && data[fieldName].trim()) {
                descriptionElement.value = data[fieldName];
                console.log(`✅ Rempli description principale avec ${fieldName}`);
                break;
            }
        }
    }
}

// Fonction pour remplir les selects (simple)
function fillSelectInputs(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        // Si c'est un objet avec value et selectedText
        if (fieldValue && typeof fieldValue === 'object' && fieldValue.value !== undefined) {
            const element = document.querySelector(`select[name="${fieldName}"]`);
            if (element && element.type === 'select-one') {
                // Essayer de sélectionner par value
                let optionFound = false;
                for (let i = 0; i < element.options.length; i++) {
                    if (element.options[i].value === fieldValue.value) {
                        element.selectedIndex = i;
                        optionFound = true;
                        console.log(`✅ Sélectionné select[${fieldName}] = "${fieldValue.selectedText}" (${fieldValue.value})`);
                        break;
                    }
                }
                
                // Si pas trouvé par value, essayer par text
                if (!optionFound && fieldValue.selectedText) {
                    for (let i = 0; i < element.options.length; i++) {
                        if (element.options[i].text.trim() === fieldValue.selectedText.trim()) {
                            element.selectedIndex = i;
                            console.log(`✅ Sélectionné select[${fieldName}] par texte = "${fieldValue.selectedText}"`);
                            break;
                        }
                    }
                }
                
                if (!optionFound) {
                    console.log(`⚠️ Option non trouvée pour select[${fieldName}]: ${fieldValue.value} / ${fieldValue.selectedText}`);
                }
            } else if (!element) {
                console.log(`⚠️ Select[${fieldName}] non trouvé dans le formulaire de création`);
            }
        }
    });
}

// Fonction pour remplir les checkboxes
function fillCheckboxes(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        // Si c'est un tableau de checkboxes
        if (Array.isArray(fieldValue)) {
            // D'abord, décocher toutes les checkboxes de ce groupe
            const allCheckboxes = document.querySelectorAll(`input[name="${fieldName}"]`);
            allCheckboxes.forEach(cb => cb.checked = false);
            
            if (allCheckboxes.length === 0) {
                console.log(`⚠️ Aucune checkbox[${fieldName}] trouvée dans le formulaire de création`);
                return;
            }
            
            // Puis cocher celles spécifiées dans les données
            fieldValue.forEach(checkboxData => {
                if (checkboxData.checked) {
                    const checkbox = document.querySelector(`input[name="${fieldName}"][value="${checkboxData.value}"]`);
                    if (checkbox && checkbox.type === 'checkbox') {
                        checkbox.checked = true;
                        console.log(`✅ Coché checkbox[${fieldName}] value="${checkboxData.value}"`);
                    } else {
                        console.log(`⚠️ Checkbox[${fieldName}][${checkboxData.value}] non trouvée`);
                    }
                }
            });
        }
    });
}

// Fonction pour remplir les boutons radio
function fillRadioButtons(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        // Si c'est une valeur simple pour un radio et que la valeur n'est pas trop longue
        if (typeof fieldValue === 'string' && fieldValue.length < 100) {
            // Vérifier d'abord qu'il existe des boutons radio avec ce nom
            const radios = document.querySelectorAll(`input[name="${fieldName}"][type="radio"]`);
            if (radios.length > 0) {
                // Échapper les caractères spéciaux pour le sélecteur CSS
                const escapedValue = fieldValue.replace(/"/g, '\\"');
                try {
                    const radio = document.querySelector(`input[name="${fieldName}"][value="${escapedValue}"]`);
                    if (radio && radio.type === 'radio') {
                        radio.checked = true;
                        console.log(`✅ Sélectionné radio[${fieldName}] = "${fieldValue}"`);
                    }
                } catch (e) {
                    // Si le sélecteur échoue, on essaie de trouver manuellement
                    for (let radio of radios) {
                        if (radio.value === fieldValue) {
                            radio.checked = true;
                            console.log(`✅ Sélectionné radio[${fieldName}] = "${fieldValue}" (méthode alternative)`);
                            break;
                        }
                    }
                }
            }
        }
    });
}

// Fonction pour remplir les selects multiples
function fillMultipleSelects(data) {
    Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        
        if (Array.isArray(fieldValue)) {
            const element = document.querySelector(`select[name="${fieldName}"]`);
            if (element && element.type === 'select-multiple') {
                // Désélectionner toutes les options d'abord
                for (let i = 0; i < element.options.length; i++) {
                    element.options[i].selected = false;
                }
                
                // Sélectionner les options spécifiées
                fieldValue.forEach(optionData => {
                    for (let i = 0; i < element.options.length; i++) {
                        if (element.options[i].value === optionData.value) {
                            element.options[i].selected = true;
                            console.log(`✅ Sélectionné option multiple[${fieldName}] = "${optionData.text}" (${optionData.value})`);
                            break;
                        }
                    }
                });
            }
        }
    });
}

// Fonction pour mapper les champs entre formulaire d'édition et de création
function mapFieldNames(data) {
    const mappedData = { ...data };
    
    // Certains champs peuvent avoir des noms différents ou ne pas exister
    // dans le formulaire de création
    const skipFields = [
        'id_ad',        // ID spécifique à l'annonce existante
        'id_horses',    // ID spécifique au cheval existant
        'city',         // Pas présent dans le formulaire de création
        'postcode',     // Pas présent dans le formulaire de création
        'county',       // Pas présent dans le formulaire de création
        'price',        // Peut être géré différemment
        'price_discount' // Peut être géré différemment
    ];
    
    // Supprimer les champs qui n'existent pas dans le formulaire de création
    skipFields.forEach(field => {
        if (mappedData[field]) {
            console.log(`⏭️ Ignoré le champ ${field} (non applicable au formulaire de création)`);
            delete mappedData[field];
        }
    });
    
    return mappedData;
}

// Fonction principale pour remplir le formulaire
function fillFormWithData(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
        console.error('❌ Données JSON invalides');
        return false;
    }
    
    // Vérifier si le formulaire existe
    const form = document.forms['horse_form'];
    if (!form) {
        console.error('❌ Formulaire "horse_form" non trouvé');
        return false;
    }
    
    console.log('🚀 Début du remplissage du formulaire de création...');
    console.log('📋 Données à traiter:', Object.keys(jsonData).length, 'champs');
    
    try {
        // Mapper les champs pour le formulaire de création
        const mappedData = mapFieldNames(jsonData);
        console.log('🔄 Données mappées:', Object.keys(mappedData).length, 'champs applicables');
        
        // Remplir les différents types d'éléments
        fillTextInputs(mappedData);
        fillTextareas(mappedData);
        fillSelectInputs(mappedData);
        fillCheckboxes(mappedData);
        fillRadioButtons(mappedData);
        fillMultipleSelects(mappedData);
        
        // Gérer les champs spéciaux pour les descriptions multilingues
        fillMultiLanguageDescriptions(jsonData);
        
        console.log('✅ Remplissage du formulaire de création terminé !');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du remplissage:', error);
        return false;
    }
}

// Fonction utilitaire pour définir les données à remplir
function setFormData(jsonData) {
    formDataToFill = jsonData;
    console.log('📝 Données JSON chargées :', Object.keys(jsonData).length, 'champs');
}

// Fonction utilitaire pour lancer le remplissage avec les données stockées
function fillForm() {
    if (Object.keys(formDataToFill).length === 0) {
        console.error('❌ Aucune donnée chargée. Utilisez setFormData(jsonData) d\'abord.');
        return false;
    }
    return fillFormWithData(formDataToFill);
}

// Fonction pour analyser le formulaire actuel
function analyzeForm() {
    const form = document.forms['horse_form'];
    if (!form) {
        console.error('❌ Formulaire "horse_form" non trouvé');
        return;
    }
    
    console.log('🔍 ANALYSE DU FORMULAIRE DE CRÉATION:');
    console.log('=====================================');
    
    const elements = form.elements;
    const fieldTypes = {};
    
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.name) {
            const type = element.type || element.tagName.toLowerCase();
            if (!fieldTypes[type]) fieldTypes[type] = [];
            fieldTypes[type].push(element.name);
        }
    }
    
    Object.keys(fieldTypes).forEach(type => {
        console.log(`${type.toUpperCase()}: ${fieldTypes[type].length} champs`);
        fieldTypes[type].forEach(name => console.log(`  - ${name}`));
    });
    
    console.log('=====================================');
}

// Fonction principale simplifiée - utilisation directe
function fillAll(jsonData) {
    return fillFormWithData(jsonData);
}

// Instructions d'utilisation
console.log(`
🔧 UTILISATION DU SCRIPT PAST-FORM (VERSION CRÉATION) :

UTILISATION SIMPLE :
   fillAll(votreObjetJSON);

UTILISATION AVANCÉE :
1. Analyser le formulaire actuel :
   analyzeForm();

2. Charger vos données :
   setFormData(votreObjetJSON);

3. Remplir le formulaire :
   fillForm();

OU directement :
   fillFormWithData(votreObjetJSON);

Le script peut être exécuté plusieurs fois sans problème.
Il ignore automatiquement les champs non applicables au formulaire de création.
`);

// Export des fonctions pour utilisation externe si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fillAll,
        fillFormWithData,
        setFormData,
        fillForm,
        analyzeForm
    };
}