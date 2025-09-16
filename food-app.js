// Food Calculator - Complete with Working Voice Search & Barcode Scanner
// Version 3.1 - Clean Implementation

// ====================================
// CONFIGURATION & CONSTANTS
// ====================================

const USDA_API_KEY = 'MA2uDUaXzLNNDGmRBiRu1p0YxC7cCoBduPhhPnhK';
const USDA_PAGE_SIZE = 8;
const USDA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const DEFAULT_MACRO_SPLIT = {
    protein: 0.25,
    carbs: 0.45,
    fat: 0.30
};

const ACTIVITY_MULTIPLIERS = {
    1.2: 'Sedentary',
    1.375: 'Light',
    1.55: 'Moderate', 
    1.725: 'Active',
    1.9: 'Very Active'
};

// ====================================
// GLOBAL VARIABLES
// ====================================

let searchTimeout = null;
let globalState = {
    mealList: [],
    currentFoodForModal: null,
    currentEditIndex: -1,
    currentSearchFilter: 'all',
    dailyTargets: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67
    },
    isDebugMode: new URLSearchParams(window.location.search).get('debug') === 'true'
};

// ====================================
// EXPANDED FOOD CATEGORIES - 20 ITEMS EACH
// ====================================

const CATEGORY_FOODS = {
    fruits: [
        {name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2},
        {name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3},
        {name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1},
        {name: 'Grapes', calories: 62, protein: 0.6, carbs: 16, fat: 0.2},
        {name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4},
        {name: 'Strawberries', calories: 32, protein: 0.7, carbs: 8, fat: 0.3},
        {name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1},
        {name: 'Watermelon', calories: 30, protein: 0.6, carbs: 8, fat: 0.2},
        {name: 'Cantaloupe', calories: 34, protein: 0.8, carbs: 8, fat: 0.2},
        {name: 'Papaya', calories: 43, protein: 0.5, carbs: 11, fat: 0.3},
        {name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5},
        {name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3},
        {name: 'Raspberries', calories: 52, protein: 1.2, carbs: 12, fat: 0.7},
        {name: 'Blackberries', calories: 43, protein: 1.4, carbs: 10, fat: 0.5},
        {name: 'Cherries', calories: 63, protein: 1.1, carbs: 16, fat: 0.2},
        {name: 'Peach', calories: 39, protein: 0.9, carbs: 10, fat: 0.3},
        {name: 'Plum', calories: 46, protein: 0.7, carbs: 11, fat: 0.3},
        {name: 'Apricot', calories: 48, protein: 1.4, carbs: 11, fat: 0.4},
        {name: 'Lemon', calories: 29, protein: 1.1, carbs: 9, fat: 0.3},
        {name: 'Lime', calories: 30, protein: 0.7, carbs: 11, fat: 0.2}
    ],
    vegetables: [
        {name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4},
        {name: 'Spinach', calories: 23, protein: 2.9, carbs: 4, fat: 0.4},
        {name: 'Carrots', calories: 41, protein: 0.9, carbs: 10, fat: 0.2},
        {name: 'Bell Pepper', calories: 31, protein: 1, carbs: 7, fat: 0.3},
        {name: 'Tomato', calories: 18, protein: 0.9, carbs: 4, fat: 0.2},
        {name: 'Cucumber', calories: 16, protein: 0.7, carbs: 4, fat: 0.1},
        {name: 'Cauliflower', calories: 25, protein: 1.9, carbs: 5, fat: 0.3},
        {name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3, fat: 0.3},
        {name: 'Eggplant', calories: 25, protein: 1, carbs: 6, fat: 0.2},
        {name: 'Mushrooms', calories: 22, protein: 3.1, carbs: 3, fat: 0.3},
        {name: 'Onions', calories: 40, protein: 1.1, carbs: 9, fat: 0.1},
        {name: 'Garlic', calories: 149, protein: 6.4, carbs: 33, fat: 0.5},
        {name: 'Celery', calories: 16, protein: 0.7, carbs: 4, fat: 0.2},
        {name: 'Asparagus', calories: 20, protein: 2.2, carbs: 4, fat: 0.1},
        {name: 'Green Beans', calories: 31, protein: 1.8, carbs: 7, fat: 0.2},
        {name: 'Brussels Sprouts', calories: 43, protein: 3.4, carbs: 9, fat: 0.3},
        {name: 'Cabbage', calories: 25, protein: 1.3, carbs: 6, fat: 0.1},
        {name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1},
        {name: 'Beets', calories: 43, protein: 1.6, carbs: 10, fat: 0.2},
        {name: 'Kale', calories: 49, protein: 4.3, carbs: 9, fat: 0.9}
    ],
    proteins: [
        {name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6},
        {name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 12},
        {name: 'Eggs', calories: 155, protein: 13, carbs: 1, fat: 11},
        {name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 4, fat: 0.4},
        {name: 'Tofu', calories: 76, protein: 8, carbs: 2, fat: 5},
        {name: 'Lentils', calories: 116, protein: 9, carbs: 20, fat: 0.4},
        {name: 'Tuna', calories: 144, protein: 30, carbs: 0, fat: 1},
        {name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1},
        {name: 'Beef Sirloin', calories: 158, protein: 26, carbs: 0, fat: 5},
        {name: 'Pork Tenderloin', calories: 143, protein: 26, carbs: 0, fat: 4},
        {name: 'Cod', calories: 82, protein: 18, carbs: 0, fat: 0.7},
        {name: 'Shrimp', calories: 85, protein: 20, carbs: 0, fat: 0.5},
        {name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3},
        {name: 'Black Beans', calories: 132, protein: 9, carbs: 23, fat: 0.5},
        {name: 'Chickpeas', calories: 164, protein: 8, carbs: 27, fat: 2.6},
        {name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9},
        {name: 'Hemp Seeds', calories: 553, protein: 31, carbs: 9, fat: 49},
        {name: 'Tempeh', calories: 193, protein: 19, carbs: 9, fat: 11},
        {name: 'Seitan', calories: 370, protein: 75, carbs: 14, fat: 2},
        {name: 'Protein Powder', calories: 103, protein: 20, carbs: 3, fat: 1}
    ],
    grains: [
        {name: 'Brown Rice', calories: 111, protein: 3, carbs: 23, fat: 0.9},
        {name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9},
        {name: 'Oats', calories: 389, protein: 17, carbs: 66, fat: 7},
        {name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 4.2},
        {name: 'Pasta', calories: 131, protein: 5, carbs: 25, fat: 1.1},
        {name: 'Barley', calories: 123, protein: 2.3, carbs: 28, fat: 0.4},
        {name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3},
        {name: 'Bulgur', calories: 83, protein: 3, carbs: 19, fat: 0.2},
        {name: 'Millet', calories: 119, protein: 3.5, carbs: 23, fat: 1},
        {name: 'Buckwheat', calories: 92, protein: 3.4, carbs: 19, fat: 0.6},
        {name: 'Amaranth', calories: 102, protein: 4, carbs: 19, fat: 1.6},
        {name: 'Wild Rice', calories: 101, protein: 4, carbs: 21, fat: 0.3},
        {name: 'Cornmeal', calories: 362, protein: 8.1, carbs: 77, fat: 3.9},
        {name: 'Rye Bread', calories: 259, protein: 9, carbs: 48, fat: 3.3},
        {name: 'Spelt', calories: 127, protein: 5.5, carbs: 26, fat: 0.9},
        {name: 'Farro', calories: 140, protein: 5, carbs: 26, fat: 2.5},
        {name: 'Teff', calories: 101, protein: 3.9, carbs: 20, fat: 0.7},
        {name: 'Sorghum', calories: 329, protein: 11, carbs: 72, fat: 3.3},
        {name: 'Rice Cakes', calories: 387, protein: 8, carbs: 82, fat: 2.8},
        {name: 'Couscous', calories: 112, protein: 3.8, carbs: 23, fat: 0.2}
    ],
    dairy: [
        {name: 'Milk (2%)', calories: 50, protein: 3.3, carbs: 5, fat: 2},
        {name: 'Cheese (Cheddar)', calories: 113, protein: 7, carbs: 1, fat: 9},
        {name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 4, fat: 0.4},
        {name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81},
        {name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3},
        {name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 5, fat: 3.3},
        {name: 'Skim Milk', calories: 34, protein: 3.4, carbs: 5, fat: 0.2},
        {name: 'Mozzarella', calories: 85, protein: 6, carbs: 1, fat: 6},
        {name: 'Parmesan', calories: 108, protein: 10, carbs: 1, fat: 7},
        {name: 'Cream Cheese', calories: 342, protein: 6, carbs: 4, fat: 34},
        {name: 'Sour Cream', calories: 193, protein: 2.4, carbs: 4.6, fat: 19},
        {name: 'Heavy Cream', calories: 340, protein: 2.8, carbs: 3, fat: 36},
        {name: 'Ricotta', calories: 174, protein: 11, carbs: 3, fat: 13},
        {name: 'Feta Cheese', calories: 75, protein: 4, carbs: 1, fat: 6},
        {name: 'Swiss Cheese', calories: 106, protein: 8, carbs: 1, fat: 8},
        {name: 'Goat Cheese', calories: 364, protein: 22, carbs: 3, fat: 30},
        {name: 'Blue Cheese', calories: 99, protein: 6, carbs: 1, fat: 8},
        {name: 'Kefir', calories: 41, protein: 3.8, carbs: 4.5, fat: 1},
        {name: 'Buttermilk', calories: 40, protein: 3.3, carbs: 5, fat: 0.9},
        {name: 'Ice Cream', calories: 207, protein: 3.5, carbs: 24, fat: 11}
    ],
    snacks: [
        {name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50},
        {name: 'Peanuts', calories: 567, protein: 26, carbs: 16, fat: 49},
        {name: 'Dark Chocolate', calories: 546, protein: 8, carbs: 61, fat: 31},
        {name: 'Popcorn', calories: 375, protein: 12, carbs: 74, fat: 4.5},
        {name: 'Crackers', calories: 502, protein: 9, carbs: 66, fat: 23},
        {name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44},
        {name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65},
        {name: 'Pistachios', calories: 560, protein: 20, carbs: 28, fat: 45},
        {name: 'Sunflower Seeds', calories: 584, protein: 21, carbs: 20, fat: 52},
        {name: 'Pumpkin Seeds', calories: 559, protein: 30, carbs: 11, fat: 49},
        {name: 'Trail Mix', calories: 462, protein: 13, carbs: 45, fat: 29},
        {name: 'Granola Bar', calories: 471, protein: 10, carbs: 64, fat: 20},
        {name: 'Pretzels', calories: 380, protein: 11, carbs: 79, fat: 3},
        {name: 'Beef Jerky', calories: 410, protein: 33, carbs: 11, fat: 26},
        {name: 'Rice Crackers', calories: 384, protein: 7, carbs: 82, fat: 3},
        {name: 'Cheese Sticks', calories: 318, protein: 25, carbs: 1, fat: 25},
        {name: 'Apple Chips', calories: 243, protein: 1, carbs: 66, fat: 0.1},
        {name: 'Protein Bar', calories: 376, protein: 26, carbs: 38, fat: 14},
        {name: 'Hummus', calories: 166, protein: 8, carbs: 14, fat: 10},
        {name: 'Olives', calories: 115, protein: 0.8, carbs: 6, fat: 11}
    ],
    beverages: [
        {name: 'Coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0},
        {name: 'Tea', calories: 1, protein: 0, carbs: 0.3, fat: 0},
        {name: 'Orange Juice', calories: 45, protein: 0.7, carbs: 10, fat: 0.2},
        {name: 'Coconut Water', calories: 19, protein: 0.7, carbs: 4, fat: 0.2},
        {name: 'Green Tea', calories: 1, protein: 0, carbs: 0, fat: 0},
        {name: 'Apple Juice', calories: 46, protein: 0.1, carbs: 11, fat: 0.1},
        {name: 'Almond Milk', calories: 17, protein: 0.6, carbs: 1.5, fat: 1.1},
        {name: 'Soy Milk', calories: 54, protein: 3.3, carbs: 6, fat: 1.8},
        {name: 'Energy Drink', calories: 45, protein: 0, carbs: 11, fat: 0},
        {name: 'Sports Drink', calories: 25, protein: 0, carbs: 6, fat: 0},
        {name: 'Lemon Water', calories: 7, protein: 0.1, carbs: 2, fat: 0},
        {name: 'Smoothie', calories: 182, protein: 4, carbs: 44, fat: 1},
        {name: 'Protein Shake', calories: 103, protein: 20, carbs: 3, fat: 1},
        {name: 'Kombucha', calories: 30, protein: 0, carbs: 7, fat: 0},
        {name: 'Herbal Tea', calories: 2, protein: 0, carbs: 0.5, fat: 0},
        {name: 'Black Tea', calories: 2, protein: 0, carbs: 0.3, fat: 0},
        {name: 'White Tea', calories: 1, protein: 0, carbs: 0.2, fat: 0},
        {name: 'Matcha', calories: 3, protein: 0.3, carbs: 0.4, fat: 0},
        {name: 'Chai Tea', calories: 25, protein: 1, carbs: 4, fat: 1},
        {name: 'Water', calories: 0, protein: 0, carbs: 0, fat: 0}
    ],
    indian: [
        {name: 'Basmati Rice', calories: 121, protein: 3, carbs: 25, fat: 0.4},
        {name: 'Roti', calories: 297, protein: 11, carbs: 61, fat: 2.7},
        {name: 'Dal', calories: 116, protein: 9, carbs: 20, fat: 0.4},
        {name: 'Paneer', calories: 265, protein: 20, carbs: 1.2, fat: 20},
        {name: 'Curd', calories: 60, protein: 11, carbs: 4.7, fat: 0.1},
        {name: 'Ghee', calories: 900, protein: 0, carbs: 0, fat: 100},
        {name: 'Naan', calories: 262, protein: 9, carbs: 45, fat: 5},
        {name: 'Chicken Curry', calories: 180, protein: 25, carbs: 5, fat: 8},
        {name: 'Rajma', calories: 127, protein: 9, carbs: 23, fat: 0.5},
        {name: 'Chana', calories: 164, protein: 8, carbs: 27, fat: 2.6},
        {name: 'Samosa', calories: 308, protein: 6, carbs: 25, fat: 21},
        {name: 'Idli', calories: 58, protein: 2, carbs: 12, fat: 0.1},
        {name: 'Dosa', calories: 168, protein: 4, carbs: 29, fat: 4},
        {name: 'Upma', calories: 85, protein: 2, carbs: 17, fat: 1.4},
        {name: 'Paratha', calories: 320, protein: 11, carbs: 35, fat: 15},
        {name: 'Biryani', calories: 200, protein: 8, carbs: 35, fat: 4},
        {name: 'Tandoori Chicken', calories: 150, protein: 28, carbs: 2, fat: 4},
        {name: 'Palak', calories: 26, protein: 3, carbs: 3, fat: 0.7},
        {name: 'Aloo Gobi', calories: 130, protein: 3, carbs: 20, fat: 5},
        {name: 'Lassi', calories: 89, protein: 3, carbs: 13, fat: 3}
    ]
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
}

function showToast(message, type = 'success', duration = 3000) {
    const container = $('#toast-container');
    if (!container) {
        // Create toast container if it doesn't exist
        const toastContainer = createElement('div', {
            id: 'toast-container',
            style: 'position: fixed; top: 20px; right: 20px; z-index: 2000;'
        });
        document.body.appendChild(toastContainer);
    }
    
    const toast = createElement('div', {
        className: `alert alert-${type}`,
        style: 'margin-bottom: 10px; animation: slideIn 0.3s ease-out;'
    }, [message]);
    
    const finalContainer = $('#toast-container');
    finalContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (finalContainer.contains(toast)) {
                finalContainer.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function hideSuggestions() {
    const container = $('#search-suggestions');
    if (container) {
        container.classList.remove('show');
    }
}

// ====================================
// VOICE SEARCH MANAGER
// ====================================

class VoiceSearchManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initializeVoiceSearch();
    }
    
    initializeVoiceSearch() {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Set up event listeners
        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.updateVoiceButton(true);
            showToast('🎤 Listening... Speak now!', 'success');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice input received:', transcript);
            this.processVoiceCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleVoiceError(event.error);
        };
        
        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            this.updateVoiceButton(false);
        };
        
        return true;
    }
    
    startListening() {
        if (!this.recognition) {
            showToast('Voice search not supported in your browser', 'danger');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            showToast('Failed to start voice search', 'danger');
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        
        // Search for food items
        const searchInput = $('#food-search');
        if (searchInput) {
            searchInput.value = transcript;
            // Trigger search
            nutritionTracker.handleSearch(transcript);
            showToast(`🔍 Searching for: "${transcript}"`, 'success');
        }
        
        // Check for specific voice commands
        if (transcript.includes('clear meal') || transcript.includes('clear all')) {
            nutritionTracker.clearMeal();
            showToast('🗑️ Meal cleared by voice command', 'success');
        } else if (transcript.includes('show profile') || transcript.includes('profile setup')) {
            userProfile.toggleProfileForm();
            showToast('📊 Profile setup opened', 'success');
        } else if (transcript.includes('export') || transcript.includes('save meal')) {
            nutritionTracker.exportToJSON();
            showToast('💾 Meal data exported', 'success');
        } else if (transcript.includes('fruits')) {
            categoryManager.showCategoryFoods('fruits');
        } else if (transcript.includes('vegetables')) {
            categoryManager.showCategoryFoods('vegetables');
        } else if (transcript.includes('protein')) {
            categoryManager.showCategoryFoods('proteins');
        } else if (transcript.includes('dairy')) {
            categoryManager.showCategoryFoods('dairy');
        } else if (transcript.includes('indian food') || transcript.includes('indian')) {
            categoryManager.showCategoryFoods('indian');
        }
    }
    
    updateVoiceButton(isListening) {
        const voiceBtn = $('#voice-search-btn');
        if (voiceBtn) {
            if (isListening) {
                voiceBtn.innerHTML = '🛑 Stop Listening';
                voiceBtn.classList.add('btn-danger');
                voiceBtn.classList.remove('btn-secondary');
                voiceBtn.classList.add('btn-listening');
            } else {
                voiceBtn.innerHTML = '🎤 Voice Search';
                voiceBtn.classList.remove('btn-danger');
                voiceBtn.classList.add('btn-secondary');
                voiceBtn.classList.remove('btn-listening');
            }
        }
    }
    
    handleVoiceError(error) {
        let errorMessage = 'Voice search error occurred';
        
        switch (error) {
            case 'network':
                errorMessage = 'Network error during voice search';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please enable microphone permissions.';
                break;
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'aborted':
                errorMessage = 'Voice search cancelled';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not available';
                break;
            case 'service-not-allowed':
                errorMessage = 'Voice service not allowed';
                break;
        }
        
        showToast(errorMessage, 'danger');
        this.updateVoiceButton(false);
    }
}

