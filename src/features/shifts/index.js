/**
 * Shifts Feature - Main exports
 * 
 * This feature module contains all shift-related functionality including
 * components, utilities, and services.
 */

// Components
export { default as ShiftTable } from './components/ShiftTable.jsx'
export { default as CreateShiftModal } from './components/CreateShiftModal.jsx'
export { default as ShiftDetailsModal } from './components/ShiftDetailsModal.jsx'
export { default as ShiftTemplateManager } from './components/ShiftTemplateManager.jsx'
export { default as ShiftWeeklyGenerator } from './components/ShiftWeeklyGenerator.jsx'

// Services and utilities (re-exported for convenience)
export * from './shifts.js'
export * from './shiftGenerationService.js'