// Content script pour remplir les formulaires
// Basé sur past-form.js mais adapté pour l'extension Chrome

console.log('Form Copy: Script de remplissage chargé');

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillForm') {
    try {
      const success = fillFormWithData(message.data);
      if (success) {
        sendResponse({ success: true });
      } else {
        sendResponse({
          success: false,
          error: 'Échec du remplissage du formulaire',
        });
      }
    } catch (error) {
      console.error('Erreur lors du remplissage:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

function fillFormWithData(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    console.error('Données JSON invalides');
    return false;
  }

  // Vérifier si le formulaire existe
  let form = document.forms['horse_form'];
  if (!form && document.forms.length > 0) {
    form = document.forms[0];
  }

  if (!form) {
    console.error('Aucun formulaire trouvé sur cette page');
    return false;
  }

  console.log('Début du remplissage du formulaire...');

  try {
    // Mapper les champs pour éviter les conflits
    const mappedData = mapFieldNames(jsonData);
    console.log(
      'Données mappées:',
      Object.keys(mappedData).length,
      'champs applicables'
    );

    // Remplir les différents types d'éléments
    fillTextInputs(mappedData);
    fillTextareas(mappedData);
    fillSelectizeInputs(mappedData);
    fillSelectInputs(mappedData);
    fillCheckboxes(mappedData);
    fillRadioButtons(mappedData);
    fillMultipleSelects(mappedData);

    // Gérer les champs spéciaux
    fillMultiLanguageDescriptions(jsonData);
    fillDynamicFields(jsonData);

    console.log('Remplissage du formulaire terminé !');
    return true;
  } catch (error) {
    console.error('Erreur lors du remplissage:', error);
    return false;
  }
}

// Fonctions utilitaires simplifiées (versions réduites de past-form.js)
function fillTextInputs(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

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
      }
    }
  });
}

function fillTextareas(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (typeof fieldValue === 'string') {
      const element = document.querySelector(`textarea[name="${fieldName}"]`);
      if (element) {
        element.value = fieldValue;
        console.log(`✅ Rempli textarea[${fieldName}]`);
      }
    }
  });
}

function fillSelectInputs(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

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
        // Ignorer les champs Selectize
        if (
          element.selectize ||
          (typeof jQuery !== 'undefined' && jQuery(element).data('selectize'))
        ) {
          return;
        }

        // Essayer de sélectionner par value
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].value === fieldValue.value) {
            element.selectedIndex = i;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(
              `✅ Sélectionné select[${fieldName}] = "${fieldValue.selectedText}"`
            );
            break;
          }
        }
      }
    }
  });
}

function fillSelectizeInputs(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (
      fieldValue &&
      typeof fieldValue === 'object' &&
      fieldValue.value !== undefined
    ) {
      const element = document.querySelector(`select[name="${fieldName}"]`);
      
      if (element && element.classList.contains('selectized')) {
        // Pour les éléments Selectize, manipulation directe
        let parentControl = element.closest('.selectize-control');
        
        // Alternative : chercher le contrôle par l'ID ou le nom
        if (!parentControl) {
          const allControls = document.querySelectorAll('.selectize-control');
          allControls.forEach((control) => {
            const hiddenSelect = control.querySelector('select');
            if (hiddenSelect && hiddenSelect.name === fieldName) {
              parentControl = control;
            }
          });
        }
        
        // Dernier recours : chercher un contrôle Selectize à côté
        if (!parentControl && element.nextElementSibling) {
          if (element.nextElementSibling.classList.contains('selectize-control')) {
            parentControl = element.nextElementSibling;
          }
        }
        
        if (parentControl) {
          const selectizeInput = parentControl.querySelector('.selectize-input');
          
          if (selectizeInput) {
            selectizeInput.click();
            
            setTimeout(() => {
              let dropdown = document.querySelector('.selectize-dropdown');
              if (!dropdown) {
                dropdown = parentControl.querySelector('.selectize-dropdown');
              }
              
              if (dropdown) {
                // Utiliser [data-value] qui est le bon sélecteur pour Selectize
                const options = dropdown.querySelectorAll('[data-value]');
                
                for (let option of options) {
                  const optionValue = option.getAttribute('data-value');
                  const optionText = option.textContent;
                  
                  if (optionValue === fieldValue.value || 
                      optionText.includes(fieldValue.selectedText)) {
                    option.click();
                    console.log(`✅ Sélectionné Selectize[${fieldName}] = "${optionText}"`);
                    return;
                  }
                }
              }
            }, 200);
          }
        }
      } else if (element) {
        // Pour les éléments normaux, essayer l'instance Selectize
        const selectizeInstance = element.selectize || 
          (typeof jQuery !== 'undefined' && jQuery(element).data('selectize'));
        
        if (selectizeInstance) {
          selectizeInstance.setValue(fieldValue.value);
          console.log(`✅ Sélectionné Selectize[${fieldName}] = "${fieldValue.selectedText}"`);
        }
      }
    }
  });
}

