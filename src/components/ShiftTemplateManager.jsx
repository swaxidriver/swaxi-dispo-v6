import { useState } from 'react'

import { useShiftTemplates } from '../contexts/useShiftTemplates'

function ShiftTemplateManager() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useShiftTemplates()
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    startTime: '',
    endTime: '',
    days: [],
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormState({ ...formState, [name]: value })
  }

  const handleDayChange = (day) => {
    const newDays = formState.days.includes(day)
      ? formState.days.filter((d) => d !== day)
      : [...formState.days, day]
    setFormState({ ...formState, days: newDays })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingTemplate) {
      updateTemplate({ ...formState, id: editingTemplate.id })
    } else {
      addTemplate(formState)
    }
    resetForm()
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormState(template)
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormState({ name: '', startTime: '', endTime: '', days: [] })
  }

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Shift Templates</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            placeholder="Template Name"
            className="p-2 border rounded"
            required
          />
          <input
            type="time"
            name="startTime"
            value={formState.startTime}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
          <input
            type="time"
            name="endTime"
            value={formState.endTime}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2">Days of the week:</label>
          <div className="flex space-x-2">
            {daysOfWeek.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => handleDayChange(day)}
                className={`px-4 py-2 rounded ${
                  formState.days.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            {editingTemplate ? 'Update Template' : 'Add Template'}
          </button>
          {editingTemplate && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div>
        <h3 className="text-lg font-bold mb-2">Existing Templates</h3>
        <ul>
          {templates.map((template) => (
            <li key={template.id} className="flex justify-between items-center p-2 border-b">
              <div>
                <p className="font-semibold">{template.name}</p>
                <p>{template.days.join(', ')}: {template.startTime} - {template.endTime}</p>
              </div>
              <div>
                <button onClick={() => handleEdit(template)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">
                  Edit
                </button>
                <button onClick={() => deleteTemplate(template.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ShiftTemplateManager
