// Popup JavaScript pour l'extension Form Copy
class FormCopyPopup {
    constructor() {
        this.init();
        this.bindEvents();
        this.loadRecentForms();
        this.updateUI();
    }

    init() {
        // Éléments DOM
        this.copyBtn = document.getElementById('copyBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.statusContainer = document.getElementById('statusContainer');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.recentList = document.getElementById('recentList');
        this.toastContainer = document.getElementById('toastContainer');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.helpBtn = document.getElementById('helpBtn');

        // État de l'application
        this.isProcessing = false;
        this.hasStoredForm = false;
    }

    bindEvents() {
        // Boutons principaux
        this.copyBtn.addEventListener('click', () => this.handleCopy());
        this.pasteBtn.addEventListener('click', () => this.handlePaste());

        // Boutons du footer
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.helpBtn.addEventListener('click', () => this.openHelp());

        // Écouter les messages du background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message, sender, sendResponse);
        });
    }

    async handleCopy() {
        if (this.isProcessing) return;

        try {
            this.setProcessing(true);
            this.updateStatus('loading', 'Extraction du formulaire...');
            this.showProgress(0, 'Analyse de la page...');

            // Obtenir l'onglet actif
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Injecter le script d'extraction
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-scripts/extract-form.js']
            });

            this.showProgress(50, 'Extraction des données...');

            // Envoyer un message pour déclencher l'extraction
            chrome.tabs.sendMessage(tab.id, { action: 'extractForm' }, (response) => {
                if (chrome.runtime.lastError) {
                    throw new Error('Impossible de communiquer avec la page');
                }

                if (response && response.success) {
                    this.handleCopySuccess(response.data, tab);
                } else {
                    throw new Error(response?.error || 'Échec de l\'extraction');
                }
            });

        } catch (error) {
            this.handleError('Erreur lors de la copie', error.message);
        }
    }

    async handlePaste() {
        if (this.isProcessing || !this.hasStoredForm) return;

        try {
            this.setProcessing(true);
            this.updateStatus('loading', 'Remplissage du formulaire...');
            this.showProgress(0, 'Préparation des données...');

            // Obtenir l'onglet actif
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Récupérer les données stockées
            const result = await chrome.storage.local.get(['currentFormData']);
            if (!result.currentFormData) {
                throw new Error('Aucune donnée de formulaire trouvée');
            }

            // Injecter le script de remplissage
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-scripts/fill-form.js']
            });

            this.showProgress(30, 'Injection du script...');

            // Envoyer les données pour le remplissage
            chrome.tabs.sendMessage(tab.id, { 
                action: 'fillForm', 
                data: result.currentFormData 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    throw new Error('Impossible de communiquer avec la page');
                }

                if (response && response.success) {
                    this.handlePasteSuccess();
                } else {
                    throw new Error(response?.error || 'Échec du remplissage');
                }
            });

        } catch (error) {
            this.handleError('Erreur lors du collage', error.message);
        }
    }

    handleCopySuccess(formData, tab) {
        // Stocker les données
        const formRecord = {
            id: Date.now(),
            data: formData,
            timestamp: Date.now(),
            url: tab.url,
            title: tab.title || 'Page sans titre',
            fieldCount: Object.keys(formData).length
        };

        // Sauvegarder dans le storage
        chrome.storage.local.set({ 
            currentFormData: formData,
            [`form_${formRecord.id}`]: formRecord
        });

        // Mettre à jour l'historique
        this.addToRecentForms(formRecord);

        this.showProgress(100, 'Extraction terminée !');
        
        setTimeout(() => {
            this.hideProgress();
            this.updateStatus('success', `${formRecord.fieldCount} champs copiés`);
            this.setProcessing(false);
            this.hasStoredForm = true;
            this.updateUI();
            
            this.showToast('success', 'Formulaire copié !', 
                `${formRecord.fieldCount} champs extraits avec succès`);
        }, 1000);
    }

    handlePasteSuccess() {
        this.showProgress(100, 'Remplissage terminé !');
        
        setTimeout(() => {
            this.hideProgress();
            this.updateStatus('success', 'Formulaire rempli avec succès');
            this.setProcessing(false);
            
            this.showToast('success', 'Formulaire rempli !', 
                'Tous les champs compatibles ont été remplis');
        }, 1000);
    }

    handleError(title, message) {
        this.hideProgress();
        this.updateStatus('error', 'Erreur survenue');
        this.setProcessing(false);
        this.showToast('error', title, message);
    }

    setProcessing(processing) {
        this.isProcessing = processing;
        this.copyBtn.disabled = processing;
        this.pasteBtn.disabled = processing || !this.hasStoredForm;
    }

    updateStatus(type, text, icon = null) {
        this.statusIndicator.className = `status-indicator ${type}`;
        this.statusText.textContent = text;
        
        if (icon) {
            this.statusIcon.innerHTML = icon;
        } else {
            // Icons par défaut selon le type
            const icons = {
                success: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
                loading: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
                error: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>'
            };
            this.statusIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${icons[type] || icons.success}</svg>`;
        }

        if (type === 'loading') {
            this.statusIcon.classList.add('loading-spin');
        } else {
            this.statusIcon.classList.remove('loading-spin');
        }
    }

    showProgress(percentage, text) {
        this.progressContainer.style.display = 'block';
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
    }

    async loadRecentForms() {
        try {
            // Vérifier s'il y a des données actuelles
            const current = await chrome.storage.local.get(['currentFormData']);
            this.hasStoredForm = !!current.currentFormData;

            // Charger l'historique
            const result = await chrome.storage.local.get(null);
            const forms = Object.entries(result)
                .filter(([key]) => key.startsWith('form_'))
                .map(([key, value]) => value)
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5); // 5 derniers

            this.renderRecentForms(forms);
        } catch (error) {
            console.error('Erreur lors du chargement des formulaires récents:', error);
        }
    }

    renderRecentForms(forms) {
        if (forms.length === 0) {
            this.recentList.innerHTML = `
                <div class="empty-state">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-icon">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="empty-text">Aucun formulaire copié récemment</p>
                </div>
            `;
            return;
        }

        this.recentList.innerHTML = forms.map(form => `
            <div class="recent-item" data-form-id="${form.id}">
                <div class="recent-item-content">
                    <div class="recent-item-title">${this.truncateText(form.title, 40)}</div>
                    <div class="recent-item-meta">
                        ${form.fieldCount} champs • ${this.formatRelativeTime(form.timestamp)}
                    </div>
                </div>
                <button class="delete-btn" data-form-id="${form.id}" title="Supprimer ce formulaire">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Ajouter les event listeners
        this.recentList.querySelectorAll('.recent-item').forEach(item => {
            const content = item.querySelector('.recent-item-content');
            const deleteBtn = item.querySelector('.delete-btn');
            
            content.addEventListener('click', () => this.loadStoredForm(item.dataset.formId));
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteStoredForm(item.dataset.formId);
            });
        });
    }

    async loadStoredForm(formId) {
        try {
            const result = await chrome.storage.local.get([`form_${formId}`]);
            const form = result[`form_${formId}`];
            
            if (form) {
                // Définir comme formulaire actuel
                await chrome.storage.local.set({ currentFormData: form.data });
                this.hasStoredForm = true;
                this.updateUI();
                
                this.showToast('success', 'Formulaire chargé', 
                    `${form.fieldCount} champs prêts à être collés`);
            }
        } catch (error) {
            this.showToast('error', 'Erreur', 'Impossible de charger ce formulaire');
        }
    }

    async deleteStoredForm(formId) {
        try {
            // Supprimer du storage
            await chrome.storage.local.remove([`form_${formId}`]);
            
            // Supprimer l'élément de l'interface
            const itemToRemove = this.recentList.querySelector(`[data-form-id="${formId}"]`);
            if (itemToRemove) {
                itemToRemove.remove();
            }
            
            // Vérifier s'il faut afficher l'état vide
            const remainingItems = this.recentList.querySelectorAll('.recent-item');
            if (remainingItems.length === 0) {
                this.recentList.innerHTML = `
                    <div class="empty-state">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-icon">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p class="empty-text">Aucun formulaire copié récemment</p>
                    </div>
                `;
            }
            
            // Vérifier si c'était le formulaire actuel
            const currentResult = await chrome.storage.local.get(['currentFormData']);
            if (currentResult.currentFormData) {
                const currentFormResult = await chrome.storage.local.get([`form_${formId}`]);
                if (!currentFormResult[`form_${formId}`]) {
                    // Le formulaire supprimé était peut-être le formulaire actuel
                    // On garde le formulaire actuel en mémoire même si son historique est supprimé
                }
            }
            
            this.showToast('success', 'Formulaire supprimé', 'Le formulaire a été retiré de l\'historique');
            
        } catch (error) {
            this.showToast('error', 'Erreur', 'Impossible de supprimer ce formulaire');
        }
    }

    addToRecentForms(formRecord) {
        // Cette méthode sera appelée après la sauvegarde réussie
        const recentItem = document.createElement('div');
        recentItem.className = 'recent-item';
        recentItem.dataset.formId = formRecord.id;
        recentItem.innerHTML = `
            <div class="recent-item-content">
                <div class="recent-item-title">${this.truncateText(formRecord.title, 40)}</div>
                <div class="recent-item-meta">
                    ${formRecord.fieldCount} champs • À l'instant
                </div>
            </div>
            <button class="delete-btn" data-form-id="${formRecord.id}" title="Supprimer ce formulaire">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        const content = recentItem.querySelector('.recent-item-content');
        const deleteBtn = recentItem.querySelector('.delete-btn');
        
        content.addEventListener('click', () => this.loadStoredForm(formRecord.id));
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteStoredForm(formRecord.id);
        });

        // Supprimer l'état vide et ajouter le nouvel élément
        const emptyState = this.recentList.querySelector('.empty-state');
        if (emptyState) {
            this.recentList.innerHTML = '';
        }

        this.recentList.insertBefore(recentItem, this.recentList.firstChild);

        // Limiter à 5 éléments
        const items = this.recentList.querySelectorAll('.recent-item');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }

    updateUI() {
        this.pasteBtn.disabled = this.isProcessing || !this.hasStoredForm;
        
        if (this.hasStoredForm && !this.isProcessing) {
            this.pasteBtn.classList.remove('disabled');
        } else {
            this.pasteBtn.classList.add('disabled');
        }
    }

    showToast(type, title, message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;

        this.toastContainer.appendChild(toast);

        // Auto-supprimer après la durée spécifiée
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    openSettings() {
        // Ouvrir la page de paramètres
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    }

    openHelp() {
        // Ouvrir la page d'aide
        chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
    }

    // Fonction utilitaire pour exporter le JSON (accessible depuis la console)
    async exportCurrentFormData() {
        try {
            const result = await chrome.storage.local.get(['currentFormData']);
            if (result.currentFormData) {
                const jsonString = JSON.stringify(result.currentFormData, null, 2);
                console.log("=== DONNÉES DU FORMULAIRE COPIÉ ===");
                console.log(jsonString);
                console.log("=== FIN DES DONNÉES ===");
                console.log("💡 Sélectionnez le JSON ci-dessus et copiez-le avec Ctrl+C");
                
                return result.currentFormData;
            } else {
                console.log("❌ Aucune donnée de formulaire trouvée");
                return null;
            }
        } catch (error) {
            console.error("Erreur lors de l'export:", error);
            return null;
        }
    }

    // Fonction pour voir toutes les données stockées
    async debugStorage() {
        try {
            const result = await chrome.storage.local.get(null);
            console.log("=== TOUTES LES DONNÉES STOCKÉES ===");
            console.log(result);
            console.log("=== FIN DU DEBUG STORAGE ===");
            return result;
        } catch (error) {
            console.error("Erreur lors du debug:", error);
            return null;
        }
    }

    handleBackgroundMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'updateProgress':
                this.showProgress(message.percentage, message.text);
                break;
            case 'copyComplete':
                this.handleCopySuccess(message.data, message.tab);
                break;
            case 'pasteComplete':
                this.handlePasteSuccess();
                break;
            case 'error':
                this.handleError(message.title, message.message);
                break;
        }
    }

    // Utilitaires
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    }
}

// Variable globale pour accéder au popup depuis la console
let formCopyPopup;

// Initialiser le popup quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    formCopyPopup = new FormCopyPopup();
    
    // Exposer les fonctions utilitaires globalement pour la console
    window.exportFormData = () => formCopyPopup.exportCurrentFormData();
    window.debugStorage = () => formCopyPopup.debugStorage();
    
    console.log("🔧 FONCTIONS DE DEBUG DISPONIBLES:");
    console.log("   exportFormData() - Exporte le JSON du formulaire copié");
    console.log("   debugStorage() - Affiche toutes les données stockées");
    console.log("");
    console.log("🚀 MÉTHODE ALTERNATIVE SIMPLE:");
    console.log('   chrome.storage.local.get(["currentFormData"], (r) => console.log(JSON.stringify(r.currentFormData, null, 2)))');
    console.log("");
});