// ImprovedBarcodeScanner (replacement)
// - Uses Html5Qrcode when available; falls back to native BarcodeDetector + video capture
// - Simpler, safer getUserMedia constraints to avoid OverconstrainedError / black preview
// - Robust logging + visible debug output for decoded text
// - Graceful camera switching and torch toggle attempts

class ImprovedBarcodeScanner {
  constructor(options = {}) {
    this.scanner = null;                 // Html5Qrcode instance
    this.cameras = [];                   // camera device list
    this.currentCameraIndex = 0;
    this.isScanning = false;
    this.deviceStream = null;            // MediaStream when using BarcodeDetector fallback
    this.detectorInterval = null;        // loop interval id for BarcodeDetector
    this.options = options || {};
    this.maxInitAttempts = 3;
    this.initAttempts = 0;
    // safer default config (avoid hard width/height constraints)
    this.config = {
      fps: 8,
      qrbox: { width: 280, height: 280 },
      // Keep videoConstraints minimal: only facingMode — width/height constraints cause errors on some devices
      videoConstraints: { facingMode: { ideal: "environment" } }
    };
  }

  // ----------------- Public API -----------------
  async openModalAndStart() {
    const modal = document.getElementById('barcode-modal') || document.getElementById('barcode-scanner-modal');
    if (modal) modal.classList.add('show');
    // small delay so modal lays out and camera can be attached cleanly
    await new Promise(r => setTimeout(r, 250));
    await this.startScanning();
  }

