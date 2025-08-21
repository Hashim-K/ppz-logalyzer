# API TODO - Missing Backend Functionality

## Overview
The current backend API provides basic file management and analysis session CRUD operations, but lacks the core telemetry parsing and data access functionality needed for the Dashboard UI.

**UI Status**: ✅ **Dashboard UI Complete** - Full dashboard with all tabs implemented using comprehensive mock data

## Current API Status ✅
- **Authentication**: Complete (register, login, logout, profile)
- **File Management**: Complete (upload, list, get, delete)
- **Analysis Sessions**: Complete (CRUD operations)
- **Schema Detection**: Basic implementation exists
- **Health Checks**: Complete

## Frontend Implementation Status ✅

- **Sessions Page**: ✅ Complete with real API integration
- **Dashboard Page**: ✅ Complete with comprehensive mock data and 5-tab interface
- **Flight Data Tab**: ✅ Complete (flight overview, performance, battery, phases, telemetry stats)
- **Charts Tab**: ✅ Complete (interactive charts for telemetry visualization)
- **Graph Builder Tab**: ✅ Complete (custom chart creation, templates, export functionality)
- **Maps Tab**: ✅ Complete (trajectory visualization, waypoints, geofences)
- **Alerts Tab**: ✅ Complete (alert management, timeline, rules configuration)

### Graph Builder Features ✅
- **Interactive Chart Builder**: ✅ Drag-and-drop interface for custom charts
- **Chart Templates**: ✅ Pre-configured templates (Flight Performance, IMU Analysis, Attitude Monitor, System Health)
- **Multiple Chart Types**: ✅ Line charts with support for multiple data series
- **Export Functionality**: ✅ PNG, SVG, and CSV export options
- **Template Management**: ✅ Save, load, and share chart configurations
- **Data Field Selection**: ✅ Complete field picker with all telemetry parameters
- **Real-time Preview**: ✅ Live chart updates as configuration changes

## Missing API Functionality ❌

### 1. Telemetry Data Access Endpoints
**Priority: HIGH** - Required for Dashboard functionality

Missing endpoints:
```http
GET /api/analysis/sessions/{session_id}/telemetry/messages
GET /api/analysis/sessions/{session_id}/telemetry/aircraft/{aircraft_id}/messages
GET /api/analysis/sessions/{session_id}/telemetry/aircraft/{aircraft_id}/messages/{message_type}
GET /api/analysis/sessions/{session_id}/telemetry/timeline
```

**What needs to be implemented:**
- Parse .log and .data file pairs
- Extract telemetry messages by type (GPS, IMU, ATTITUDE, etc.)
- Group messages by aircraft ID
- Provide time-series data with proper timestamps
- Support filtering by time range, message type, aircraft

**Frontend Ready**: Mock interfaces and components ready for integration

### 2. Flight Data Analysis Endpoints
**Priority: HIGH** - Required for Dashboard tabs

Missing endpoints:
```http
GET /api/analysis/sessions/{session_id}/flight-data/summary
GET /api/analysis/sessions/{session_id}/flight-data/trajectory
GET /api/analysis/sessions/{session_id}/flight-data/performance
GET /api/analysis/sessions/{session_id}/flight-data/alerts
```

**What needs to be implemented:**
- Flight summary statistics (duration, distance, max altitude, etc.)
- GPS trajectory data for mapping
- Performance metrics (climb rates, speeds, battery usage)
- Alert detection (geofence violations, low battery, errors)

**Frontend Ready**: All tab components ready to consume real data

### 3. Real-time Processing Status
**Priority: MEDIUM** - Nice to have for user feedback

Missing endpoints:
```http
GET /api/analysis/sessions/{session_id}/processing/status
POST /api/analysis/sessions/{session_id}/processing/start
```

**What needs to be implemented:**
- Background processing of uploaded files
- Progress tracking for large file parsing
- WebSocket or SSE for real-time updates

### 4. Map Data Endpoints
**Priority: HIGH** - Required for Maps tab

Missing endpoints:
```http
GET /api/analysis/sessions/{session_id}/maps/trajectory
GET /api/analysis/sessions/{session_id}/maps/waypoints
GET /api/analysis/sessions/{session_id}/maps/geofences
```

**What needs to be implemented:**
- GPS coordinate extraction and formatting
- Waypoint detection from flight plans
- Geofence boundary definitions
- Map overlay data (restricted zones, etc.)

**Frontend Ready**: Maps tab with trajectory visualization ready

### 5. Performance Analysis
**Priority: MEDIUM** - Required for Performance tab

Missing endpoints:
```http
GET /api/analysis/sessions/{session_id}/performance/metrics
GET /api/analysis/sessions/{session_id}/performance/charts
```

**What needs to be implemented:**
- Performance metric calculations
- Chart data formatting for various metrics
- Comparative analysis between flights

**Frontend Ready**: Performance tab with charts and metrics ready

## Mock Data Currently Used
All dashboard functionality is currently powered by comprehensive mock data:

- **Flight Summary**: Complete flight statistics (duration, distance, altitude, speed, battery)
- **GPS Trajectory**: 7-point mock trajectory with timestamps and coordinates
- **Performance Metrics**: Speed, altitude, battery charts with time series data
- **System Health**: GPS, IMU, radio, battery, autopilot status monitoring
- **Alerts**: Critical, warning, and info alerts with timeline visualization
- **Maps**: Waypoints, geofences, trajectory visualization placeholder

## Implementation Strategy ✅
1. **✅ UI Complete**: All dashboard components implemented with mock data
2. **✅ TypeScript Interfaces**: Complete type definitions for all API responses
3. **⏳ Backend Implementation**: Implement telemetry parsing and analysis endpoints
4. **⏳ API Integration**: Replace mock data with real API calls
5. **⏳ Real-time Updates**: Add live data streaming capabilities

## Implementation Order (Backend)
1. **Telemetry parsing core** - Extract messages from .log/.data files
2. **Basic data endpoints** - Return raw telemetry messages  
3. **Flight data analysis** - Calculate summary statistics
4. **Map data processing** - Format GPS data for mapping
5. **Performance metrics** - Advanced analytics
6. **Real-time processing** - Background job system

## Ready for Backend Development
- ✅ Complete UI implemented and tested
- ✅ All TypeScript interfaces defined
- ✅ Mock data provides clear API response format examples
- ✅ Components ready to consume real API responses
- ✅ Error handling and loading states implemented

## Notes
- The telemetry parsing code exists in `backend/api/src/telemetry/mod.rs` but no endpoints use it yet
- Database schema likely needs telemetry storage tables
- Consider pagination for large telemetry datasets
- Need to handle different PaparazziUAV message formats and versions
- Interactive maps will require additional mapping library integration (Leaflet, MapBox, etc.)
