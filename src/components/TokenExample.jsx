import React from 'react'

/**
 * Example component demonstrating new design token utilities
 * Shows usage of semantic colors mapped to CSS variables via Tailwind
 */
export default function TokenExample() {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-text font-sans text-lg font-semibold">Design Token Examples</h3>
      
      <div className="space-y-3">
        <div className="bg-primary text-white px-4 py-2 rounded">
          Primary Background (bg-primary)
        </div>
        
        <div className="bg-accent text-white px-4 py-2 rounded">
          Accent Background (bg-accent)
        </div>
        
        <div className="bg-ok text-white px-4 py-2 rounded">
          Success Background (bg-ok)
        </div>
        
        <div className="bg-warn text-white px-4 py-2 rounded">
          Warning Background (bg-warn)
        </div>
        
        <div className="bg-danger text-white px-4 py-2 rounded">
          Danger Background (bg-danger)
        </div>
        
        <div className="border-2 border-primary px-4 py-2 rounded">
          Primary Border (border-primary)
        </div>
        
        <p className="text-muted">
          Muted text example (text-muted)
        </p>
      </div>
    </div>
  )
}