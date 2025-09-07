# Food-Based Calorie Calculator

A comprehensive, mobile-first web application for tracking food intake and nutrition with hybrid data sources including local databases, FSSAI Indian food data, and USDA FoodData Central API integration.

## ✨ Features

- **Hybrid Food Search**: Combines local databases, Indian FSSAI data, and USDA API fallback
- **Smart Autocomplete**: Debounced search with keyboard navigation and accessibility
- **Flexible Quantities**: Support for grams, milliliters, and pieces with automatic conversion
- **Real-time Calculations**: Running nutrition totals with TDEE comparison
- **Export Options**: PDF reports and JSON data export/import
- **Offline Capable**: Local databases work without internet connection
- **Mobile-First Design**: Responsive UI built with Tailwind CSS
- **Accessibility**: ARIA roles, keyboard navigation, and screen reader support
- **Caching System**: Smart caching of USDA API responses with TTL
- **Data Provenance**: Clear source labeling for transparency

## 🚀 Quick Start

### Prerequisites
- A modern web browser
- A simple HTTP server (Python, Node.js, or similar)
- USDA API key (included for testing, see Security section)

### Installation

1. **Clone/Download** this repository to your local machine

2. **Start a local server** (required for loading JSON files):
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js
   npx http-server -p 8000

   # Using PHP
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to `http://localhost:8000`

4. **Start searching** for foods and building your meal!

## 🔧 Configuration

### USDA API Key Setup

The application includes a test API key for demonstration. For production use:

1. **Get your own key** from [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide.html)

2. **Update the key** in `food-app.js`:
   ```javascript
   const USDA_API_KEY = 'your-actual-api-key-here';
   ```

3. **Move to server proxy** (see Security section below)

### Customizable Settings

In `food-app.js`, you can adjust these settings:

```javascript
// API Configuration
const USDA_PAGE_SIZE = 8;                    // Results per USDA search
const USDA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days cache

// Default Macros (for future features)
const DEFAULT_MACRO_SPLIT = { 
    protein: 0.25, 
    carbs: 0.45, 
    fat: 0.30 
};

// Activity Multipliers (for TDEE calculations)
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};
```

## 📊 Database Schema

All JSON databases follow this consistent schema:

```json
{
  "id": "unique-identifier",
  "name": "Human readable food name",
  "calories": 0,        // per 100g unless specified
  "protein": 0.0,       // grams per 100g
  "carbs": 0.0,         // grams per 100g
  "fat": 0.0,           // grams per 100g
  "fiber": 0.0,         // optional, grams per 100g
  "sugar": 0.0,         // optional, grams per 100g
  "serving_size": "100 g",
  "serving_grams": 100,  // actual weight for "1 piece"
  "source": "Local|FSSAI|USDA|Meal Planner|Custom",
  "origin": "India|Global|US",
  "last_updated": "YYYY-MM-DD",
  "label_url": "optional-link-to-nutrition-label"
}
```

### Database Files

- **`foods.json`**: 82 common whole foods (fruits, vegetables, grains, proteins)
- **`localFSSAI.json`**: 35 Indian branded products with FSSAI compliance
- **`meal.json`**: 15 prepared meal combinations for quick selection

## 🔍 How It Works

### Search Priority
1. **Meal Database** (exact & fuzzy matching) → up to 6 results
2. **FSSAI Database** (Indian brands) → fill remaining slots
3. **Local Foods Database** (whole foods) → fill remaining slots
4. **USDA API** (if needed) → complete to 6-8 total results

### Unit Conversions
- **Grams**: Direct 1:1 nutritional calculation
- **Milliliters**: Assumes 1ml ≈ 1g (adjustable per food type)
- **Pieces**: Uses `serving_grams` field for automatic conversion

### Caching Strategy
- USDA search results cached for 7 days
- Full USDA food details cached separately
- LocalStorage used with timestamp-based TTL
- Graceful fallback when cache fails

## 🛠️ Expanding the Database

### Adding Foods to `foods.json`
```json
{
  "id": "f-083",
  "name": "New Food Item",
  "calories": 150,
  "protein": 5.0,
  "carbs": 30.0,
  "fat": 2.0,
  "fiber": 3.0,
  "sugar": 15.0,
  "serving_size": "100 g",
  "serving_grams": 120,
  "source": "Local",
  "origin": "Global",
  "last_updated": "2025-09-01",
  "label_url": ""
}
```

### Adding Indian Brands to `localFSSAI.json`
Use the same schema but set:
- `"source": "FSSAI"`
- `"origin": "India"`
- Include `label_url` for regulatory compliance

### Adding Prepared Meals to `meal.json`
Set `"source": "Meal Planner"` and calculate combined nutritional values.

## 🔒 Security & Production Deployment

### ⚠️ IMPORTANT SECURITY NOTICE

