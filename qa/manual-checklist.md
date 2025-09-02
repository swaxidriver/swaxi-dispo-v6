# Manual QA Checklist - Swaxi Dispo v6

## Overview

This checklist covers the complete user journey for the Swaxi Dispo system: Login → Shift Designer → Generate → Assign → Export.

**Test Environment:**

- Local development: `http://localhost:5173/swaxi-dispo-v6/`
- Live demo: `https://swaxidriver.github.io/swaxi-dispo-v6/`

**Test Duration:** ~45-60 minutes for full checklist
**Required Browsers:** Chrome, Firefox, Safari (latest versions)
**Required Devices:** Desktop, Tablet, Mobile

---

## 🔐 1. Login & Authentication Flow

### 1.1 Role-Based Login Testing

Test each user role to verify RBAC permissions work correctly.

**Test Users:**

- **ADMIN** - Full system access
- **CHIEF** - Shift management, assignment, templates, analytics (NO audit)
- **DISPONENT** - Apply for shifts, view analytics only
- **ANALYST** - View analytics only (READ-ONLY)

#### ✅ ADMIN Role Tests

- [ ] Can access all menu items (Dashboard, Calendar, Shift Designer, Administration, Audit, Settings)
- [ ] Can create, edit, and delete shifts
- [ ] Can assign shifts to users
- [ ] Can manage user roles
- [ ] Can view audit logs
- [ ] Can access test page and diagnostics

#### ✅ CHIEF Role Tests

- [ ] Can access Dashboard, Calendar, Shift Designer, Settings
- [ ] Can create and manage shift templates
- [ ] Can generate shifts from templates
- [ ] Can assign shifts to users
- [ ] Can view analytics
- [ ] **CANNOT** access Administration or Audit pages
- [ ] Verify hidden menu items don't appear

#### ✅ DISPONENT Role Tests

- [ ] Can access Dashboard and Calendar (limited view)
- [ ] Can apply for open shifts
- [ ] Can view own assigned shifts
- [ ] Can view analytics (limited)
- [ ] **CANNOT** create, edit, or delete shifts
- [ ] **CANNOT** access Shift Designer or Administration
- [ ] Verify assignment buttons are disabled/hidden

#### ✅ ANALYST Role Tests

- [ ] Can access Dashboard with analytics only
- [ ] Can view shift statistics and reports
- [ ] **CANNOT** create, edit, assign, or apply for shifts
- [ ] **CANNOT** access any management functions
- [ ] All action buttons disabled/hidden

### 1.2 Authentication Flow

- [ ] Login screen appears for unauthenticated users
- [ ] Role selection works correctly
- [ ] Active role badge displays current role
- [ ] Role switching works (for ADMIN testing multiple roles)
- [ ] Session persistence across browser refresh
- [ ] Logout functionality works correctly

---

## 🏗️ 2. Shift Designer Flow

### 2.1 Template Management

Test the creation and management of shift templates.

#### Template Creation

- [ ] Access Shift Designer page
- [ ] Switch to "Templates" tab
- [ ] Create new template with valid data:
  - Template name: "Frühdienst Vorlage"
  - Start time: "06:00"
  - End time: "14:00"
  - Location: "Hauptbahnhof"
  - Required role: "DISPONENT"
- [ ] Template appears in template list
- [ ] Edit existing template (change time/location)
- [ ] Delete template (with confirmation)
- [ ] Template validation works (invalid times, empty fields)

#### Cross-Midnight Template Testing

- [ ] Create overnight template:
  - Name: "Nachtschicht"
  - Start: "22:00"
  - End: "06:00"
  - Location: "Depot"
- [ ] Verify cross-midnight template saves correctly
- [ ] Check duration calculation is correct (8 hours)
- [ ] Template displays properly in list

### 2.2 Shift Generation

Test bulk shift generation from templates.

#### Weekly Generation