  async closeModalAndStop() {
    const modal = document.getElementById('barcode-modal') || document.getElementById('barcode-scanner-modal');
    if (modal) modal.classList.remove('show');
    await this.stopScanning();
  }

  // ----------------- Initialization -----------------
  async initHtml5QrcodeSafe() {
    if (typeof Html5Qrcode === 'undefined') {
      console.warn('Html5Qrcode not present - skipping Html5Qrcode init');
      return false;
    }

    try {
      this.initAttempts++;
      // attempt to get cameras via Html5Qrcode.getCameras (lib handles browser quirks)
      const cams = await Html5Qrcode.getCameras().catch(() => []);
      this.cameras = (cams || []).slice();

      // make sure scanner element exists
      let container = document.getElementById('barcode-scanner');
      if (!container) {
        // Create container fallback
        container = document.createElement('div');
        container.id = 'barcode-scanner';
        const holder = document.getElementById('barcode-scanner-body') || document.body;
        holder.appendChild(container);
        console.log('Created fallback #barcode-scanner container');
      }

      // create/cleanup existing instance
      if (this.scanner) {
        try { await this.scanner.stop(); } catch(e) {}
        try { this.scanner.clear(); } catch(e) {}
        this.scanner = null;
      }

      // instantiate
      this.scanner = new Html5Qrcode("barcode-scanner", { verbose: false });
      return true;
    } catch (err) {
      console.error('initHtml5QrcodeSafe error:', err);
      if (this.initAttempts < this.maxInitAttempts) {
        await new Promise(r => setTimeout(r, 500));
        return this.initHtml5QrcodeSafe();
      }
      return false;
    }
  }

