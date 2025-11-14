
# Themis: Barangay Management System

## Overview

Themis is a modern, web-based barangay management system designed to streamline and automate administrative processes. It provides a centralized platform for managing resident data, tracking blotter cases, issuing certificates, and more. This document outlines the project's architecture, features, and design principles.

## Project Outline

### 1. **Frontend**

*   **Framework:** React
*   **Styling:** Material-UI for components, with custom styling for a unique and modern look and feel.
*   **Routing:** `react-router-dom` for navigation between pages.
*   **Key Features:**
    *   **Dashboard:** A comprehensive overview of key barangay statistics, including population, number of households, and blotter case summaries. It features interactive charts for better data visualization.
    *   **Residents Management:** A searchable and filterable list of all residents. Includes a detailed view for each resident, showing their complete profile and a "View Details" modal.
    *   **Households Management:** A list of all households, with the ability to view the members of each household.
    *   **Blotter Management:** A system for recording and tracking community disputes (blotter cases), including details of the complainant, respondent, and the case status.
    *   **Certificate Issuance:** A module for generating and issuing various barangay certificates, such as Certificate of Indigency, Barangay Clearance, etc.
    *   **Analytics:** A section for generating reports and visualizing data related to the barangay's population, demographics, and other key metrics.
    *   **Announcements:** A feature for posting and managing barangay-wide announcements.

### 2. **Backend**

*   **Framework:** Node.js with Express
*   **Database:** Mock data provided via a `mockData.json` file, with API endpoints for residents, households, and blotter cases.

### 3. **Design and UX**

*   **Theme:** A modern, clean, and professional design with a blue color palette.
*   **Layout:** A dashboard-style layout with a persistent sidebar for easy navigation.
*   **Visualizations:** Use of charts and graphs to present data in an easily digestible format.

## Current Status (as of this version)

*   **Frontend:**
    *   The basic application structure is in place, with a sidebar for navigation and a content area for displaying pages.
    *   Routing is set up for all the main pages.
    *   The **Dashboard** page is implemented with cards for key statistics and a bar chart for blotter case status.
    *   The **Residents** page is implemented with a searchable table of residents and a modal for viewing resident details.
    *   The **Blotter** page is implemented with a table of blotter cases and a modal for viewing case details.
    *   The **Households** page has been created as a placeholder.
*   **Backend:**
    *   An Express server is set up to serve mock data from a `mockData.json` file for residents, households, and blotter cases.
