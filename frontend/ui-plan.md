# UI Plan: Sessions & Dashboard Pages

## Overview

We'll create two distinct pages with clear purposes:

- **Sessions Page** (`/sessions`): Manage and browse all available sessions
- **Dashboard Page** (`/dashboard`): Analyze a specific selected session

---

## 🗂️ Sessions Page (`/sessions`)

### Purpose

Browse, manage, and select sessions for analysis.

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Page Header                          │
│  📊 Sessions                                            │
│  Manage your processed log sessions                     │
├─────────────────────────────────────────────────────────┤
│  Controls Bar                                           │
│  [🔄 Refresh]                            Found X sessions │
├─────────────────────────────────────────────────────────┤
│  Session Cards Grid (3 per row on desktop)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │   SESSION   │ │   SESSION   │ │   SESSION   │     │
│  │    CARD     │ │    CARD     │ │    CARD     │     │
│  │             │ │             │ │             │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                         │
│  Empty State (if no sessions):                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │        🛩️  No Sessions Found                        ││
│  │     Upload log files to get started                 ││
│  │           [Go to Upload] button                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Session Card Design

```
┌─────────────────────────────────────┐
│  📁 filename.log              [🗑️] │  <- Header with delete
│  📅 Aug 21, 2025 11:42              │  <- Date
├─────────────────────────────────────┤
│  Stats Grid (2x2):                 │
│  ✈️  Aircraft    💬 Messages       │
│     3 active       12.5K           │
│  ⏱️  Duration     📊 Msg Types     │
│     5m 30s         45              │
├─────────────────────────────────────┤
│  Aircraft Tags:                     │
│  [AC 1] [AC 2] [AC 5] +2 more      │  <- Badge list
├─────────────────────────────────────┤
│  Actions:                          │
│  [🔍 Analyze] [📤 Export]          │  <- Action buttons
└─────────────────────────────────────┘
```

### Key Features

- **Grid Layout**: Responsive cards (1 col mobile, 2 col tablet, 3 col desktop)
- **Session Info**: Filename, date, stats, aircraft list
- **Quick Actions**: Analyze button → goes to `/dashboard?session=ID`
- **Management**: Delete sessions with confirmation dialog
- **Loading States**: Skeleton cards while loading
- **Empty State**: Guide users to upload page

---

## 📊 Dashboard Page (`/dashboard`)

### Purpose

Detailed analysis interface for a selected session with multiple analysis tools.

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Page Header                          │
│  📊 Dashboard                                           │
│  Analyze your Paparazzi UAV log data                   │
├─────────────────────────────────────────────────────────┤
│  Session Selector Bar                                   │
│  Session: [Dropdown: Select session...] [🔄] [⚙️]    │
├─────────────────────────────────────────────────────────┤
│  CONTENT AREA (depends on state):                      │
│                                                         │
│  STATE 1: No Session Selected                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │        📊 Select a Session to Analyze               ││
│  │   Choose a session from dropdown above              ││
│  │        [Browse All Sessions] link                   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  STATE 2: Session Selected - Tabbed Analysis Interface │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Session Overview Bar (always visible)             ││
│  │  ✈️ 3 Aircraft  💬 12.5K Msgs  ⏱️ 5m 30s  📊 45 Types ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  Tab Navigation                                     ││
│  │  [📊 Session Info] [📋 Log Table] [📈 Charts]      ││
│  │  [🗺️ Map View] [📊 Graph Builder] [⚙️ Settings]    ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  Tab Content Area (dynamic based on selected tab)  ││
│  │  ┌─────────────────────────────────────────────────┐ ││
│  │  │          TAB CONTENT GOES HERE                  │ ││
│  │  │                                                 │ ││
│  │  │                                                 │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  STATE 3: Loading Session Data                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │        ⏳ Loading session data...                   ││
│  │          [Progress indicator]                       ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Session Overview Bar (Always Visible When Session Selected)

