// food-app.js
// Enhanced Calorie Calculator with Profile System and Advanced Progress Tracking
// Version 2.0 - Complete Enhancement Implementation

// CONFIG (replace with server proxy in production)
const USDA_API_KEY = 'MA2uDUaXzLNNDGmRBiRu1p0YxC7cCoBduPhhPnhK';
const USDA_PAGE_SIZE = 8;
const USDA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Tunables
const DEFAULT_MACRO_SPLIT = { protein: 0.25, carbs: 0.45, fat: 0.30 };
const ACTIVITY_MULTIPLIERS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
const UNIT_DEFAULTS = { serving_pieces_default: 1, liquid_ml_per_100g: 100 };

// Global state
let foodDatabase = [];
let fssaiDatabase = [];
let mealDatabase = [];
let searchIndex = [];
let mealList = [];
let currentFoodForModal = null;
let currentEditIndex = -1;
let searchTimeout = null;
let currentSuggestionIndex = -1;
let isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
let enhancedUserProfile = null;
let advancedProgressTracker = null;

// DOM Elements
const elements = {
    searchInput: null,
    suggestions: null,
    mealTbody: null,
    totalCals: null,
    totalProtein: null,
    totalCarbs: null,
    totalFat: null,
    tdeeInput: null,
    tdeeBar: null,
    tdeePercent: null,
    quantityModal: null,
    customFoodModal: null,
    importModal: null
};

// =========================
// Profiles & TDEE (Enhanced)
// =========================
class EnhancedUserProfile {
    constructor() {
        this.userData = this.loadUserData();
        this.dailyTargets = null;
        this.initializeProfile();
    }
    
    initializeProfile() {
        this.setupEventListeners();
        if (this.userData) {
            this.populateForm();
            this.calculateAndDisplayGoals();
        }
    }
    
    setupEventListeners() {
        // Profile toggle - check if elements exist before adding listeners
        const profileToggle = document.getElementById('profile-toggle');
        if (profileToggle) {
            profileToggle.addEventListener('click', () => {
                this.toggleProfileForm();
            });
        }
        
        // Form submission
        const profileForm = document.getElementById('user-profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmission();
            });
            
