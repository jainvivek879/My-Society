# OmniGate: Smart Housing Society Management Platform

An enterprise-grade, highly scalable multi-tenant SaaS foundation for gated communities (similar to MyGate). Built using Clean Architecture and SOLID principles, this project is engineered to remain completely **free to develop and host** using the Firebase ecosystem free tiers, with modular abstraction layers designed for future database/provider migrations.

---

## 🚀 1. Phase 1 Architecture Overview

This platform uses a decoupled full-stack architecture with a multi-tenant database strategy to ensure absolute security boundaries.

### Architecture Diagram
```
                     ┌───────────────────────────────────────────────┐
                     │               Responsive Client               │
                     │          (Android / iOS / Web Admin)          │
                     └───────────────────────┬───────────────────────┘
                                             │
                       HTTPS Operations & Authentication Flows
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │            Firebase Services Suite            │
                     ├───────────────────────┬───────────────────────┤
                     │ Firebase Auth (JWT)   │ Cloud Firestore (NoSQL)│
                     │  - Email Verification │  - Multi-Tenant Rule  │
                     │  - Google SSO         │    Boundary Checkers  │
                     │  - Mobile OTP Login   │  - Strict Data Schema │
                     └───────────────────────┴───────────────────────┘
                                             │
                              Secure Server-Side Evaluations
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │          Isolated Tenant Data Silos           │
                     ├───────────────────────┬───────────────────────┤
                     │ Greenwood Residency   │ Golden Heights Gated  │
                     │ (Society Tenant A)    │ (Society Tenant B)    │
                     └───────────────────────┴───────────────────────┘
```

---

## 🗄️ 2. Folder Structure

The project foundation adheres strictly to the separation of concerns:

```
├── /firebase-blueprint.json  # intermediate representation (IR) declarative schema
├── /firestore.rules          # secure, mathematically hardened ruleset
├── /security_spec.md         # security specification, Data Invariants, and TDD Spec
├── /package.json             # package manifests and scripts
├── /src
│   ├── /types.ts             # centralized, type-safe multi-tenant models
│   ├── /config               # environment configuration
│   ├── /data
│   │   └── /mockData.ts      # high-fidelity mock data mimicking physical collections
│   ├── /services
│   │   ├── /firebase.ts      # firebase initializing routines & custom error handlers
│   │   └── /authContext.tsx  # reactive state context for sessions, roles, and themes
│   ├── /presentation
│   │   ├── /screens
│   │   │   ├── /Splash.tsx   # animated entrance branding UI
│   │   │   ├── /Login.tsx    # multi-modal SSO / OTP / Email Sign-In UI
│   │   │   ├── /ForgotPassword.tsx # reset credential router
│   │   │   ├── /Loading.tsx  # skeleton loaders and state transition screens
│   │   │   ├── /Error.tsx    # robust permission crash warning UI
│   │   │   └── /Playground.tsx # diagnostic visualization suite (No Dashboards)
│   │   └── /theme            # Material Design 3 configuration tokens
│   ├── /App.tsx              # root orchestrator & reactive router state-machine
│   └── /main.tsx             # DOM entry point
```

---

## 🔑 3. Authentication & Role-Based Access Flow

The platform supports multiple sign-in interfaces, maintaining absolute role-based control and mapping users securely to their specific tenant context:

```
   [User signs in] ──► [Retrieve Firebase Auth Token]
                                │
                                ▼
         [Fetch /users/{userId}/public/profile Document]
                                │
                                ├─► SocietyId is NULL? ──► [Grant SUPER_ADMIN Access]
                                │
                                └─► SocietyId Matches?
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
                  [SOCIETY_ADMIN]                       [RESIDENT / GUARD]
            Access only to bound society          Access only to specific flat 
            management configs & rosters.          logs & assigned gates/duty shifts.
```

