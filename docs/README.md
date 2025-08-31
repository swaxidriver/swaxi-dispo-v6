# Documentation Index

This directory contains comprehensive documentation for the Swaxi Dispo v6 project.

## 📋 Project Management

| Document | Description | Use Case |
|----------|-------------|----------|
| **[CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)** | Complete guide for importing CSV files to create GitHub issues | Bulk issue creation, project setup |
| **[swaxi_issue_plan.md](swaxi_issue_plan.md)** | Master implementation and issue planning document | Project structure, epic planning |
| **[github-issues.md](github-issues.md)** | Structured GitHub issues with templates | Issue examples, copy-paste templates |
| **[github-milestones.md](github-milestones.md)** | Milestone definitions and planning | Release planning, sprint organization |

## 🔧 Development & Setup

| Document | Description | Use Case |
|----------|-------------|----------|
| **[RBAC_INTEGRATION.md](RBAC_INTEGRATION.md)** | Role-based access control documentation | Security implementation, user permissions |
| **[github-setup-guide.md](github-setup-guide.md)** | Repository configuration and workflow setup | Initial project setup, CI/CD configuration |
| **[contrast-audit-plan.md](contrast-audit-plan.md)** | Accessibility compliance and contrast guidelines | WCAG compliance, visual design standards |

## 📁 Templates & Examples

| Path | Description | Use Case |
|------|-------------|----------|
| **[templates/](templates/)** | CSV templates and examples | Issue import, data structure templates |
| **[templates/issue-import-template.csv](templates/issue-import-template.csv)** | Ready-to-use CSV template for issue import | Quick start for bulk issue creation |

## 🛠 Scripts & Automation

| Path | Description | Use Case |
|------|-------------|----------|
| **[../scripts/import-issues.sh](../scripts/import-issues.sh)** | Automated CSV to GitHub issues import script | Bulk issue creation automation |
| **[../scripts/validate-csv.sh](../scripts/validate-csv.sh)** | CSV format and data validation tool | Pre-import validation and error checking |

## 📚 Quick Reference

### Issue Management Workflow

1. **Plan**: Use `swaxi_issue_plan.md` for epic and structure planning
2. **Prepare**: Create CSV using `templates/issue-import-template.csv`
3. **Import**: Run `../scripts/import-issues.sh your-file.csv`
4. **Track**: Monitor progress using GitHub milestones and project boards

### CSV Import Process

```bash
# 1. Copy template
cp docs/templates/issue-import-template.csv my-issues.csv

# 2. Edit CSV with your issues

# 3. Validate format
./scripts/validate-csv.sh my-issues.csv

# 4. Test import (dry run)
./scripts/import-issues.sh my-issues.csv true

# 5. Import for real
./scripts/import-issues.sh my-issues.csv
```

### Documentation Standards

- **Markdown**: All documentation in Markdown format
- **Structure**: Clear headings, tables, and code examples
- **Links**: Internal linking between related documents
- **Examples**: Practical examples for all processes
- **Automation**: Scripts and tools for efficiency

## 🔗 Integration Points

This documentation integrates with:

- **GitHub Issues**: Template-based issue creation
- **GitHub Projects**: Project board organization
- **GitHub Milestones**: Release planning structure
- **GitHub CLI**: Automation and bulk operations
- **VS Code**: Development workflow integration

## 📈 Maintenance

### Updating Documentation

1. **Keep in sync**: Update docs when changing processes
2. **Version**: Track major changes in CHANGELOG.md
3. **Validate**: Test CSV imports and scripts regularly
4. **Improve**: Gather feedback and iterate on processes

### Contributing

When adding new documentation:

1. Follow existing structure and formatting
2. Include practical examples
3. Update this index file
4. Test any automation scripts
5. Link from main README.md if appropriate

---

For questions about documentation or to suggest improvements, create an issue with the `docs` label.