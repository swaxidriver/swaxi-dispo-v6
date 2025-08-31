import { useState } from 'react'

import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import ShiftTemplateManager from '../components/ShiftTemplateManager'
import ShiftWeeklyGenerator from '../components/ShiftWeeklyGenerator'

function ShiftDesigner() {
  const [activeTab, setActiveTab] = useState('templates')

  const tabs = [
    { id: 'templates', name: 'Templates', icon: '📋' },
    { id: 'generator', name: 'Generator', icon: '🔄' }
  ]

  return (
    <div className="container mx-auto p-4" data-testid="shift-designer">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Shift Designer</h1>
        <p className="text-gray-600">
          Create and manage shift templates, then generate shifts for multiple weeks.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <ShiftTemplateProvider>
        <div className="min-h-96">
          {activeTab === 'templates' && (
            <div data-testid="templates-tab-content">
              <ShiftTemplateManager />
            </div>
          )}
          
          {activeTab === 'generator' && (
            <div data-testid="generator-tab-content">
              <ShiftWeeklyGenerator />
            </div>
          )}
        </div>
      </ShiftTemplateProvider>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 How to use the Shift Designer</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Templates Tab:</strong> Create, edit, clone, and delete shift templates. Each template defines a shift pattern with specific times, days, and colors.</p>
          <p><strong>Generator Tab:</strong> Select templates and generate shifts for multiple weeks. Preview the changes before applying them.</p>
          <p>All actions are logged in the audit system for tracking and compliance.</p>
        </div>
      </div>
    </div>
  )
}

export default ShiftDesigner