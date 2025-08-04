// Background script pour l'extension Form Copy
// Service Worker pour Manifest V3

console.log('Form Copy: Background script chargé');

// Gérer l'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension Form Copy installée:', details.reason);
    
    if (details.reason === 'install') {
        // Première installation
        console.log('Première installation de Form Copy');
        
        // Initialiser le stockage avec des valeurs par défaut
        chrome.storage.local.set({
            settings: {
                autoCleanup: true,
                cleanupDays: 7,
                showNotifications: true
            }
        });
    }
});

// Gérer les raccourcis clavier
chrome.commands.onCommand.addListener((command) => {
    console.log('Commande reçue:', command);
    
    switch (command) {
        case 'copy-form':
            handleCopyCommand();
            break;
        case 'paste-form':
            handlePasteCommand();
            break;
    }
});

// Fonction pour gérer la copie via raccourci
async function handleCopyCommand() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Injecter le script d'extraction
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/extract-form.js']
        });

        // Envoyer le message d'extraction
        chrome.tabs.sendMessage(tab.id, { action: 'extractForm' }, (response) => {
            if (response && response.success) {
                // Stocker les données
                const formRecord = {
                    id: Date.now(),
                    data: response.data,
                    timestamp: Date.now(),
                    url: tab.url,
                    title: tab.title || 'Page sans titre',
                    fieldCount: Object.keys(response.data).length
                };

                chrome.storage.local.set({ 
                    currentFormData: response.data,
                    [`form_${formRecord.id}`]: formRecord
                });

                // Notification de succès
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Form Copy',
                    message: `Formulaire copié ! ${formRecord.fieldCount} champs extraits.`
                });
            }
        });
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
    }
}

// Fonction pour gérer le collage via raccourci
async function handlePasteCommand() {
    try {
        // Vérifier s'il y a des données à coller
        const result = await chrome.storage.local.get(['currentFormData']);
        if (!result.currentFormData) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Form Copy',
                message: 'Aucun formulaire à coller. Copiez d\'abord un formulaire.'
            });
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Injecter le script de remplissage
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/fill-form.js']
        });

        // Envoyer les données pour le remplissage
        chrome.tabs.sendMessage(tab.id, { 
            action: 'fillForm', 
            data: result.currentFormData 
        }, (response) => {
            if (response && response.success) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Form Copy',
                    message: 'Formulaire rempli avec succès !'
                });
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Form Copy - Erreur',
                    message: response?.error || 'Échec du remplissage'
                });
            }
        });
    } catch (error) {
        console.error('Erreur lors du collage:', error);
    }
}

// Nettoyage automatique des anciennes données
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        cleanupOldForms();
    }
});

// Créer l'alarme de nettoyage (une fois par jour)
chrome.alarms.create('cleanup', { 
    delayInMinutes: 60, // 1 heure après installation
    periodInMinutes: 24 * 60 // Tous les jours
});

// Fonction de nettoyage
async function cleanupOldForms() {
    try {
        const result = await chrome.storage.local.get(null);
        const settings = result.settings || { cleanupDays: 7 };
        const cutoffTime = Date.now() - (settings.cleanupDays * 24 * 60 * 60 * 1000);
        
        const keysToRemove = [];
        
        Object.entries(result).forEach(([key, value]) => {
            if (key.startsWith('form_') && value.timestamp < cutoffTime) {
                keysToRemove.push(key);
            }
        });
        
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
            console.log(`Nettoyage: ${keysToRemove.length} anciens formulaires supprimés`);
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
    }
}

// Gérer les messages des content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'log':
            console.log('Content script:', message.data);
            break;
        case 'error':
            console.error('Content script error:', message.data);
            break;
    }
});

// Gérer la suppression de l'extension
chrome.runtime.onSuspend.addListener(() => {
    console.log('Extension Form Copy suspendue');
});