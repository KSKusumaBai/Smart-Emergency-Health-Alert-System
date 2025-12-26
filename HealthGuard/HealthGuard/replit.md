# HealthGuard - Smart Health Monitoring System

## Overview

HealthGuard is a comprehensive health monitoring platform designed for seniors that integrates smartwatch data, AI-powered health analysis, and emergency response systems. The application provides real-time health tracking with continuous monitoring of vital signs like heart rate, blood pressure, and body temperature, coupled with intelligent anomaly detection and automated emergency alerts.

The system features a patient dashboard for health data visualization, a dedicated doctor portal for medical professionals to review abnormal readings, and a robust emergency contact system that automatically reaches out to designated contacts when health anomalies are detected.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla JavaScript with Bootstrap 5 for responsive UI components
- **Visualization**: Chart.js for real-time health data graphs and trend analysis
- **PWA Features**: Designed for mobile-first experience with offline capabilities
- **Modular Design**: Separate JavaScript modules for different functionalities (auth, bluetooth, alerts, ML analysis)

### Backend Architecture
- **Framework**: Flask (Python) with session-based authentication
- **Data Storage**: In-memory dictionaries for user data, health records, and emergency contacts (designed for database replacement)
- **Authentication**: SHA256 password hashing with Flask sessions
- **API Design**: RESTful endpoints for user registration, login, health data management, and emergency contacts

### Real-time Data Processing
- **Device Integration**: Web Bluetooth API for smartwatch connectivity supporting multiple brands (Fitbit, Garmin, Apple Watch)
- **ML Analysis**: TensorFlow.js integration for client-side health pattern analysis and anomaly detection
- **Activity-based Thresholds**: Dynamic health parameter validation based on user activity state (rest, active, sleep, etc.)

### Emergency Response System
- **Multi-tier Alerting**: Cascading emergency contact system with configurable priority order
- **Location Services**: Geolocation API integration for emergency location sharing
- **Automated Responses**: Smart detection of health emergencies with automatic contact initiation

### External Dependencies

- **Bluetooth Integration**: Web Bluetooth API for smartwatch connectivity with support for standard health services (heart_rate, health_thermometer)
- **Firebase Services**: Real-time database, authentication, and cloud storage for data synchronization and backup
- **Geolocation Services**: Browser Geolocation API for emergency location tracking
- **Frontend Libraries**: 
  - Bootstrap 5 for responsive design
  - Chart.js for data visualization
  - Font Awesome for icons
  - TensorFlow.js for machine learning capabilities

The application is designed with a database-agnostic approach using in-memory storage that can be easily replaced with PostgreSQL or other database systems for production deployment.