- [ ] Switch to "Generator" tab
- [ ] Select template for generation
- [ ] Choose date range (7 days)
- [ ] Select days of week (Mon-Fri)
- [ ] Generate shifts
- [ ] Verify correct number of shifts created
- [ ] Check all shifts have correct template data
- [ ] Verify shifts appear in calendar view

#### Multi-Week Generation

- [ ] Generate shifts for multiple weeks (3 weeks)
- [ ] Select different template combinations
- [ ] Verify no duplicate shift IDs created
- [ ] Check generated shifts span correct date range
- [ ] Verify template rules applied correctly

---

## 📅 3. Shift Assignment & Application Flow

### 3.1 Shift Assignment (ADMIN/CHIEF)

Test manual shift assignment functionality.

#### Basic Assignment

- [ ] Navigate to Dashboard or Calendar
- [ ] Find an open shift
- [ ] Click "Assign" button
- [ ] Select user from dropdown
- [ ] Confirm assignment
- [ ] Verify shift status changes to "ASSIGNED"
- [ ] Check user notification appears
- [ ] Verify assigned user appears in shift details

#### Assignment Validation

- [ ] Try to assign user to overlapping shift
- [ ] Verify conflict warning appears
- [ ] Check conflict details are accurate
- [ ] Test override functionality:
  - Provide business justification
  - Enter approver information
  - Confirm override
  - Verify assignment completes with override logged

### 3.2 Shift Applications (DISPONENT)

Test shift application workflow from user perspective.

#### Application Process

- [ ] Login as DISPONENT role
- [ ] Navigate to open shifts view
- [ ] Apply for available shift
- [ ] Verify application is recorded
- [ ] Check application appears in user's applications list
- [ ] Test application withdrawal

#### Application Management (ADMIN/CHIEF)

- [ ] Switch to ADMIN/CHIEF role
- [ ] View pending applications
- [ ] Approve application (converts to assignment)
- [ ] Reject application with reason
- [ ] Verify applicant receives notification

---

## ⚠️ 4. Conflict Detection & Cross-Midnight Testing

### 4.1 Time Overlap Conflicts

Test conflict detection for overlapping shifts.

#### Standard Overlap Testing

- [ ] Create shift: "Morning" 08:00-16:00
- [ ] Try to assign same user to: "Afternoon" 12:00-20:00
- [ ] Verify `TIME_OVERLAP` conflict detected
- [ ] Check conflict badge displays
- [ ] Verify assignment blocked without override

#### Edge Case Testing

- [ ] Test exact time boundaries (16:00 end / 16:00 start)
- [ ] Test single minute overlap (16:00 end / 15:59 start)
- [ ] Verify boundary conditions handled correctly

### 4.2 Cross-Midnight Conflict Testing

Test overnight shift conflict detection.

#### Cross-Midnight Scenarios

- [ ] Create overnight shift: "Night1" 22:00-06:00
- [ ] Try to assign same user to: "Morning" 06:00-14:00
- [ ] Verify no conflict (valid handoff)
- [ ] Try to assign to: "Evening" 18:00-23:00
- [ ] Verify `TIME_OVERLAP` conflict detected (22:00-23:00 overlap)

#### Complex Cross-Midnight Testing

- [ ] Create: "Late Night" 21:00-05:00
- [ ] Create: "Early Morning" 04:00-12:00
- [ ] Assign both to same user
- [ ] Verify 1-hour overlap detected (04:00-05:00)
- [ ] Test override process for cross-midnight conflicts

### 4.3 Location Consistency Testing

- [ ] Assign user to shift at "Location A"
- [ ] Try to assign same user to simultaneous shift at "Location B"
- [ ] Verify `LOCATION_MISMATCH` warning appears
- [ ] Check warning allows override with justification

### 4.4 Rest Period Testing

- [ ] Assign user to shift ending at 22:00
- [ ] Try to assign same user to shift starting at 06:00 next day
- [ ] Verify `SHORT_TURNAROUND` warning for <8 hours rest
- [ ] Test override for insufficient rest periods

---

## 📊 5. Export & Analytics Flow

### 5.1 Shift Export Testing

Test data export functionality.

#### Export Formats

