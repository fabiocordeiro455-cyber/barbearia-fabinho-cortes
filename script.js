document.addEventListener('DOMContentLoaded', () => {
    // State management
    let currentStep = 1;
    let isOwnerMode = false;
    const bookingData = {
        client: {},
        service: null,
        dateTime: {}
    };
    let currentPendingViewMode = 'list'; // 'list' or 'timeline'
    let currentTimelineDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for pending appointments timeline
    let ownerBookingTimelineDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for owner booking timeline

    // Constants
    const OWNER_WHATSAPP_NUMBER = '5511989963259';
    const OWNER_PASSWORD = '5063is'; 
    const LOGO_STORAGE_KEY = 'app_logo'; 
    const COVER_PHOTO_STORAGE_KEY = 'app_cover_photo'; 
    const APP_ICON_STORAGE_KEY = 'app_custom_icon'; 
    const OWNER_MENU_ORDER_KEY = 'owner_menu_order'; 
    const BUSINESS_HOURS_START_MINUTES = 10 * 60; 
    const BUSINESS_HOURS_END_MINUTES = 21 * 60; 
    const TIMELINE_SLOT_HEIGHT_PER_MINUTE = 2; 
    const SLOT_INTERVAL_MINUTES = 30; // Changed from 15 to 30 as per user request

    // Set CSS variables for consistent calculations
    document.documentElement.style.setProperty('--timeline-slot-height-per-minute', `${TIMELINE_SLOT_HEIGHT_PER_MINUTE}px`);
    document.documentElement.style.setProperty('--business-hours-start-minutes', `${BUSINESS_HOURS_START_MINUTES}`);
    document.documentElement.style.setProperty('--business-hours-end-minutes', `${BUSINESS_HOURS_END_MINUTES}`);
    const totalBusinessDurationMinutes = BUSINESS_HOURS_END_MINUTES - BUSINESS_HOURS_START_MINUTES;
    document.documentElement.style.setProperty('--timeline-total-content-height', `${totalBusinessDurationMinutes * TIMELINE_SLOT_HEIGHT_PER_MINUTE}px`);

    // Services Data (default, will be replaced by localStorage)
    const defaultServices = [
        { id: 1, name: 'Corte de Cabelo', duration: '30 min', price: 'R$ 50,00', durationMinutes: 30 },
        { id: 2, name: 'Barba', duration: '20 min', price: 'R$ 30,00', durationMinutes: 20 },
        { id: 3, name: 'Corte e Barba', duration: '50 min', price: 'R$ 75,00', durationMinutes: 50 },
        { id: 4, name: 'Hidratação Capilar', duration: '40 min', price: 'R$ 60,00', durationMinutes: 40 }
    ];

    // Define all owner menu items with default order and properties
    const defaultOwnerMenuItemsConfig = [
        { id: 'owner-booking', text: 'Fazer Agendamento' },
        { id: 'logo-management', text: 'Gestão de Logo' },
        { id: 'app-icon-management', text: 'Gestão de Ícone do Aplicativo' }, 
        { id: 'cover-photo-management', text: 'Gestão de Foto de Capa' },
        { id: 'client-management', text: 'Clientes' },
        { id: 'service-management', text: 'Serviços e Pacotes' },
        { id: 'completed-appointments-management', text: 'Agendamentos Concluídos' },
        { id: 'financial-management', text: 'Gestão Financeira' },
        { id: 'pending-appointments-display', text: 'Agendamentos Pendentes' },
        { id: 'menu-organization-management', text: 'Organizar Menu' }
    ];

    // Load data from localStorage
    let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    let services = JSON.parse(localStorage.getItem('services')) || defaultServices;
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let ownerMenuOrder = JSON.parse(localStorage.getItem(OWNER_MENU_ORDER_KEY)) || [];

    // --- Data Persistence Functions ---
    const saveAppointments = () => localStorage.setItem('appointments', JSON.stringify(appointments));
    const saveServices = () => localStorage.setItem('services', JSON.stringify(services));
    const saveClients = () => localStorage.setItem('clients', JSON.stringify(clients));
    const saveAppLogo = (dataUrl) => localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    const saveCoverPhoto = (dataUrl) => localStorage.setItem(COVER_PHOTO_STORAGE_KEY, dataUrl); 
    const saveAppIcon = (dataUrl) => localStorage.setItem(APP_ICON_STORAGE_KEY, dataUrl); 
    const saveOwnerMenuOrder = () => localStorage.setItem(OWNER_MENU_ORDER_KEY, JSON.stringify(ownerMenuOrder));

    // --- General Element Selectors ---
    const steps = document.querySelectorAll('.form-step');
    
    const completedAppointmentsContainer = document.getElementById('completed-appointments-container');
    const totalRevenueSpan = document.getElementById('total-revenue');
    const financialTransactionsList = document.getElementById('financial-transactions-list');
    // New selectors for financial summary
    const dailyRevenueSpan = document.getElementById('daily-revenue');
    const weeklyRevenueSpan = document.getElementById('weekly-revenue');
    const monthlyRevenueSpan = document.getElementById('monthly-revenue');

    // --- Mode Toggle Elements & Logic ---
    const ownerModeToggle = document.getElementById('owner-mode-toggle');
    const viewModeLabel = document.getElementById('view-mode-label');
    const clientView = document.getElementById('client-view');
    const ownerPanel = document.getElementById('owner-panel'); 
    const clientSelectionOwnerDiv = document.getElementById('client-selection-owner');

    // --- New: Owner Menu Elements ---
    const ownerMenuToggle = document.getElementById('owner-menu-toggle');
    const ownerSidebarMenu = document.getElementById('owner-sidebar-menu');
    const closeOwnerMenuBtn = document.getElementById('close-owner-menu');
    const ownerSidebarOverlay = document.getElementById('owner-sidebar-overlay');
    const ownerContentSections = document.querySelectorAll('#owner-panel .content-section');
    const ownerMenuItemsList = document.getElementById('owner-menu-items-list'); 
    let ownerMenuItems = document.querySelectorAll('#owner-sidebar-menu .menu-item'); 
    const ownerMainPanelTitle = document.getElementById('owner-main-panel-title');

    // --- Logo Management Elements ---
    const headerLogo = document.getElementById('header-logo');
    const logoPreview = document.getElementById('logo-preview');
    const logoUploadInput = document.getElementById('logo-upload-input');
    const removeLogoBtn = document.getElementById('remove-logo-btn');

    // --- Cover Photo Management Elements ---
    const clientCoverPhotoDisplay = document.getElementById('client-cover-photo-display'); 
    const clientCoverPhoto = document.getElementById('client-cover-photo'); 
    const coverPhotoPreview = document.getElementById('cover-photo-preview'); 
    const coverPhotoUploadInput = document.getElementById('cover-photo-upload-input'); 
    const removeCoverPhotoBtn = document.getElementById('remove-cover-photo-btn'); 

    // NEW: App Icon Management Elements
    const appleTouchIconLink = document.head.querySelector('link[rel="apple-touch-icon"]');
    const faviconLink = document.getElementById('dynamic-favicon');
    const appIconPreview = document.getElementById('app-icon-preview');
    const appIconUploadInput = document.getElementById('app-icon-upload-input');
    const removeAppIconBtn = document.getElementById('remove-app-icon-btn');

    // --- Menu Organization Elements ---
    const sortableMenuList = document.getElementById('sortable-menu-list');
    const saveMenuOrderBtn = document.getElementById('save-menu-order-btn');
    let draggedItem = null; 

    // --- Pending Appointments View Switch Elements ---
    const listViewBtn = document.getElementById('list-view-btn');
    const timelineViewBtn = document.getElementById('timeline-view-btn');
    const appointmentList = document.getElementById('appointment-list'); 
    const timelineView = document.getElementById('timeline-view'); 
    const timelineDateSelectionContainer = document.getElementById('timeline-date-selection-container');
    const timelineDatePicker = document.getElementById('timeline-date-picker');
    const timelineTimeLabels = timelineView.querySelector('.time-labels');
    const timelineSlotsArea = timelineView.querySelector('.timeline-slots-area');
    const currentTimeIndicator = timelineView.querySelector('.current-time-indicator');
    let currentTimeIndicatorInterval;

    // --- Owner Booking Timeline Elements (Step 3) ---
    const ownerDateSelectionContainer = document.getElementById('owner-date-selection-container');
    const ownerDatePicker = document.getElementById('owner-date-picker');
    const ownerTimelineView = document.getElementById('owner-timeline-view');
    const ownerTimelineTimeLabels = ownerTimelineView.querySelector('.time-labels');
    const ownerTimelineSlotsArea = ownerTimelineView.querySelector('.timeline-slots-area');
    const ownerCurrentTimeIndicator = ownerTimelineView.querySelector('.current-time-indicator');
    let ownerBookingTimelineInterval; 

    ownerModeToggle.addEventListener('change', () => {
        if (ownerModeToggle.checked) {
            const password = prompt("Digite a senha para acessar o Modo Proprietário:");
            if (password === OWNER_PASSWORD) {
                isOwnerMode = true;
                toggleView();
            } else {
                alert("Senha incorreta!");
                ownerModeToggle.checked = false; 
                isOwnerMode = false;
                toggleView(); 
            }
        } else {
            isOwnerMode = false;
            toggleView();
        }
    });

    const toggleView = () => {
        if (isOwnerMode) {
            viewModeLabel.textContent = "Modo Proprietário";
            clientView.style.display = 'none'; 
            ownerPanel.style.display = 'block'; 
            ownerMenuToggle.style.display = 'flex'; 
            clientSelectionOwnerDiv.style.display = 'none'; 

            // Load and render the owner menu based on stored order
            loadOwnerMenuOrder();
            renderOwnerSidebarMenu(); 
            
            // Set default active section for owner mode
            showOwnerSection(ownerMenuOrder[0] || 'owner-booking'); 
            
            populateClientDropdown();
            loadLogo();
            loadAppIcon(); 
        } else {
            viewModeLabel.textContent = "Modo Cliente";
            clientView.style.display = 'block'; 
            document.getElementById('booking-container').style.display = 'block'; 
            ownerPanel.style.display = 'none'; 
            ownerMenuToggle.style.display = 'none'; 
            clientSelectionOwnerDiv.style.display = 'none'; 
            ownerSidebarMenu.classList.remove('active'); 
            ownerSidebarOverlay.classList.remove('active'); 
            loadCoverPhoto(); 
            loadAppIcon(); 
        }
        resetBookingForm();
    };

    // --- Owner Menu Functions ---

    // Function to load menu order from localStorage or use default, ensuring all items are present
    const loadOwnerMenuOrder = () => {
        const storedOrder = JSON.parse(localStorage.getItem(OWNER_MENU_ORDER_KEY));
        const defaultOrderIds = defaultOwnerMenuItemsConfig.map(item => item.id);

        if (storedOrder && Array.isArray(storedOrder)) {
            // Filter out any invalid/old IDs and add new default ones that might be missing
            ownerMenuOrder = defaultOrderIds.filter(id => storedOrder.includes(id));
            const newItems = defaultOrderIds.filter(id => !ownerMenuOrder.includes(id));
            ownerMenuOrder = [...ownerMenuOrder, ...newItems]; 
        } else {
            ownerMenuOrder = defaultOrderIds;
        }
        saveOwnerMenuOrder(); 
    };

    // Function to render the owner sidebar menu based on ownerMenuOrder
    const renderOwnerSidebarMenu = () => {
        ownerMenuItemsList.innerHTML = ''; 
        ownerMenuOrder.forEach(sectionId => {
            const menuItemConfig = defaultOwnerMenuItemsConfig.find(config => config.id === sectionId);
            if (menuItemConfig) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'menu-item';
                a.dataset.sectionId = menuItemConfig.id;
                a.textContent = menuItemConfig.text;
                li.appendChild(a);
                ownerMenuItemsList.appendChild(li);
            }
        });
        ownerMenuItems = document.querySelectorAll('#owner-sidebar-menu .menu-item'); 
        addOwnerMenuEventListeners(); 
    };

    // Function to show the selected section in the owner panel
    const showOwnerSection = (sectionId) => {
        ownerContentSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        clientView.style.display = 'none';
        document.getElementById('booking-container').style.display = 'none';
        clientCoverPhotoDisplay.style.display = 'none';
        clientSelectionOwnerDiv.style.display = 'none';

        // Clear any active intervals for current time indicator
        if (currentTimeIndicatorInterval) clearInterval(currentTimeIndicatorInterval);
        if (ownerBookingTimelineInterval) clearInterval(ownerBookingTimelineInterval);

        if (sectionId === 'owner-booking') {
            ownerMainPanelTitle.textContent = "Novo Agendamento";
            clientView.style.display = 'block';
            document.getElementById('booking-container').style.display = 'block';
            clientSelectionOwnerDiv.style.display = 'block';
            loadCoverPhoto();
            resetBookingForm();
        } else {
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';

                if (sectionId === 'pending-appointments-display') {
                    renderPendingAppointments(); 
                } else if (sectionId === 'completed-appointments-management') {
                    renderCompletedAppointments();
                } else if (sectionId === 'financial-management') {
                    renderFinancialSummary();
                } else if (sectionId === 'client-management') {
                    renderClients();
                } else if (sectionId === 'service-management') {
                    renderServicesForManagement();
                } else if (sectionId === 'menu-organization-management') {
                    renderSortableMenuList(); 
                }
            }
            const menuItem = defaultOwnerMenuItemsConfig.find(item => item.id === sectionId);
            ownerMainPanelTitle.textContent = menuItem ? menuItem.text : "Painel do Proprietário";
        }
    };

    // Helper to add listeners to owner menu items (called after rendering)
    const addOwnerMenuEventListeners = () => {
        ownerMenuItems.forEach(item => {
            item.removeEventListener('click', handleOwnerMenuItemClick); 
            item.addEventListener('click', handleOwnerMenuItemClick);
        });
    };

    const handleOwnerMenuItemClick = (e) => {
        e.preventDefault();
        const sectionId = e.target.dataset.sectionId;
        showOwnerSection(sectionId);
        ownerSidebarMenu.classList.remove('active');
        ownerSidebarOverlay.classList.remove('active');
    };

    // --- Owner Menu Event Listeners ---
    ownerMenuToggle.addEventListener('click', () => {
        ownerSidebarMenu.classList.add('active');
        ownerSidebarOverlay.classList.add('active');
    });

    closeOwnerMenuBtn.addEventListener('click', () => {
        ownerSidebarMenu.classList.remove('active');
        ownerSidebarOverlay.classList.remove('active');
    });

    ownerSidebarOverlay.addEventListener('click', () => {
        ownerSidebarMenu.classList.remove('active');
        ownerSidebarOverlay.classList.remove('active');
    });

    // --- Menu Organization Functions ---
    const renderSortableMenuList = () => {
        sortableMenuList.innerHTML = '';
        ownerMenuOrder.forEach(sectionId => {
            const menuItemConfig = defaultOwnerMenuItemsConfig.find(config => config.id === sectionId);
            if (menuItemConfig) {
                const li = document.createElement('li');
                li.className = 'sortable-list-item';
                li.dataset.sectionId = menuItemConfig.id;
                li.draggable = true;
                li.innerHTML = `<span>${menuItemConfig.text}</span>`;
                sortableMenuList.appendChild(li);
            }
        });
        addDragAndDropListeners();
    };

    const addDragAndDropListeners = () => {
        const items = sortableMenuList.querySelectorAll('.sortable-list-item');
        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    };

    const handleDragStart = (e) => {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.sectionId);
        setTimeout(() => {
            draggedItem.classList.add('dragging');
        }, 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
        const targetItem = e.target.closest('.sortable-list-item');
        if (targetItem && targetItem !== draggedItem) {
            const boundingBox = targetItem.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);
            if (e.clientY - offset > 0) {
                sortableMenuList.insertBefore(draggedItem, targetItem.nextSibling);
            } else {
                sortableMenuList.insertBefore(draggedItem, targetItem);
            }
        }
    };

    const handleDragLeave = (e) => {
        // No specific visual feedback for dragleave needed with current approach
    };

    const handleDrop = (e) => {
        e.preventDefault();
        // The DOM manipulation already happened in dragover
    };

    const handleDragEnd = (e) => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    };

    saveMenuOrderBtn.addEventListener('click', () => {
        const newOrder = Array.from(sortableMenuList.children).map(item => item.dataset.sectionId);
        ownerMenuOrder = newOrder;
        saveOwnerMenuOrder();
        renderOwnerSidebarMenu(); 
        alert('Ordem do menu salva com sucesso!');
    });

    // --- Logo Management Functions ---
    const loadLogo = () => {
        const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
        if (storedLogo) {
            headerLogo.src = storedLogo;
            logoPreview.src = storedLogo;
            headerLogo.style.display = 'block';
            logoPreview.style.display = 'block';
        } else {
            // Default to provided asset logo
            headerLogo.src = 'logo para o app.png';
            logoPreview.src = 'logo para o app.png';
            headerLogo.style.display = 'block';
            logoPreview.style.display = 'none'; 
        }
    };

    logoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                saveAppLogo(dataUrl);
                loadLogo(); 
                alert('Logo carregada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    });

    removeLogoBtn.addEventListener('click', () => {
        localStorage.removeItem(LOGO_STORAGE_KEY);
        loadLogo(); 
        alert('Logo removida com sucesso!');
    });

    // --- Cover Photo Management Functions ---
    const loadCoverPhoto = () => {
        const storedCoverPhoto = localStorage.getItem(COVER_PHOTO_STORAGE_KEY);
        if (storedCoverPhoto) {
            clientCoverPhoto.src = storedCoverPhoto;
            coverPhotoPreview.src = storedCoverPhoto;
            clientCoverPhotoDisplay.style.display = 'block';
            coverPhotoPreview.style.display = 'block';
        } else {
            clientCoverPhoto.src = ''; 
            coverPhotoPreview.src = '';
            clientCoverPhotoDisplay.style.display = 'none';
            coverPhotoPreview.style.display = 'none';
        }
    };

    coverPhotoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                saveCoverPhoto(dataUrl);
                loadCoverPhoto(); 
                alert('Foto de capa carregada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    });

    removeCoverPhotoBtn.addEventListener('click', () => {
        localStorage.removeItem(COVER_PHOTO_STORAGE_KEY);
        loadCoverPhoto();
        alert('Foto de capa removida com sucesso!');
    });

    // --- App Icon Management Functions ---
    const loadAppIcon = () => {
        const storedAppIcon = localStorage.getItem(APP_ICON_STORAGE_KEY);
        if (storedAppIcon) {
            // Update manifest for PWA (needs a full reload/reinstall to take effect completely)
            // For immediate visual feedback on page
            appleTouchIconLink.href = storedAppIcon;
            faviconLink.href = storedAppIcon;
            appIconPreview.src = storedAppIcon;
            appIconPreview.style.display = 'block';

            // Also update the manifest.json stored in service worker cache if possible (complex for dynamic changes)
            // For now, we update the in-memory manifest data and rely on browser to re-evaluate after update.
            updateManifestIcons(storedAppIcon);

        } else {
            // Revert to default
            appleTouchIconLink.href = 'fabinho_logo_apple.png';
            faviconLink.href = 'fabinho_logo_192.png';
            appIconPreview.src = 'fabinho_logo_192.png';
            appIconPreview.style.display = 'block'; 

            // Revert manifest icons to default
            updateManifestIcons('fabinho_logo_192.png', 'fabinho_logo_512.png');
        }
    };

    const updateManifestIcons = (icon192, icon512 = icon192) => {
        // This attempts to dynamically update the manifest in a way that might be picked up
        // by the browser for PWA icons. However, for a true PWA icon change, the manifest file
        // itself often needs to be updated and the PWA reinstalled/updated by the user.
        // This is primarily for updating the visual representation within the web page.

        // Get the current manifest link
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            fetch(manifestLink.href)
                .then(response => response.json())
                .then(manifest => {
                    const newIcons = [
                        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                    ];
                    // Overwrite icons in the fetched manifest
                    manifest.icons = newIcons;

                    // Create a Blob from the updated manifest object
                    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
                    // Create an object URL for the Blob
                    const manifestBlobUrl = URL.createObjectURL(manifestBlob);

                    // Update the manifest link's href to point to the new Blob URL
                    manifestLink.href = manifestBlobUrl;

                    // Clean up the old URL object to prevent memory leaks, after a short delay
                    // as the browser might still be using the old one.
                    const oldManifestUrl = manifestLink.dataset.originalHref;
                    if (oldManifestUrl && oldManifestUrl.startsWith('blob:')) {
                        setTimeout(() => URL.revokeObjectURL(oldManifestUrl), 5000); // Revoke after 5 seconds
                    }
                    manifestLink.dataset.originalHref = manifestBlobUrl; // Store the new blob URL
                })
                .catch(error => console.error("Error updating manifest icons:", error));
        }
    };

    appIconUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                saveAppIcon(dataUrl);
                loadAppIcon(); 
                alert('Ícone do aplicativo carregado com sucesso! (Pode requerer reinstalação do PWA para atualização completa)');
            };
            reader.readAsDataURL(file);
        }
    });

    removeAppIconBtn.addEventListener('click', () => {
        localStorage.removeItem(APP_ICON_STORAGE_KEY);
        loadAppIcon(); 
        alert('Ícone do aplicativo removido com sucesso!');
    });

    // --- Utility Functions ---

    const formatDate = (dateString) => {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed as local time
        return date.toLocaleDateString('pt-BR', options);
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    // --- Booking Flow Functions (Client and Owner) ---

    const showStep = (stepNumber, ownerMode = false) => {
        const currentSteps = ownerMode ? document.querySelectorAll('#owner-booking-container .form-step') : steps;
        currentSteps.forEach((step, index) => {
            if (index + 1 === stepNumber) {
                step.classList.add('active-step');
                step.style.display = 'block';
            } else {
                step.classList.remove('active-step');
                step.style.display = 'none';
            }
        });
        currentStep = stepNumber;

        // Specific actions for each step
        if (stepNumber === 2) {
            renderServices(ownerMode ? 'owner-service-list' : 'service-list');
        } else if (stepNumber === 3) {
            if (ownerMode) {
                renderOwnerDatePicker();
                renderOwnerTimelineSlots(ownerBookingTimelineDate);
            } else {
                renderDatePicker();
                document.getElementById('time-selection-container').style.display = 'none'; // Hide time slots until date is picked
            }
        }
    };

    const resetBookingForm = (ownerMode = false) => {
        const clientForm = ownerMode ? document.getElementById('owner-client-info-form') : document.getElementById('client-info-form');
        clientForm.reset();
        
        bookingData.client = {};
        bookingData.service = null;
        bookingData.dateTime = {};

        // Reset service selection
        const serviceList = ownerMode ? document.getElementById('owner-service-list') : document.getElementById('service-list');
        serviceList.querySelectorAll('.service-item').forEach(item => item.classList.remove('selected'));
        
        // Reset date/time selection
        const datePicker = ownerMode ? document.getElementById('owner-date-picker') : document.getElementById('date-picker');
        datePicker.querySelectorAll('.date-option').forEach(item => item.classList.remove('selected'));
        const timeSlots = ownerMode ? ownerTimelineSlotsArea : document.getElementById('time-slots');
        if (timeSlots) timeSlots.innerHTML = ''; // Clear time slots
        if (document.getElementById('time-selection-container')) {
            document.getElementById('time-selection-container').style.display = 'none';
        }

        // Disable nav buttons
        const nextToStep2 = ownerMode ? document.getElementById('owner-next-to-step-2') : document.getElementById('next-to-step-2');
        const nextToStep3 = ownerMode ? document.getElementById('owner-next-to-step-3') : document.getElementById('next-to-step-3');
        const submitBooking = ownerMode ? document.getElementById('owner-submit-booking') : document.getElementById('submit-booking');
        
        if (nextToStep2) nextToStep2.disabled = false; // Always enabled for step 1 initially
        if (nextToStep3) nextToStep3.disabled = true;
        if (submitBooking) submitBooking.disabled = true;

        showStep(1, ownerMode);
    };

    // --- Client Management ---
    const addClientForm = document.getElementById('add-client-form');
    const newClientFirstnameInput = document.getElementById('new-client-firstname');
    const newClientLastnameInput = document.getElementById('new-client-lastname');
    const newClientWhatsappInput = document.getElementById('new-client-whatsapp');
    const clientListUl = document.getElementById('client-list');
    const existingClientSelect = document.getElementById('existing-client-select');
    const ownerExistingClientSelect = document.getElementById('owner-existing-client-select');

    const renderClients = () => {
        clientListUl.innerHTML = '';
        clients.forEach(client => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details">
                    <span class="item-name">${client.firstName} ${client.lastName}</span>
                    <span class="item-sub-details">WhatsApp: ${client.whatsapp}</span>
                </div>
                <button class="delete-btn" data-client-id="${client.id}">Excluir</button>
            `;
            clientListUl.appendChild(li);
        });

        clientListUl.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const clientId = e.target.dataset.clientId;
                clients = clients.filter(c => c.id !== clientId);
                saveClients();
                renderClients();
                populateClientDropdown();
            });
        });
    };

    const populateClientDropdown = () => {
        existingClientSelect.innerHTML = '<option value="">-- Novo Cliente --</option>';
        ownerExistingClientSelect.innerHTML = '<option value="">-- Novo Cliente --</option>';

        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.firstName} ${client.lastName} (${client.whatsapp})`;
            existingClientSelect.appendChild(option);

            const ownerOption = option.cloneNode(true);
            ownerExistingClientSelect.appendChild(ownerOption);
        });
    };

    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newClient = {
            id: generateId(),
            firstName: newClientFirstnameInput.value,
            lastName: newClientLastnameInput.value,
            whatsapp: newClientWhatsappInput.value,
        };
        clients.push(newClient);
        saveClients();
        renderClients();
        populateClientDropdown();
        addClientForm.reset();
        alert('Cliente adicionado com sucesso!');
    });

    // --- Services Management ---
    const addServiceForm = document.getElementById('add-service-form');
    const newServiceNameInput = document.getElementById('new-service-name');
    const newServiceDurationInput = document.getElementById('new-service-duration');
    const newServicePriceInput = document.getElementById('new-service-price');
    const serviceManagementListUl = document.getElementById('service-management-list');

    const renderServices = (targetElementId) => {
        const serviceListContainer = document.getElementById(targetElementId);
        if (!serviceListContainer) return;

        serviceListContainer.innerHTML = '';
        services.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.dataset.serviceId = service.id;
            serviceItem.innerHTML = `
                <div class="name">${service.name}</div>
                <div class="details">${service.duration} - ${service.price}</div>
            `;
            serviceItem.addEventListener('click', () => {
                serviceListContainer.querySelectorAll('.service-item').forEach(item => item.classList.remove('selected'));
                serviceItem.classList.add('selected');
                bookingData.service = service;
                // Enable next button for step 2
                const nextBtn = targetElementId === 'owner-service-list' ? document.getElementById('owner-next-to-step-3') : document.getElementById('next-to-step-3');
                if (nextBtn) nextBtn.disabled = false;
            });
            serviceListContainer.appendChild(serviceItem);
        });
    };

    const renderServicesForManagement = () => {
        serviceManagementListUl.innerHTML = '';
        services.forEach(service => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details">
                    <span class="item-name">${service.name}</span>
                    <span class="item-sub-details">Duração: ${service.durationMinutes} min - Preço: ${service.price}</span>
                </div>
                <button class="delete-btn" data-service-id="${service.id}">Excluir</button>
            `;
            serviceManagementListUl.appendChild(li);
        });

        serviceManagementListUl.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const serviceId = e.target.dataset.serviceId;
                services = services.filter(s => s.id !== serviceId);
                saveServices();
                renderServicesForManagement();
                // Re-render services in booking forms if they are open
                renderServices('service-list');
                renderServices('owner-service-list');
            });
        });
    };

    addServiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newService = {
            id: generateId(),
            name: newServiceNameInput.value,
            duration: `${newServiceDurationInput.value} min`, // Display format
            durationMinutes: parseInt(newServiceDurationInput.value), // Numeric for calculations
            price: `R$ ${parseFloat(newServicePriceInput.value).toFixed(2).replace('.', ',')}`, // Display format
            priceValue: parseFloat(newServicePriceInput.value), // Numeric for calculations
        };
        services.push(newService);
        saveServices();
        renderServicesForManagement();
        renderServices('service-list'); // Update client booking view
        renderServices('owner-service-list'); // Update owner booking view
        addServiceForm.reset();
        alert('Serviço adicionado com sucesso!');
    });

    // --- Date Picker Logic (Client Mode) ---
    const datePicker = document.getElementById('date-picker');
    const timeSlotsContainer = document.getElementById('time-slots');
    const timeSelectionContainer = document.getElementById('time-selection-container');

    const renderDatePicker = () => {
        datePicker.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        for (let i = 0; i < 7; i++) { // Next 7 days
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dateOption = document.createElement('div');
            dateOption.className = 'date-option';
            dateOption.dataset.date = date.toISOString().split('T')[0]; // YYYY-MM-DD
            dateOption.innerHTML = `
                <span class="day-of-week">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span class="date-str">${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
            `;
            dateOption.addEventListener('click', () => {
                datePicker.querySelectorAll('.date-option').forEach(item => item.classList.remove('selected'));
                dateOption.classList.add('selected');
                bookingData.dateTime.date = dateOption.dataset.date;
                timeSelectionContainer.style.display = 'block'; // Show time slots
                renderTimeSlots(dateOption.dataset.date);
                // Disable submit until time is picked
                document.getElementById('submit-booking').disabled = true;
            });
            datePicker.appendChild(dateOption);
        }
    };

    const renderTimeSlots = (selectedDate) => {
        timeSlotsContainer.innerHTML = '';
        const serviceDuration = bookingData.service ? bookingData.service.durationMinutes : 0;
        if (serviceDuration === 0) {
            timeSlotsContainer.innerHTML = '<p>Por favor, selecione um serviço primeiro.</p>';
            return;
        }

        const now = new Date();
        // Calculate the minimum booking time: current time + 30 minutes
        const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes in milliseconds
        
        for (let minutes = BUSINESS_HOURS_START_MINUTES; minutes < BUSINESS_HOURS_END_MINUTES; minutes += SLOT_INTERVAL_MINUTES) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            
            const slotStart = new Date(`${selectedDate}T${timeString}:00`);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);

            // Check if slot is in the past or within the next 30 minutes
            // This condition now correctly disables all slots on past dates as well,
            // because `slotStart` for any time on a past date will be less than `minBookingTime`.
            const isInPastOrTooSoon = (slotStart < minBookingTime);

            // Check for overlaps with existing appointments
            const isBooked = appointments.some(appt => {
                if (appt.date !== selectedDate) return false;
                const apptStart = new Date(`${appt.date}T${appt.time}:00`);
                const apptEnd = new Date(apptStart.getTime() + appt.service.durationMinutes * 60 * 1000);
                
                // Check if new slot overlaps with existing appointment
                return (slotStart < apptEnd && slotEnd > apptStart);
            });

            const timeSlot = document.createElement('div');
            timeSlot.className = `time-slot ${isInPastOrTooSoon || isBooked ? 'disabled' : ''}`;
            timeSlot.dataset.time = timeString;
            timeSlot.textContent = timeString;

            if (!isInPastOrTooSoon && !isBooked) {
                timeSlot.addEventListener('click', () => {
                    timeSlotsContainer.querySelectorAll('.time-slot').forEach(item => item.classList.remove('selected'));
                    timeSlot.classList.add('selected');
                    bookingData.dateTime.time = timeSlot.dataset.time;
                    document.getElementById('submit-booking').disabled = false;
                });
            }
            timeSlotsContainer.appendChild(timeSlot);
        }
    };

    // --- Owner Booking Timeline (Step 3) ---
    const renderOwnerDatePicker = () => {
        ownerDatePicker.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) { // Next 7 days
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dateOption = document.createElement('div');
            dateOption.className = 'date-option';
            dateOption.dataset.date = date.toISOString().split('T')[0];
            dateOption.innerHTML = `
                <span class="day-of-week">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span class="date-str">${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
            `;
            
            if (dateOption.dataset.date === ownerBookingTimelineDate) {
                dateOption.classList.add('selected');
            }

            dateOption.addEventListener('click', () => {
                ownerDatePicker.querySelectorAll('.date-option').forEach(item => item.classList.remove('selected'));
                dateOption.classList.add('selected');
                ownerBookingTimelineDate = dateOption.dataset.date;
                renderOwnerTimelineSlots(ownerBookingTimelineDate);
                document.getElementById('owner-timeline-view').style.display = 'block';
                // Disable submit until a slot is selected
                document.getElementById('owner-submit-booking').disabled = true;
            });
            ownerDatePicker.appendChild(dateOption);
        }
    };

    const renderOwnerTimelineSlots = (selectedDate) => {
        ownerTimelineTimeLabels.innerHTML = '';
        ownerTimelineSlotsArea.innerHTML = '';

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const isCurrentDate = (selectedDate === today);

        // Calculate the minimum booking time: current time + 30 minutes
        const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes in milliseconds

        // Generate time labels (e.g., 10:00, 11:00)
        for (let h = Math.floor(BUSINESS_HOURS_START_MINUTES / 60); h <= Math.floor(BUSINESS_HOURS_END_MINUTES / 60); h++) {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label-item';
            timeLabel.textContent = `${String(h).padStart(2, '0')}:00`;
            ownerTimelineTimeLabels.appendChild(timeLabel);
        }

        const serviceDuration = bookingData.service ? bookingData.service.durationMinutes : 0;
        if (serviceDuration === 0) {
            ownerTimelineSlotsArea.innerHTML = '<p style="padding: 10px;">Por favor, selecione um serviço primeiro.</p>';
            return;
        }

        // Render individual slots
        for (let minutes = BUSINESS_HOURS_START_MINUTES; minutes < BUSINESS_HOURS_END_MINUTES; minutes += SLOT_INTERVAL_MINUTES) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            const slotIdentifier = `${selectedDate}T${timeString}`;

            const slotStart = new Date(`${slotIdentifier}:00`);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);

            // Check if slot is in the past or within the next 30 minutes
            const isInPast = (slotStart < minBookingTime);
            
            // Check for overlaps with existing appointments
            const isBooked = appointments.some(appt => {
                if (appt.date !== selectedDate) return false;
                const apptStart = new Date(`${appt.date}T${appt.time}:00`);
                const apptEnd = new Date(apptStart.getTime() + appt.service.durationMinutes * 60 * 1000);
                
                // Check if new slot overlaps with existing appointment
                return (slotStart < apptEnd && slotEnd > apptStart);
            });

            // Calculate position and height
            const startOffsetMinutes = minutes - BUSINESS_HOURS_START_MINUTES;
            const topPosition = startOffsetMinutes * TIMELINE_SLOT_HEIGHT_PER_MINUTE;
            const slotHeight = serviceDuration * TIMELINE_SLOT_HEIGHT_PER_MINUTE;

            const slotElement = document.createElement('div');
            slotElement.className = `owner-timeline-slot ${isInPast || isBooked ? 'booked' : 'available'}`;
            slotElement.dataset.time = timeString;
            slotElement.style.top = `${topPosition}px`;
            slotElement.style.height = `${slotHeight}px`;

            if (isInPast) {
                 slotElement.innerHTML = `<span class="time-display">${timeString}</span><span class="details-display">Passado</span>`;
            } else if (isBooked) {
                // Find the conflicting appointment(s)
                const conflictingAppointments = appointments.filter(appt => {
                    if (appt.date !== selectedDate) return false;
                    const apptStart = new Date(`${appt.date}T${appt.time}:00`);
                    const apptEnd = new Date(apptStart.getTime() + appt.service.durationMinutes * 60 * 1000);
                    return (slotStart < apptEnd && slotEnd > apptStart);
                });
                const firstConflict = conflictingAppointments[0]; // Just show the first one
                slotElement.innerHTML = `
                    <span class="time-display">${timeString} - ${formatTime(slotEnd.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}))}</span>
                    <span class="details-display">${firstConflict.client.firstName} (${firstConflict.service.name})</span>
                `;
            } else {
                slotElement.innerHTML = `<span class="time-display">${timeString} - ${formatTime(slotEnd.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}))}</span><span class="details-display">Disponível</span>`;
                slotElement.addEventListener('click', () => {
                    ownerTimelineSlotsArea.querySelectorAll('.owner-timeline-slot').forEach(item => item.classList.remove('selected'));
                    slotElement.classList.add('selected');
                    bookingData.dateTime.time = timeString;
                    document.getElementById('owner-submit-booking').disabled = false;
                });
            }
            ownerTimelineSlotsArea.appendChild(slotElement);
        }

        // Display timeline view and update current time indicator
        document.getElementById('owner-timeline-view').style.display = 'grid';
        updateCurrentTimeIndicator(ownerCurrentTimeIndicator, selectedDate);
        if (ownerBookingTimelineInterval) clearInterval(ownerBookingTimelineInterval);
        ownerBookingTimelineInterval = setInterval(() => updateCurrentTimeIndicator(ownerCurrentTimeIndicator, selectedDate), 60 * 1000); // Update every minute
    };

    // --- Appointment Management ---
    document.getElementById('next-to-step-2').addEventListener('click', () => {
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const whatsapp = document.getElementById('whatsapp').value;

        if (!firstName || !lastName || !whatsapp) {
            alert('Por favor, preencha todos os campos do cliente.');
            return;
        }

        // Check if client exists, otherwise add new
        let existingClient = clients.find(c => c.firstName === firstName && c.lastName === lastName && c.whatsapp === whatsapp);
        if (!existingClient) {
            existingClient = { id: generateId(), firstName, lastName, whatsapp };
            clients.push(existingClient);
            saveClients();
            populateClientDropdown(); // Update dropdowns if new client is added
        }
        bookingData.client = existingClient;
        showStep(2);
    });

    document.getElementById('prev-to-step-1').addEventListener('click', () => {
        document.getElementById('next-to-step-3').disabled = true; // Disable next step 3 button
        showStep(1);
    });

    document.getElementById('next-to-step-3').addEventListener('click', () => {
        if (!bookingData.service) {
            alert('Por favor, selecione um serviço.');
            return;
        }
        document.getElementById('submit-booking').disabled = true; // Disable submit until date/time picked
        showStep(3);
    });

    document.getElementById('prev-to-step-2').addEventListener('click', () => {
        document.getElementById('submit-booking').disabled = true; // Disable submit button
        showStep(2);
    });

    document.getElementById('submit-booking').addEventListener('click', () => {
        if (!bookingData.client.id || !bookingData.service || !bookingData.dateTime.date || !bookingData.dateTime.time) {
            alert('Por favor, preencha todas as informações do agendamento.');
            return;
        }

        const newAppointment = {
            id: generateId(),
            client: bookingData.client,
            service: bookingData.service,
            date: bookingData.dateTime.date,
            time: bookingData.dateTime.time,
            status: 'pending' // 'pending' or 'completed'
        };
        appointments.push(newAppointment);
        saveAppointments();
        showStep(4); // Confirmation step

        // Generate WhatsApp link for owner notification
        const message = encodeURIComponent(`Novo agendamento!\n\nCliente: ${bookingData.client.firstName} ${bookingData.client.lastName}\nWhatsApp: ${bookingData.client.whatsapp}\nServiço: ${bookingData.service.name}\nData: ${formatDate(bookingData.dateTime.date)}\nHorário: ${bookingData.dateTime.time}`);
        document.getElementById('whatsapp-owner-notify-btn').href = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${message}`;
    });

    document.getElementById('new-booking').addEventListener('click', () => {
        resetBookingForm();
    });

    // --- Owner Booking Form Handlers ---
    document.getElementById('owner-existing-client-select').addEventListener('change', (e) => {
        const clientId = e.target.value;
        if (clientId) {
            const selectedClient = clients.find(c => c.id === clientId);
            document.getElementById('owner-first-name').value = selectedClient.firstName;
            document.getElementById('owner-last-name').value = selectedClient.lastName;
            document.getElementById('owner-whatsapp').value = selectedClient.whatsapp;
            bookingData.client = selectedClient;
        } else {
            // New Client
            document.getElementById('owner-client-info-form').reset();
            bookingData.client = {};
        }
    });

    document.getElementById('owner-next-to-step-2').addEventListener('click', () => {
        const firstName = document.getElementById('owner-first-name').value;
        const lastName = document.getElementById('owner-last-name').value;
        const whatsapp = document.getElementById('owner-whatsapp').value;

        if (!firstName || !lastName || !whatsapp) {
            alert('Por favor, preencha todos os campos do cliente.');
            return;
        }

        let existingClient = clients.find(c => c.firstName === firstName && c.lastName === lastName && c.whatsapp === whatsapp);
        if (!existingClient) {
            existingClient = { id: generateId(), firstName, lastName, whatsapp };
            clients.push(existingClient);
            saveClients();
            populateClientDropdown();
        }
        bookingData.client = existingClient;
        showStep(2, true); // Owner mode step 2
    });

    document.getElementById('owner-prev-to-step-1').addEventListener('click', () => {
        document.getElementById('owner-next-to-step-3').disabled = true;
        showStep(1, true);
    });

    document.getElementById('owner-next-to-step-3').addEventListener('click', () => {
        if (!bookingData.service) {
            alert('Por favor, selecione um serviço.');
            return;
        }
        document.getElementById('owner-submit-booking').disabled = true;
        showStep(3, true); // Owner mode step 3
    });

    document.getElementById('owner-prev-to-step-2').addEventListener('click', () => {
        document.getElementById('owner-submit-booking').disabled = true;
        showStep(2, true);
    });

    document.getElementById('owner-submit-booking').addEventListener('click', () => {
        if (!bookingData.client.id || !bookingData.service || !bookingData.dateTime.date || !bookingData.dateTime.time) {
            alert('Por favor, preencha todas as informações do agendamento.');
            return;
        }

        const newAppointment = {
            id: generateId(),
            client: bookingData.client,
            service: bookingData.service,
            date: bookingData.dateTime.date,
            time: bookingData.dateTime.time,
            status: 'pending'
        };
        appointments.push(newAppointment);
        saveAppointments();
        showStep(4, true); // Owner mode confirmation step

        const message = encodeURIComponent(`Novo agendamento!\n\nCliente: ${bookingData.client.firstName} ${bookingData.client.lastName}\nWhatsApp: ${bookingData.client.whatsapp}\nServiço: ${bookingData.service.name}\nData: ${formatDate(bookingData.dateTime.date)}\nHorário: ${bookingData.dateTime.time}`);
        document.getElementById('owner-whatsapp-owner-notify-btn').href = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${message}`;
    });

    document.getElementById('owner-new-booking').addEventListener('click', () => {
        resetBookingForm(true);
    });

    // --- Pending Appointments Display ---
    const renderPendingAppointments = () => {
        if (currentPendingViewMode === 'list') {
            renderPendingAppointmentsList();
        } else {
            renderPendingAppointmentsTimeline(currentTimelineDate);
        }
    };

    const renderPendingAppointmentsList = () => {
        appointmentList.innerHTML = '';
        appointmentList.classList.add('active-view');
        timelineView.classList.remove('active-view');
        timelineView.style.display = 'none';
        timelineDateSelectionContainer.style.display = 'none';
        
        const pending = appointments.filter(appt => appt.status === 'pending')
                                    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

        if (pending.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty-message';
            li.textContent = 'Nenhum agendamento pendente.';
            appointmentList.appendChild(li);
            return;
        }

        pending.forEach(appt => {
            const li = document.createElement('li');
            li.className = 'appointment-item';
            li.innerHTML = `
                <div class="details">
                    <span class="client-name">${appt.client.firstName} ${appt.client.lastName}</span>
                    <span class="service-name">${appt.service.name} (${appt.service.duration})</span>
                    <span class="datetime">${formatDate(appt.date)} às ${appt.time}</span>
                </div>
                <div class="actions">
                    <button class="complete-btn" data-id="${appt.id}">Concluir</button>
                    <button class="delete-btn" data-id="${appt.id}">Excluir</button>
                </div>
            `;
            appointmentList.appendChild(li);
        });

        appointmentList.querySelectorAll('.complete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const apptIndex = appointments.findIndex(appt => appt.id === id);
                if (apptIndex > -1) {
                    appointments[apptIndex].status = 'completed';
                    appointments[apptIndex].completionDate = new Date().toISOString().split('T')[0]; // Record completion date
                    saveAppointments();
                    renderPendingAppointments(); // Re-render current view
                    renderCompletedAppointments(); // Update completed list
                    renderFinancialSummary(); // Update financial summary
                }
            });
        });

        appointmentList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                appointments = appointments.filter(appt => appt.id !== id);
                saveAppointments();
                renderPendingAppointments();
            });
        });
    };

    // --- Timeline View for Pending Appointments ---
    const renderTimelineDatePicker = () => {
        timelineDatePicker.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) { // Next 7 days
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dateOption = document.createElement('div');
            dateOption.className = 'date-option';
            dateOption.dataset.date = date.toISOString().split('T')[0];
            dateOption.innerHTML = `
                <span class="day-of-week">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span class="date-str">${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
            `;
            
            if (dateOption.dataset.date === currentTimelineDate) {
                dateOption.classList.add('selected');
            }

            dateOption.addEventListener('click', () => {
                timelineDatePicker.querySelectorAll('.date-option').forEach(item => item.classList.remove('selected'));
                dateOption.classList.add('selected');
                currentTimelineDate = dateOption.dataset.date;
                renderPendingAppointmentsTimeline(currentTimelineDate);
            });
            timelineDatePicker.appendChild(dateOption);
        }
    };

    const renderPendingAppointmentsTimeline = (selectedDate) => {
        timelineTimeLabels.innerHTML = '';
        timelineSlotsArea.innerHTML = '';

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const isCurrentDate = (selectedDate === today);

        // Generate time labels (e.g., 10:00, 11:00)
        for (let h = Math.floor(BUSINESS_HOURS_START_MINUTES / 60); h <= Math.floor(BUSINESS_HOURS_END_MINUTES / 60); h++) {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label-item';
            timeLabel.textContent = `${String(h).padStart(2, '0')}:00`;
            timelineTimeLabels.appendChild(timeLabel);
        }

        const pendingForDate = appointments.filter(appt => 
            appt.status === 'pending' && appt.date === selectedDate
        ).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

        pendingForDate.forEach(appt => {
            const [hours, minutes] = appt.time.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const startOffsetMinutes = startMinutes - BUSINESS_HOURS_START_MINUTES;

            const topPosition = startOffsetMinutes * TIMELINE_SLOT_HEIGHT_PER_MINUTE;
            const height = appt.service.durationMinutes * TIMELINE_SLOT_HEIGHT_PER_MINUTE;

            const apptBlock = document.createElement('div');
            apptBlock.className = 'timeline-appointment-block';
            apptBlock.style.top = `${topPosition}px`;
            apptBlock.style.height = `${height}px`;

            apptBlock.innerHTML = `
                <span class="client-name">${appt.client.firstName} ${appt.client.lastName}</span>
                <span class="service-name">${appt.service.name}</span>
                <span class="datetime-display">${appt.time} - ${formatTime(new Date(new Date(`${appt.date}T${appt.time}:00`).getTime() + appt.service.durationMinutes * 60 * 1000).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}))}</span>
                <div class="actions">
                    <button class="complete-btn" data-id="${appt.id}">Concluir</button>
                    <button class="delete-btn" data-id="${appt.id}">Excluir</button>
                </div>
            `;
            timelineSlotsArea.appendChild(apptBlock);
        });

        // Add event listeners for buttons within timeline blocks
        timelineSlotsArea.querySelectorAll('.complete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent block click event
                const id = e.target.dataset.id;
                const apptIndex = appointments.findIndex(appt => appt.id === id);
                if (apptIndex > -1) {
                    appointments[apptIndex].status = 'completed';
                    appointments[apptIndex].completionDate = new Date().toISOString().split('T')[0];
                    saveAppointments();
                    renderPendingAppointmentsTimeline(selectedDate);
                    renderCompletedAppointments();
                    renderFinancialSummary();
                }
            });
        });

        timelineSlotsArea.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent block click event
                const id = e.target.dataset.id;
                appointments = appointments.filter(appt => appt.id !== id);
                saveAppointments();
                renderPendingAppointmentsTimeline(selectedDate);
            });
        });

        // Update current time indicator
        updateCurrentTimeIndicator(currentTimeIndicator, selectedDate);
        if (currentTimeIndicatorInterval) clearInterval(currentTimeIndicatorInterval);
        currentTimeIndicatorInterval = setInterval(() => updateCurrentTimeIndicator(currentTimeIndicator, selectedDate), 60 * 1000); // Update every minute
    };

    const updateCurrentTimeIndicator = (indicatorElement, selectedDate) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (selectedDate === today) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (currentMinutes >= BUSINESS_HOURS_START_MINUTES && currentMinutes <= BUSINESS_HOURS_END_MINUTES) {
                const offsetMinutes = currentMinutes - BUSINESS_HOURS_START_MINUTES;
                const topPosition = offsetMinutes * TIMELINE_SLOT_HEIGHT_PER_MINUTE;
                indicatorElement.style.top = `${topPosition}px`;
                indicatorElement.style.display = 'block';
            } else {
                indicatorElement.style.display = 'none'; // Outside business hours
            }
        } else {
            indicatorElement.style.display = 'none'; // Not current date
        }
    };

    listViewBtn.addEventListener('click', () => {
        currentPendingViewMode = 'list';
        listViewBtn.classList.add('active');
        timelineViewBtn.classList.remove('active');
        appointmentList.classList.add('active-view');
        timelineView.classList.remove('active-view');
        timelineView.style.display = 'none';
        timelineDateSelectionContainer.style.display = 'none';
        renderPendingAppointmentsList();
        if (currentTimeIndicatorInterval) clearInterval(currentTimeIndicatorInterval); // Stop interval for timeline
    });

    timelineViewBtn.addEventListener('click', () => {
        currentPendingViewMode = 'timeline';
        timelineViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        appointmentList.classList.remove('active-view');
        timelineView.classList.add('active-view');
        timelineView.style.display = 'grid';
        timelineDateSelectionContainer.style.display = 'block';
        renderTimelineDatePicker();
        renderPendingAppointmentsTimeline(currentTimelineDate);
    });

    // --- Completed Appointments Management ---
    const renderCompletedAppointments = () => {
        completedAppointmentsContainer.innerHTML = '';
        const completed = appointments.filter(appt => appt.status === 'completed')
                                    .sort((a, b) => new Date(`${b.completionDate}T${b.time}`) - new Date(`${a.completionDate}T${a.time}`)); // Sort by completion date descending

        if (completed.length === 0) {
            completedAppointmentsContainer.innerHTML = '<p style="text-align: center; color: #606770;">Nenhum agendamento concluído.</p>';
            return;
        }

        const appointmentsByDate = completed.reduce((acc, appt) => {
            const dateKey = appt.completionDate; // Use completionDate for grouping
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(appt);
            return acc;
        }, {});

        // Sort dates in descending order
        const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateKey => {
            const column = document.createElement('div');
            column.className = 'completed-day-column';
            column.innerHTML = `<h3>${formatDate(dateKey)}</h3><ul></ul>`;
            const ul = column.querySelector('ul');

            appointmentsByDate[dateKey].forEach(appt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <span class="client-name">${appt.client.firstName} ${appt.client.lastName}</span><br>
                        <span class="service-details">${appt.service.name} - ${appt.service.price} às ${appt.time}</span>
                    </div>
                    <div class="actions">
                        <button class="delete-btn" data-id="${appt.id}">Excluir</button>
                    </div>
                `;
                ul.appendChild(li);
            });
            completedAppointmentsContainer.appendChild(column);
        });

        // Add event listeners for delete buttons in completed appointments
        completedAppointmentsContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm('Tem certeza que deseja excluir este agendamento concluído?')) {
                    appointments = appointments.filter(appt => appt.id !== id);
                    saveAppointments();
                    renderCompletedAppointments(); // Re-render completed list
                    renderFinancialSummary(); // Update financial summary
                }
            });
        });
    };

    // --- Financial Management ---
    const renderFinancialSummary = () => {
        const completedAppointments = appointments.filter(appt => appt.status === 'completed');
        
        let totalRevenue = 0;
        let dailyRevenue = 0;
        let weeklyRevenue = 0;
        let monthlyRevenue = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        // Calculate start of current week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); 

        // Calculate start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        financialTransactionsList.innerHTML = ''; // Clear previous transactions

        if (completedAppointments.length === 0) {
            financialTransactionsList.innerHTML = '<li class="empty-message">Nenhuma transação concluída.</li>';
        }

        // Sort by completion date and time descending for the list
        completedAppointments.sort((a, b) => new Date(`${b.completionDate}T${b.time}`) - new Date(`${a.completionDate}T${a.time}`));

        completedAppointments.forEach(appt => {
            const price = appt.service.priceValue || 0;
            totalRevenue += price;

            const completionDate = new Date(`${appt.completionDate}T00:00:00`); // Normalize to start of day

            // Daily Revenue
            if (completionDate.getTime() === today.getTime()) {
                dailyRevenue += price;
            }

            // Weekly Revenue
            if (completionDate >= startOfWeek && completionDate <= today) {
                weeklyRevenue += price;
            }

            // Monthly Revenue
            if (completionDate >= startOfMonth && completionDate <= today) {
                monthlyRevenue += price;
            }

            // Add to transactions list
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details">
                    <span class="item-name">${appt.client.firstName} ${appt.client.lastName} - ${appt.service.name}</span>
                    <span class="item-sub-details">Preço: ${appt.service.price} | Concluído em: ${formatDate(appt.completionDate)} às ${appt.time}</span>
                </div>
            `;
            financialTransactionsList.appendChild(li);
        });

        totalRevenueSpan.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
        dailyRevenueSpan.textContent = `R$ ${dailyRevenue.toFixed(2).replace('.', ',')}`;
        weeklyRevenueSpan.textContent = `R$ ${weeklyRevenue.toFixed(2).replace('.', ',')}`;
        monthlyRevenueSpan.textContent = `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`;
    };

    // --- Initialization ---
    const initializeApp = () => {
        loadAppIcon(); // Load custom app icon/favicon first
        loadLogo(); // Load custom logo
        loadCoverPhoto(); // Load custom cover photo
        populateClientDropdown();
        renderServices('service-list'); // Render services for client view
        renderServices('owner-service-list'); // Render services for owner booking view
        loadOwnerMenuOrder(); // Load owner menu order
        renderOwnerSidebarMenu(); // Render owner sidebar menu
        toggleView(); // Set initial view (client or owner if password saved)
        
        // Register service worker if not in owner mode or if it's the first load
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker Registered', reg))
                .catch(err => console.error('Service Worker registration failed: ', err));
        }
    };

    initializeApp();
});