            // Real-time goal updates
            const formInputs = profileForm.querySelectorAll('input, select');
            formInputs.forEach(input => {
                input.addEventListener('change', () => {
                    if (this.isFormValid()) {
                        this.previewGoals();
                    }
                });
            });
        }
    }
    
    toggleProfileForm() {
        const formSection = document.getElementById('profile-form-section');
        const toggleBtn = document.getElementById('profile-toggle');
        
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
            this.showError('Please fill in all required fields');
            return;
        }
        
        this.userData = formData;
        this.saveUserData();
        this.calculateAndDisplayGoals();
        this.showSuccess('Profile saved! Daily targets calculated.');
        
        // Trigger app update
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { targets: this.dailyTargets } 
        }));
    }
    
    collectFormData() {
        const ageEl = document.getElementById('user-age');
        const genderEl = document.getElementById('user-gender');
        const weightEl = document.getElementById('user-weight');
        const heightEl = document.getElementById('user-height');
        const activityEl = document.getElementById('activity-level');
        const goalEl = document.querySelector('input[name="goal"]:checked');
        
        return {
            age: ageEl ? parseInt(ageEl.value) : null,
            gender: genderEl ? genderEl.value : '',
            weight: weightEl ? parseFloat(weightEl.value) : null,
            height: heightEl ? parseInt(heightEl.value) : null,
            activityLevel: activityEl ? parseFloat(activityEl.value) : null,
            goal: goalEl ? goalEl.value : '',
            lastUpdated: new Date().toISOString()
        };
    }
    
    validateFormData(data) {
        return data.age && data.gender && data.weight && 
               data.height && data.activityLevel && data.goal;
    }
    
    calculateBMR(age, gender, weight, height) {
        // Mifflin-St Jeor Equation (more accurate than Harris-Benedict)
        if (gender === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }
    
    calculateTDEEAndMacros() {
        if (!this.userData) return null;
        
        const { age, gender, weight, height, activityLevel, goal } = this.userData;
        
        // Calculate BMR
        const bmr = this.calculateBMR(age, gender, weight, height);
        
        // Calculate TDEE
        let tdee = bmr * activityLevel;
        
        // Apply goal adjustment
        const goalMultipliers = {
            'lose': 0.8,    // 20% deficit
            'maintain': 1.0, // Maintenance
            'gain': 1.2      // 20% surplus
        };
        
        const adjustedCalories = Math.round(tdee * goalMultipliers[goal]);
        
        // Calculate macros (flexible approach)
        const proteinGrams = Math.round((adjustedCalories * 0.25) / 4); // 25% protein
        const carbsGrams = Math.round((adjustedCalories * 0.45) / 4);   // 45% carbs
        const fatGrams = Math.round((adjustedCalories * 0.30) / 9);     // 30% fat
        
        return {
            calories: adjustedCalories,
            protein: proteinGrams,
            carbs: carbsGrams,
            fat: fatGrams,
            bmr: Math.round(bmr),
            tdee: Math.round(tdee)
        };
    }
    
    calculateAndDisplayGoals() {
        this.dailyTargets = this.calculateTDEEAndMacros();
        
        if (!this.dailyTargets) return;
        
        // Update display elements if they exist
        const targetElements = {
            calories: document.getElementById('target-calories'),
            protein: document.getElementById('target-protein'),
            carbs: document.getElementById('target-carbs'),
            fat: document.getElementById('target-fat'),
            goals: document.getElementById('calculated-goals')
        };
        
        if (targetElements.calories) targetElements.calories.textContent = this.dailyTargets.calories;
        if (targetElements.protein) targetElements.protein.textContent = this.dailyTargets.protein + 'g';
        if (targetElements.carbs) targetElements.carbs.textContent = this.dailyTargets.carbs + 'g';
        if (targetElements.fat) targetElements.fat.textContent = this.dailyTargets.fat + 'g';
        
        // Show calculated goals section
        if (targetElements.goals) {
            targetElements.goals.classList.remove('hidden');
        }
        
        // Update existing TDEE input
        if (elements.tdeeInput) {
            elements.tdeeInput.value = this.dailyTargets.calories;
            // Trigger change event to update progress
            elements.tdeeInput.dispatchEvent(new Event('input'));
        }
    }
    
    previewGoals() {
        const tempData = this.collectFormData();
        if (this.validateFormData(tempData)) {
            const tempProfile = { ...this };
            tempProfile.userData = tempData;
            const previewTargets = tempProfile.calculateTDEEAndMacros.call(tempProfile);
            
            if (previewTargets) {
                // Show preview with visual indication
                this.showGoalsPreview(previewTargets);
            }
        }
    }
    
    showGoalsPreview(targets) {
        let previewDiv = document.getElementById('goals-preview');
        if (!previewDiv) {
            previewDiv = this.createGoalsPreview();
        }
        
        if (previewDiv) {
            previewDiv.innerHTML = `
                <div class="preview-goals">
                    <small>Preview: </small>
                    <span>${targets.calories} cal</span> • 
                    <span>${targets.protein}g protein</span> • 
                    <span>${targets.carbs}g carbs</span> • 
                    <span>${targets.fat}g fat</span>
                </div>
            `;
            
            previewDiv.classList.add('show');
        }
    }
    
    createGoalsPreview() {
        const form = document.getElementById('user-profile-form');
        if (form) {
            const previewDiv = document.createElement('div');
            previewDiv.id = 'goals-preview';
            previewDiv.className = 'goals-preview';
            form.appendChild(previewDiv);
            return previewDiv;
        }
        return null;
    }
    
    populateForm() {
        if (!this.userData) return;
        
        const elements = {
            age: document.getElementById('user-age'),
            gender: document.getElementById('user-gender'),
            weight: document.getElementById('user-weight'),
            height: document.getElementById('user-height'),
            activity: document.getElementById('activity-level')
        };
        
        if (elements.age) elements.age.value = this.userData.age || '';
        if (elements.gender) elements.gender.value = this.userData.gender || '';
        if (elements.weight) elements.weight.value = this.userData.weight || '';
        if (elements.height) elements.height.value = this.userData.height || '';
        if (elements.activity) elements.activity.value = this.userData.activityLevel || '';
        
        if (this.userData.goal) {
            const goalRadio = document.querySelector(`input[name="goal"][value="${this.userData.goal}"]`);
            if (goalRadio) goalRadio.checked = true;
        }
    }
    
    isFormValid() {
        const tempData = this.collectFormData();
        return this.validateFormData(tempData);
    }
    
    saveUserData() {
        try {
            localStorage.setItem('enhancedCalcProfile', JSON.stringify(this.userData));
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }
    
    loadUserData() {
        try {
            const data = localStorage.getItem('enhancedCalcProfile');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load user data:', error);
            return null;
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Bridge to existing toast system
        if (typeof showToast === 'function') {
            showToast(message, type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'));
            return;
        }
        
        // Fallback notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = 'position:fixed;top:16px;right:16px;background:#333;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;';
        
        if (type === 'success') notification.style.background = '#4CAF50';
        if (type === 'error') notification.style.background = '#f44336';
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 4000);
    }
    
    getDailyTargets() {
        return this.dailyTargets;
    }
}

// =========================
// Advanced Progress Tracker
// =========================
class AdvancedProgressTracker {
    constructor() {
        this.currentTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        this.dailyTargets = { calories: 2000, protein: 150, carbs: 200, fat: 67 };
        this.progressRings = {};
        
        this.initializeProgressRings();
        this.setupEventListeners();
    }
    
    initializeProgressRings() {
        const nutrients = ['calories', 'protein', 'carbs', 'fat'];
        
        nutrients.forEach(nutrient => {
            const ring = document.querySelector(`.${nutrient}-card .progress-ring-progress`);
            if (ring) {
                const radius = ring.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;
                
                ring.style.strokeDasharray = `${circumference} ${circumference}`;
                ring.style.strokeDashoffset = circumference;
                
                this.progressRings[nutrient] = {
                    element: ring,
                    circumference: circumference
                };
            }
        });
    }
    
    setupEventListeners() {
        // Listen for profile updates
        window.addEventListener('profileUpdated', (e) => {
            if (e.detail.targets) {
                this.updateTargets(e.detail.targets);
            }
        });
        
        // Listen for meal updates (we'll trigger this manually)
        window.addEventListener('mealUpdated', (e) => {
            if (e.detail && e.detail.totals) {
                this.updateProgress(e.detail.totals);
            }
        });
    }
    
    updateTargets(newTargets) {
        this.dailyTargets = newTargets;
        
        // Update target displays
        const displays = {
            'target-calories-display': newTargets.calories,
            'target-protein-display': newTargets.protein,
            'target-carbs-display': newTargets.carbs,
            'target-fat-display': newTargets.fat
        };
        
        Object.entries(displays).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Recalculate progress with new targets
        this.updateProgress(this.currentTotals);
    }
    
    updateProgress(nutritionTotals) {
        this.currentTotals = nutritionTotals;
        
        // Update each nutrient progress
        this.updateNutrientProgress('calories', nutritionTotals.calories);
        this.updateNutrientProgress('protein', nutritionTotals.protein);
        this.updateNutrientProgress('carbs', nutritionTotals.carbs);
        this.updateNutrientProgress('fat', nutritionTotals.fat);
        
        // Update daily summary
        this.updateDailySummary();
        
        // Add achievement animations
        this.checkAchievements(nutritionTotals);
    }
    
    updateNutrientProgress(nutrient, currentValue) {
        const target = this.dailyTargets[nutrient];
        const percentage = Math.min((currentValue / target) * 100, 100);
        const remaining = Math.max(target - currentValue, 0);
        
        // Update ring progress
        this.animateProgressRing(nutrient, percentage);
        
        // Update text values
        const currentEl = document.getElementById(`current-${nutrient}`);
        const percentEl = document.getElementById(`${nutrient}-percentage`);
        const remainingEl = document.getElementById(`${nutrient}-remaining`);
        
        if (currentEl) currentEl.textContent = Math.round(currentValue);
        if (percentEl) percentEl.textContent = Math.round(percentage) + '%';
        
        // Update remaining
        const unit = nutrient === 'calories' ? '' : 'g';
        if (remainingEl) {
            remainingEl.textContent = remaining > 0 ? 
                `${Math.round(remaining)}${unit} remaining` : 
                `Goal reached! 🎉`;
        }
        
        // Update card styling based on progress
        this.updateCardStyling(nutrient, percentage);
    }
    
    animateProgressRing(nutrient, percentage) {
        const ring = this.progressRings[nutrient];
        if (!ring) return;
        
        const offset = ring.circumference - (percentage / 100) * ring.circumference;
        
        // Smooth animation
        ring.element.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        ring.element.style.strokeDashoffset = offset;
        
        // Color coding based on progress
        let strokeColor;
        if (percentage >= 90) strokeColor = '#4CAF50'; // Green - excellent
        else if (percentage >= 70) strokeColor = '#8BC34A'; // Light green - good
        else if (percentage >= 50) strokeColor = '#FFC107'; // Yellow - okay
        else if (percentage >= 25) strokeColor = '#FF9800'; // Orange - needs work
        else strokeColor = '#F44336'; // Red - far from goal
        
        ring.element.style.stroke = strokeColor;
    }
    
    updateCardStyling(nutrient, percentage) {
        const card = document.querySelector(`.${nutrient}-card`);
        if (!card) return;
        
        // Remove existing status classes
        card.classList.remove('status-excellent', 'status-good', 'status-okay', 'status-needs-work', 'status-far');
        
        // Add appropriate status class
        if (percentage >= 90) card.classList.add('status-excellent');
        else if (percentage >= 70) card.classList.add('status-good');
        else if (percentage >= 50) card.classList.add('status-okay');
        else if (percentage >= 25) card.classList.add('status-needs-work');
        else card.classList.add('status-far');
    }
    
    updateDailySummary() {
        const totals = this.currentTotals;
        const targets = this.dailyTargets;
        
        // Calculate overall progress (weighted average)
        const calorieProgress = (totals.calories / targets.calories) * 100;
        const proteinProgress = (totals.protein / targets.protein) * 100;
        const carbsProgress = (totals.carbs / targets.carbs) * 100;
        const fatProgress = (totals.fat / targets.fat) * 100;
        
        const overallProgress = (calorieProgress + proteinProgress + carbsProgress + fatProgress) / 4;
        
        // Update overall status
        let status, statusClass;
        if (overallProgress >= 90) {
            status = 'Excellent! 🎯';
            statusClass = 'excellent';
        } else if (overallProgress >= 70) {
            status = 'On Track! 👍';
            statusClass = 'good';
        } else if (overallProgress >= 50) {
            status = 'Making Progress 📈';
            statusClass = 'okay';
        } else if (overallProgress >= 25) {
            status = 'Keep Going! 💪';
            statusClass = 'needs-work';
        } else {
            status = 'Just Started 🌱';
            statusClass = 'started';
        }
        
        const statusEl = document.getElementById('overall-status');
        const progressEl = document.getElementById('overall-progress');
        const caloriesLeftEl = document.getElementById('calories-left');
        
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = `stat-value ${statusClass}`;
        }
        if (progressEl) progressEl.textContent = Math.round(overallProgress) + '%';
        
        // Update calories left
        const caloriesLeft = Math.max(targets.calories - totals.calories, 0);
        if (caloriesLeftEl) caloriesLeftEl.textContent = Math.round(caloriesLeft);
    }
    
    checkAchievements(totals) {
        const targets = this.dailyTargets;
        
        // Check for goal achievements
        Object.keys(targets).forEach(nutrient => {
            const current = totals[nutrient];
            const target = targets[nutrient];
            const percentage = (current / target) * 100;
            
            // Achievement milestones
            if (percentage >= 100 && !this.hasShownAchievement(nutrient, 100)) {
                this.showAchievement(`🎉 ${nutrient.toUpperCase()} goal completed!`, 'gold');
                this.markAchievementShown(nutrient, 100);
            } else if (percentage >= 75 && !this.hasShownAchievement(nutrient, 75)) {
                this.showAchievement(`🌟 75% of ${nutrient} goal reached!`, 'silver');
                this.markAchievementShown(nutrient, 75);
            } else if (percentage >= 50 && !this.hasShownAchievement(nutrient, 50)) {
                this.showAchievement(`⭐ Halfway to ${nutrient} goal!`, 'bronze');
                this.markAchievementShown(nutrient, 50);
            }
        });
    }
    
    hasShownAchievement(nutrient, milestone) {
        const today = new Date().toDateString();
        const key = `achievement_${nutrient}_${milestone}_${today}`;
        return localStorage.getItem(key) === 'shown';
    }
    
    markAchievementShown(nutrient, milestone) {
        const today = new Date().toDateString();
        const key = `achievement_${nutrient}_${milestone}_${today}`;
        localStorage.setItem(key, 'shown');
    }
    
    showAchievement(message, type) {
        const achievement = document.createElement('div');
        achievement.className = `achievement-popup ${type}`;
        achievement.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-message">${message}</div>
                <div class="achievement-close">&times;</div>
            </div>
        `;
        
        document.body.appendChild(achievement);
        
        // Animate in
        setTimeout(() => achievement.classList.add('show'), 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 300);
        }, 5000);
        
        // Close on click
        achievement.querySelector('.achievement-close').addEventListener('click', () => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 300);
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    await loadDatabases();
    buildSearchIndex();
    setupEventListeners();
    loadPersistedMeal();
    updateTotals();
    
    // Initialize Enhanced User Profile (TDEE + targets)
    try {
        enhancedUserProfile = new EnhancedUserProfile();
        advancedProgressTracker = new AdvancedProgressTracker();
        if (isDebugMode) console.log('✅ Enhanced systems initialized');
    } catch (error) {
        console.error('Failed to initialize enhanced systems:', error);
    }
    
    if (isDebugMode) console.log('🐛 Debug mode enabled');
});

function initializeElements() {
    elements.searchInput = document.getElementById('foodSearch');
    elements.suggestions = document.getElementById('suggestions');
    elements.mealTbody = document.getElementById('mealTbody');
    elements.totalCals = document.getElementById('totalCals');
    elements.totalProtein = document.getElementById('totalProtein');
    elements.totalCarbs = document.getElementById('totalCarbs');
    elements.totalFat = document.getElementById('totalFat');
    elements.tdeeInput = document.getElementById('tdeeInput');
    elements.tdeeBar = document.getElementById('tdeeBar');
    elements.tdeePercent = document.getElementById('tdeePercent');
    elements.quantityModal = document.getElementById('quantityModal');
    elements.customFoodModal = document.getElementById('customFoodModal');
    elements.importModal = document.getElementById('importModal');
}

async function loadDatabases() {
    try {
        // Load all JSON databases
        const [foodsResponse, fssaiResponse, mealsResponse] = await Promise.all([
            fetch('foods.json').catch(() => ({ ok: false })),
            fetch('localFSSAI.json').catch(() => ({ ok: false })),
            fetch('meal.json').catch(() => ({ ok: false }))
        ]);

        if (foodsResponse.ok) {
            foodDatabase = await foodsResponse.json();
            if (isDebugMode) console.log('Loaded foods.json:', foodDatabase.length, 'items');
        }

        if (fssaiResponse.ok) {
            fssaiDatabase = await fssaiResponse.json();
            if (isDebugMode) console.log('Loaded localFSSAI.json:', fssaiDatabase.length, 'items');
        }

        if (mealsResponse.ok) {
            mealDatabase = await mealsResponse.json();
            if (isDebugMode) console.log('Loaded meal.json:', mealDatabase.length, 'items');
        }
    } catch (error) {
        console.error('Error loading databases:', error);
        showToast('Error loading food databases', 'error');
    }
}

function buildSearchIndex() {
    searchIndex = [];

    // Add meal database items
    mealDatabase.forEach(item => {
        searchIndex.push({
            ...item,
            searchName: item.name.toLowerCase(),
            source_type: 'meal'
        });
    });

    // Add FSSAI database items
    fssaiDatabase.forEach(item => {
        searchIndex.push({
            ...item,
            searchName: item.name.toLowerCase(),
            source_type: 'fssai'
        });
    });

    // Add general food database items
    foodDatabase.forEach(item => {
        searchIndex.push({
            ...item,
            searchName: item.name.toLowerCase(),
            source_type: 'local'
        });
    });

    if (isDebugMode) console.log('Built search index with', searchIndex.length, 'items');
}

function setupEventListeners() {
    // Search input with debouncing
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        searchTimeout = setTimeout(() => performSearch(query), 300);
    });

    // Search input keyboard navigation
    elements.searchInput.addEventListener('keydown', handleSearchKeydown);

    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#foodSearch') && !e.target.closest('#suggestions')) {
            hideSuggestions();
        }
    });

    // TDEE input
    elements.tdeeInput.addEventListener('input', updateTDEEComparison);

    // Button event listeners
    document.getElementById('btnAddCustom').addEventListener('click', openCustomFoodModal);
    document.getElementById('btnImportMeal').addEventListener('click', openImportModal);
    document.getElementById('btnDownloadMeal').addEventListener('click', downloadMealPDF);
    document.getElementById('btnCopyMeal').addEventListener('click', copyMealJSON);
    document.getElementById('btnExportMeal').addEventListener('click', exportMealJSON);
    document.getElementById('btnClearMeal').addEventListener('click', clearMeal);

    // Modal event listeners
    setupModalEventListeners();
}

function setupModalEventListeners() {
    // Quantity Modal
    const quantityModal = elements.quantityModal;
    document.getElementById('modalCancel').addEventListener('click', () => closeModal(quantityModal));
    document.getElementById('modalConfirm').addEventListener('click', confirmAddFood);
    document.getElementById('modalQuantity').addEventListener('input', updateModalPreview);
    document.getElementById('modalUnit').addEventListener('change', updateModalPreview);

    // Close modal on backdrop click
    quantityModal.addEventListener('click', (e) => {
        if (e.target === quantityModal) closeModal(quantityModal);
    });

    // Custom Food Modal
    const customFoodModal = elements.customFoodModal;
    document.getElementById('customModalCancel').addEventListener('click', () => closeModal(customFoodModal));
    document.getElementById('customModalConfirm').addEventListener('click', addCustomFood);
    customFoodModal.addEventListener('click', (e) => {
        if (e.target === customFoodModal) closeModal(customFoodModal);
    });

    // Import Modal
    const importModal = elements.importModal;
    document.getElementById('importModalCancel').addEventListener('click', () => closeModal(importModal));
    document.getElementById('importModalConfirm').addEventListener('click', importMealData);
    importModal.addEventListener('click', (e) => {
        if (e.target === importModal) closeModal(importModal);
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!quantityModal.classList.contains('hidden')) closeModal(quantityModal);
            if (!customFoodModal.classList.contains('hidden')) closeModal(customFoodModal);
            if (!importModal.classList.contains('hidden')) closeModal(importModal);
        }
    });
}

async function performSearch(query) {
    if (isDebugMode) console.log('🔍 Searching for:', query);
    const lowQuery = query.toLowerCase();
    let results = [];

    // 1. Search meal database (exact & fuzzy)
    const mealResults = searchIndex
        .filter(item => item.source_type === 'meal')
        .filter(item => item.searchName.includes(lowQuery))
        .slice(0, 6);
    results.push(...mealResults);

    // 2. Search FSSAI database
    if (results.length < 6) {
        const fssaiResults = searchIndex
            .filter(item => item.source_type === 'fssai')
            .filter(item => item.searchName.includes(lowQuery))
            .slice(0, 6 - results.length);
        results.push(...fssaiResults);
    }

    // 3. Search local foods database
    if (results.length < 6) {
        const localResults = searchIndex
            .filter(item => item.source_type === 'local')
            .filter(item => item.searchName.includes(lowQuery))
            .slice(0, 6 - results.length);
        results.push(...localResults);
    }

    // 4. If still need more results, search USDA
    if (results.length < 6) {
        try {
            const usdaResults = await searchUSDA(query);
            results.push(...usdaResults.slice(0, 6 - results.length));
        } catch (error) {
            console.error('USDA search failed:', error);
            showToast('USDA lookup unavailable — showing local results', 'warning');
        }
    }

    displaySuggestions(results, lowQuery);
}

async function searchUSDA(query) {
    // Check cache first
    const cacheKey = `usda-search-${query}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
        if (isDebugMode) console.log('Using cached USDA search for:', query);
        return cached;
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${USDA_PAGE_SIZE}&api_key=${USDA_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const results = data.foods?.map(food => mapUSDAFoodToLocal(food)) || [];

        // Cache results
        setCachedData(cacheKey, results);

        if (isDebugMode) console.log('USDA API returned', results.length, 'items');
        return results;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

function mapUSDAFoodToLocal(usdaFood) {
    const nutrients = usdaFood.foodNutrients || [];

    // Map USDA nutrient codes to our schema
    const getNutrientValue = (codes) => {
        const nutrient = nutrients.find(n => codes.includes(n.nutrientId));
        return nutrient ? nutrient.value : 0;
    };

    return {
        id: `usda-${usdaFood.fdcId}`,
        name: usdaFood.description || 'Unknown food',
        calories: getNutrientValue([1008, 1062]), // Energy kcal
        protein: getNutrientValue([1003]), // Protein
        carbs: getNutrientValue([1005, 1050]), // Carbohydrate, by difference
        fat: getNutrientValue([1004]), // Total lipid (fat)
        serving_size: '100 g',
        serving_grams: 100,
        source: 'USDA',
        origin: 'US',
        last_updated: new Date().toISOString().split('T')[0],
        label_url: '',
        source_type: 'usda',
        confidence: usdaFood.score || 0,
        source_raw: usdaFood
    };
}

function displaySuggestions(results, query) {
    if (results.length === 0) {
        hideSuggestions();
        return;
    }

    const html = results.map((item, index) => {
        const icon = getSourceIcon(item);
        const badge = getSourceBadge(item);
        const highlightedName = highlightMatch(item.name, query);
        const calories = item.calories ? `${Math.round(item.calories)} cal/100g` : 'No cal info';

        return `
            <div class="suggestion-item px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center justify-between"
                 data-index="${index}" role="option" tabindex="-1">
                <div class="flex items-center space-x-3 flex-1">
                    <span class="text-lg">${icon}</span>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 truncate">${highlightedName}</div>
                        <div class="flex items-center space-x-2 mt-1">
                            ${badge}
                            <span class="text-xs text-gray-500">${calories}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    elements.suggestions.innerHTML = html;
    elements.suggestions.classList.remove('hidden');
    elements.searchInput.setAttribute('aria-expanded', 'true');

    // Add click listeners to suggestions
    elements.suggestions.querySelectorAll('.suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => selectSuggestion(results[index]));
    });

    currentSuggestionIndex = -1;
}

function getSourceIcon(item) {
    switch (item.source_type || item.source) {
        case 'meal':
        case 'Meal Planner': return '🍲';
        case 'fssai':
        case 'FSSAI': return '🥤';
        case 'usda':
        case 'USDA': return '🍗';
        default: return '🥗';
    }
}

function getSourceBadge(item) {
    const source = item.source_type || item.source;
    switch (source) {
        case 'meal':
        case 'Meal Planner':
            return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Meal Planner</span>';
        case 'fssai':
        case 'FSSAI':
            return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">🇮🇳 FSSAI</span>';
        case 'usda':
        case 'USDA':
            return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">🇺🇸 USDA</span>';
        default:
            return '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Local</span>';
    }
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

function escapeRegex(string) {
return string.replace(/[.*+?^${}()|[\]\\]/g, '$&');

}


function handleSearchKeydown(e) {
    const suggestionItems = elements.suggestions.querySelectorAll('.suggestion-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
            updateSuggestionHighlight(suggestionItems);
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
            updateSuggestionHighlight(suggestionItems);
            break;
        case 'Enter':
            e.preventDefault();
            if (currentSuggestionIndex >= 0 && suggestionItems[currentSuggestionIndex]) {
                suggestionItems[currentSuggestionIndex].click();
            }
            break;
        case 'Escape':
            hideSuggestions();
            break;
    }
}

function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('bg-blue-50');
            item.setAttribute('aria-selected', 'true');
        } else {
            item.classList.remove('bg-blue-50');
            item.setAttribute('aria-selected', 'false');
        }
    });
}

function hideSuggestions() {
    elements.suggestions.classList.add('hidden');
    elements.searchInput.setAttribute('aria-expanded', 'false');
    currentSuggestionIndex = -1;
}

function selectSuggestion(food) {
    currentFoodForModal = food;
    currentEditIndex = -1;
    openQuantityModal();
    hideSuggestions();
    elements.searchInput.value = '';
}

function openQuantityModal() {
    const food = currentFoodForModal;
    if (!food) return;

    // Populate food info
    const foodInfoEl = document.getElementById('modalFoodInfo');
    foodInfoEl.innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="text-2xl">${getSourceIcon(food)}</span>
            <div class="flex-1">
                <h4 class="font-medium text-gray-900">${food.name}</h4>
                <div class="flex items-center space-x-2 mt-1">
                    ${getSourceBadge(food)}
                    ${food.last_updated ? `<span class="text-xs text-gray-500">Updated: ${food.last_updated}</span>` : ''}
                </div>
                <div class="text-sm text-gray-600 mt-1">
                    ${Math.round(food.calories || 0)} cal, ${(food.protein || 0).toFixed(1)}g protein per 100g
                </div>
            </div>
        </div>
    `;

    // Reset form
    document.getElementById('modalQuantity').value = currentEditIndex >= 0 ? mealList[currentEditIndex].quantity : 100;
    document.getElementById('modalUnit').value = currentEditIndex >= 0 ? mealList[currentEditIndex].unit : 'g';

    // Set up unit options
    const unitSelect = document.getElementById('modalUnit');
    unitSelect.innerHTML = '<option value="g">grams (g)</option><option value="ml">milliliters (ml)</option>';
    
    if (food.serving_grams && food.serving_grams > 0) {
        unitSelect.innerHTML += `<option value="piece">pieces (${food.serving_grams}g each)</option>`;
    } else {
        unitSelect.innerHTML += '<option value="piece">pieces</option>';
    }

    updateModalPreview();
    showModal(elements.quantityModal);
}

function updateModalPreview() {
    const food = currentFoodForModal;
    if (!food) return;

    const quantity = parseFloat(document.getElementById('modalQuantity').value) || 0;
    const unit = document.getElementById('modalUnit').value;

    let grams = quantity;
    let conversionNote = '';

    if (unit === 'ml') {
        grams = quantity; // Assume 1ml ≈ 1g for most foods
        conversionNote = ' (assuming 1ml ≈ 1g)';
    } else if (unit === 'piece') {
        const servingGrams = food.serving_grams || 50; // Default piece size
        grams = quantity * servingGrams;
        conversionNote = ` (${servingGrams}g per piece)`;
    }

    const factor = grams / 100;
    const calories = Math.round((food.calories || 0) * factor);
    const protein = ((food.protein || 0) * factor).toFixed(1);
    const carbs = ((food.carbs || 0) * factor).toFixed(1);
    const fat = ((food.fat || 0) * factor).toFixed(1);

    const previewEl = document.getElementById('modalPreview');
    previewEl.innerHTML = `
        <div class="text-sm">
            <div class="font-medium text-blue-900 mb-2">
                ${quantity} ${unit} = ${grams.toFixed(0)}g${conversionNote}
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>Calories: <span class="font-medium">${calories}</span></div>
                <div>Protein: <span class="font-medium">${protein}g</span></div>
                <div>Carbs: <span class="font-medium">${carbs}g</span></div>
                <div>Fat: <span class="font-medium">${fat}g</span></div>
            </div>
        </div>
    `;
}

function confirmAddFood() {
    const food = currentFoodForModal;
    if (!food) return;

    const quantity = parseFloat(document.getElementById('modalQuantity').value);
    const unit = document.getElementById('modalUnit').value;

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    // Calculate grams
    let grams = quantity;
    if (unit === 'ml') {
        grams = quantity; // Assume 1ml ≈ 1g
    } else if (unit === 'piece') {
        const servingGrams = food.serving_grams || 50;
        grams = quantity * servingGrams;
    }

    // Calculate nutrients
    const factor = grams / 100;
    const mealItem = {
        id: food.id,
        name: food.name,
        quantity: quantity,
        unit: unit,
        grams: grams,
        calories: (food.calories || 0) * factor,
        protein: (food.protein || 0) * factor,
        carbs: (food.carbs || 0) * factor,
        fat: (food.fat || 0) * factor,
        source: food.source || 'Local',
        origin: food.origin || '',
        originalFood: food
    };

    if (currentEditIndex >= 0) {
        mealList[currentEditIndex] = mealItem;
        showToast('Food updated successfully', 'success');
    } else {
        mealList.push(mealItem);
        showToast('Food added to meal', 'success');
    }

    updateMealDisplay();
    updateTotals();
    persistMeal();
    closeModal(elements.quantityModal);
}

function updateMealDisplay() {
    const tbody = elements.mealTbody;
    
    if (mealList.length === 0) {
        tbody.innerHTML = `
            <tr id="emptyMealRow">
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    No items added yet. Search and add foods to get started.
                </td>
            </tr>
        `;
        updateExportButtons(false);
        return;
    }

    const html = mealList.map((item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                    <span class="text-sm">${getSourceIcon(item.originalFood)}</span>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${item.name}</div>
                        <div class="text-xs text-gray-500">${getSourceBadge(item.originalFood)}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
                ${item.quantity} ${item.unit}
                ${item.grams !== item.quantity ? `<div class="text-xs text-gray-500">(${Math.round(item.grams)}g)</div>` : ''}
            </td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${Math.round(item.calories)}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.protein.toFixed(1)}g</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.carbs.toFixed(1)}g</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.fat.toFixed(1)}g</td>
            <td class="px-4 py-3 text-sm font-medium">
                <button onclick="editMealItem(${index})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onclick="removeMealItem(${index})" class="text-red-600 hover:text-red-900">Remove</button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
    updateExportButtons(true);
}

function editMealItem(index) {
    currentEditIndex = index;
    currentFoodForModal = mealList[index].originalFood;
    openQuantityModal();
}

function removeMealItem(index) {
    mealList.splice(index, 1);
    updateMealDisplay();
    updateTotals();
    persistMeal();
    showToast('Item removed from meal', 'success');
}

function updateTotals() {
    const totals = mealList.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    elements.totalCals.textContent = Math.round(totals.calories);
    elements.totalProtein.textContent = totals.protein.toFixed(1) + 'g';
    elements.totalCarbs.textContent = totals.carbs.toFixed(1) + 'g';
    elements.totalFat.textContent = totals.fat.toFixed(1) + 'g';

    updateTDEEComparison();
    
    // Update advanced progress tracker
    if (advancedProgressTracker) {
        advancedProgressTracker.updateProgress(totals);
    }
}

function updateTDEEComparison() {
    const tdee = parseFloat(elements.tdeeInput.value);
    const currentCalories = mealList.reduce((sum, item) => sum + item.calories, 0);

    if (!tdee || tdee <= 0) {
        elements.tdeePercent.textContent = '0%';
        elements.tdeeBar.style.width = '0%';
        return;
    }

    const percentage = Math.min((currentCalories / tdee) * 100, 200);
    elements.tdeePercent.textContent = percentage.toFixed(1) + '%';
    elements.tdeeBar.style.width = percentage + '%';

    // Change color based on progress
    const bar = elements.tdeeBar;
    bar.className = bar.className.replace(/bg-(red|yellow|green|blue)-\d+/, '');
    
    if (percentage < 80) {
        bar.classList.add('bg-blue-600');
    } else if (percentage <= 100) {
        bar.classList.add('bg-green-600');
    } else if (percentage <= 120) {
        bar.classList.add('bg-yellow-600');
    } else {
        bar.classList.add('bg-red-600');
    }
}

function updateExportButtons(enabled) {
    const buttons = ['btnDownloadMeal', 'btnCopyMeal', 'btnExportMeal'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        btn.disabled = !enabled;
        if (enabled) {
            btn.classList.remove('disabled:bg-gray-300', 'disabled:cursor-not-allowed');
        } else {
            btn.classList.add('disabled:bg-gray-300', 'disabled:cursor-not-allowed');
        }
    });
}

async function downloadMealPDF() {
    if (mealList.length === 0) {
        showToast('No items to export', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Header
        pdf.setFontSize(18);
        pdf.text('Enhanced Nutrition Report', 20, 20);
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

        // Profile info if available
        if (enhancedUserProfile?.userData) {
            const profile = enhancedUserProfile.userData;
            pdf.text(`Profile: ${profile.age}y, ${profile.gender}, ${profile.weight}kg, ${profile.height}cm`, 20, 40);
        }

        // Totals
        const totals = mealList.reduce((acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fat: acc.fat + item.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        pdf.setFontSize(12);
        pdf.text('NUTRITION TOTALS', 20, 55);
        pdf.setFontSize(10);
        pdf.text(`Calories: ${Math.round(totals.calories)}`, 20, 65);
        pdf.text(`Protein: ${totals.protein.toFixed(1)}g`, 70, 65);
        pdf.text(`Carbs: ${totals.carbs.toFixed(1)}g`, 20, 75);
        pdf.text(`Fat: ${totals.fat.toFixed(1)}g`, 70, 75);

        // TDEE comparison
        const tdee = parseFloat(elements.tdeeInput.value);
        if (tdee > 0) {
            const percentage = (totals.calories / tdee * 100).toFixed(1);
            pdf.text(`TDEE Progress: ${percentage}% (${Math.round(totals.calories)}/${tdee} calories)`, 20, 85);
        }

        // Food items
        pdf.setFontSize(12);
        pdf.text('FOOD ITEMS', 20, 100);
        
        let yPos = 110;
        mealList.forEach((item, index) => {
            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }
            
            pdf.setFontSize(10);
            pdf.text(`${index + 1}. ${item.name}`, 20, yPos);
            pdf.text(`${item.quantity} ${item.unit} | ${Math.round(item.calories)} cal`, 20, yPos + 7);
            pdf.text(`P: ${item.protein.toFixed(1)}g | C: ${item.carbs.toFixed(1)}g | F: ${item.fat.toFixed(1)}g`, 20, yPos + 14);
            pdf.setFontSize(8);
            pdf.text(`Source: ${item.source}`, 20, yPos + 21);
            yPos += 30;
        });

        pdf.save(`enhanced-nutrition-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('Enhanced PDF downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF', 'error');
    }
}

function copyMealJSON() {
    if (mealList.length === 0) {
        showToast('No meal to copy', 'warning');
        return;
    }

    try {
        const jsonData = JSON.stringify(mealList, null, 2);
        navigator.clipboard.writeText(jsonData);
        showToast('Meal JSON copied to clipboard', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        showToast('Error copying to clipboard', 'error');
    }
}

function exportMealJSON() {
    if (mealList.length === 0) {
        showToast('No meal to export', 'warning');
        return;
    }

    try {
        const exportData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            meals: mealList,
            profile: enhancedUserProfile?.userData || null
        };
        
        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-meal-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Enhanced meal data exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting meal', 'error');
    }
}

function clearMeal() {
    if (mealList.length === 0) return;
    
    if (confirm('Are you sure you want to clear all items from your meal?')) {
        mealList = [];
        updateMealDisplay();
        updateTotals();
        persistMeal();
        showToast('Meal cleared', 'success');
    }
}

function openCustomFoodModal() {
    // Reset form
    document.getElementById('customFoodForm').reset();
    showModal(elements.customFoodModal);
}

function addCustomFood() {
    const name = document.getElementById('customName').value.trim();
    const calories = parseFloat(document.getElementById('customCalories').value);
    const protein = parseFloat(document.getElementById('customProtein').value);
    const carbs = parseFloat(document.getElementById('customCarbs').value);
    const fat = parseFloat(document.getElementById('customFat').value);
    const servingGrams = parseFloat(document.getElementById('customServingGrams').value) || null;

    if (!name || isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
        showToast('Please fill all required fields with valid numbers', 'error');
        return;
    }

    const customFood = {
        id: `custom-${Date.now()}`,
        name: name,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        serving_size: servingGrams ? `${servingGrams} g` : '100 g',
        serving_grams: servingGrams || 100,
        source: 'Custom',
        origin: 'User',
        last_updated: new Date().toISOString().split('T')[0],
        label_url: '',
        source_type: 'custom'
    };

    // Add to search index
    searchIndex.push({
        ...customFood,
        searchName: customFood.name.toLowerCase()
    });

    closeModal(elements.customFoodModal);

    // Immediately open quantity modal for this custom food
    currentFoodForModal = customFood;
    currentEditIndex = -1;
    openQuantityModal();
    showToast('Custom food added', 'success');
}

function openImportModal() {
    document.getElementById('importTextarea').value = '';
    showModal(elements.importModal);
}

function importMealData() {
    const jsonText = document.getElementById('importTextarea').value.trim();
    
    if (!jsonText) {
        showToast('Please paste JSON data', 'warning');
        return;
    }

    try {
        const importedData = JSON.parse(jsonText);
        
        // Handle both old and new format
        const meals = importedData.meals || (Array.isArray(importedData) ? importedData : []);
        
        if (!Array.isArray(meals)) {
            throw new Error('Invalid meal data format');
        }

        // Validate structure
        const validItems = meals.filter(item => 
            item.name && 
            typeof item.calories === 'number' && 
            typeof item.protein === 'number' && 
            typeof item.carbs === 'number' && 
            typeof item.fat === 'number'
        );

        if (validItems.length === 0) {
            throw new Error('No valid meal items found');
        }

        // Replace current meal
        mealList = validItems;
        updateMealDisplay();
        updateTotals();
        persistMeal();
        closeModal(elements.importModal);
        
        showToast(`Imported ${validItems.length} meal items successfully`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showToast(`Import failed: ${error.message}`, 'error');
    }
}

function showModal(modal) {
    modal.classList.remove('hidden');
    modal.focus();
}

function closeModal(modal) {
    modal.classList.add('hidden');
    currentFoodForModal = null;
    currentEditIndex = -1;
}

function persistMeal() {
    try {
        const stateData = {
            meals: mealList,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('food-calc-meal', JSON.stringify(stateData.meals));
        localStorage.setItem('food-calc-tdee', elements.tdeeInput.value);
        
        // Enhanced storage
        localStorage.setItem('enhanced-calc-state', JSON.stringify(stateData));
        
    } catch (error) {
        console.error('Error saving meal:', error);
    }
}

function loadPersistedMeal() {
    try {
        // Try enhanced storage first
        const enhancedState = localStorage.getItem('enhanced-calc-state');
        if (enhancedState) {
            const state = JSON.parse(enhancedState);
            mealList = state.meals || [];
        } else {
            // Fallback to original storage
            const savedMeal = localStorage.getItem('food-calc-meal');
            if (savedMeal) {
                mealList = JSON.parse(savedMeal);
            }
        }
        
        const savedTdee = localStorage.getItem('food-calc-tdee');
        if (savedTdee) {
            elements.tdeeInput.value = savedTdee;
        }
        
        updateMealDisplay();
    } catch (error) {
        console.error('Error loading persisted meal:', error);
    }
}

function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > USDA_CACHE_TTL_MS) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data.value;
    } catch (error) {
        localStorage.removeItem(key);
        return null;
    }
}

function setCachedData(key, value) {
    try {
        const data = {
            value: value,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        if (isDebugMode) console.log('Cached:', key);
    } catch (error) {
        console.error('Cache error:', error);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    toast.className = `${colors[type]} px-4 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Make functions globally available for onclick handlers
window.editMealItem = editMealItem;
window.removeMealItem = removeMealItem;

// Debug function for development
if (isDebugMode) {
    window.debugApp = () => ({
        mealList,
        searchIndex: searchIndex.length,
        databases: {
            foods: foodDatabase.length,
            fssai: fssaiDatabase.length, 
            meals: mealDatabase.length
        },
        cache: Object.keys(localStorage).filter(k => k.includes('usda')),
        profile: enhancedUserProfile ? enhancedUserProfile.getDailyTargets() : null,
        progressTracker: advancedProgressTracker ? 'initialized' : 'not initialized'
    });
}