- **User Roles:**
  - `SUPER_ADMIN`: Overall platform manager, bypasses tenant guards for global monitoring.
  - `SOCIETY_ADMIN`: Society manager, restricted completely to their bound `societyId`.
  - `SECURITY_GUARD`: Gate personnel, allowed to read/write notification gates and visitor logs within their community.
  - `RESIDENT`: Apartment occupant, restricted to their own flat details and profile.

---

## 🔒 4. Firestore Security Rules Documentation

The `/firestore.rules` file implements **Attribute-Based Access Control (ABAC)** and Zero-Trust validation.

### Core Security Pillars:
1. **Global Default-Deny:** Starts with `match /{document=**} { allow read, write: if false; }` to catch any undefined access vectors.
2. **Multi-Tenant Isolation:** Validates that `request.auth.uid` is registered to the target society before granting reads or writes inside any `/societies/{societyId}` paths:
   ```javascript
   function isSameSocietyMember(societyId) {
     return isVerified() && (isSuperAdmin() || getUserProfile().societyId == societyId);
   }
   ```
3. **Email Verification Requirement:** Users must possess a verified email token (`request.auth.token.email_verified == true`) to commit edits.
4. **Validation Blueprints:** Write commands execute validation helpers (e.g. `isValidSociety`, `isValidFlat`) to prevent data corruption and ghost field injection.
5. **No Client Trust:** List operations explicitly check `resource.data` to prevent unauthorized query scrapers.

---

## 🛠️ 5. Deployment Guide

Since this platform is configured to stay within Firebase's Spark (Free) Tier limits, development and deployment costs are **$0.00**.

### Pre-requisites
1. Install [Firebase CLI](https://firebase.google.com/docs/cli) globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in using your Google Account:
   ```bash
   firebase login
   ```

### Step 1: Initialize Project
Link this project to your active Firebase Project ID:
```bash
firebase use --add YOUR_PROJECT_ID
```

### Step 2: Deploy Firestore Security Rules
Deploy our mathematically-hardened ruleset instantly:
```bash
firebase deploy --only firestore:rules
```

### Step 3: Run / Build the Web Portal
Install dependencies and build the static dist assets:
```bash
npm install
npm run build
```

The compiled SPA in `dist/` is now optimized for deployment on Firebase Hosting, Google Cloud Run, or GitHub Pages.

---

## 📦 Phases & Verified Modules

### 🏢 Phase 3: Society & Resident Management (Active)
In Phase 3, we implemented a robust **Society & Resident Management** administrative system. This module provides critical physical topology and tenant identity mapping for the Visitor Management system.

- **`societyService` (Data Authority Layer):** Manages localized data storage in `localStorage` mirroring persistent Firestore patterns. Orchestrates hierarchical cascade integrity (Societies ──► Towers ──► Flats ──► Residents).
- **Core Entities & Data Invariants:**
  - **Society:** Registered name, registration number, address, cities, contact information, emergency directories, and state status.
  - **Tower / Wing:** Self-generating floors with custom status codes and designations. Duplicates within the same society are blocked.
  - **Flat / Unit:** Hierarchical validation mapping, area, and parking allocation. Duplicates are mathematically blocked inside any single Tower.
  - **Resident:** Owner or Tenant profiles with support for multi-family members and registered vehicles. Duplicates of phone numbers within a society or vehicle numbers across the entire tenant database are strictly blocked.
- **`SocietyAdminDashboard` (UI Console):** An ultra-clean dashboard containing:
  - **Real-time Stats Overview:** Real-time counters for Societies, Wings, Units, and active Residents.
  - **Integrated CRUD Consoles:** Form controllers for building/modifying towers, units, residents, and general societies.
  - **Cascading Filters:** Fast hierarchical dropdowns to isolate units/flats.
  - **Global Search:** Type-ahead filter across all data parameters including resident name, contact numbers, towers, or vehicle plate registrations.
- **Visitor Integration:** The Gated Gate Guard cascade is fully integrated into the registered resident directory, enabling guard checks to immediately pull from live unit-resident linkages, preserving maximum data integrity.

- **TypeScript:** 100% type-safe compiling with zero errors.
- **Production Build:** Standard build compiles and runs perfectly.
