# QA Documentation

This directory contains quality assurance documentation and testing guidelines for the Swaxi Dispo v6 project.

## 📁 Contents

### 📋 [manual-checklist.md](manual-checklist.md)

**Comprehensive manual testing checklist covering:**

- Login & Authentication Flow (all user roles)
- Shift Designer workflow (templates & generation)
- Shift Assignment & Application processes
- Conflict Detection & Cross-Midnight scenarios
- Export & Analytics functionality
- RBAC edge cases & security testing
- Mobile & Accessibility testing
- Error handling & edge cases

**Usage:** Follow this checklist before each release to ensure all critical functionality works correctly.

### 🐛 [bug-bash-guide.md](bug-bash-guide.md)

**Complete guide for organizing effective bug bash sessions:**

- Pre-session planning and participant recruitment
- Environment setup and test data preparation
- Session execution with structured testing phases
- Bug classification and reporting templates
- Post-session activities and follow-up

**Usage:** Use this guide to organize collaborative testing sessions with your team.

## 🎯 Quick Start

### For Manual Testing

1. Set up test environment (local or staging)
2. Create test user accounts for all roles (ADMIN, CHIEF, DISPONENT, ANALYST)
3. Follow the manual checklist systematically
4. Document any issues found using the provided templates

### For Bug Bash Sessions

1. Schedule session 2 weeks in advance
2. Follow the bug-bash-guide for preparation
3. Execute 2-hour structured testing session
4. Triage and prioritize findings immediately after

## 🔗 Integration with Development

### Test Environment URLs

- **Local Development:** `http://localhost:5173/swaxi-dispo-v6/`
- **Live Demo:** `https://swaxidriver.github.io/swaxi-dispo-v6/`
- **Test Page:** `http://localhost:5173/swaxi-dispo-v6/test`

### Test User Roles

The system supports four distinct user roles with different permissions:

| Role          | Permissions                       | Test Focus                             |
| ------------- | --------------------------------- | -------------------------------------- |
| **ADMIN**     | Full system access                | All functionality, security boundaries |
| **CHIEF**     | Shift management, no audit access | Management workflows, assignment       |
| **DISPONENT** | Apply for shifts, limited view    | User workflows, applications           |
| **ANALYST**   | Read-only analytics               | Reporting, data display                |

### Key Test Scenarios

#### Critical Path Testing

1. **Login** → Role selection and authentication
2. **Shift Designer** → Template creation and management
3. **Generate** → Bulk shift creation from templates
4. **Assign** → Manual assignment with conflict detection
5. **Export** → Data export and analytics

#### Edge Case Focus Areas

- **Cross-midnight shifts** (22:00-06:00 scenarios)
- **RBAC boundaries** (unauthorized access attempts)
- **Conflict detection** (overlapping shifts, location mismatches)
- **Mobile responsiveness** (all screen sizes)
- **Accessibility** (keyboard navigation, screen readers)

## 📊 Quality Gates

### Before Release

- [ ] 100% of manual checklist completed
- [ ] Zero P0 (critical) bugs
- [ ] Less than 3 P1 (high priority) bugs
- [ ] Bug bash session completed with 5+ participants
- [ ] All user roles tested thoroughly
- [ ] Cross-browser compatibility verified

### Continuous Monitoring

- Regular bug bash sessions (quarterly)
- Automated test coverage >80%
- Performance benchmarks maintained
- Accessibility compliance verified

## 🤝 Contributing

### Updating QA Documentation

- Keep checklists current with new features
- Update test scenarios based on bug findings
- Improve templates based on team feedback
- Document lessons learned from testing sessions

### Reporting Issues

Use the bug report templates provided in the documentation. Include:

- Clear reproduction steps
- Expected vs actual behavior
- Environment details (browser, device, user role)
- Screenshots when applicable

---

_For questions about QA processes or to suggest improvements, please create an issue in the GitHub repository._
