import ShiftTemplateManager from '../components/ShiftTemplateManager'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import RoleManagement from '../components/RoleManagement'
import AutoAssignPanel from '../components/AutoAssignPanel'

function Administration() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administration</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ShiftTemplateProvider>
            <ShiftTemplateManager />
          </ShiftTemplateProvider>
        </div>
        <div>
          <AutoAssignPanel />
        </div>
      </div>
      <div className="mt-8">
        <RoleManagement />
      </div>
    </div>
  )
}

export default Administration
