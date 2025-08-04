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
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    // Si c'est une valeur simple (string)
    if (typeof fieldValue === 'string') {
      const element = document.querySelector(`input[name="${fieldName}"]`);
      if (
        element &&
        [
          'text',
          'hidden',
          'email',
          'tel',
          'url',
          'number',
          'password',
        ].includes(element.type)
      ) {
        element.value = fieldValue;
        console.log(`✅ Rempli input[${fieldName}] = "${fieldValue}"`);
      } else if (!element) {
        console.log(
          `⚠️ Champ input[${fieldName}] non trouvé dans le formulaire de création`
        );
      }
    }
  });
}

// Fonction pour remplir les textareas
function fillTextareas(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (typeof fieldValue === 'string') {
      const element = document.querySelector(`textarea[name="${fieldName}"]`);
      if (element) {
        element.value = fieldValue;
        console.log(
          `✅ Rempli textarea[${fieldName}] = "${fieldValue.substring(
            0,
            50
          )}..."`
        );
      }
    }
  });
}

// Fonction pour gérer les descriptions multilingues et CKEditor
function fillMultiLanguageDescriptions(data) {
  // Pour le formulaire de création, on utilise le champ "description" principal
  // On prend la première description non vide disponible
  const descriptionFields = [
    'text_desc[1]',
    'text_desc[3]',
    'text_desc[4]',
    'text_desc[5]',
    'text_desc[6]',
    'text_desc[14]',
  ];

  let descriptionToUse = '';
  let sourceField = '';

  // Trouver la première description non vide
  for (let fieldName of descriptionFields) {
    if (data[fieldName] && data[fieldName].trim()) {
      descriptionToUse = data[fieldName];
      sourceField = fieldName;
      break;
    }
  }

  if (!descriptionToUse) {
    console.log('⚠️ Aucune description trouvée dans les données');
    return;
  }

  // Méthode 1: Essayer avec CKEditor si disponible
  if (typeof CKEDITOR !== 'undefined') {
    const editorInstance = CKEDITOR.instances['description'];
    if (editorInstance) {
      editorInstance.setData(descriptionToUse);
      console.log(`✅ Rempli CKEditor description avec ${sourceField}`);
      return;
    }
  }

  // Méthode 2: Essayer avec le textarea standard
  const descriptionElement = document.querySelector(
    'textarea[name="description"]'
  );
  if (descriptionElement) {
    if (!descriptionElement.value || descriptionElement.value.trim() === '') {
      descriptionElement.value = descriptionToUse;

      // Déclencher les événements pour les éditeurs qui se basent sur le textarea
      descriptionElement.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionElement.dispatchEvent(new Event('change', { bubbles: true }));

      console.log(`✅ Rempli textarea description avec ${sourceField}`);
    } else {
      console.log('⚠️ Description déjà remplie, passage ignoré');
    }
  } else {
    console.log('⚠️ Champ description non trouvé');
  }

  // Méthode 3: Tentative avec d'autres éditeurs WYSIWYG populaires
  setTimeout(() => {
    // TinyMCE
    if (typeof tinymce !== 'undefined') {
      const editor = tinymce.get('description');
      if (editor && editor.getContent().trim() === '') {
        editor.setContent(descriptionToUse);
        console.log(`✅ Rempli TinyMCE description avec ${sourceField}`);
        return;
      }
    }

    // Quill
    if (typeof Quill !== 'undefined') {
      const quillContainer = document.querySelector(
        '#description-editor .ql-editor'
      );
      if (quillContainer && quillContainer.innerHTML.trim() === '<p><br></p>') {
        quillContainer.innerHTML = descriptionToUse;
        console.log(`✅ Rempli Quill description avec ${sourceField}`);
        return;
      }
    }
  }, 100); // Petit délai pour laisser les éditeurs s'initialiser
}

// Fonction pour remplir les champs Selectize
function fillSelectizeInputs(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    // Si c'est un objet avec value et selectedText
    if (
      fieldValue &&
      typeof fieldValue === 'object' &&
      fieldValue.value !== undefined
    ) {
      const element = document.querySelector(`select[name="${fieldName}"]`);
      if (element) {
        // Vérifier si c'est un champ Selectize
        const selectizeInstance = element.selectize;
        if (selectizeInstance) {
          // C'est un champ Selectize
          selectizeInstance.setValue(fieldValue.value);
          console.log(
            `✅ Sélectionné Selectize[${fieldName}] = "${fieldValue.selectedText}" (${fieldValue.value})`
          );
        } else if (
          typeof jQuery !== 'undefined' &&
          jQuery(element).data('selectize')
        ) {
          // Alternative avec jQuery
          const selectizeObj = jQuery(element).data('selectize');
          selectizeObj.setValue(fieldValue.value);
          console.log(
            `✅ Sélectionné Selectize jQuery[${fieldName}] = "${fieldValue.selectedText}" (${fieldValue.value})`
          );
        }
      }
    }
  });
}