- [ ] Navigate to shift overview
- [ ] Export shifts as CSV
- [ ] Verify CSV contains all required fields:
  - Shift ID, Date, Start Time, End Time
  - Location, Status, Assigned User
  - Application count, Created date
- [ ] Open CSV in spreadsheet application
- [ ] Verify data formatting is correct
- [ ] Test export filtering (date range, status, location)

#### Export Edge Cases

- [ ] Export with no shifts (empty dataset)
- [ ] Export with special characters in shift names
- [ ] Export with cross-midnight shifts (verify time display)
- [ ] Export with German umlauts and special characters

### 5.2 Analytics & Reporting

Test analytics dashboard functionality.

#### Dashboard Analytics

- [ ] View shift statistics tiles
- [ ] Verify counters are accurate:
  - Total shifts, Open shifts, Assigned shifts
  - Application count, Conflict count
- [ ] Test filter functionality:
  - Date range filtering
  - Location filtering
  - Status filtering
- [ ] Verify analytics update in real-time

#### Advanced Analytics (ADMIN/CHIEF)

- [ ] Access detailed analytics view
- [ ] View user workload distribution
- [ ] Check location utilization statistics
- [ ] Verify time-based analytics (hourly, daily, weekly)

---

## 🧪 6. RBAC Edge Cases & Security Testing

### 6.1 Permission Boundary Testing

Test role permission boundaries thoroughly.

#### URL Direct Access Testing

- [ ] As DISPONENT, try to access `/admin` directly
- [ ] Verify redirect or access denied
- [ ] As ANALYST, try to access `/shift-designer`
- [ ] Verify appropriate permission denial
- [ ] Test all protected routes for each role

#### API Permission Testing

- [ ] As DISPONENT, attempt shift creation via browser console
- [ ] Verify backend permission validation
- [ ] Test unauthorized assignment attempts
- [ ] Check audit logging for permission violations

### 6.2 Role Transition Testing

- [ ] Switch from ADMIN to DISPONENT mid-session
- [ ] Verify UI updates to reflect new permissions
- [ ] Check previously accessible features are now restricted
- [ ] Test role switching without data loss

---

## 📱 7. Mobile & Accessibility Testing

### 7.1 Mobile Responsiveness

Test all flows on mobile devices.

#### Mobile Layout Testing

- [ ] Test on mobile viewport (375x667, 390x844)
- [ ] Verify navigation menu works (hamburger menu)
- [ ] Check all buttons are touch-friendly (44px minimum)
- [ ] Test scroll behavior and sticky elements
- [ ] Verify modal dialogs fit mobile screen

#### Mobile-Specific Flows

- [ ] Complete full Login → Designer → Generate → Assign flow on mobile
- [ ] Test shift application on mobile
- [ ] Check conflict detection visibility on mobile
- [ ] Verify export functionality works on mobile

### 7.2 Accessibility Testing

Test keyboard navigation and screen reader compatibility.

#### Keyboard Navigation

- [ ] Navigate entire application using only keyboard
- [ ] Verify Tab order is logical
- [ ] Check focus indicators are visible
- [ ] Test Escape key closes modals
- [ ] Verify Enter/Space activate buttons

#### Screen Reader Testing

- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify all interactive elements have labels
- [ ] Check ARIA attributes are correct
- [ ] Test table headers and data association
- [ ] Verify skip links work correctly

---

## 🚨 8. Error Handling & Edge Cases

### 8.1 Data Validation Testing

Test form validation and error handling.

#### Input Validation

- [ ] Submit forms with empty required fields
- [ ] Enter invalid time formats (25:00, abc:def)
- [ ] Test maximum length limits
- [ ] Enter special characters and emoji
- [ ] Test SQL injection attempts (basic security)

#### Date/Time Edge Cases

- [ ] Create shifts for leap year (February 29)
- [ ] Test daylight saving time transitions
- [ ] Handle timezone edge cases
- [ ] Test year boundary (December 31 → January 1)

### 8.2 Network & Performance Testing

Test offline scenarios and performance.