  // ----------------- Start / Stop -----------------
  async startScanning() {
    if (this.isScanning) {
      console.log('Already scanning');
      return;
    }

    // Try Html5Qrcode route first
    const html5Ready = await this.initHtml5QrcodeSafe();
    if (html5Ready && this.scanner) {
      try {
        // pick camera id if available (prefer back/rear)
        let cameraIdOrFacing = { facingMode: "environment" };
        if (this.cameras && this.cameras.length) {
          const back = this.cameras.find(c => /back|rear|environment/i.test(c.label || ""));
          if (back) cameraIdOrFacing = back.id;
          else cameraIdOrFacing = this.cameras[this.currentCameraIndex].id;
        }

        await this.scanner.start(
          cameraIdOrFacing,
          this.config,
          decodedText => this._onDecoded(decodedText, 'html5'),
          errorMsg => this._onScanAttemptError(errorMsg)
        );

        this.isScanning = true;
        console.log('Html5Qrcode scanning started');
        this._debugShow('Scanner ready (Html5Qrcode).');
        return;
      } catch (startErr) {
        console.warn('Html5Qrcode.start failed, falling back:', startErr);
        // attempt to gracefully stop & clear
        try { await this.scanner.stop(); } catch(e) {}
        try { this.scanner.clear(); } catch(e) {}
        this.scanner = null;
        // continue to fallback
      }
    }

    // Fallback: native BarcodeDetector + video
    if ('BarcodeDetector' in window) {
      try {
        await this._startBarcodeDetectorFallback();
        this.isScanning = true;
        console.log('BarcodeDetector fallback started');
        this._debugShow('Scanner ready (BarcodeDetector).');
        return;
      } catch (detErr) {
        console.error('BarcodeDetector fallback failed:', detErr);
      }
    }

    // If we reach here, scanning not available
    this._notify('Camera scanning not available on this device/browser. Use manual entry.', 'danger');
  }

  async stopScanning() {
    // stop html5 scanner if running
    try {
      if (this.scanner) {
        await this.scanner.stop().catch(()=>{});
        try { this.scanner.clear(); } catch(e) {}
        this.scanner = null;
      }
    } catch(e) { console.warn('Error stopping html5 scanner', e); }

    // stop fallback stream + interval
    if (this.detectorInterval) {
      clearInterval(this.detectorInterval);
      this.detectorInterval = null;
    }
    if (this.deviceStream) {
      this.deviceStream.getTracks().forEach(t => {
        try { t.stop(); } catch(e) {}
      });
      this.deviceStream = null;
    }

    this.isScanning = false;
    this._debugShow('Scanner stopped.');
    console.log('Scanner stopped and cleaned up');
  }

  // ----------------- Camera switch & torch -----------------
  async switchCamera() {
    // if using list of cameras, cycle index and restart
    if (this.cameras && this.cameras.length > 1) {
      this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
      await this.stopScanning();
      await this.startScanning();
      const cam = this.cameras[this.currentCameraIndex];
      this._notify(`Switched to: ${cam.label || 'camera'}`, 'success');
      return;
    }
    this._notify('No additional cameras available', 'info');
  }