// Fonction pour remplir les selects (simple) - version mise à jour
function fillSelectInputs(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    // Si c'est un objet avec value et selectedText
    if (
      fieldValue &&
      typeof fieldValue === 'object' &&
      fieldValue.value !== undefined
    ) {
      const element = document.querySelector(`select[name="${fieldName}"]`);
      if (
        element &&
        (element.type === 'select-one' || element.multiple === false)
      ) {
        // Vérifier d'abord si c'est un champ Selectize et le traiter séparément
        if (
          element.selectize ||
          (typeof jQuery !== 'undefined' && jQuery(element).data('selectize'))
        ) {
          // Sera traité par fillSelectizeInputs
          return;
        }

        // Essayer de sélectionner par value
        let optionFound = false;
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].value === fieldValue.value) {
            element.selectedIndex = i;
            optionFound = true;
            console.log(
              `✅ Sélectionné select[${fieldName}] = "${fieldValue.selectedText}" (${fieldValue.value})`
            );

            // Déclencher l'événement change pour les selects avec des dépendances
            element.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }

        // Si pas trouvé par value, essayer par text (comparaison plus flexible)
        if (!optionFound && fieldValue.selectedText) {
          for (let i = 0; i < element.options.length; i++) {
            const optionText = element.options[i].text.trim().toLowerCase();
            const searchText = fieldValue.selectedText.trim().toLowerCase();
            if (optionText === searchText || optionText.includes(searchText)) {
              element.selectedIndex = i;
              optionFound = true;
              console.log(
                `✅ Sélectionné select[${fieldName}] par texte = "${fieldValue.selectedText}"`
              );
              element.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        }

        if (!optionFound) {
          console.log(
            `⚠️ Option non trouvée pour select[${fieldName}]: ${fieldValue.value} / ${fieldValue.selectedText}`
          );
          // Debug: afficher les options disponibles
          console.log(
            `   Options disponibles:`,
            Array.from(element.options).map(
              (opt) => `${opt.value}: ${opt.text}`
            )
          );
        }
      } else if (!element) {
        console.log(
          `⚠️ Select[${fieldName}] non trouvé dans le formulaire de création`
        );
      }
    }
  });
}

// Fonction pour remplir les checkboxes
function fillCheckboxes(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    // Si c'est un tableau de checkboxes
    if (Array.isArray(fieldValue)) {
      // D'abord, décocher toutes les checkboxes de ce groupe
      const allCheckboxes = document.querySelectorAll(
        `input[name="${fieldName}"]`
      );
      allCheckboxes.forEach((cb) => (cb.checked = false));

      if (allCheckboxes.length === 0) {
        console.log(
          `⚠️ Aucune checkbox[${fieldName}] trouvée dans le formulaire de création`
        );
        return;
      }

      // Puis cocher celles spécifiées dans les données
      fieldValue.forEach((checkboxData) => {
        if (checkboxData.checked) {
          const checkbox = document.querySelector(
            `input[name="${fieldName}"][value="${checkboxData.value}"]`
          );
          if (checkbox && checkbox.type === 'checkbox') {
            checkbox.checked = true;
            console.log(
              `✅ Coché checkbox[${fieldName}] value="${checkboxData.value}"`
            );
          } else {
            console.log(
              `⚠️ Checkbox[${fieldName}][${checkboxData.value}] non trouvée`
            );
          }
        }
      });
    }
  });
}

