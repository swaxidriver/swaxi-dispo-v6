import { useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'

import { generateShifts } from '../shiftGenerationService'
import { useShiftTemplates } from '../../../contexts/useShiftTemplates'
import { useShifts } from '../../../contexts/useShifts'
import AuditService from '../../../services/auditService'

function ShiftWeeklyGenerator() {
  const { templates } = useShiftTemplates()
  const { addShift } = useShifts()
  const [startDate, setStartDate] = useState(() => {
    // Default to next Monday
    const now = new Date()
    return format(startOfWeek(addDays(now, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  })
  const [weeks, setWeeks] = useState(1)
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [preview, setPreview] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const generatePreview = () => {
    if (selectedTemplates.length === 0) {
      alert('Please select at least one template')
      return
    }

    const templatesToUse = templates.filter(t => selectedTemplates.includes(t.id))
    const daysToGenerate = weeks * 7
    
    const generatedShifts = generateShifts(templatesToUse, {
      startDate: new Date(startDate),
      daysToGenerate,
      enhanceWithDatetime: true
    })

    setPreview({
      shifts: generatedShifts,
      templates: templatesToUse,
      startDate,
      weeks,
      count: generatedShifts.length
    })

    AuditService.logCurrentUserAction(
      'Shift generation preview',
      { 
        startDate,
        weeks,
        templatesCount: templatesToUse.length,
        shiftsCount: generatedShifts.length
      },
      generatedShifts.length
    )
  }

  const executeGeneration = () => {
    if (!preview) {
      alert('Please generate a preview first')
      return
    }

    setIsGenerating(true)
    
    try {
      // Add each shift to the context
      preview.shifts.forEach(shift => {
        addShift(shift)
      })

      AuditService.logCurrentUserAction(
        'Shifts generated from templates',
        {
          startDate: preview.startDate,
          weeks: preview.weeks,
          templatesUsed: preview.templates.map(t => t.name),
          shiftsGenerated: preview.count
        },
        preview.count
      )

      alert(`Successfully generated ${preview.count} shifts!`)
      
      // Clear preview after successful generation
      setPreview(null)
    } catch (error) {
      console.error('Error generating shifts:', error)
      alert('Error generating shifts. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg" data-testid="shift-weekly-generator">
      <h2 className="text-xl font-bold mb-4">Weekly Shift Generator</h2>
      
      {/* Generation Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium mb-2">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="start-date-input"
          />
        </div>
        <div>
          <label htmlFor="weeks" className="block text-sm font-medium mb-2">Number of Weeks</label>
          <input
            id="weeks"
            type="number"
            min="1"
            max="12"
            value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
            className="w-full p-2 border rounded"
            data-testid="weeks-input"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={generatePreview}
            disabled={selectedTemplates.length === 0}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            data-testid="generate-preview-btn"
          >
            Generate Preview
          </button>
        </div>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(template => (
            <label
              key={template.id}
              className={`flex items-center space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                selectedTemplates.includes(template.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`template-selector-${template.id}`}
            >
              <input
                type="checkbox"
                checked={selectedTemplates.includes(template.id)}
                onChange={() => handleTemplateToggle(template.id)}
                className="w-4 h-4"
              />
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: template.color || '#3B82F6' }}
              />
              <div className="flex-1">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-600">
                  {template.days.join(', ')} • {template.startTime}-{template.endTime}
                </div>
              </div>
            </label>
          ))}
        </div>
        {templates.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No templates available. Create templates first.
          </p>
        )}
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="mr-2">📊</span>
            Generation Preview
          </h3>
          
          <div className="mb-4">
            <p><strong>Period:</strong> {format(new Date(preview.startDate), 'MMM dd, yyyy')} - {format(addDays(new Date(preview.startDate), preview.weeks * 7 - 1), 'MMM dd, yyyy')}</p>
            <p><strong>Templates:</strong> {preview.templates.map(t => t.name).join(', ')}</p>
            <p><strong>Total Shifts:</strong> {preview.count}</p>
          </div>

          {/* Shift Preview Table */}
          <div className="max-h-96 overflow-y-auto">
            <h4 className="font-medium mb-2">Shifts to be created:</h4>
            <div className="grid gap-2">
              {preview.shifts.slice(0, 20).map((shift, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: preview.templates.find(t => t.name === shift.name)?.color || '#3B82F6' }}
                    />
                    <span className="font-medium">{shift.name}</span>
                  </div>
                  <div className="text-gray-600">
                    {format(new Date(shift.date), 'MMM dd')} • {shift.start}-{shift.end}
                  </div>
                </div>
              ))}
              {preview.shifts.length > 20 && (
                <p className="text-gray-500 text-center py-2">
                  ... and {preview.shifts.length - 20} more shifts
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={executeGeneration}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              data-testid="execute-generation-btn"
            >
              {isGenerating ? 'Generating...' : 'Confirm & Generate'}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              data-testid="cancel-preview-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShiftWeeklyGenerator