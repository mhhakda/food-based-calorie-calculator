/**
 * Food Calculator - Complete with Working Voice Search & Barcode Scanner
 * Version 3.2 - Diet Tracker Design System Integration
 * Maintains all functionality while applying consistent UI/UX
 */

// CONFIGURATION CONSTANTS
const USDA_API_KEY = 'MA2uDUaXzLNNDGmRBiRu1p0YxC7cCoBduPhhPnhK';
const USDA_PAGE_SIZE = 8;
const USDA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const DEFAULT_MACRO_SPLIT = { protein: 0.25, carbs: 0.45, fat: 0.30 };
const ACTIVITY_MULTIPLIERS = {
    1.2: 'Sedentary',
    1.375: 'Light',
    1.55: 'Moderate', 
    1.725: 'Active',
    1.9: 'Very Active'
};

// GLOBAL VARIABLES
let searchTimeout = null;
let globalState = {
    mealList: [],
    currentFoodForModal: null,
    currentEditIndex: -1,
    currentSearchFilter: 'all',
    dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
    isDebugMode: new URLSearchParams(window.location.search).get('debug') === 'true'
};

// EXPANDED FOOD CATEGORIES - 20+ ITEMS EACH
const CATEGORY_FOODS = {
    fruits: [
        { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
        { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
        { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
        { name: 'Grapes', calories: 62, protein: 0.6, carbs: 16, fat: 0.2 },
        { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
        { name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
        { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
        { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
        { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },
        { name: 'Papaya', calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
        { name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5 },
        { name: 'Peach', calories: 39, protein: 0.9, carbs: 10, fat: 0.3 },
        { name: 'Pear', calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
        { name: 'Plum', calories: 46, protein: 0.7, carbs: 11, fat: 0.3 },
        { name: 'Pomegranate', calories: 83, protein: 1.7, carbs: 19, fat: 1.2 },
        { name: 'Guava', calories: 68, protein: 2.6, carbs: 14, fat: 1.0 },
        { name: 'Lychee', calories: 66, protein: 0.8, carbs: 17, fat: 0.4 },
        { name: 'Cherries', calories: 63, protein: 1.1, carbs: 16, fat: 0.2 },
        { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15 },
        { name: 'Coconut', calories: 354, protein: 3.3, carbs: 15, fat: 33 }
    ],
    vegetables: [
        { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
        { name: 'Spinach', calories: 23, protein: 2.9, carbs: 4, fat: 0.4 },
        { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
        { name: 'Tomato', calories: 18, protein: 0.9, carbs: 4, fat: 0.2 },
        { name: 'Onion', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
        { name: 'Potato', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
        { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
        { name: 'Bell Pepper', calories: 31, protein: 1, carbs: 7, fat: 0.3 },
        { name: 'Cucumber', calories: 16, protein: 0.7, carbs: 4, fat: 0.1 },
        { name: 'Cauliflower', calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
        { name: 'Cabbage', calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
        { name: 'Lettuce', calories: 15, protein: 1.4, carbs: 3, fat: 0.2 },
        { name: 'Beetroot', calories: 43, protein: 1.6, carbs: 10, fat: 0.2 },
        { name: 'Radish', calories: 16, protein: 0.7, carbs: 2, fat: 0.1 },
        { name: 'Green Beans', calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
        { name: 'Peas', calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
        { name: 'Mushroom', calories: 22, protein: 3.1, carbs: 3, fat: 0.3 },
        { name: 'Okra (Bhindi)', calories: 33, protein: 1.9, carbs: 7, fat: 0.2 },
        { name: 'Eggplant (Brinjal)', calories: 25, protein: 1, carbs: 6, fat: 0.2 },
        { name: 'Bottle Gourd (Lauki)', calories: 14, protein: 0.6, carbs: 3, fat: 0.0 }
    ],
    proteins: [
        { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        { name: 'Fish (Salmon)', calories: 208, protein: 25, carbs: 0, fat: 12 },
        { name: 'Eggs (2 large)', calories: 155, protein: 13, carbs: 1, fat: 11 },
        { name: 'Greek Yogurt', calories: 130, protein: 11, carbs: 9, fat: 5 },
        { name: 'Paneer', calories: 265, protein: 18, carbs: 1.2, fat: 20 },
        { name: 'Tofu', calories: 144, protein: 17, carbs: 3, fat: 9 },
        { name: 'Lentils (Cooked)', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
        { name: 'Chickpeas (Cooked)', calories: 164, protein: 8, carbs: 27, fat: 2.6 },
        { name: 'Kidney Beans (Rajma)', calories: 127, protein: 8.7, carbs: 23, fat: 0.5 },
        { name: 'Black Gram (Urad Dal)', calories: 341, protein: 25, carbs: 59, fat: 1.6 },
        { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1 },
        { name: 'Lean Beef', calories: 250, protein: 26, carbs: 0, fat: 15 },
        { name: 'Tuna (Canned)', calories: 154, protein: 25, carbs: 0, fat: 6 },
        { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3, fat: 4 },
        { name: 'Quinoa (Cooked)', calories: 120, protein: 4.4, carbs: 22, fat: 1.9 },
        { name: 'Soy Chunks', calories: 345, protein: 52, carbs: 33, fat: 1.8 },
        { name: 'Almonds', calories: 575, protein: 21, carbs: 22, fat: 49 },
        { name: 'Peanuts', calories: 567, protein: 26, carbs: 16, fat: 49 },
        { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65 },
        { name: 'Whey Protein (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1 }
    ],
    grains: [
        { name: 'Brown Rice (Cooked)', calories: 112, protein: 2.6, carbs: 22, fat: 0.9 },
        { name: 'White Rice (Cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
        { name: 'Wheat Roti', calories: 297, protein: 12, carbs: 51, fat: 4.4 },
        { name: 'Oats', calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
        { name: 'Quinoa (Cooked)', calories: 120, protein: 4.4, carbs: 22, fat: 1.9 },
        { name: 'Barley (Cooked)', calories: 123, protein: 2.3, carbs: 28, fat: 0.4 },
        { name: 'Millet (Bajra)', calories: 378, protein: 11, carbs: 67, fat: 5 },
        { name: 'Sorghum (Jowar)', calories: 329, protein: 10, carbs: 72, fat: 1.9 },
        { name: 'Buckwheat', calories: 343, protein: 13, carbs: 72, fat: 3.4 },
        { name: 'Whole Wheat Bread (2 slices)', calories: 160, protein: 8, carbs: 28, fat: 2 },
        { name: 'Brown Bread (2 slices)', calories: 138, protein: 6, carbs: 26, fat: 1.8 },
        { name: 'Pasta (Cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
        { name: 'Corn', calories: 86, protein: 3.3, carbs: 19, fat: 1.4 },
        { name: 'Popcorn (Plain)', calories: 387, protein: 13, carbs: 78, fat: 5 },
        { name: 'Rice Cakes', calories: 35, protein: 0.7, carbs: 7, fat: 0.3 },
        { name: 'Semolina (Suji)', calories: 360, protein: 13, carbs: 73, fat: 1.05 },
        { name: 'Vermicelli (Cooked)', calories: 112, protein: 3.2, carbs: 22, fat: 0.6 },
        { name: 'Upma', calories: 183, protein: 5, carbs: 27, fat: 6 },
        { name: 'Poha', calories: 180, protein: 6, carbs: 35, fat: 2 },
        { name: 'Idli (2 pieces)', calories: 78, protein: 3, carbs: 17, fat: 0 }
    ],
    dairy: [
        { name: 'Whole Milk (1 cup)', calories: 146, protein: 8, carbs: 11, fat: 8 },
        { name: 'Skim Milk (1 cup)', calories: 91, protein: 9, carbs: 12, fat: 0.6 },
        { name: 'Greek Yogurt', calories: 130, protein: 11, carbs: 9, fat: 5 },
        { name: 'Regular Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
        { name: 'Cheddar Cheese', calories: 402, protein: 25, carbs: 1.3, fat: 33 },
        { name: 'Mozzarella Cheese', calories: 300, protein: 22, carbs: 2.2, fat: 22 },
        { name: 'Paneer', calories: 265, protein: 18, carbs: 1.2, fat: 20 },
        { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3, fat: 4 },
        { name: 'Butter (1 tbsp)', calories: 102, protein: 0.1, carbs: 0, fat: 12 },
        { name: 'Ghee (1 tbsp)', calories: 112, protein: 0, carbs: 0, fat: 13 },
        { name: 'Cream', calories: 340, protein: 2.8, carbs: 2.8, fat: 37 },
        { name: 'Ice Cream', calories: 207, protein: 3.5, carbs: 24, fat: 11 },
        { name: 'Buttermilk', calories: 19, protein: 2, carbs: 3, fat: 0 },
        { name: 'Lassi (Sweet)', calories: 180, protein: 6, carbs: 20, fat: 8 },
        { name: 'Kheer', calories: 143, protein: 4, carbs: 22, fat: 4 },
        { name: 'Rasgulla', calories: 186, protein: 4, carbs: 32, fat: 4 },
        { name: 'Curd', calories: 98, protein: 11, carbs: 12, fat: 0 },
        { name: 'Cheese Spread', calories: 276, protein: 14, carbs: 6, fat: 22 },
        { name: 'Condensed Milk', calories: 321, protein: 8, carbs: 54, fat: 9 },
        { name: 'Milk Powder', calories: 496, protein: 26, carbs: 39, fat: 27 }
    ],
    snacks: [
        { name: 'Almonds (10 pieces)', calories: 69, protein: 2.6, carbs: 2.6, fat: 6 },
        { name: 'Cashews (10 pieces)', calories: 78, protein: 2.6, carbs: 4.4, fat: 6.2 },
        { name: 'Peanuts (20 pieces)', calories: 95, protein: 4.4, carbs: 2.7, fat: 8.2 },
        { name: 'Walnuts (5 halves)', calories: 98, protein: 2.3, carbs: 2, fat: 9.8 },
        { name: 'Raisins (30g)', calories: 90, protein: 1, carbs: 22, fat: 0.1 },
        { name: 'Dates (3 pieces)', calories: 66, protein: 0.4, carbs: 18, fat: 0.03 },
        { name: 'Trail Mix', calories: 462, protein: 13, carbs: 45, fat: 30 },
        { name: 'Popcorn (1 cup)', calories: 31, protein: 1, carbs: 6, fat: 0.4 },
        { name: 'Dark Chocolate (20g)', calories: 108, protein: 2, carbs: 12, fat: 7 },
        { name: 'Banana Chips', calories: 519, protein: 2.3, carbs: 58, fat: 34 },
        { name: 'Namkeen Mix', calories: 465, protein: 15, carbs: 55, fat: 21 },
        { name: 'Bhel Puri', calories: 200, protein: 6, carbs: 30, fat: 7 },
        { name: 'Samosa (1 piece)', calories: 262, protein: 6, carbs: 24, fat: 16 },
        { name: 'Pakora (5 pieces)', calories: 180, protein: 4, carbs: 15, fat: 12 },
        { name: 'Murukku', calories: 464, protein: 9, carbs: 52, fat: 25 },
        { name: 'Mathri (2 pieces)', calories: 120, protein: 3, carbs: 12, fat: 7 },
        { name: 'Khakhra (2 pieces)', calories: 80, protein: 3, carbs: 14, fat: 1.5 },
        { name: 'Roasted Chana', calories: 360, protein: 17, carbs: 63, fat: 5 },
        { name: 'Puffed Rice (Murmura)', calories: 325, protein: 7.5, carbs: 78, fat: 1 },
        { name: 'Digestive Biscuits (3 pieces)', calories: 150, protein: 2, carbs: 20, fat: 7 }
    ],
    beverages: [
        { name: 'Green Tea (1 cup)', calories: 2, protein: 0.5, carbs: 0, fat: 0 },
        { name: 'Black Coffee (1 cup)', calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: 'Coffee with Milk', calories: 25, protein: 1.3, carbs: 2.5, fat: 1 },
        { name: 'Masala Chai', calories: 50, protein: 2, carbs: 7, fat: 2 },
        { name: 'Fresh Orange Juice', calories: 47, protein: 0.7, carbs: 11, fat: 0.2 },
        { name: 'Apple Juice', calories: 46, protein: 0.1, carbs: 11, fat: 0.1 },
        { name: 'Coconut Water', calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2 },
        { name: 'Sugarcane Juice', calories: 183, protein: 0, carbs: 50, fat: 0.4 },
        { name: 'Lemon Water', calories: 7, protein: 0.1, carbs: 2.1, fat: 0 },
        { name: 'Buttermilk', calories: 19, protein: 2, carbs: 3, fat: 0 },
        { name: 'Lassi (Sweet)', calories: 180, protein: 6, carbs: 20, fat: 8 },
        { name: 'Lassi (Salted)', calories: 58, protein: 6, carbs: 4, fat: 3 },
        { name: 'Aam Panna', calories: 60, protein: 0.5, carbs: 15, fat: 0.1 },
        { name: 'Nimbu Paani', calories: 40, protein: 0.1, carbs: 10, fat: 0 },
        { name: 'Jaljeera', calories: 25, protein: 0.5, carbs: 6, fat: 0 },
        { name: 'Thandai', calories: 200, protein: 5, carbs: 25, fat: 8 },
        { name: 'Badam Milk', calories: 150, protein: 6, carbs: 18, fat: 6 },
        { name: 'Rose Milk', calories: 120, protein: 4, carbs: 20, fat: 3 },
        { name: 'Protein Shake', calories: 150, protein: 25, carbs: 5, fat: 2 },
        { name: 'Sports Drink', calories: 25, protein: 0, carbs: 6, fat: 0 }
    ],
    indian: [
        { name: 'Dal Rice', calories: 200, protein: 8, carbs: 35, fat: 3 },
        { name: 'Rajma Rice', calories: 250, protein: 12, carbs: 45, fat: 4 },
        { name: 'Chole', calories: 210, protein: 10, carbs: 30, fat: 6 },
        { name: 'Palak Paneer', calories: 180, protein: 12, carbs: 8, fat: 12 },
        { name: 'Butter Chicken', calories: 300, protein: 25, carbs: 8, fat: 18 },
        { name: 'Biryani (1 plate)', calories: 350, protein: 15, carbs: 55, fat: 8 },
        { name: 'Dosa', calories: 133, protein: 4, carbs: 16, fat: 6 },
        { name: 'Idli (2 pieces)', calories: 78, protein: 3, carbs: 17, fat: 0 },
        { name: 'Vada (2 pieces)', calories: 180, protein: 4, carbs: 20, fat: 9 },
        { name: 'Upma', calories: 183, protein: 5, carbs: 27, fat: 6 },
        { name: 'Poha', calories: 180, protein: 6, carbs: 35, fat: 2 },
        { name: 'Aloo Paratha', calories: 320, protein: 8, carbs: 42, fat: 14 },
        { name: 'Stuffed Paratha', calories: 280, protein: 8, carbs: 38, fat: 12 },
        { name: 'Puri Bhaji', calories: 400, protein: 8, carbs: 50, fat: 18 },
        { name: 'Sambar', calories: 85, protein: 4, carbs: 12, fat: 2.5 },
        { name: 'Rasam', calories: 45, protein: 2, carbs: 8, fat: 1 },
        { name: 'Fish Curry', calories: 180, protein: 20, carbs: 8, fat: 8 },
        { name: 'Chicken Curry', calories: 220, protein: 22, carbs: 6, fat: 12 },
        { name: 'Mutton Curry', calories: 280, protein: 25, carbs: 5, fat: 18 },
        { name: 'Mixed Vegetable Curry', calories: 120, protein: 4, carbs: 15, fat: 5 }
    ]
};

// EXTENDED INDIAN BRANDED FOODS DATABASE
const INDIAN_BRANDED_FOODS = [
    // Biscuits & Cookies
    { name: 'Parle-G Biscuit (4 pieces)', calories: 120, protein: 2, carbs: 22, fat: 3.5, brand: 'Parle' },
    { name: 'Marie Gold Biscuit (4 pieces)', calories: 130, protein: 2.5, carbs: 21, fat: 4, brand: 'Britannia' },
    { name: 'Good Day Cookies (2 pieces)', calories: 110, protein: 1.5, carbs: 16, fat: 4.5, brand: 'Britannia' },
    { name: 'Oreo Cookies (3 pieces)', calories: 160, protein: 2, carbs: 25, fat: 7, brand: 'Cadbury' },
    { name: 'Hide & Seek Cookies (3 pieces)', calories: 150, protein: 2, carbs: 20, fat: 7, brand: 'Parle' },
    { name: '50-50 Biscuits (4 pieces)', calories: 140, protein: 2.2, carbs: 20, fat: 5.5, brand: 'Britannia' },
    { name: 'Tiger Biscuits (4 pieces)', calories: 135, protein: 2.1, carbs: 19, fat: 5.8, brand: 'Britannia' },
    { name: 'Monaco Biscuits (6 pieces)', calories: 120, protein: 2.4, carbs: 18, fat: 4.2, brand: 'Parle' },

    // Chocolates & Sweets
    { name: 'Dairy Milk Chocolate (13g)', calories: 67, protein: 1, carbs: 7, fat: 4, brand: 'Cadbury' },
    { name: '5 Star Chocolate (22g)', calories: 110, protein: 1.5, carbs: 13, fat: 6, brand: 'Cadbury' },
    { name: 'Kit Kat (17g)', calories: 85, protein: 1.2, carbs: 10, fat: 4.5, brand: 'Nestle' },
    { name: 'Snickers (25g)', calories: 125, protein: 2.8, carbs: 14, fat: 6.5, brand: 'Mars' },
    { name: 'Kaju Katli (2 pieces)', calories: 180, protein: 4, carbs: 20, fat: 9, brand: 'Traditional' },
    { name: 'Gulab Jamun (2 pieces)', calories: 160, protein: 3, carbs: 28, fat: 4.5, brand: 'Traditional' },
    { name: 'Rasgulla (2 pieces)', calories: 186, protein: 4, carbs: 32, fat: 4, brand: 'Traditional' },

    // Chips & Namkeen
    { name: 'Lays Chips (30g pack)', calories: 160, protein: 2, carbs: 16, fat: 10, brand: 'Lays' },
    { name: 'Kurkure (30g)', calories: 150, protein: 2.5, carbs: 16, fat: 8.5, brand: 'PepsiCo' },
    { name: 'Haldirams Aloo Bhujia (30g)', calories: 170, protein: 5, carbs: 14, fat: 11, brand: 'Haldirams' },
    { name: 'Bikaji Bhujia (30g)', calories: 165, protein: 4.5, carbs: 15, fat: 10.5, brand: 'Bikaji' },
    { name: 'Uncle Chips (30g)', calories: 155, protein: 2.2, carbs: 17, fat: 9, brand: 'Uncle Chips' },
    { name: 'Balaji Wafers (30g)', calories: 150, protein: 2, carbs: 16.5, fat: 9, brand: 'Balaji' },

    // Instant Foods
    { name: 'Maggi Noodles (1 pack)', calories: 310, protein: 9, carbs: 46, fat: 11, brand: 'Nestle' },
    { name: 'Top Ramen Noodles', calories: 290, protein: 8, carbs: 44, fat: 10, brand: 'Nissin' },
    { name: 'Yippee Noodles', calories: 300, protein: 8.5, carbs: 45, fat: 10.5, brand: 'ITC' },
    { name: 'MTR Ready to Eat Poha', calories: 220, protein: 6, carbs: 38, fat: 5.5, brand: 'MTR' },
    { name: 'Gits Idli Mix (prepared)', calories: 180, protein: 6, carbs: 35, fat: 2, brand: 'Gits' },
    { name: 'MDH Pav Bhaji Masala (meal)', calories: 250, protein: 8, carbs: 35, fat: 9, brand: 'MDH' },

    // Beverages
    { name: 'Frooti (200ml)', calories: 85, protein: 0, carbs: 21, fat: 0, brand: 'Parle Agro' },
    { name: 'Maaza (200ml)', calories: 90, protein: 0, carbs: 22, fat: 0, brand: 'Coca Cola' },
    { name: 'Limca (200ml)', calories: 80, protein: 0, carbs: 20, fat: 0, brand: 'Coca Cola' },
    { name: 'Thums Up (200ml)', calories: 85, protein: 0, carbs: 21, fat: 0, brand: 'Coca Cola' },
    { name: 'Pepsi (200ml)', calories: 82, protein: 0, carbs: 20.5, fat: 0, brand: 'PepsiCo' },
    { name: 'Real Juice (200ml)', calories: 95, protein: 0.5, carbs: 23, fat: 0, brand: 'Dabur' },
    { name: 'Bournvita (2 tsp in milk)', calories: 180, protein: 8.5, carbs: 25, fat: 5, brand: 'Cadbury' },
    { name: 'Complan (2 tsp in milk)', calories: 185, protein: 9, carbs: 24, fat: 5.5, brand: 'Heinz' },

    // Dairy Products
    { name: 'Amul Butter (1 tbsp)', calories: 108, protein: 0.1, carbs: 0.1, fat: 12, brand: 'Amul' },
    { name: 'Amul Cheese Slice (1 slice)', calories: 65, protein: 4, carbs: 1, fat: 5, brand: 'Amul' },
    { name: 'Mother Dairy Paneer (100g)', calories: 265, protein: 18, carbs: 1.2, fat: 20, brand: 'Mother Dairy' },
    { name: 'Nestle Yogurt (100g)', calories: 70, protein: 4, carbs: 8, fat: 2.5, brand: 'Nestle' },
    { name: 'Britannia Cheese Spread (20g)', calories: 55, protein: 2.8, carbs: 1.2, fat: 4.4, brand: 'Britannia' },

    // Breakfast Cereals
    { name: 'Kelloggs Corn Flakes (30g)', calories: 110, protein: 2, carbs: 25, fat: 0.1, brand: 'Kelloggs' },
    { name: 'Chocos (30g)', calories: 120, protein: 1.8, carbs: 26, fat: 1.2, brand: 'Kelloggs' },
    { name: 'Oats (Quaker - 40g)', calories: 148, protein: 5.4, carbs: 26, fat: 3, brand: 'Quaker' },
    { name: 'Muesli (30g)', calories: 110, protein: 3.5, carbs: 20, fat: 2, brand: 'Kelloggs' },

    // Ice Creams
    { name: 'Amul Vanilla Ice Cream (100ml)', calories: 207, protein: 3.5, carbs: 24, fat: 11, brand: 'Amul' },
    { name: 'Kwality Walls Cornetto', calories: 230, protein: 4, carbs: 28, fat: 11, brand: 'HUL' },
    { name: 'Mother Dairy Kulfi (1 piece)', calories: 150, protein: 4, carbs: 20, fat: 6, brand: 'Mother Dairy' },
    { name: 'Vadilal Cassata (100ml)', calories: 190, protein: 3, carbs: 26, fat: 8, brand: 'Vadilal' }
];

// BARCODE SCANNER SETUP
let barcodeScanner = null;
let currentCameraId = null;
let isFlashlightOn = false;

// VOICE RECOGNITION SETUP
let recognition = null;
let isListening = false;

// =============================================
// INITIALIZATION FUNCTIONS
// =============================================

// Initialize the application
function initializeApp() {
    console.log('Initializing Food Calculator v3.2...');
    
    // Setup event listeners
    setupEventListeners();
    setupVoiceRecognition();
    updateProgress();
    
    // Setup profile form radio button styling
    setupRadioButtons();
    
    // Load saved data
    loadSavedData();
    
    // Initialize filter buttons
    initializeFilterButtons();
    
    console.log('Food Calculator initialized successfully!');
}

// Setup all event listeners
function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('user-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', toggleProfileForm);
    }

    // Search functionality
    const searchInput = document.getElementById('food-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const category = btn.dataset.category;
            if (category) {
                toggleCategory(category);
            }
        });
    });

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = btn.dataset.filter;
            setSearchFilter(filter);
        });
    });

    // Scanner and voice buttons
    const barcodeBtn = document.getElementById('barcode-btn');
    const voiceBtn = document.getElementById('voice-search-btn');
    
    if (barcodeBtn) barcodeBtn.addEventListener('click', openBarcodeScanner);
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoiceSearch);

    // Modal controls
    setupModalEventListeners();

    // Quick action buttons
    setupQuickActionListeners();

    console.log('Event listeners setup complete');
}

// Setup radio button styling for profile form
function setupRadioButtons() {
    const radioLabels = document.querySelectorAll('label input[type="radio"]');
    radioLabels.forEach(radio => {
        const label = radio.parentElement;
        
        radio.addEventListener('change', () => {
            // Remove active class from all labels in this group
            const groupName = radio.name;
            document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
                r.parentElement.classList.remove('btn-success');
                r.parentElement.classList.add('btn-secondary');
            });
            
            // Add active class to selected label
            if (radio.checked) {
                label.classList.remove('btn-secondary');
                label.classList.add('btn-success');
            }
        });
    });
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Quantity modal
    const quantityModal = document.getElementById('quantity-modal');
    const closeQuantity = document.getElementById('close-quantity');
    const cancelAdd = document.getElementById('cancel-add');
    const confirmAdd = document.getElementById('confirm-add');

    if (closeQuantity) closeQuantity.addEventListener('click', closeQuantityModal);
    if (cancelAdd) cancelAdd.addEventListener('click', closeQuantityModal);
    if (confirmAdd) confirmAdd.addEventListener('click', confirmAddFood);

    // Custom food modal
    const customFoodModal = document.getElementById('custom-food-modal');
    const closeCustomFood = document.getElementById('close-custom-food');
    const cancelCustomFood = document.getElementById('cancel-custom-food');
    const customFoodForm = document.getElementById('custom-food-form');

    if (closeCustomFood) closeCustomFood.addEventListener('click', closeCustomFoodModal);
    if (cancelCustomFood) cancelCustomFood.addEventListener('click', closeCustomFoodModal);
    if (customFoodForm) customFoodForm.addEventListener('submit', handleCustomFoodSubmit);

    // Barcode modal
    const barcodeModal = document.getElementById('barcode-modal');
    const closeBarcodeBtn = document.getElementById('close-barcode');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const manualEntryBtn = document.getElementById('manual-entry-btn');

    if (closeBarcodeBtn) closeBarcodeBtn.addEventListener('click', closeBarcodeScanner);
    if (switchCameraBtn) switchCameraBtn.addEventListener('click', switchCamera);
    if (flashlightBtn) flashlightBtn.addEventListener('click', toggleFlashlight);
    if (manualEntryBtn) manualEntryBtn.addEventListener('click', openManualBarcodeEntry);

    // Import modal
    const importModal = document.getElementById('import-modal');
    const closeImport = document.getElementById('close-import');
    const cancelImport = document.getElementById('cancel-import');
    const confirmImport = document.getElementById('confirm-import');

    if (closeImport) closeImport.addEventListener('click', closeImportModal);
    if (cancelImport) cancelImport.addEventListener('click', closeImportModal);
    if (confirmImport) confirmImport.addEventListener('click', handleImportConfirm);

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

// Setup quick action button listeners
function setupQuickActionListeners() {
    const addCustomBtn = document.getElementById('add-custom-food-btn');
    const importBtn = document.getElementById('import-meal-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const copyBtn = document.getElementById('copy-meal-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const clearBtn = document.getElementById('clear-meal-btn');

    if (addCustomBtn) addCustomBtn.addEventListener('click', openCustomFoodModal);
    if (importBtn) importBtn.addEventListener('click', openImportModal);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (copyBtn) copyBtn.addEventListener('click', copyMealToClipboard);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportToJSON);
    if (clearBtn) clearBtn.addEventListener('click', clearMeal);
}

// Initialize filter buttons
function initializeFilterButtons() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === globalState.currentSearchFilter) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-success');
        }
    });
}

// =============================================
// PROFILE MANAGEMENT FUNCTIONS
// =============================================

// Toggle profile form visibility
function toggleProfileForm() {
    const formSection = document.getElementById('profile-form-section');
    const toggleBtn = document.getElementById('profile-toggle');
    
    if (formSection && toggleBtn) {
        const isHidden = formSection.classList.contains('hidden');
        
        if (isHidden) {
            formSection.classList.remove('hidden');
            toggleBtn.textContent = 'Hide Profile Setup';
        } else {
            formSection.classList.add('hidden');
            toggleBtn.textContent = 'Show Profile Setup';
        }
    }
}

// Handle profile form submission
function handleProfileSubmit(e) {
    e.preventDefault();
    
    const age = parseInt(document.getElementById('user-age').value);
    const gender = document.getElementById('user-gender').value;
    const weight = parseFloat(document.getElementById('user-weight').value);
    const height = parseInt(document.getElementById('user-height').value);
    const activityLevel = parseFloat(document.getElementById('activity-level').value);
    const goal = document.querySelector('input[name="goal"]:checked')?.value;

    if (!age || !gender || !weight || !height || !activityLevel || !goal) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE
    const tdee = bmr * activityLevel;

    // Adjust for goals
    let targetCalories;
    switch (goal) {
        case 'lose':
            targetCalories = Math.round(tdee * 0.8); // 20% deficit
            break;
        case 'gain':
            targetCalories = Math.round(tdee * 1.2); // 20% surplus
            break;
        default:
            targetCalories = Math.round(tdee); // maintenance
    }

    // Calculate macros using optimal ratios
    const targetProtein = Math.round(targetCalories * DEFAULT_MACRO_SPLIT.protein / 4);
    const targetCarbs = Math.round(targetCalories * DEFAULT_MACRO_SPLIT.carbs / 4);
    const targetFat = Math.round(targetCalories * DEFAULT_MACRO_SPLIT.fat / 9);

    // Update global targets
    globalState.dailyTargets = {
        calories: targetCalories,
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat
    };

    // Update UI
    updateCalculatedGoals();
    updateProgress();
    
    // Save to localStorage
    localStorage.setItem('foodCalc_dailyTargets', JSON.stringify(globalState.dailyTargets));
    localStorage.setItem('foodCalc_userProfile', JSON.stringify({
        age, gender, weight, height, activityLevel, goal
    }));

    // Hide form and show success
    toggleProfileForm();
    showToast('Daily nutrition targets calculated successfully!', 'success');
}

// Update calculated goals display
function updateCalculatedGoals() {
    document.getElementById('target-calories').textContent = globalState.dailyTargets.calories;
    document.getElementById('target-protein').textContent = `${globalState.dailyTargets.protein}g`;
    document.getElementById('target-carbs').textContent = `${globalState.dailyTargets.carbs}g`;
    document.getElementById('target-fat').textContent = `${globalState.dailyTargets.fat}g`;
    
    const goalsCard = document.getElementById('calculated-goals');
    if (goalsCard) {
        goalsCard.classList.remove('hidden');
    }
}

// =============================================
// SEARCH AND CATEGORY FUNCTIONS
// =============================================

// Handle search input
function handleSearch() {
    const query = document.getElementById('food-search').value.trim().toLowerCase();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
        document.getElementById('search-suggestions').classList.remove('show');
        return;
    }

    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

// Perform food search
async function performSearch(query) {
    console.log(`Searching for: "${query}" with filter: ${globalState.currentSearchFilter}`);
    
    let results = [];
    const suggestionsContainer = document.getElementById('search-suggestions');

    try {
        // Search local foods
        if (globalState.currentSearchFilter === 'all' || globalState.currentSearchFilter === 'local') {
            results.push(...searchLocalFoods(query));
        }

        // Search Indian branded foods
        if (globalState.currentSearchFilter === 'all' || globalState.currentSearchFilter === 'indian') {
            results.push(...searchIndianBrandedFoods(query));
        }

        // Search USDA foods
        if (globalState.currentSearchFilter === 'all' || globalState.currentSearchFilter === 'usda') {
            const usdaResults = await searchUSDAFoods(query);
            results.push(...usdaResults);
        }

        // Limit results to prevent UI overload
        results = results.slice(0, 10);

        displaySearchResults(results);

    } catch (error) {
        console.error('Search error:', error);
        showToast('Search error occurred', 'danger');
    }
}

// Search local food database
function searchLocalFoods(query) {
    const results = [];
    
    Object.values(CATEGORY_FOODS).forEach(category => {
        category.forEach(food => {
            if (food.name.toLowerCase().includes(query)) {
                results.push({
                    ...food,
                    source: 'Local'
                });
            }
        });
    });
    
    return results;
}

// Search Indian branded foods
function searchIndianBrandedFoods(query) {
    return INDIAN_BRANDED_FOODS
        .filter(food => 
            food.name.toLowerCase().includes(query) ||
            (food.brand && food.brand.toLowerCase().includes(query))
        )
        .map(food => ({
            ...food,
            source: 'Indian Brands'
        }));
}

// Search USDA food database
async function searchUSDAFoods(query) {
    if (!USDA_API_KEY) {
        console.warn('USDA API key not configured');
        return [];
    }

    // Check cache first
    const cacheKey = `usda_${query}`;
    const cachedResults = getCachedResults(cacheKey);
    if (cachedResults) {
        console.log('Using cached USDA results for:', query);
        return cachedResults;
    }

    try {
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${USDA_PAGE_SIZE}&dataType=Foundation,SR%20Legacy`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }

        const data = await response.json();
        const results = data.foods?.map(food => parseUSDAFood(food)) || [];
        
        // Cache results
        setCachedResults(cacheKey, results);
        
        return results;
    } catch (error) {
        console.error('USDA search error:', error);
        return [];
    }
}

// Parse USDA food data
function parseUSDAFood(food) {
    const nutrients = food.foodNutrients || [];
    
    // Find specific nutrients by ID
    const getNutrient = (nutrientId) => {
        const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
        return nutrient ? nutrient.value : 0;
    };

    return {
        name: food.description || 'Unknown Food',
        calories: Math.round(getNutrient(1008) || 0), // Energy (kcal)
        protein: Math.round((getNutrient(1003) || 0) * 10) / 10, // Protein
        carbs: Math.round((getNutrient(1005) || 0) * 10) / 10, // Carbs
        fat: Math.round((getNutrient(1004) || 0) * 10) / 10, // Fat
        source: 'USDA',
        fdcId: food.fdcId
    };
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('search-suggestions');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="food-item"><div class="food-info"><div class="food-name text-muted">No foods found</div></div></div>';
        container.classList.add('show');
        return;
    }

    const html = results.map(food => `
        <div class="food-item" onclick="selectFood(${JSON.stringify(food).replace(/"/g, '&quot;')})">
            <div class="food-info">
                <div class="food-name">${food.name}</div>
                <div class="food-nutrition">
                    ${food.calories} cal • ${food.protein}g protein • ${food.carbs}g carbs • ${food.fat}g fat
                    ${food.source ? `<span class="text-muted"> • ${food.source}</span>` : ''}
                    ${food.brand ? `<span class="text-primary"> • ${food.brand}</span>` : ''}
                </div>
            </div>
            <button class="food-add-btn">Add</button>
        </div>
    `).join('');

    container.innerHTML = html;
    container.classList.add('show');
}

// Select food from search results
function selectFood(food) {
    globalState.currentFoodForModal = food;
    openQuantityModal();
}

// Set search filter
function setSearchFilter(filter) {
    globalState.currentSearchFilter = filter;
    
    // Update button styles
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-secondary');
    });
    
    document.querySelector(`[data-filter="${filter}"]`)?.classList.replace('btn-secondary', 'btn-success');
    
    // Re-search if there's a query
    const query = document.getElementById('food-search').value.trim();
    if (query.length >= 2) {
        performSearch(query.toLowerCase());
    }
}

// Toggle category display
function toggleCategory(category) {
    // Toggle button style
    const button = document.querySelector(`[data-category="${category}"]`);
    const categoryFoodsDiv = document.getElementById('category-foods');
    
    // Check if this category is already active
    const isActive = button?.classList.contains('btn-success');
    
    // Reset all category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-secondary');
    });
    
    if (isActive) {
        // Hide category foods if clicking same category
        categoryFoodsDiv.classList.remove('show');
        return;
    }
    
    // Mark current category as active
    if (button) {
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
    }
    
    // Display category foods
    displayCategoryFoods(category);
}

// Display foods for a specific category
function displayCategoryFoods(category) {
    const foods = CATEGORY_FOODS[category] || [];
    const container = document.getElementById('category-foods');
    
    if (foods.length === 0) {
        container.innerHTML = '<div class="food-item"><div class="food-info"><div class="food-name text-muted">No foods available in this category</div></div></div>';
        container.classList.add('show');
        return;
    }

    const html = foods.map(food => `
        <div class="food-item" onclick="selectFood(${JSON.stringify(food).replace(/"/g, '&quot;')})">
            <div class="food-info">
                <div class="food-name">${food.name}</div>
                <div class="food-nutrition">
                    ${food.calories} cal • ${food.protein}g protein • ${food.carbs}g carbs • ${food.fat}g fat
                </div>
            </div>
            <button class="food-add-btn">Add</button>
        </div>
    `).join('');

    container.innerHTML = html;
    container.classList.add('show');
}

// =============================================
// MODAL MANAGEMENT FUNCTIONS
// =============================================

// Open quantity modal
function openQuantityModal() {
    if (!globalState.currentFoodForModal) return;
    
    const modal = document.getElementById('quantity-modal');
    const titleEl = modal.querySelector('.modal-title');
    
    if (titleEl) {
        titleEl.textContent = `Add ${globalState.currentFoodForModal.name}`;
    }
    
    // Reset form
    document.getElementById('food-quantity').value = '100';
    document.getElementById('food-unit').value = 'grams';
    
    modal.classList.add('show');
}

// Close quantity modal
function closeQuantityModal() {
    document.getElementById('quantity-modal').classList.remove('show');
    globalState.currentFoodForModal = null;
}

// Confirm add food from modal
function confirmAddFood() {
    if (!globalState.currentFoodForModal) return;
    
    const quantity = parseFloat(document.getElementById('food-quantity').value);
    const unit = document.getElementById('food-unit').value;
    
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'warning');
        return;
    }
    
    // Calculate nutrition based on quantity
    const multiplier = unit === 'ml' ? quantity / 100 : quantity / 100; // Assume per 100g/ml
    
    const foodEntry = {
        id: Date.now(),
        name: globalState.currentFoodForModal.name,
        quantity: quantity,
        unit: unit,
        calories: Math.round(globalState.currentFoodForModal.calories * multiplier),
        protein: Math.round(globalState.currentFoodForModal.protein * multiplier * 10) / 10,
        carbs: Math.round(globalState.currentFoodForModal.carbs * multiplier * 10) / 10,
        fat: Math.round(globalState.currentFoodForModal.fat * multiplier * 10) / 10,
        source: globalState.currentFoodForModal.source || 'Local',
        brand: globalState.currentFoodForModal.brand || ''
    };
    
    globalState.mealList.push(foodEntry);
    
    updateMealTable();
    updateProgress();
    updateNutritionTotals();
    saveToLocalStorage();
    
    closeQuantityModal();
    showToast(`Added ${foodEntry.name} to your meal!`, 'success');
}

// Open custom food modal
function openCustomFoodModal() {
    document.getElementById('custom-food-modal').classList.add('show');
    document.getElementById('custom-food-name').focus();
}

// Close custom food modal
function closeCustomFoodModal() {
    document.getElementById('custom-food-modal').classList.remove('show');
    document.getElementById('custom-food-form').reset();
}

// Handle custom food form submission
function handleCustomFoodSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('custom-food-name').value.trim();
    const calories = parseFloat(document.getElementById('custom-calories').value);
    const protein = parseFloat(document.getElementById('custom-protein').value);
    const carbs = parseFloat(document.getElementById('custom-carbs').value);
    const fat = parseFloat(document.getElementById('custom-fat').value);
    const serving = parseFloat(document.getElementById('custom-serving').value) || 100;
    
    if (!name || !calories || calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
        showToast('Please enter valid nutrition values', 'warning');
        return;
    }
    
    const foodEntry = {
        id: Date.now(),
        name: name,
        quantity: serving,
        unit: 'grams',
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        source: 'Custom'
    };
    
    globalState.mealList.push(foodEntry);
    
    updateMealTable();
    updateProgress();
    updateNutritionTotals();
    saveToLocalStorage();
    
    closeCustomFoodModal();
    showToast(`Added custom food "${name}" to your meal!`, 'success');
}

// Open import modal
function openImportModal() {
    document.getElementById('import-modal').classList.add('show');
}

// Close import modal
function closeImportModal() {
    document.getElementById('import-modal').classList.remove('show');
    document.getElementById('import-data').value = '';
}

// Handle import confirmation
function handleImportConfirm() {
    const importData = document.getElementById('import-data').value.trim();
    
    if (!importData) {
        showToast('Please enter JSON data to import', 'warning');
        return;
    }
    
    try {
        const data = JSON.parse(importData);
        
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }
        
        let importedCount = 0;
        data.forEach(item => {
            if (item.name && typeof item.calories === 'number') {
                const foodEntry = {
                    id: Date.now() + importedCount,
                    name: item.name,
                    quantity: item.quantity || 100,
                    unit: item.unit || 'grams',
                    calories: Math.round(item.calories || 0),
                    protein: Math.round((item.protein || 0) * 10) / 10,
                    carbs: Math.round((item.carbs || 0) * 10) / 10,
                    fat: Math.round((item.fat || 0) * 10) / 10,
                    source: item.source || 'Imported'
                };
                
                globalState.mealList.push(foodEntry);
                importedCount++;
            }
        });
        
        if (importedCount > 0) {
            updateMealTable();
            updateProgress();
            updateNutritionTotals();
            saveToLocalStorage();
            
            closeImportModal();
            showToast(`Successfully imported ${importedCount} food items!`, 'success');
        } else {
            showToast('No valid food items found in the data', 'warning');
        }
        
    } catch (error) {
        console.error('Import error:', error);
        showToast('Invalid JSON format. Please check your data.', 'danger');
    }
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    globalState.currentFoodForModal = null;
}

// =============================================
// BARCODE SCANNER FUNCTIONS
// =============================================

// Open barcode scanner
async function openBarcodeScanner() {
    const modal = document.getElementById('barcode-modal');
    modal.classList.add('show');
    
    try {
        await initializeBarcodeScanner();
    } catch (error) {
        console.error('Scanner initialization error:', error);
        showToast('Camera access denied or not available', 'danger');
        closeBarcodeScanner();
    }
}

// Initialize barcode scanner
async function initializeBarcodeScanner() {
    if (barcodeScanner) {
        await barcodeScanner.stop();
    }

    if (!Html5Qrcode.getCameras) {
        throw new Error('Barcode scanning not supported');
    }

    const cameras = await Html5Qrcode.getCameras();
    if (cameras.length === 0) {
        throw new Error('No cameras found');
    }

    currentCameraId = cameras[cameras.length - 1].id; // Use back camera if available
    
    barcodeScanner = new Html5Qrcode('barcode-scanner');
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    await barcodeScanner.start(
        currentCameraId,
        config,
        onScanSuccess,
        onScanFailure
    );
}

// Handle successful barcode scan
async function onScanSuccess(decodedText) {
    console.log('Scanned barcode:', decodedText);
    
    try {
        await barcodeScanner.stop();
        closeBarcodeScanner();
        
        // Look up food by barcode
        await lookupFoodByBarcode(decodedText);
    } catch (error) {
        console.error('Post-scan error:', error);
    }
}

// Handle scan failure (ignore)
function onScanFailure(error) {
    // Ignore scan failures - they happen frequently
}

// Lookup food by barcode
async function lookupFoodByBarcode(barcode) {
    // Show loading
    showToast('Looking up barcode...', 'info');
    
    try {
        // Try Open Food Facts API
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            const product = data.product;
            const food = {
                name: product.product_name || 'Unknown Product',
                calories: Math.round(parseFloat(product.nutriments?.['energy-kcal_100g']) || 0),
                protein: Math.round((parseFloat(product.nutriments?.proteins_100g) || 0) * 10) / 10,
                carbs: Math.round((parseFloat(product.nutriments?.carbohydrates_100g) || 0) * 10) / 10,
                fat: Math.round((parseFloat(product.nutriments?.fat_100g) || 0) * 10) / 10,
                source: 'Barcode',
                brand: product.brands || ''
            };
            
            globalState.currentFoodForModal = food;
            openQuantityModal();
            showToast('Product found!', 'success');
        } else {
            showToast('Product not found in database', 'warning');
        }
    } catch (error) {
        console.error('Barcode lookup error:', error);
        showToast('Failed to lookup barcode', 'danger');
    }
}

// Close barcode scanner
async function closeBarcodeScanner() {
    if (barcodeScanner) {
        try {
            await barcodeScanner.stop();
            barcodeScanner = null;
        } catch (error) {
            console.error('Error stopping scanner:', error);
        }
    }
    
    document.getElementById('barcode-modal').classList.remove('show');
}

// Switch camera
async function switchCamera() {
    if (!barcodeScanner) return;
    
    try {
        const cameras = await Html5Qrcode.getCameras();
        const currentIndex = cameras.findIndex(cam => cam.id === currentCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        currentCameraId = cameras[nextIndex].id;
        
        await barcodeScanner.stop();
        await initializeBarcodeScanner();
        
        showToast('Camera switched', 'success');
    } catch (error) {
        console.error('Camera switch error:', error);
        showToast('Failed to switch camera', 'danger');
    }
}

// Toggle flashlight (if supported)
async function toggleFlashlight() {
    try {
        if (barcodeScanner && barcodeScanner.getRunningTrackSettings) {
            const track = barcodeScanner.getRunningTrackSettings();
            if (track && 'torch' in track.getCapabilities()) {
                await track.applyConstraints({
                    advanced: [{ torch: !isFlashlightOn }]
                });
                isFlashlightOn = !isFlashlightOn;
                
                const btn = document.getElementById('flashlight-btn');
                btn.textContent = isFlashlightOn ? 'Flashlight Off' : 'Flashlight';
                showToast(isFlashlightOn ? 'Flashlight on' : 'Flashlight off', 'info');
            } else {
                showToast('Flashlight not supported', 'warning');
            }
        }
    } catch (error) {
        console.error('Flashlight error:', error);
        showToast('Flashlight control failed', 'danger');
    }
}

// Manual barcode entry
function openManualBarcodeEntry() {
    const barcode = prompt('Enter barcode number:');
    if (barcode && barcode.trim()) {
        closeBarcodeScanner();
        lookupFoodByBarcode(barcode.trim());
    }
}

// =============================================
// VOICE RECOGNITION FUNCTIONS
// =============================================

// Setup voice recognition
function setupVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        const voiceBtn = document.getElementById('voice-search-btn');
        if (voiceBtn) {
            voiceBtn.disabled = true;
            voiceBtn.innerHTML = '🎤 <small>Not Supported</small>';
        }
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        console.log('Voice recognition started');
        isListening = true;
        const voiceBtn = document.getElementById('voice-search-btn');
        if (voiceBtn) {
            voiceBtn.classList.add('btn-listening');
            voiceBtn.innerHTML = '🎤 Listening...';
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Voice input:', transcript);
        
        document.getElementById('food-search').value = transcript;
        performSearch(transcript);
        showToast(`Searching for: "${transcript}"`, 'info');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast(`Voice error: ${event.error}`, 'warning');
    };

    recognition.onend = () => {
        console.log('Voice recognition ended');
        isListening = false;
        const voiceBtn = document.getElementById('voice-search-btn');
        if (voiceBtn) {
            voiceBtn.classList.remove('btn-listening');
            voiceBtn.innerHTML = '🎤 Voice Search';
        }
    };
}

// Toggle voice search
function toggleVoiceSearch() {
    if (!recognition) {
        showToast('Voice recognition not supported', 'warning');
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Voice start error:', error);
            showToast('Failed to start voice recognition', 'danger');
        }
    }
}

// =============================================
// MEAL MANAGEMENT FUNCTIONS
// =============================================

// Update meal table
function updateMealTable() {
    const tableBody = document.getElementById('meal-table');
    
    if (globalState.mealList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No items added yet. Search, use voice, or scan to add foods.</td></tr>';
        return;
    }

    const html = globalState.mealList.map((food, index) => `
        <tr>
            <td>
                <strong>${food.name}</strong>
                ${food.brand ? `<br><small class="text-primary">${food.brand}</small>` : ''}
                ${food.source ? `<br><small class="text-muted">${food.source}</small>` : ''}
            </td>
            <td>${food.quantity}${food.unit}</td>
            <td><strong>${food.calories}</strong></td>
            <td>${food.protein}g</td>
            <td>${food.carbs}g</td>
            <td>${food.fat}g</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editFood(${index})" style="margin-right: 5px;">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="removeFood(${index})">Remove</button>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = html;
}

// Remove food from meal
function removeFood(index) {
    if (index >= 0 && index < globalState.mealList.length) {
        const removedFood = globalState.mealList.splice(index, 1)[0];
        
        updateMealTable();
        updateProgress();
        updateNutritionTotals();
        saveToLocalStorage();
        
        showToast(`Removed ${removedFood.name}`, 'success');
    }
}

// Edit food in meal
function editFood(index) {
    if (index >= 0 && index < globalState.mealList.length) {
        const food = globalState.mealList[index];
        globalState.currentFoodForModal = food;
        globalState.currentEditIndex = index;
        
        // Pre-fill modal with current values
        document.getElementById('food-quantity').value = food.quantity;
        document.getElementById('food-unit').value = food.unit;
        
        const modal = document.getElementById('quantity-modal');
        const titleEl = modal.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = `Edit ${food.name}`;
        }
        
        // Change confirm button text
        const confirmBtn = document.getElementById('confirm-add');
        if (confirmBtn) {
            confirmBtn.textContent = 'Update Food';
        }
        
        modal.classList.add('show');
    }
}

// Clear all foods from meal
function clearMeal() {
    if (globalState.mealList.length === 0) {
        showToast('Meal is already empty', 'info');
        return;
    }

    if (confirm('Are you sure you want to clear all foods from your meal?')) {
        globalState.mealList = [];
        
        updateMealTable();
        updateProgress();
        updateNutritionTotals();
        saveToLocalStorage();
        
        showToast('Meal cleared', 'success');
    }
}

// Update nutrition totals
function updateNutritionTotals() {
    const totals = globalState.mealList.reduce((acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    document.getElementById('total-calories').textContent = Math.round(totals.calories);
    document.getElementById('total-protein').textContent = `${Math.round(totals.protein * 10) / 10}g`;
    document.getElementById('total-carbs').textContent = `${Math.round(totals.carbs * 10) / 10}g`;
    document.getElementById('total-fat').textContent = `${Math.round(totals.fat * 10) / 10}g`;
}

// Update progress circles
function updateProgress() {
    const totals = globalState.mealList.reduce((acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Update displays and progress circles
    updateProgressCircle('calories', totals.calories, globalState.dailyTargets.calories);
    updateProgressCircle('protein', totals.protein, globalState.dailyTargets.protein);
    updateProgressCircle('carbs', totals.carbs, globalState.dailyTargets.carbs);
    updateProgressCircle('fat', totals.fat, globalState.dailyTargets.fat);
}

// Update individual progress circle
function updateProgressCircle(nutrient, current, target) {
    const currentEl = document.getElementById(`current-${nutrient}`);
    const remainingEl = document.getElementById(`${nutrient}-remaining`);
    const progressEl = document.getElementById(`${nutrient}-progress`);
    
    if (!currentEl || !remainingEl || !progressEl) return;

    const percentage = Math.min((current / target) * 100, 100);
    const remaining = Math.max(target - current, 0);
    
    // Update text
    if (nutrient === 'calories') {
        currentEl.textContent = Math.round(current);
        remainingEl.textContent = `${Math.round(remaining)} remaining`;
    } else {
        currentEl.textContent = `${Math.round(current * 10) / 10}g`;
        remainingEl.textContent = `${Math.round(remaining * 10) / 10}g remaining`;
    }
    
    // Update progress circle - FIXED to start from top
    const circumference = 377; // 2 * Math.PI * 60
    const offset = circumference - (percentage / 100) * circumference;
    
    progressEl.style.strokeDasharray = `${circumference} ${circumference}`;
    progressEl.style.strokeDashoffset = offset;
    
    // Color coding
    if (percentage >= 100) {
        progressEl.style.stroke = '#28a745'; // green when complete
    } else if (percentage >= 75) {
        progressEl.style.stroke = '#FFC107'; // yellow when close
    } else {
        progressEl.style.stroke = 'var(--color-primary)'; // teal default
    }
}


// =============================================
// EXPORT AND UTILITY FUNCTIONS
// =============================================

// Export meal to PDF
function exportToPDF() {
    if (globalState.mealList.length === 0) {
        showToast('No foods to export', 'warning');
        return;
    }

    // Create printable content
    const totals = globalState.mealList.reduce((acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const content = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1FB8CD; text-align: center;">My Meal Summary</h1>
            <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
            
            <h2>Nutrition Totals</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                    <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Calories</th>
                    <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Protein</th>
                    <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Carbs</th>
                    <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Fat</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${Math.round(totals.calories)}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${Math.round(totals.protein * 10) / 10}g</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${Math.round(totals.carbs * 10) / 10}g</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${Math.round(totals.fat * 10) / 10}g</td>
                </tr>
            </table>
            
            <h2>Foods Consumed</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5; text-align: left;">Food</th>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Calories</th>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Protein</th>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Carbs</th>
                        <th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5;">Fat</th>
                    </tr>
                </thead>
                <tbody>
                    ${globalState.mealList.map(food => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 12px;">${food.name}${food.brand ? `<br><small>${food.brand}</small>` : ''}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${food.quantity}${food.unit}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${food.calories}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${food.protein}g</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${food.carbs}g</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${food.fat}g</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                Generated by Food Calculator • TheDietPlanner.com
            </p>
        </div>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
    
    showToast('Meal exported to PDF!', 'success');
}

// Copy meal to clipboard
function copyMealToClipboard() {
    if (globalState.mealList.length === 0) {
        showToast('No foods to copy', 'warning');
        return;
    }

    const totals = globalState.mealList.reduce((acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const text = `MY MEAL SUMMARY (${new Date().toLocaleDateString()})

NUTRITION TOTALS:
• Calories: ${Math.round(totals.calories)}
• Protein: ${Math.round(totals.protein * 10) / 10}g
• Carbs: ${Math.round(totals.carbs * 10) / 10}g
• Fat: ${Math.round(totals.fat * 10) / 10}g

FOODS:
${globalState.mealList.map(food => 
    `• ${food.name}${food.brand ? ` (${food.brand})` : ''} - ${food.quantity}${food.unit}
  ${food.calories} cal | ${food.protein}g protein | ${food.carbs}g carbs | ${food.fat}g fat`
).join('\n')}

Generated by Food Calculator • TheDietPlanner.com`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Meal copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy to clipboard', 'danger');
    });
}

// Export meal to JSON
function exportToJSON() {
    if (globalState.mealList.length === 0) {
        showToast('No foods to export', 'warning');
        return;
    }

    const exportData = {
        exportDate: new Date().toISOString(),
        totalNutrition: globalState.mealList.reduce((acc, food) => ({
            calories: acc.calories + food.calories,
            protein: acc.protein + food.protein,
            carbs: acc.carbs + food.carbs,
            fat: acc.fat + food.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 }),
        foods: globalState.mealList,
        dailyTargets: globalState.dailyTargets
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Meal data exported as JSON!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// =============================================
// DATA PERSISTENCE FUNCTIONS
// =============================================

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('foodCalc_mealList', JSON.stringify(globalState.mealList));
        localStorage.setItem('foodCalc_dailyTargets', JSON.stringify(globalState.dailyTargets));
        localStorage.setItem('foodCalc_lastSaved', new Date().toISOString());
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Load saved data
function loadSavedData() {
    try {
        // Load meal list
        const savedMeals = localStorage.getItem('foodCalc_mealList');
        if (savedMeals) {
            globalState.mealList = JSON.parse(savedMeals);
            updateMealTable();
            updateProgress();
            updateNutritionTotals();
        }

        // Load daily targets
        const savedTargets = localStorage.getItem('foodCalc_dailyTargets');
        if (savedTargets) {
            globalState.dailyTargets = { ...globalState.dailyTargets, ...JSON.parse(savedTargets) };
            updateCalculatedGoals();
        }

        // Load user profile
        const savedProfile = localStorage.getItem('foodCalc_userProfile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            
            // Fill form fields
            const fields = ['user-age', 'user-gender', 'user-weight', 'user-height', 'activity-level'];
            fields.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                const key = fieldId.replace('user-', '').replace('-', '');
                if (element && profile[key]) {
                    element.value = profile[key];
                }
            });

            // Set goal radio button
            if (profile.goal) {
                const goalRadio = document.querySelector(`input[name="goal"][value="${profile.goal}"]`);
                if (goalRadio) {
                    goalRadio.checked = true;
                    goalRadio.dispatchEvent(new Event('change'));
                }
            }
        }
        
        console.log('Saved data loaded successfully');
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

// Cache management for USDA API
function getCachedResults(key) {
    try {
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < USDA_CACHE_TTL_MS) {
                return data;
            }
            localStorage.removeItem(`cache_${key}`);
        }
    } catch (error) {
        console.error('Cache get error:', error);
    }
    return null;
}

function setCachedResults(key, data) {
    try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

// =============================================
// INITIALIZATION
// =============================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveToLocalStorage();
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

// Debug functions for development
if (globalState.isDebugMode) {
    window.debugState = globalState;
    window.debugFunctions = {
        clearCache: () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
            console.log('Cache cleared');
        },
        exportState: () => JSON.stringify(globalState, null, 2),
        resetApp: () => {
            localStorage.clear();
            location.reload();
        }
    };
    console.log('Debug mode enabled. Access via window.debugFunctions');
}
// Initialize progress circles to start from top
function initializeProgressCircles() {
    const circles = document.querySelectorAll('.circle-fill');
    circles.forEach(circle => {
        circle.style.strokeDasharray = '377 377';
        circle.style.strokeDashoffset = '377';
    });
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeProgressCircles();
    initializeApp(); // Your existing initialization
});

console.log('Food Calculator v3.2 - Diet Tracker Design System Integration - Loaded Successfully! 🎉');