```
┌─────────────────────────────────────────────────────────┐
│  📁 filename.log                    📅 Aug 21, 2025    │
│  ✈️ 3 Aircraft  💬 12.5K Messages  ⏱️ 5m 30s  📊 45 Types │
│  [� Quick Search] [📤 Export] [🗑️ Delete] [⚙️ Settings] │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: 📊 Session Info

```
┌─────────────────────────────────────────────────────────┐
│  Session Details & Aircraft Analysis                   │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  📁 FILE    │ │  ✈️ AIRCRAFT │ │ 💬 MESSAGE  │       │
│  │    INFO     │ │    PANEL     │ │    TYPES    │       │
│  │             │ │              │ │   PANEL     │       │
│  │ • Filename  │ │ 🔴 AC 1      │ │ GPS    2.5K │       │
│  │ • File Size │ │   1.2K msgs  │ │ ATTITUDE 2K │       │
│  │ • Duration  │ │              │ │ WAYPOINT 1K │       │
│  │ • Start/End │ │ 🟢 AC 2      │ │ ENGINE  800 │       │
│  │ • Messages  │ │   8.3K msgs  │ │ ... +41     │       │
│  │             │ │              │ │             │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Tab 2: 📋 Log Table

```
┌─────────────────────────────────────────────────────────┐
│  Message Log Table with Filtering & Search             │
│                                                         │
│  Filters: [AC: All ▼] [MsgType: All ▼] [🔍 Search...] │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Time      │ Aircraft │ Message  │ Data         │ ⚡ │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ 10:15:32  │ AC 1     │ GPS      │ Lat: 52.1... │   │ │
│  │ 10:15:33  │ AC 1     │ ATTITUDE │ Roll: 2.3°   │   │ │
│  │ 10:15:33  │ AC 2     │ GPS      │ Lat: 52.2... │   │ │
│  │ 10:15:34  │ AC 1     │ ENGINE   │ RPM: 5600    │   │ │
│  │ ...       │ ...      │ ...      │ ...          │   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Pagination: [← Prev] Page 1 of 250 [Next →]          │
└─────────────────────────────────────────────────────────┘
```

### Tab 3: 📈 Charts

```
┌─────────────────────────────────────────────────────────┐
│  Pre-built Chart Views                                 │
│                                                         │
│  Chart Templates:                                       │
│  [📊 Altitude Over Time] [🧭 GPS Track] [⚡ Engine RPM] │
│  [📡 Signal Strength] [🔋 Battery Level] [+ Custom]    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │            CHART DISPLAY AREA                       │ │
│  │          (Interactive Plotly/Chart.js)             │ │
│  │                                                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Chart Controls: [📤 Export PNG] [📋 Data] [⚙️ Config] │
└─────────────────────────────────────────────────────────┘
```

### Tab 4: 🗺️ Map View

```
┌─────────────────────────────────────────────────────────┐
│  GPS Track Visualization                               │
│                                                         │
│  Controls: [🎯 Center] [� Measure] [🎨 Style ▼]      │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │                MAP COMPONENT                        │ │
│  │            (Leaflet/MapBox)                         │ │
│  │                                                     │ │
│  │  • GPS tracks for each aircraft                     │ │
│  │  • Color-coded by aircraft                          │ │
│  │  • Clickable waypoints                              │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Legend: [🔴 AC 1] [🟢 AC 2] [🔵 AC 5] [📊 Altitude]  │
└─────────────────────────────────────────────────────────┘
```

### Tab 5: 📊 Graph Builder

