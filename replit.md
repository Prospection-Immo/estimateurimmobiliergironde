# Real Estate Estimation Platform

## Overview

This is a real estate estimation platform specifically designed for the Gironde/Bordeaux region in France. The application provides property valuation services through a multi-step estimation form, displaying results with confidence metrics and expert analysis. The platform features both a public-facing estimation interface and an admin dashboard for lead management. The design follows established real estate platforms like Zillow and Realtor.com for credibility and user familiarity.

## User Preferences

Preferred communication style: Simple, everyday language.

### Copywriting Guidelines - Mots Magiques

Pour optimiser la conversion sur toutes les pages, utiliser ces mots magiques :

1. **Vous** - Le mot le plus puissant pour établir une connexion avec le client
2. **Nouveau** - Attire par la nouveauté et pique la curiosité
3. **Solution** - Positionne votre offre comme une réponse aux problèmes
4. **Gagner** - Crée un sentiment de privilège et d'opportunité
5. **Garantie** - Renforce la confiance et réduit les risques perçus
6. **Économie** - Fait appel au désir d'économiser de l'argent
7. **Exclusif** - Crée un sentiment de rareté et de valeur ajoutée
8. **Gratuit** - Puissant catalyseur de décision (à utiliser avec parcimonie)
9. **Résultat** - Montre les bénéfices concrets et mesurables

Ces mots doivent être intégrés naturellement dans tous les textes : pages web, emails, articles, et interfaces utilisateur.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Wouter for routing
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Theme Support**: Light/dark mode with system preference detection
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express session with MemoryStore for development (configurable for production)
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Property Valuation**: Custom algorithm based on Gironde market data with confidence scoring

### Database Design
- **ORM**: Drizzle ORM for type-safe database interactions
- **Schema**: Four main entities:
  - Users (admin authentication)
  - Leads (property estimation requests with contact info)
  - Estimations (detailed valuation results)
  - Contacts (general inquiry submissions)
- **Migration System**: Drizzle Kit for schema management and version control

### Component Architecture
- **Design System**: Shadcn/ui components with custom theming
- **Layout**: Responsive design with mobile-first approach
- **Multi-step Forms**: Progressive form completion with validation at each step
- **Data Display**: Cards and tables for property information and admin dashboards

### Estimation Algorithm
- **Market Analysis**: City-based pricing with property type adjustments
- **Feature Scoring**: Room count, age, amenities (garden, parking, balcony) impact valuations
- **Confidence Metrics**: Algorithm provides confidence scores (1-100) based on data completeness
- **Localized Pricing**: Specific price per m² data for Gironde municipalities

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production deployments
- **Connection**: Environment-based DATABASE_URL configuration

### UI Libraries
- **Radix UI**: Accessible component primitives for all interactive elements
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for optimal readability

### Development Tools
- **ESBuild**: Fast bundling for server-side code
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **TypeScript**: Full type safety across client and server code

### Session Storage
- **Development**: MemoryStore for local development
- **Production Ready**: Configurable for Redis or database-backed sessions