import ShiftTemplateManager from '../components/ShiftTemplateManager'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import RoleManagement from '../components/RoleManagement'

function Administration() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administration</h1>
      <ShiftTemplateProvider>
        <ShiftTemplateManager />
      </ShiftTemplateProvider>
      <div className="mt-8">
        <RoleManagement />
      </div>
    </div>
  )
}

export default Administration
