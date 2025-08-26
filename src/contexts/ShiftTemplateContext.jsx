import { createContext, useState, useContext, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const ShiftTemplateContext = createContext()

export function ShiftTemplateProvider({ children }) {
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem('shiftTemplates')
    return savedTemplates ? JSON.parse(savedTemplates) : []
  })

  useEffect(() => {
    localStorage.setItem('shiftTemplates', JSON.stringify(templates))
  }, [templates])

  const addTemplate = (template) => {
    const newTemplate = { ...template, id: uuidv4() }
    setTemplates([...templates, newTemplate])
  }

  const updateTemplate = (updatedTemplate) => {
    setTemplates(
      templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    )
  }

  const deleteTemplate = (id) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  return (
    <ShiftTemplateContext.Provider
      value={{ templates, addTemplate, updateTemplate, deleteTemplate }}
    >
      {children}
    </ShiftTemplateContext.Provider>
  )
}

export function useShiftTemplates() {
  return useContext(ShiftTemplateContext)
}