```
┌─────────────────────────────────────────────────────────┐
│  Custom Chart Builder Interface                        │
│                                                         │
│  ┌─────────────┐ ┌─────────────────────────────────────┐ │
│  │ CHART       │ │           PREVIEW                   │ │
│  │ BUILDER     │ │                                     │ │
│  │             │ │  ┌─────────────────────────────────┐ │ │
│  │ Chart Type: │ │  │                                 │ │ │
│  │ [Line ▼]    │ │  │        LIVE CHART PREVIEW       │ │ │
│  │             │ │  │                                 │ │ │
│  │ X-Axis:     │ │  │                                 │ │ │
│  │ [Time ▼]    │ │  │                                 │ │ │
│  │             │ │  │                                 │ │ │
│  │ Y-Axis:     │ │  └─────────────────────────────────┘ │ │
│  │ [Altitude▼] │ │                                     │ │
│  │             │ │  [🔄 Refresh] [📤 Export] [� Save] │ │
│  │ Aircraft:   │ │                                     │ │
│  │ ☑ AC 1      │ │                                     │ │
│  │ ☑ AC 2      │ │                                     │ │
│  │ ☐ AC 5      │ │                                     │ │
│  │             │ │                                     │ │
│  │ [🎨 Style]  │ │                                     │ │
│  └─────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Tab 6: ⚙️ Settings

```
┌─────────────────────────────────────────────────────────┐
│  Session Analysis Settings                              │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 🎨 DISPLAY  │ │ 📊 DATA     │ │ 📤 EXPORT   │       │
│  │   SETTINGS  │ │ FILTERING   │ │  OPTIONS    │       │
│  │             │ │             │ │             │       │
│  │ Time Format:│ │ Max Records:│ │ File Format:│       │
│  │ [HH:MM:SS▼] │ │ [10000    ] │ │ [CSV ▼]     │       │
│  │             │ │             │ │             │       │
│  │ Date Format:│ │ Time Range: │ │ Include:    │       │
│  │ [DD/MM/YY▼] │ │ [All ▼]     │ │ ☑ Metadata  │       │
│  │             │ │             │ │ ☑ Raw Data  │       │
│  │ Theme:      │ │ Aircraft:   │ │ ☐ Debug Info│       │
│  │ [Auto ▼]    │ │ ☑ AC 1      │ │             │       │
│  │             │ │ ☑ AC 2      │ │ Precision:  │       │
│  │ Refresh:    │ │ ☑ AC 5      │ │ [6 decimal] │       │
│  │ ☑ Auto      │ │             │ │             │       │
│  │ [5s ▼]      │ │ [🔄 Apply]  │ │ [📤 Export] │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- **Session Selector**: Smart dropdown with session info preview
- **URL State**: Session ID in URL for bookmarking/sharing
- **Three States**: Empty, Loading, Analysis view
- **Rich Analytics**: Overview cards + detailed panels
- **Action Tools**: Charts, tables, export, settings
- **Responsive**: Stacked on mobile, grid on desktop

---

## 🔄 Navigation Flow

```
Sessions Page (/sessions)
    │
    │ [Analyze] button on session card
    ▼
Dashboard Page (/dashboard?session=ID)
    │
    │ [Browse All Sessions] link
    ▼
Sessions Page (/sessions)
```

---

## 🎨 Design System

### Colors

- **Aircraft Panel**: Blue theme (`bg-blue-50`, `text-blue-600`)
- **Messages Panel**: Green theme (`bg-green-50`, `text-green-600`)
- **Duration Panel**: Purple theme (`bg-purple-50`, `text-purple-600`)
- **Types Panel**: Orange theme (`bg-orange-50`, `text-orange-600`)

### Component Types

- **Cards**: `shadcn/ui Card` components
- **Buttons**: Primary (Analyze), Secondary (Export), Destructive (Delete)
- **Badges**: Aircraft IDs, message counts
- **Loading**: Skeleton components and spinners
- **Icons**: Lucide React icons consistently

### Responsive Breakpoints

- **Mobile** (< 768px): Single column, stacked panels
- **Tablet** (768px - 1024px): 2-column grids
- **Desktop** (> 1024px): 3-column grids, full layout

---

## 🔧 Technical Implementation

### API Integration

- `GET /sessions` - List all sessions
- `GET /sessions/:id/info` - Get detailed session info
- `DELETE /sessions/:id` - Delete session
- Auth: `Bearer ${token}` header

### State Management

- **URL State**: Session selection via URL params
- **Local State**: Loading, selected session data
- **Error Handling**: Graceful fallbacks for API failures

### File Structure

