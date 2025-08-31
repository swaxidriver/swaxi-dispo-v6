/**
 * Calendar view utilities for color-coded shifts by template
 * Provides template color mapping and quick actions for shifts
 */

import React from 'react'
import ConflictBadge from '../components/ConflictBadge'

/**
 * Get template color for a shift
 * @param {Object} shift - The shift object
 * @param {Array} templates - Array of templates
 * @returns {string} Hex color or default
 */
export function getShiftTemplateColor(shift, templates = []) {
  if (!shift || !templates?.length) {
    return '#6B7280' // Default gray
  }

  // Try to find template by templateId first
  if (shift.templateId) {
    const template = templates.find(t => t.id === shift.templateId)
    if (template?.color) {
      return template.color
    }
  }

  // Fallback: find by name/type match
  const templateName = shift.type || shift.name
  if (templateName) {
    const template = templates.find(t => t.name === templateName)
    if (template?.color) {
      return template.color
    }
  }

  return '#6B7280' // Default gray
}

/**
 * Get CSS classes for shift display based on template and status
 * @param {Object} shift - The shift object
 * @param {Array} templates - Array of templates
 * @returns {Object} CSS classes and styles
 */
export function getShiftDisplayStyles(shift, templates = []) {
  const templateColor = getShiftTemplateColor(shift, templates)
  
  // Convert hex to RGB for opacity variants
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 112, b: 128 } // Default gray
  }

  const rgb = hexToRgb(templateColor)
  const backgroundColorOpacity = shift.assignedTo ? '0.2' : '0.1'
  const borderColorOpacity = shift.assignedTo ? '0.6' : '0.4'
  
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${backgroundColorOpacity})`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${borderColorOpacity})`,
    color: templateColor,
    borderWidth: '1px',
    borderStyle: 'solid'
  }
}

/**
 * Quick actions for shifts
 */
export const QUICK_ACTIONS = {
  SWAP: 'swap',
  RELEASE: 'release', 
  NOTE: 'note'
}

/**
 * Quick action button component
 * @param {Object} props - Component props
 * @param {string} props.action - Action type from QUICK_ACTIONS
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.size - Size variant ('sm', 'xs')
 */
export function QuickActionButton({ action, onClick, disabled = false, size = 'xs' }) {
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-xs'
  }

  const actionConfig = {
    [QUICK_ACTIONS.SWAP]: {
      label: '↔',
      title: 'Tauschen',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    [QUICK_ACTIONS.RELEASE]: {
      label: '✕',
      title: 'Freigeben', 
      className: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    [QUICK_ACTIONS.NOTE]: {
      label: '📝',
      title: 'Notiz',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    }
  }

  const config = actionConfig[action]
  if (!config) return null

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={config.title}
      className={`${sizeClasses[size]} rounded font-medium transition-colors ${config.className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {config.label}
    </button>
  )
}

/**
 * Enhanced shift cell for calendar views with template colors and quick actions
 * @param {Object} props - Component props
 */
export function ShiftCell({ 
  shift, 
  templates = [], 
  onShiftClick, 
  onQuickAction,
  showQuickActions = false,
  conflicts = [],
  size = 'normal' // 'normal', 'compact'
}) {
  const displayStyles = getShiftDisplayStyles(shift, templates)
  const isCompact = size === 'compact'
  
  const handleQuickAction = (e, action) => {
    e.stopPropagation()
    onQuickAction?.(shift, action)
  }

  return (
    <div
      className={`relative rounded truncate cursor-pointer transition-all hover:shadow-sm ${
        isCompact ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-1'
      }`}
      style={displayStyles}
      title={`${shift.type || shift.name} ${shift.start}-${shift.end} ${
        shift.assignedTo ? `(${shift.assignedTo})` : '(Offen)'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onShiftClick?.(shift)
      }}
    >
      <div className="flex items-center justify-between">
        <span className="truncate flex-1">
          {shift.type || shift.name}
        </span>
        
        {/* Conflict badge */}
        {conflicts.length > 0 && (
          <ConflictBadge conflicts={conflicts} className="ml-1 text-[8px]" />
        )}
      </div>
      
      {/* Time display for normal size */}
      {!isCompact && (
        <div className="text-[10px] opacity-75 mt-0.5">
          {shift.start}-{shift.end}
        </div>
      )}
      
      {/* Quick actions */}
      {showQuickActions && !isCompact && (
        <div className="flex gap-1 mt-1">
          <QuickActionButton 
            action={QUICK_ACTIONS.NOTE}
            onClick={(e) => handleQuickAction(e, QUICK_ACTIONS.NOTE)}
          />
          {shift.assignedTo && (
            <>
              <QuickActionButton
                action={QUICK_ACTIONS.SWAP}
                onClick={(e) => handleQuickAction(e, QUICK_ACTIONS.SWAP)}
              />
              <QuickActionButton
                action={QUICK_ACTIONS.RELEASE}
                onClick={(e) => handleQuickAction(e, QUICK_ACTIONS.RELEASE)}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}


/**
 * Timeline shift component for week view with template colors
 * @param {Object} props - Component props
 */
export function TimelineShiftCell({
  shift,
  templates = [],
  span,
  dayIdx,
  onShiftClick,
  onQuickAction,
  onDragStart,
  onDragEnd,
  isDraggable = false,
  isDragged = false,
  conflicts = []
}) {
  const templateColor = getShiftTemplateColor(shift, templates)
  
  // Convert hex to RGB for the timeline style
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 } // Default blue
  }

  const rgb = hexToRgb(templateColor)
  const opacity = shift.assignedTo ? '0.9' : '0.7'
  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`

  const handleQuickAction = (e, action) => {
    e.stopPropagation()
    onQuickAction?.(shift, action)
  }

  return (
    <div
      key={`${shift.id}_${dayIdx}`}
      className={`absolute mx-1 rounded-md text-white text-[10px] px-1 py-0.5 cursor-move shadow-sm hover:shadow-md transition-shadow ${
        isDragged ? 'opacity-50' : ''
      }`}
      style={{ 
        top: span.top, 
        height: span.height,
        backgroundColor,
        minHeight: '16px' // Ensure minimum clickable area
      }}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onShiftClick?.(shift)}
      title={`${shift.type || shift.name} ${shift.start}-${shift.end}${isDraggable ? ' (Ziehen zum Verschieben)' : ''}`}
    >
      <div className="font-semibold truncate">{shift.type || shift.name}</div>
      <div className="truncate text-[9px] opacity-90">
        {shift.assignedTo || 'Offen'}
      </div>
      
      {/* Conflict indicator */}
      {conflicts.length > 0 && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" 
             title={`${conflicts.length} Konflikt${conflicts.length > 1 ? 'e' : ''}`} />
      )}
      
      {/* Quick actions for larger shifts */}
      {span.height > 40 && (
        <div className="absolute bottom-0 right-0 flex gap-0.5 p-0.5">
          <QuickActionButton
            action={QUICK_ACTIONS.NOTE}
            onClick={(e) => handleQuickAction(e, QUICK_ACTIONS.NOTE)}
            size="xs"
          />
          {shift.assignedTo && (
            <QuickActionButton
              action={QUICK_ACTIONS.RELEASE}
              onClick={(e) => handleQuickAction(e, QUICK_ACTIONS.RELEASE)}
              size="xs"
            />
          )}
        </div>
      )}
    </div>
  )
}