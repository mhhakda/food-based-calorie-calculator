# Create the CSS file
css_content = '''/* styles.css */
/* Changelog:
   - Custom styles to complement Tailwind CDN
   - Toast animations and accessibility improvements
   - Modal backdrop and focus styles
*/

/* Custom animations for toasts */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* Toast container positioning */
#toastContainer {
    pointer-events: none;
}

#toastContainer > div {
    pointer-events: all;
}

/* Modal backdrop blur effect */
.modal-backdrop {
    backdrop-filter: blur(2px);
}

/* Focus management for accessibility */
.suggestion-item:focus,
.suggestion-item:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
    background-color: rgb(239 246 255);
}

/* Custom scrollbar for suggestions */
#suggestions::-webkit-scrollbar {
    width: 6px;
}

#suggestions::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

#suggestions::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

#suggestions::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

/* Smooth transitions for progress bars */
#tdeeBar {
    transition: width 0.5s ease-in-out, background-color 0.3s ease;
}

/* Loading spinner utility */
.spinner {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 8px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Print styles for PDF generation */
@media print {
    .no-print {
        display: none !important;
    }
    
    body {
        background: white !important;
        color: black !important;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .suggestion-item:hover,
    .suggestion-item:focus {
        background-color: #000;
        color: #fff;
    }
    
    #tdeeBar {
        border: 1px solid currentColor;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    #tdeeBar {
        transition: none;
    }
}

/* Mobile-specific adjustments */
@media (max-width: 640px) {
    .suggestion-item {
        padding: 12px 16px;
    }
    
    .suggestion-item .text-lg {
        font-size: 1rem;
    }
}

/* Focus trap for modals */
.modal-open {
    overflow: hidden;
}

/* Mark element styling for search highlights */
mark {
    background-color: #fef08a;
    padding: 0 2px;
    border-radius: 2px;
}

/* Custom table styles for better mobile view */
@media (max-width: 768px) {
    .meal-table td {
        padding: 8px 4px;
        font-size: 12px;
    }
    
    .meal-table .actions-cell {
        min-width: 80px;
    }
}

/* Ensure accessibility for screen readers */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Custom button states */
button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

button:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* Input validation styles */
input:invalid {
    border-color: #ef4444;
}

input:invalid:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Success state for inputs */
input.success {
    border-color: #10b981;
}

input.success:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}'''

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

print("✅ Created styles.css")