```
src/
├── app/
│   ├── sessions/page.tsx          # Sessions list page
│   └── dashboard/page.tsx         # Dashboard analysis page
├── components/
│   ├── sessions/
│   │   ├── SessionCard.tsx        # Individual session card
│   │   ├── SessionsGrid.tsx       # Grid of session cards
│   │   └── SessionsEmptyState.tsx # No sessions found
│   └── dashboard/
│       ├── SessionSelector.tsx    # Session dropdown
│       ├── OverviewCards.tsx      # Stats cards row
│       ├── AircraftPanel.tsx      # Aircraft list panel
│       ├── MessageTypesPanel.tsx  # Message types panel
│       ├── ToolsPanel.tsx         # Action buttons panel
│       └── DashboardEmptyState.tsx # No session selected
```

---

## 📋 Backend API Integration

### Current API Status

Based on backend analysis, here's what's available:

**✅ Available Endpoints:**

```
Auth:
  POST /api/auth/login
  POST /api/auth/register
  GET /api/auth/profile

Files:
  POST /api/files/upload
  GET /api/files
  GET /api/files/{id}
  DELETE /api/files/{id}
  GET /api/files/{id}/schema

Analysis Sessions:
  POST /api/analysis/sessions
  GET /api/analysis/sessions
  GET /api/analysis/sessions/{id}
  PUT /api/analysis/sessions/{id}
  DELETE /api/analysis/sessions/{id}
```

**❌ Not Yet Implemented (will need mock data initially):**

```
Telemetry Data:
  GET /api/sessions/{id}/messages - Get parsed log messages
  GET /api/sessions/{id}/statistics - Get session stats
  GET /api/sessions/{id}/aircraft - Get aircraft info
  GET /api/sessions/{id}/message-types - Get message type counts
  GET /api/sessions/{id}/export - Export session data
```

### API Response Models

**Session List Response:**

```typescript
interface AnalysisSessionResponse {
	id: string;
	file_id?: string;
	template_id?: string;
	session_name?: string;
	session_config: {
		file_ids?: string[];
		base_filename?: string;
		auto_created?: boolean;
		created_at?: string;
	};
	created_at: string;
	updated_at: string;
	last_accessed: string;
}
```

**File Info Response:**

```typescript
interface LogFileInfo {
	id: string;
	original_filename: string;
	file_size: number;
	upload_timestamp: string;
	processing_status: string; // 'pending' | 'processing' | 'completed' | 'failed'
	content_type: string;
	is_processed: boolean;
}
```

### Mock Data Strategy

Since telemetry processing endpoints aren't implemented yet, we'll use mock data for:

- Session statistics (aircraft count, message counts, duration)
- Message tables with sample telemetry data
- Chart data points
- Map GPS coordinates

### Implementation Phases

**Phase 1: Sessions Management (Real API)**

- Use actual `/api/analysis/sessions` endpoints
- Real file upload and session creation
- Session selector and basic info

**Phase 2: Analysis Interface (Mock Data)**

- Mock telemetry data for tabs
- Placeholder charts and tables
- Static GPS tracks on map

**Phase 3: Backend Integration (Future)**

- Replace mock data when processing endpoints are implemented
- Real-time telemetry parsing
- Dynamic chart generation

---

## ✅ Success Criteria

### Sessions Page

- [ ] Loads session list from API
- [ ] Shows session cards with all info
- [ ] Analyze button navigates to dashboard
- [ ] Delete functionality works with confirmation
- [ ] Responsive on all screen sizes
- [ ] Empty state guides users to upload

### Dashboard Page

- [ ] Session selector populates from API
- [ ] URL state management works (bookmarkable)
- [ ] Shows rich session analysis when selected
- [ ] All panels display correct data
- [ ] Action buttons are functional
- [ ] Loading states are smooth
- [ ] Empty state guides to session selection

### Both Pages

- [ ] Consistent design with theme system
- [ ] Error handling for API failures
- [ ] Loading states for better UX
- [ ] Responsive design works well
- [ ] Navigation between pages is smooth

---

**Ready to proceed with implementation?**
Let me know if you want to modify anything in this plan before we start building!
