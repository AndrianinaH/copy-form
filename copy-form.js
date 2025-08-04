// Script pour extraire toutes les donn�es du formulaire d'�dition
//  exécuter dans la console du navigateur sur la page du formulaire

function extractFormData() {
  const formData = {};

  // Récupérer le formulaire principal (horse_form)
  const form = document.forms["horse_form"];
  if (!form) {
    console.error("Formulaire horse_form non trouv�");
    return null;
  }

  // Parcourir tous les éléments du formulaire
  const elements = form.elements;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const name = element.name;
    const type = element.type;

    if (!name) continue; // Ignorer les éléments sans nom

    switch (type) {
      case "text":
      case "hidden":
      case "email":
      case "tel":
      case "url":
      case "number":
      case "password":
        formData[name] = element.value;
        break;

      case "textarea":
        formData[name] = element.value;
        break;

      case "select-one":
        formData[name] = {
          value: element.value,
          selectedText: element.options[element.selectedIndex]?.text || "",
        };
        break;

      case "select-multiple":
        const selectedOptions = [];
        for (let j = 0; j < element.options.length; j++) {
          if (element.options[j].selected) {
            selectedOptions.push({
              value: element.options[j].value,
              text: element.options[j].text,
            });
          }
        }
        formData[name] = selectedOptions;
        break;

      case "checkbox":
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

      case "radio":
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

  return formData;
}

// Fonction principale � ex�cuter
function getFormDataAsJSON() {
  const data = extractFormData();
  if (data) {
    const jsonString = JSON.stringify(data, null, 2);
    console.log("Données du formulaire :");
    console.log(jsonString);

    // Copier automatiquement dans le presse-papiers si possible
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          console.log(" JSON copié dans le presse-papiers !");
        })
        .catch((err) => {
          console.log("L Erreur lors de la copie :", err);
        });
    }

    return data;
  }
  return null;
}

// Exécuter automatiquement
console.log("🚀 Extraction des données du formulaire...");
getFormDataAsJSON();