#### Offline Functionality

- [ ] Disconnect network during shift creation
- [ ] Verify offline queue functionality
- [ ] Reconnect and check data synchronization
- [ ] Test data loss prevention

#### Performance Testing

- [ ] Generate 100+ shifts quickly
- [ ] Verify application remains responsive
- [ ] Test calendar view with many shifts
- [ ] Check memory usage over time

---

## 🐛 Bug Bash Session Organization

### Pre-Bug Bash Setup

- [ ] **Environment Setup**
  - Deploy test build to staging environment
  - Create test user accounts for all roles
  - Prepare test data (shifts, users, templates)
  - Document known issues to exclude

- [ ] **Team Preparation**
  - Share this checklist with all participants
  - Provide environment URLs and test credentials
  - Set up bug tracking spreadsheet/tool
  - Prepare device/browser assignments

### Bug Bash Execution (2-hour session)

#### Session Structure

1. **Kickoff (15 minutes)**
   - [ ] Brief overview of application features
   - [ ] Explain bug reporting format
   - [ ] Assign testing focus areas to participants
   - [ ] Share testing credentials and environment

2. **Exploratory Testing (90 minutes)**
   - [ ] Free-form exploration of application
   - [ ] Focus on user workflows and edge cases
   - [ ] Test cross-browser compatibility
   - [ ] Explore mobile responsiveness
   - [ ] Test accessibility features

3. **Bug Review & Prioritization (15 minutes)**
   - [ ] Collect all reported bugs
   - [ ] Quick triage by severity
   - [ ] Assign initial priorities
   - [ ] Plan immediate fixes

#### Bug Reporting Template

```
Bug ID: BB-[number]
Title: [Brief description]
Severity: Critical/High/Medium/Low
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Expected Result: [What should happen]
Actual Result: [What actually happens]
Browser/Device: [Chrome 119, iPhone 13, etc.]
User Role: [ADMIN/CHIEF/DISPONENT/ANALYST]
Screenshots: [Attach if applicable]
```

### Post-Bug Bash Activities

- [ ] **Bug Triage Meeting**
  - Review all reported bugs
  - Assign severity levels (P0/P1/P2)
  - Create GitHub issues for confirmed bugs
  - Plan fix timeline

- [ ] **Results Documentation**
  - Summary of bugs found
  - Test coverage achieved
  - Recommendations for improvement
  - Schedule follow-up bug bash if needed

---

## 🎯 Success Criteria

### Checklist Completion Goals

- [ ] **100% Critical Path Coverage**
  - Login → Shift Designer → Generate → Assign → Export flow
  - All user roles tested thoroughly
  - Cross-midnight and conflict scenarios verified

- [ ] **Cross-Browser Compatibility**
  - All flows tested in Chrome, Firefox, Safari
  - Mobile testing completed on 2+ devices
  - No blocking issues found

- [ ] **RBAC Validation**
  - All role permissions verified
  - Security boundaries tested
  - No unauthorized access possible

- [ ] **Bug Bash Success**
  - 5+ participants in bug bash session
  - 10+ bugs/issues identified and documented
  - Critical issues identified and prioritized

### Quality Gates

- [ ] Zero P0 (critical) bugs blocking basic functionality
- [ ] Less than 3 P1 (high) bugs affecting user experience
- [ ] All accessibility checklist items pass
- [ ] Performance acceptable under normal load

---

## 📝 Test Execution Log

**Date:** ****\_\_\_****  
**Tester:** ****\_\_\_****  
**Environment:** ****\_\_\_****  
**Browser/Device:** ****\_\_\_****

### Execution Summary

- [ ] All sections completed
- [ ] Critical issues documented
- [ ] Follow-up actions identified
- [ ] Stakeholders notified

**Overall Rating:** ⭐⭐⭐⭐⭐ (1-5 stars)

**Notes:**
_Use this space for additional observations, suggestions, or issues not covered in the checklist._

---

_This checklist should be updated regularly as new features are added or issues are discovered. Version: 1.0_