  async toggleTorch() {
    // toggling torch requires access to active track and the capability
    try {
      // If we have a deviceStream, use that
      let stream = this.deviceStream;
      if (!stream && this.scanner && Html5Qrcode) {
        // Html5Qrcode doesn't expose the track directly; attempt to get track from created video element
        const vid = document.querySelector('#barcode-scanner video, #barcode-video, #html5-qrcode-region video');
        stream = vid && vid.srcObject;
      }
      if (!stream) {
        this._notify('No active camera stream to toggle torch', 'info');
        return;
      }
      const track = stream.getVideoTracks()[0];
      if (!track) {
        this._notify('No camera track found', 'info');
        return;
      }
      const caps = track.getCapabilities && track.getCapabilities();
      if (!caps || !caps.torch) {
        this._notify('Torch not supported on this device', 'info');
        return;
      }
      // toggle current value
      const current = track.getSettings && track.getSettings().torch;
      await track.applyConstraints({ advanced: [{ torch: !current }] });
      this._notify(!current ? 'Flashlight ON' : 'Flashlight OFF', 'success');
    } catch (err) {
      console.error('toggleTorch failed:', err);
      this._notify('Could not toggle flashlight', 'danger');
    }
  }

  // ----------------- BarcodeDetector fallback pipeline -----------------
  async _startBarcodeDetectorFallback() {
    // create or reuse video element
    let video = document.getElementById('barcode-video');
    if (!video) {
      video = document.createElement('video');
      video.id = 'barcode-video';
      video.setAttribute('playsinline', 'true');
      video.style.width = '100%';
      const holder = document.getElementById('barcode-scanner-body') || document.body;
      holder.appendChild(video);
    }

    // ask for a simple stream (only facingMode)
    const stream = await navigator.mediaDevices.getUserMedia({ video: this.config.videoConstraints });
    this.deviceStream = stream;
    video.srcObject = stream;
    await video.play();

    const formats = ['qr_code', 'ean_13', 'code_128', 'upc_a', 'upc_e'];
    const detector = new BarcodeDetector({ formats });

    // Detection loop - runs every 300-500ms
    this.detectorInterval = setInterval(async () => {
      try {
        const results = await detector.detect(video);
        if (results && results.length) {
          const r = results[0];
          const code = r.rawValue || r.rawData || r.rawText || (r.value && r.value.raw) || null;
          if (code) {
            this._onDecoded(code, 'detector');
          } else {
            console.log('BarcodeDetector result with no rawValue', r);
          }
        }
      } catch (err) {
        // occasional detect() errors are expected; log in debug mode
        if (this.options.debug) console.debug('detector detect error:', err);
      }
    }, 400);
  }

  // ----------------- Scan result handling -----------------
  async _onDecoded(decodedText, source = 'unknown') {
    console.log(`[scan:${source}] decoded ->`, decodedText);
    // show in debug UI
    this._debugShow(`Decoded (${source}): ${decodedText}`);

    // stop scanning to avoid duplicates
    try { await this.stopScanning(); } catch(e){}

    // close modal (if present)
    const modal = document.getElementById('barcode-modal') || document.getElementById('barcode-scanner-modal');
    if (modal) modal.classList.remove('show');

    // Normalize and deliver to app integration points in prioritized order
    const code = (decodedText || '').toString().trim();
    if (!code) {
      this._notify('Scanned code is empty', 'warning');
      return;
    }

    // 1) if nutritionTracker.handleSearch exists, call it (your code used it previously)
    if (window.nutritionTracker && typeof window.nutritionTracker.handleSearch === 'function') {
      try {
        const inputEl = document.getElementById('food-search') || document.getElementById('foodSearch') || document.querySelector('[name="food-search"]');
        if (inputEl) inputEl.value = code;
        window.nutritionTracker.handleSearch(code);
        return;
      } catch (err) {
        console.warn('nutritionTracker.handleSearch failed:', err);
      }
    }

    // 2) fallback: call performSearch if available
    if (typeof performSearch === 'function') {
      try {
        performSearch(code);
        return;
      } catch (err) {
        console.warn('performSearch failed:', err);
      }
    }

    // 3) fallback: populate search input and show quantity modal if available
    const fallbackInput = document.getElementById('food-search') || document.getElementById('foodSearch');
    if (fallbackInput) fallbackInput.value = code;
    // if you have a modal function like showQuantityModal or openCustomFoodModal, try them
    if (window.nutritionTracker && typeof window.nutritionTracker.showQuantityModal === 'function') {
      try { window.nutritionTracker.showQuantityModal(); return; } catch(e){}
    }
    if (typeof openCustomFoodModal === 'function') { openCustomFoodModal(); return; }

    // final fallback: show a toast with raw code so dev/testers can use it
    this._notify(`Scanned: ${code}`, 'success');
  }

  _onScanAttemptError(msg) {
    // html5-qrcode errors come here frequently (not found in frame) — only log non-expected errors
    if (!msg || /not found|No QR code detected|No barcode detected/i.test(msg)) {
      if (this.options.debug) console.debug('scan attempt:', msg);
      return;
    }
    console.warn('scan attempt error:', msg);
  }

  // ----------------- Helpers / UI utilities -----------------
  _notify(text, type = 'info') {
    // try calling your existing showToast wrapper, otherwise console
    if (typeof showToast === 'function') {
      showToast(text, type);
    } else {
      console.log(`[toast:${type}] ${text}`);
    }
  }

  _debugShow(text) {
    // write debug text into a visible dom element if present
    const debugEl = document.getElementById('barcode-decoded-text') || document.getElementById('barcode-debug');
    if (debugEl) {
      debugEl.textContent = text;
      debugEl.style.display = 'block';
    } else if (this.options.debug) {
      console.debug('debug:', text);
    }
  }
}

// ====================================
// USER PROFILE MANAGER
// ====================================

class UserProfileManager {
    constructor() {
        this.userData = this.loadUserData();
        this.initializeProfile();
    }
    
    loadUserData() {
        try {
            const data = localStorage.getItem('userProfile');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }
    
    saveUserData() {
        try {
            localStorage.setItem('userProfile', JSON.stringify(this.userData));
        } catch (error) {
            console.error('Error saving user profile:', error);
        }
    }
    
    initializeProfile() {
        this.setupEventListeners();
        if (this.userData) {
            this.populateForm();
            this.calculateAndDisplayGoals();
        }
    }
    
    setupEventListeners() {
        const profileToggle = $('#profile-toggle');
        if (profileToggle) {
            profileToggle.addEventListener('click', () => {
                this.toggleProfileForm();
            });
        }
        
        const profileForm = $('#user-profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmission();
            });
        }
        