// Fonction pour remplir les boutons radio
function fillRadioButtons(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    // Si c'est une valeur simple pour un radio et que la valeur n'est pas trop longue
    if (typeof fieldValue === 'string' && fieldValue.length < 100) {
      // Vérifier d'abord qu'il existe des boutons radio avec ce nom
      const radios = document.querySelectorAll(
        `input[name="${fieldName}"][type="radio"]`
      );
      if (radios.length > 0) {
        // Échapper les caractères spéciaux pour le sélecteur CSS
        const escapedValue = fieldValue.replace(/"/g, '\\"');
        try {
          const radio = document.querySelector(
            `input[name="${fieldName}"][value="${escapedValue}"]`
          );
          if (radio && radio.type === 'radio') {
            radio.checked = true;
            console.log(`✅ Sélectionné radio[${fieldName}] = "${fieldValue}"`);
          }
        } catch (e) {
          // Si le sélecteur échoue, on essaie de trouver manuellement
          for (let radio of radios) {
            if (radio.value === fieldValue) {
              radio.checked = true;
              console.log(
                `✅ Sélectionné radio[${fieldName}] = "${fieldValue}" (méthode alternative)`
              );
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
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (Array.isArray(fieldValue)) {
      const element = document.querySelector(`select[name="${fieldName}"]`);
      if (element && element.type === 'select-multiple') {
        // Désélectionner toutes les options d'abord
        for (let i = 0; i < element.options.length; i++) {
          element.options[i].selected = false;
        }

        // Sélectionner les options spécifiées
        fieldValue.forEach((optionData) => {
          for (let i = 0; i < element.options.length; i++) {
            if (element.options[i].value === optionData.value) {
              element.options[i].selected = true;
              console.log(
                `✅ Sélectionné option multiple[${fieldName}] = "${optionData.text}" (${optionData.value})`
              );
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
    'id_ad', // ID spécifique à l'annonce existante
    'id_horses', // ID spécifique au cheval existant
    'city', // Pas présent dans le formulaire de création
    'postcode', // Pas présent dans le formulaire de création
    'price', // Peut être géré différemment
    'price_discount', // Peut être géré différemment
    // Note: county n'est plus ignoré car il existe mais est chargé dynamiquement
  ];

  // Supprimer les champs qui n'existent pas dans le formulaire de création
  skipFields.forEach((field) => {
    if (mappedData[field]) {
      console.log(
        `⏭️ Ignoré le champ ${field} (non applicable au formulaire de création)`
      );
      delete mappedData[field];
    }
  });

  return mappedData;
}

// Fonction pour gérer les champs chargés dynamiquement (comme county)
function fillDynamicFields(data) {
  // Gérer le champ county qui dépend du country
  if (data.county && data.country) {
    // Attendre que le champ county soit chargé après la sélection du pays
    const maxAttempts = 20; // 10 secondes maximum
    let attempts = 0;

    const tryFillCounty = () => {
      attempts++;
      const countyElement = document.querySelector('select[name="county"]');

      if (countyElement && countyElement.options.length > 1) {
        // Le champ county est maintenant chargé
        const fieldValue = data.county;
        let optionFound = false;

        for (let i = 0; i < countyElement.options.length; i++) {
          if (countyElement.options[i].value === fieldValue.value) {
            countyElement.selectedIndex = i;
            optionFound = true;
            console.log(
              `✅ Sélectionné county[${fieldValue.selectedText}] = ${fieldValue.value}`
            );
            countyElement.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }

        if (!optionFound && fieldValue.selectedText) {
          // Essayer par texte
          for (let i = 0; i < countyElement.options.length; i++) {
            const optionText = countyElement.options[i].text
              .trim()
              .toLowerCase();
            const searchText = fieldValue.selectedText.trim().toLowerCase();
            if (
              optionText.includes(searchText) ||
              searchText.includes(optionText)
            ) {
              countyElement.selectedIndex = i;
              optionFound = true;
              console.log(
                `✅ Sélectionné county par texte[${fieldValue.selectedText}] = ${countyElement.options[i].text}`
              );
              countyElement.dispatchEvent(
                new Event('change', { bubbles: true })
              );
              break;
            }
          }
        }

        if (!optionFound) {
          console.log(
            `⚠️ Département non trouvé: ${fieldValue.value} / ${fieldValue.selectedText}`
          );
          console.log(
            `   Options disponibles:`,
            Array.from(countyElement.options).map(
              (opt) => `${opt.value}: ${opt.text}`
            )
          );
        }
      } else if (attempts < maxAttempts) {
        // Réessayer dans 500ms
        setTimeout(tryFillCounty, 500);
        console.log(
          `⏳ Attente du chargement du champ county... (tentative ${attempts}/${maxAttempts})`
        );
      } else {
        console.log(
          "⚠️ Timeout: le champ county n'a pas pu être chargé dans les temps"
        );
      }
    };

    // Commencer à essayer après un petit délai
    setTimeout(tryFillCounty, 500);
  }
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
    console.log(
      '🔄 Données mappées:',
      Object.keys(mappedData).length,
      'champs applicables'
    );

    // Remplir les différents types d'éléments
    fillTextInputs(mappedData);
    fillTextareas(mappedData);
    fillSelectizeInputs(mappedData); // Traiter les champs Selectize en premier
    fillSelectInputs(mappedData);
    fillCheckboxes(mappedData);
    fillRadioButtons(mappedData);
    fillMultipleSelects(mappedData);

    // Gérer les champs spéciaux pour les descriptions multilingues
    fillMultiLanguageDescriptions(jsonData);

    // Gérer les champs chargés dynamiquement (comme county)
    fillDynamicFields(jsonData);

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
  console.log(
    '📝 Données JSON chargées :',
    Object.keys(jsonData).length,
    'champs'
  );
}

// Fonction utilitaire pour lancer le remplissage avec les données stockées
function fillForm() {
  if (Object.keys(formDataToFill).length === 0) {
    console.error(
      "❌ Aucune donnée chargée. Utilisez setFormData(jsonData) d'abord."
    );
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

  Object.keys(fieldTypes).forEach((type) => {
    console.log(`${type.toUpperCase()}: ${fieldTypes[type].length} champs`);
    fieldTypes[type].forEach((name) => console.log(`  - ${name}`));
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
    analyzeForm,
  };
}