**DO NOT use the included USDA API key in production!** The key is exposed in client-side JavaScript and should only be used for testing.

### Production Setup

Create a server proxy to secure your API key:

```javascript
// Example: Netlify Function (/.netlify/functions/usda-proxy.js)
exports.handler = async (event, context) => {
  const query = event.queryStringParameters.query;
  const pageSize = event.queryStringParameters.pageSize || 8;

  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&api_key=${process.env.USDA_API_KEY}`,
    { headers: { 'Accept': 'application/json' } }
  );

  return {
    statusCode: 200,
    headers: { 
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(await response.json())
  };
};
```

Then update `food-app.js`:
```javascript
// Replace direct USDA calls with your proxy
const url = `/.netlify/functions/usda-proxy?query=${encodeURIComponent(query)}&pageSize=${USDA_PAGE_SIZE}`;
```

## 🧪 Quality Assurance Checklist

### Manual Testing Checklist

- [ ] **Search Functionality**
  - [ ] Type in search box → suggestions appear within 300ms
  - [ ] Try "apple" → should show local foods first
  - [ ] Try "coca cola" → should show FSSAI branded items
  - [ ] Try uncommon food → should fall back to USDA API

- [ ] **Quantity & Units**
  - [ ] Add 150g of rice → should calculate correctly
  - [ ] Add 2 pieces of apple → should convert using serving_grams
  - [ ] Add 250ml milk → should assume 1ml = 1g
  - [ ] Verify conversion preview in modal is accurate

- [ ] **Meal Management**
  - [ ] Add multiple items → totals update in real-time
  - [ ] Edit existing item → changes reflect immediately
  - [ ] Remove item → totals recalculate
  - [ ] Clear entire meal → confirms before clearing

- [ ] **TDEE Comparison**
  - [ ] Enter 2000 in TDEE input → progress bar activates
  - [ ] Add foods to reach 100% → bar turns green
  - [ ] Exceed 120% → bar turns red appropriately

- [ ] **Export Features**
  - [ ] Download PDF → creates formatted nutrition report
  - [ ] Copy JSON → clipboard contains valid JSON
  - [ ] Export JSON → downloads .json file
  - [ ] Import JSON → parses and loads meal correctly

- [ ] **Persistence & Caching**
  - [ ] Refresh page → meal persists from localStorage
  - [ ] Search same term twice → second search uses cache
  - [ ] Test after 7+ days → cache expires and refetches

- [ ] **Error Handling**
  - [ ] Disconnect internet → graceful fallback to local data
  - [ ] Invalid USDA response → shows toast notification
  - [ ] Malformed JSON import → displays helpful error message

- [ ] **Accessibility**
  - [ ] Navigate search with arrow keys → highlights suggestions
  - [ ] Press Enter on suggestion → opens quantity modal
  - [ ] Tab through interface → logical focus order
  - [ ] Use with screen reader → proper ARIA announcements

- [ ] **Mobile Experience**
  - [ ] Test on phone → interface adapts properly
  - [ ] Touch interactions work smoothly
  - [ ] Modals are appropriately sized
  - [ ] Text remains readable at mobile sizes

### Debug Mode

Add `?debug=true` to the URL to enable detailed console logging:
```
http://localhost:8000?debug=true
```

This will log:
- Database loading status
- Search queries and results
- Cache hits/misses
- API call details
- Internal state information

## 📱 Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+
- **Required APIs**: Fetch, LocalStorage, ES6+ features

## 📄 License & Attribution

- **USDA Data**: Public domain via USDA FoodData Central
- **FSSAI Data**: Sample data for demonstration (replace with real compliance data)
- **Code**: Open source (specify your license)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Add** foods to appropriate JSON database
4. **Test** using the QA checklist
5. **Submit** a pull request

### Adding Food Data
- Verify nutrition facts against reliable sources
- Use consistent naming conventions
- Include proper source attribution
- Test search functionality with new items

## 📞 Support

- **Issues**: [Create an issue](https://github.com/yourusername/food-calorie-calculator/issues)
- **Questions**: Check existing discussions or start a new one
- **USDA API**: [Official documentation](https://fdc.nal.usda.gov/api-guide.html)

## 🎯 Roadmap

- [ ] **Barcode Scanning**: Camera integration for packaged foods
- [ ] **Meal Planning**: Weekly meal planning with shopping lists
- [ ] **Nutrition Goals**: Customizable macro and micronutrient targets
- [ ] **Recipe Builder**: Create and save custom recipes
- [ ] **Social Features**: Share meals and recipes
- [ ] **Offline Mode**: Full PWA with service worker
- [ ] **Multi-language**: Hindi and regional language support

---

**Last Updated**: August 2025  
**Version**: 1.0.0  
**Maintainer**: [Your Name/Organization]
