// Content script pour extraire les données de formulaire
// Basé sur copy-form.js mais adapté pour l'extension Chrome

console.log("Form Copy: Script d'extraction chargé");

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractForm') {
    try {
      const formData = extractFormData();
      if (formData) {
        sendResponse({ success: true, data: formData });
      } else {
        sendResponse({
          success: false,
          error: 'Aucun formulaire trouvé sur cette page',
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Garde la connexion ouverte pour sendResponse asynchrone
});

function extractFormData() {
  const formData = {};

  // Récupérer le formulaire principal (horse_form en priorité, sinon le premier formulaire)
  let form = document.forms['horse_form'];
  if (!form && document.forms.length > 0) {
    form = document.forms[0];
  }

  if (!form) {
    console.log('Aucun formulaire trouvé');
    return null;
  }

  console.log('Formulaire trouvé:', form.name || 'sans nom');

  // Parcourir tous les éléments du formulaire
  const elements = form.elements;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const name = element.name;
    const type = element.type;

    if (!name) continue; // Ignorer les éléments sans nom

    switch (type) {
      case 'text':
      case 'hidden':
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
      case 'password':
        if (element.value) {
          formData[name] = element.value;
        }
        break;

      case 'textarea':
        if (element.value) {
          formData[name] = element.value;
        }
        break;

      case 'select-one':
        if (element.selectedIndex > 0) {
          formData[name] = {
            value: element.value,
            selectedText: element.options[element.selectedIndex]?.text || '',
          };
        }
        break;

      case 'select-multiple':
        const selectedOptions = [];
        for (let j = 0; j < element.options.length; j++) {
          if (element.options[j].selected) {
            selectedOptions.push({
              value: element.options[j].value,
              text: element.options[j].text,
            });
          }
        }
        if (selectedOptions.length > 0) {
          formData[name] = selectedOptions;
        }
        break;

      case 'checkbox':
        if (!formData[name]) {
          formData[name] = [];
        }
        if (element.checked) {
          formData[name].push({
            value: element.value,
            checked: true,
          });
        }
        break;

      case 'radio':
        if (element.checked) {
          formData[name] = element.value;
        }
        break;
    }
  }

  // Nettoyer les tableaux vides pour les checkboxes
  Object.keys(formData).forEach((key) => {
    if (Array.isArray(formData[key]) && formData[key].length === 0) {
      delete formData[key];
    }
  });

  console.log('Données extraites:', Object.keys(formData).length, 'champs');
  return formData;
}