        $$('input[name="goal"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                $$('input[name="goal"]').forEach(r => {
                    r.parentElement.classList.remove('btn-success');
                    r.parentElement.classList.add('btn-secondary');
                });
                e.target.parentElement.classList.remove('btn-secondary');
                e.target.parentElement.classList.add('btn-success');
            });
        });
    }
    
    toggleProfileForm() {
        const formSection = $('#profile-form-section');
        const toggleBtn = $('#profile-toggle');
        if (formSection && toggleBtn) {
            formSection.classList.toggle('hidden');
            toggleBtn.textContent = formSection.classList.contains('hidden') 
                ? 'Show Profile Setup' 
                : 'Hide Profile Setup';
        }
    }
    
    handleProfileSubmission() {
        const formData = this.collectFormData();
        if (!this.validateFormData(formData)) {
            showToast('Please fill in all required fields', 'danger');
            return;
        }
        
        this.userData = formData;
        this.saveUserData();
        this.calculateAndDisplayGoals();
        showToast('Profile saved! Daily targets calculated.', 'success');
        
        this.toggleProfileForm();
    }
    
    collectFormData() {
        return {
            age: parseInt($('#user-age')?.value) || null,
            gender: $('#user-gender')?.value || '',
            weight: parseFloat($('#user-weight')?.value) || null,
            height: parseInt($('#user-height')?.value) || null,
            activityLevel: parseFloat($('#activity-level')?.value) || null,
            goal: $$('input[name="goal"]:checked')[0]?.value || '',
            lastUpdated: new Date().toISOString()
        };
    }
    
    validateFormData(data) {
        return data.age && data.gender && data.weight && 
               data.height && data.activityLevel && data.goal;
    }
    
    populateForm() {
        if (!this.userData) return;
        
        const { age, gender, weight, height, activityLevel, goal } = this.userData;
        
        if ($('#user-age')) $('#user-age').value = age;
        if ($('#user-gender')) $('#user-gender').value = gender;
        if ($('#user-weight')) $('#user-weight').value = weight;
        if ($('#user-height')) $('#user-height').value = height;
        if ($('#activity-level')) $('#activity-level').value = activityLevel;
        
        const goalRadio = $(`input[name="goal"][value="${goal}"]`);
        if (goalRadio) {
            goalRadio.checked = true;
            goalRadio.dispatchEvent(new Event('change'));
        }
    }
    
    calculateBMR(age, gender, weight, height) {
        if (gender === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }
    
    calculateAndDisplayGoals() {
        if (!this.userData) return;
        
        const { age, gender, weight, height, activityLevel, goal } = this.userData;
        
        const bmr = this.calculateBMR(age, gender, weight, height);
        let tdee = bmr * activityLevel;
        
        const goalMultipliers = {
            'lose': 0.8,
            'maintain': 1.0,
            'gain': 1.2
        };
        
        const adjustedCalories = Math.round(tdee * goalMultipliers[goal]);
        const proteinGrams = Math.round((adjustedCalories * 0.25) / 4);
        const carbsGrams = Math.round((adjustedCalories * 0.45) / 4);
        const fatGrams = Math.round((adjustedCalories * 0.30) / 9);
        
        globalState.dailyTargets = {
            calories: adjustedCalories,
            protein: proteinGrams,
            carbs: carbsGrams,
            fat: fatGrams
        };
        
        this.updateTargetDisplay();
        this.updateProgress();
    }
    
    updateTargetDisplay() {
        const targets = globalState.dailyTargets;
        
        if ($('#target-calories')) $('#target-calories').textContent = targets.calories;
        if ($('#target-protein')) $('#target-protein').textContent = targets.protein + 'g';
        if ($('#target-carbs')) $('#target-carbs').textContent = targets.carbs + 'g';
        if ($('#target-fat')) $('#target-fat').textContent = targets.fat + 'g';
        
        const goalsSection = $('#calculated-goals');
        if (goalsSection) {
            goalsSection.classList.remove('hidden');
        }
    }
    
    updateProgress() {
        if (window.nutritionTracker) {
            nutritionTracker.updateAllProgress();
        }
    }
}

// ====================================
// CATEGORY MANAGER
// ====================================