function fillCheckboxes(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (Array.isArray(fieldValue)) {
      const allCheckboxes = document.querySelectorAll(
        `input[name="${fieldName}"]`
      );
      allCheckboxes.forEach((cb) => (cb.checked = false));

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
          }
        }
      });
    }
  });
}

function fillRadioButtons(data) {
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (typeof fieldValue === 'string' && fieldValue.length < 100) {
      const radios = document.querySelectorAll(
        `input[name="${fieldName}"][type="radio"]`
      );
      if (radios.length > 0) {
        for (let radio of radios) {
          if (radio.value === fieldValue) {
            radio.checked = true;
            console.log(`✅ Sélectionné radio[${fieldName}] = "${fieldValue}"`);
            break;
          }
        }
      }
    }
  });
}

function fillMultipleSelects(data) {
  // Version simplifiée pour les selects multiples
  Object.keys(data).forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (Array.isArray(fieldValue)) {
      const element = document.querySelector(`select[name="${fieldName}"]`);
      if (element && element.type === 'select-multiple') {
        for (let i = 0; i < element.options.length; i++) {
          element.options[i].selected = false;
        }

        fieldValue.forEach((optionData) => {
          for (let i = 0; i < element.options.length; i++) {
            if (element.options[i].value === optionData.value) {
              element.options[i].selected = true;
              break;
            }
          }
        });
      }
    }
  });
}

function fillMultiLanguageDescriptions(data) {
  const descriptionFields = [
    'text_desc[1]',
    'text_desc[3]',
    'text_desc[4]',
    'text_desc[5]',
    'text_desc[6]',
    'text_desc[14]',
  ];

  let descriptionToUse = '';
  for (let fieldName of descriptionFields) {
    if (data[fieldName] && data[fieldName].trim()) {
      descriptionToUse = data[fieldName];
      break;
    }
  }

  if (descriptionToUse) {
    const descriptionElement = document.querySelector(
      'textarea[name="description"]'
    );
    if (descriptionElement && !descriptionElement.value) {
      descriptionElement.value = descriptionToUse;
      descriptionElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Rempli description principale');
    }
  }
}

function fillDynamicFields(data) {
  // Version simplifiée pour les champs dynamiques comme county
  if (data.county && data.country) {
    setTimeout(() => {
      const countyElement = document.querySelector('select[name="county"]');
      if (countyElement && countyElement.options.length > 1) {
        const fieldValue = data.county;
        for (let i = 0; i < countyElement.options.length; i++) {
          if (countyElement.options[i].value === fieldValue.value) {
            countyElement.selectedIndex = i;
            console.log(`✅ Sélectionné county[${fieldValue.selectedText}]`);
            break;
          }
        }
      }
    }, 1000);
  }
}

function mapFieldNames(data) {
  const mappedData = { ...data };

  const skipFields = [
    'id_ad',
    'id_horses',
    'city',
    'postcode',
    'price',
    'price_discount',
  ];

  skipFields.forEach((field) => {
    if (mappedData[field]) {
      delete mappedData[field];
    }
  });

  return mappedData;
}
