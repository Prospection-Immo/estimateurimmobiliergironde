# Design Guidelines for Real Estate Estimation Platform

## Design Approach
**Reference-Based Approach** - Drawing inspiration from established real estate platforms like **Zillow, Realtor.com, and SeLoger** for credibility and user familiarity. This utility-focused application prioritizes trust, efficiency, and data clarity over visual flair.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: Deep blue (220 85% 25%) for trust and professionalism
- Dark mode: Softer blue (220 60% 70%) for reduced eye strain
- Success: Green (142 70% 45%) for positive estimations
- Warning: Amber (45 95% 50%) for alerts
- Error: Red (0 85% 60%) for validation errors

**Background & Surface:**
- Light mode: Clean whites and light grays (220 10% 98%)
- Dark mode: Dark surfaces (220 15% 8%) with subtle blue undertones

### B. Typography
- **Primary:** Inter from Google Fonts for excellent readability
- **Headings:** Font weights 600-700, sizes from text-lg to text-4xl
- **Body:** Font weight 400-500, primarily text-sm and text-base
- **Data/Numbers:** Font weight 600 for emphasis on property values

### C. Layout System
**Tailwind Spacing Primitives:** Consistent use of 2, 4, 8, 12, and 16 units
- **Containers:** max-w-6xl for main content areas
- **Cards:** p-6 with rounded-lg borders
- **Forms:** space-y-4 between form groups
- **Grid Systems:** gap-6 for property listings, gap-4 for form elements

### D. Component Library

**Navigation:** Clean horizontal nav with subtle hover states and clear active indicators

**Cards:** 
- Property cards with subtle shadows and hover elevation
- Estimation result cards with prominent value display
- Admin dashboard cards with status indicators

**Forms:**
- Multi-step estimation forms with progress indicators
- Clear field labels and helpful placeholder text
- Inline validation with contextual error messages
- Primary CTAs using brand blue, secondary using outline variant

**Data Displays:**
- Property value tables with alternating row colors
- Price/m² charts with clean grid lines
- Lead management tables with status badges

**Admin Interface:**
- Sidebar navigation with grouped sections
- Data tables with sorting and filtering
- Content management forms with rich text editing capabilities

### E. Specific Page Treatments

**Estimation Pages:** Clean, step-by-step forms with clear value propositions and trust signals

**Landing Pages:** Minimal hero sections focusing on local expertise (Bordeaux/Gironde), social proof through recent estimations, and clear CTAs

**Admin Dashboard:** Information-dense layouts with organized sections, quick actions, and clear data hierarchies

**Legal Pages:** Simple, readable layouts with proper typography hierarchy and easy navigation

### Images
**Hero Images:** Small, localized hero images of Bordeaux/Gironde properties (max 40vh height) to establish local expertise without overwhelming the form-focused interface

**Property Thumbnails:** Standardized aspect ratios (16:9) for consistency in listings

**Trust Signals:** Professional headshots for team pages, certification badges, and local landmark imagery for credibility

**Implementation Note:** All buttons with variant="outline" placed over images should have blurred backgrounds for optimal readability.

This design system prioritizes trust, usability, and local market expertise while maintaining the professional standards expected in real estate technology.