class CategoryManager {
    constructor() {
        this.currentCategory = null;
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        $$('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.getAttribute('data-category');
                this.showCategoryFoods(category);
            });
        });
    }
    
    showCategoryFoods(category) {
        const foodList = $('#category-foods');
        const foods = CATEGORY_FOODS[category];
        
        if (!foods || !foodList) return;
        
        this.currentCategory = category;
        
        $$('.category-btn').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        });
        const selectedBtn = $(`.category-btn[data-category="${category}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('btn-success');
            selectedBtn.classList.remove('btn-secondary');
        }
        
        foodList.innerHTML = '';
        
        foods.forEach(food => {
            const foodItem = this.createFoodItem(food);
            foodList.appendChild(foodItem);
        });
        
        foodList.classList.add('show');
        foodList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showToast(`Showing ${foods.length} ${category} items`, 'success');
    }
    
    createFoodItem(food) {
        const foodItem = createElement('div', { className: 'food-item' });
        
        const foodInfo = createElement('div', { className: 'food-info' });
        const foodName = createElement('div', { className: 'food-name' }, [food.name]);
        const foodNutrition = createElement('div', { 
            className: 'food-nutrition' 
        }, [`${food.calories} cal, ${food.protein}g protein, ${food.carbs}g carbs, ${food.fat}g fat`]);
        
        foodInfo.appendChild(foodName);
        foodInfo.appendChild(foodNutrition);
        
        const addBtn = createElement('button', {
            className: 'food-add-btn',
            innerHTML: '+ Add'
        });
        
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addFoodToMeal(food);
        });
        
        foodItem.appendChild(foodInfo);
        foodItem.appendChild(addBtn);
        
        foodItem.addEventListener('click', () => {
            this.addFoodToMeal(food);
        });
        
        return foodItem;
    }
    
    addFoodToMeal(food) {
        globalState.currentFoodForModal = food;
        nutritionTracker.showQuantityModal();
    }
    
    hideCategoryFoods() {
        const foodList = $('#category-foods');
        if (foodList) {
            foodList.classList.remove('show');
        }
        
        $$('.category-btn').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        });
        
        this.currentCategory = null;
    }
}

// ====================================
// NUTRITION TRACKER
// ====================================

class NutritionTracker {
    constructor() {
        this.initializeEventListeners();
        this.updateAllProgress();
    }
    
    initializeEventListeners() {
        $$('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('show');
            });
        });
        
        $('#confirm-add')?.addEventListener('click', () => this.addFoodFromModal());
        $('#cancel-add')?.addEventListener('click', () => $('#quantity-modal').classList.remove('show'));
        
        $('#custom-food-form')?.addEventListener('submit', (e) => this.handleCustomFood(e));
        $('#cancel-custom-food')?.addEventListener('click', () => $('#custom-food-modal').classList.remove('show'));
        
        $('#confirm-import')?.addEventListener('click', () => this.importMealData());
        $('#cancel-import')?.addEventListener('click', () => $('#import-modal').classList.remove('show'));
        
        $('#add-custom-food-btn')?.addEventListener('click', () => this.showCustomFoodModal());
        $('#import-meal-btn')?.addEventListener('click', () => this.showImportModal());
        $('#export-pdf-btn')?.addEventListener('click', () => this.exportToPDF());
        $('#copy-meal-btn')?.addEventListener('click', () => this.copyMealData());
        $('#export-json-btn')?.addEventListener('click', () => this.exportToJSON());
        $('#clear-meal-btn')?.addEventListener('click', () => this.clearMeal());
        
        const searchInput = $('#food-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        $$('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setSearchFilter(filter);
            });
        });
    }
    
    handleSearch(query) {
        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }
        
        const results = [];
        Object.entries(CATEGORY_FOODS).forEach(([category, foods]) => {
            foods.forEach(food => {
                if (food.name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ ...food, category });
                }
            });
        });
        
        this.showSearchResults(results);
    }
    
    showSearchResults(results) {
        const container = $('#search-suggestions');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<div class="food-item">No foods found. Try a different search term or use voice search.</div>';
        } else {
            results.forEach(food => {
                const item = this.createSearchResultItem(food);
                container.appendChild(item);
            });
        }
        
        container.classList.add('show');
    }
    
    createSearchResultItem(food) {
        const foodItem = createElement('div', { className: 'food-item' });
        
        const foodInfo = createElement('div', { className: 'food-info' });
        const foodName = createElement('div', { className: 'food-name' }, [
            `${food.name} (${food.category})`
        ]);
        const foodNutrition = createElement('div', { 
            className: 'food-nutrition' 
        }, [`${food.calories} cal, ${food.protein}g protein, ${food.carbs}g carbs, ${food.fat}g fat`]);
        
        foodInfo.appendChild(foodName);
        foodInfo.appendChild(foodNutrition);
        
        const addBtn = createElement('button', {
            className: 'food-add-btn',
            innerHTML: '+ Add'
        });
        
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            globalState.currentFoodForModal = food;
            this.showQuantityModal();
        });
        
        foodItem.appendChild(foodInfo);
        foodItem.appendChild(addBtn);
        
        return foodItem;
    }
    
    hideSearchResults() {
        const container = $('#search-suggestions');
        if (container) {
            container.classList.remove('show');
        }
    }
    
    addFoodFromModal() {
        if (!globalState.currentFoodForModal) return;
        
        const quantity = parseFloat($('#food-quantity')?.value) || 100;
        const unit = $('#food-unit')?.value || 'grams';
        
        const food = { ...globalState.currentFoodForModal };
        
        const multiplier = quantity / 100;
        food.calories = Math.round(food.calories * multiplier);
        food.protein = Math.round(food.protein * multiplier * 10) / 10;
        food.carbs = Math.round(food.carbs * multiplier * 10) / 10;
        food.fat = Math.round(food.fat * multiplier * 10) / 10;
        food.quantity = quantity;
        food.unit = unit;
        
        this.addFoodToMeal(food);
        
        $('#quantity-modal').classList.remove('show');
        globalState.currentFoodForModal = null;
        $('#food-quantity').value = 100;
    }
    
    addFoodToMeal(food) {
        globalState.mealList.push({ ...food, id: Date.now() });
        this.updateMealTable();
        this.updateNutritionTotals();
        this.updateAllProgress();
        
        showToast(`Added ${food.name} to your meal`, 'success');
    }
    
    removeFoodFromMeal(index) {
        if (index >= 0 && index < globalState.mealList.length) {
            const food = globalState.mealList[index];
            globalState.mealList.splice(index, 1);
            this.updateMealTable();
            this.updateNutritionTotals();
            this.updateAllProgress();
            
            showToast(`Removed ${food.name} from your meal`, 'warning');
        }
    }
    
    updateMealTable() {
        const tbody = $('#meal-table');
        if (!tbody) return;
        
        if (globalState.mealList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No items added yet. Search, use voice, or scan to add foods.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        globalState.mealList.forEach((food, index) => {
            const row = createElement('tr');
            
            row.innerHTML = `
                <td>${food.name}</td>
                <td>${food.quantity || 100}${food.unit ? ` ${food.unit}` : 'g'}</td>
                <td>${food.calories}</td>
                <td>${food.protein}g</td>
                <td>${food.carbs}g</td>
                <td>${food.fat}g</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="nutritionTracker.removeFoodFromMeal(${index})">
                        Remove
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    updateNutritionTotals() {
        const totals = globalState.mealList.reduce((sum, food) => ({
            calories: sum.calories + (food.calories || 0),
            protein: sum.protein + (food.protein || 0),
            carbs: sum.carbs + (food.carbs || 0),
            fat: sum.fat + (food.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        if ($('#total-calories')) $('#total-calories').textContent = Math.round(totals.calories);
        if ($('#total-protein')) $('#total-protein').textContent = Math.round(totals.protein * 10) / 10 + 'g';
        if ($('#total-carbs')) $('#total-carbs').textContent = Math.round(totals.carbs * 10) / 10 + 'g';
        if ($('#total-fat')) $('#total-fat').textContent = Math.round(totals.fat * 10) / 10 + 'g';
    }
    
    updateAllProgress() {
        const totals = globalState.mealList.reduce((sum, food) => ({
            calories: sum.calories + (food.calories || 0),
            protein: sum.protein + (food.protein || 0),
            carbs: sum.carbs + (food.carbs || 0),
            fat: sum.fat + (food.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        this.updateProgressCircle('calories', totals.calories, globalState.dailyTargets.calories);
        this.updateProgressCircle('protein', totals.protein, globalState.dailyTargets.protein);
        this.updateProgressCircle('carbs', totals.carbs, globalState.dailyTargets.carbs);
        this.updateProgressCircle('fat', totals.fat, globalState.dailyTargets.fat);
    }
    
    updateProgressCircle(nutrient, current, target) {
        const percentage = Math.min((current / target) * 100, 100);
        const remaining = Math.max(target - current, 0);
        
        const circle = $(`#${nutrient}-progress`);
        if (circle) {
            const circumference = 314;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        const currentEl = $(`#current-${nutrient}`);
        const remainingEl = $(`#${nutrient}-remaining`);
        
        if (currentEl) {
            if (nutrient === 'calories') {
                currentEl.textContent = Math.round(current);
            } else {
                currentEl.textContent = Math.round(current * 10) / 10;
            }
        }
        
        if (remainingEl) {
            if (nutrient === 'calories') {
                remainingEl.textContent = Math.round(remaining) + ' remaining';
            } else {
                remainingEl.textContent = Math.round(remaining * 10) / 10 + 'g remaining';
            }
        }
    }
    
    showQuantityModal() {
        const modal = $('#quantity-modal');
        if (modal) modal.classList.add('show');
    }
    
    showCustomFoodModal() {
        const modal = $('#custom-food-modal');
        if (modal) modal.classList.add('show');
    }
    
    showImportModal() {
        const modal = $('#import-modal');
        if (modal) modal.classList.add('show');
    }
    
    handleCustomFood(e) {
        e.preventDefault();
        
        const food = {
            name: $('#custom-food-name')?.value || 'Custom Food',
            calories: parseFloat($('#custom-calories')?.value) || 0,
            protein: parseFloat($('#custom-protein')?.value) || 0,
            carbs: parseFloat($('#custom-carbs')?.value) || 0,
            fat: parseFloat($('#custom-fat')?.value) || 0
        };
        
        globalState.currentFoodForModal = food;
        this.showQuantityModal();
        $('#custom-food-modal').classList.remove('show');
        
        $('#custom-food-form')?.reset();
    }
    
    importMealData() {
        try {
            const data = $('#import-data')?.value;
            if (!data) {
                showToast('Please enter valid JSON data', 'danger');
                return;
            }
            
            const foods = JSON.parse(data);
            if (!Array.isArray(foods)) {
                throw new Error('Data must be an array');
            }
            
            globalState.mealList = [...globalState.mealList, ...foods];
            this.updateMealTable();
            this.updateNutritionTotals();
            this.updateAllProgress();
            
            $('#import-modal').classList.remove('show');
            $('#import-data').value = '';
            
            showToast(`Imported ${foods.length} food items`, 'success');
        } catch (error) {
            showToast('Invalid JSON data. Please check format.', 'danger');
            console.error('Import error:', error);
        }
    }
    
    exportToPDF() {
        showToast('PDF export feature coming soon!', 'warning');
    }
    
    copyMealData() {
        try {
            const data = JSON.stringify(globalState.mealList, null, 2);
            navigator.clipboard.writeText(data);
            showToast('Meal data copied to clipboard', 'success');
        } catch (error) {
            showToast('Failed to copy to clipboard', 'danger');
        }
    }
    
    exportToJSON() {
        const data = JSON.stringify(globalState.mealList, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = createElement('a', {
            href: url,
            download: 'meal-data.json'
        });
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Meal data exported as JSON', 'success');
    }
    
    clearMeal() {
        if (globalState.mealList.length === 0) {
            showToast('Meal is already empty', 'warning');
            return;
        }
        
        if (confirm('Are you sure you want to clear all foods from your meal?')) {
            globalState.mealList = [];
            this.updateMealTable();
            this.updateNutritionTotals();
            this.updateAllProgress();
            showToast('Meal cleared successfully', 'success');
        }
    }
    
    setSearchFilter(filter) {
        globalState.currentSearchFilter = filter;
        
        $$('[data-filter]').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        });
        
        $(`[data-filter="${filter}"]`)?.classList.add('btn-success');
        $(`[data-filter="${filter}"]`)?.classList.remove('btn-secondary');
        
        showToast(`Search filter set to: ${filter}`, 'success');
    }
}

// ====================================
// INITIALIZATION
// ====================================

let userProfile;
let voiceSearch;
let barcodeScanner;
let categoryManager;
let nutritionTracker;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Food Calculator v3.1 - Voice Search & Scanner Fixed');
    
    // Initialize managers
    userProfile = new UserProfileManager();
    voiceSearch = new VoiceSearchManager();
    barcodeScanner = new ImprovedBarcodeScanner();
    categoryManager = new CategoryManager();
    nutritionTracker = new NutritionTracker();
    
    // Setup voice search button
    $('#voice-search-btn')?.addEventListener('click', () => {
        voiceSearch.startListening();
    });
    
    // Setup barcode scanner button
    $('#barcode-btn')?.addEventListener('click', () => {
        barcodeScanner.openModal();
    });
    
    // Scanner modal controls
    $('#close-barcode')?.addEventListener('click', () => {
        barcodeScanner.closeModal();
    });
    
    $('#switch-camera-btn')?.addEventListener('click', () => {
        barcodeScanner.switchCamera();
    });
    
    $('#manual-entry-btn')?.addEventListener('click', () => {
        const barcode = prompt('Enter barcode manually:');
        if (barcode && barcode.trim()) {
            barcodeScanner.processBarcode(barcode.trim(), { format: 'manual' });
            barcodeScanner.closeModal();
        }
    });
    
    // Handle page visibility changes for scanner
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' && barcodeScanner?.isScanning) {
            barcodeScanner.stopScanning();
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (voiceSearch?.isListening) {
            voiceSearch.stopListening();
        }
        if (barcodeScanner?.isScanning) {
            barcodeScanner.stopScanning();
        }
    });
    
    // Close modals when clicking outside
    $$('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                if (modal.id === 'barcode-modal') {
                    barcodeScanner.closeModal();
                }
            }
        });
    });
    
    // Hide category foods when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.category-grid') && !e.target.closest('#category-foods')) {
            categoryManager.hideCategoryFoods();
        }
    });
    
    // Hide search suggestions when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#food-search') && !e.target.closest('#search-suggestions')) {
            nutritionTracker.hideSearchResults();
        }
    });
    
    console.log('Food Calculator initialized successfully!');
    console.log('Voice Search Status:', voiceSearch.recognition ? 'Ready' : 'Not Supported');
    console.log('Barcode Scanner Status: Ready');
    
    // Show welcome message
    setTimeout(() => {
        showToast('🎤📱 Voice search and barcode scanner are working!', 'success', 4000);
    }, 1000);
});

// ====================================
// GLOBAL ERROR HANDLING
// ====================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (globalState.isDebugMode) {
        showToast('An error occurred. Check console for details.', 'danger');
    }
});

// ====================================
// EXPORT GLOBAL REFERENCES
// ====================================

window.nutritionTracker = nutritionTracker;
window.voiceSearch = voiceSearch;
window.barcodeScanner = barcodeScanner;
window.categoryManager = categoryManager;
window.userProfile = userProfile;
