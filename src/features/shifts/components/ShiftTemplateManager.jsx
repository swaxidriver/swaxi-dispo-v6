import { useState } from "react";

import { useShiftTemplates } from "../../../contexts/useShiftTemplates";
import { useTimeInputStep } from "../../../hooks/useMobileDevice";
import AuditService from "../../../services/auditService";

function ShiftTemplateManager() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } =
    useShiftTemplates();
  const timeStep = useTimeInputStep();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formState, setFormState] = useState({
    name: "",
    startTime: "",
    endTime: "",
    days: [],
    color: "#3B82F6", // Default blue color
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleDayChange = (day) => {
    const newDays = formState.days.includes(day)
      ? formState.days.filter((d) => d !== day)
      : [...formState.days, day];
    setFormState({ ...formState, days: newDays });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplate({ ...formState, id: editingTemplate.id });
      AuditService.logCurrentUserAction(
        "Template updated",
        { templateName: formState.name, templateId: editingTemplate.id },
        1,
      );
    } else {
      addTemplate(formState);
      AuditService.logCurrentUserAction(
        "Template created",
        { templateName: formState.name },
        1,
      );
    }
    resetForm();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormState({
      ...template,
      color: template.color || "#3B82F6", // Ensure color is always defined
    });
  };

  const handleClone = (template) => {
    const clonedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      color: template.color || "#3B82F6", // Ensure color is always defined
      id: undefined, // Remove ID so it gets a new one
    };
    setFormState(clonedTemplate);
    setEditingTemplate(null);
    AuditService.logCurrentUserAction(
      "Template cloned",
      { originalName: template.name, clonedName: clonedTemplate.name },
      1,
    );
  };

  const handleDelete = (templateId, templateName) => {
    if (
      confirm(`Are you sure you want to delete template "${templateName}"?`)
    ) {
      deleteTemplate(templateId);
      AuditService.logCurrentUserAction(
        "Template deleted",
        { templateName, templateId },
        1,
      );
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormState({
      name: "",
      startTime: "",
      endTime: "",
      days: [],
      color: "#3B82F6",
    });
  };

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div
      className="p-4 bg-white shadow-md rounded-lg"
      data-testid="shift-template-manager"
    >
      <h2 className="text-xl font-bold mb-4">Shift Templates</h2>
      <form
        onSubmit={handleSubmit}
        className="mb-4"
        data-testid="create-template-form"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            placeholder="Template Name"
            className="p-2 border rounded"
            data-testid="template-name-input"
            required
          />
          <input
            type="time"
            name="startTime"
            value={formState.startTime}
            onChange={handleInputChange}
            className="p-2 border rounded"
            data-testid="template-start-time-input"
            step={timeStep}
            required
          />
          <input
            type="time"
            name="endTime"
            value={formState.endTime}
            onChange={handleInputChange}
            className="p-2 border rounded"
            data-testid="template-end-time-input"
            step={timeStep}
            required
          />
          <div className="flex items-center space-x-2">
            <label htmlFor="color" className="text-sm font-medium">
              Color:
            </label>
            <input
              type="color"
              name="color"
              id="color"
              value={formState.color}
              onChange={handleInputChange}
              className="w-full h-10 border rounded"
              data-testid="template-color-input"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block mb-2">Days of the week:</label>
          <div className="flex space-x-2" data-testid="template-days-selector">
            {daysOfWeek.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => handleDayChange(day)}
                data-testid={`day-${day.toLowerCase()}`}
                className={`px-4 py-2 rounded ${
                  formState.days.includes(day)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            data-testid="create-template-btn"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {editingTemplate ? "Update Template" : "Add Template"}
          </button>
          {editingTemplate && (
            <button
              type="button"
              onClick={resetForm}
              data-testid="cancel-template-edit-btn"
              className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div>
        <h3 className="text-lg font-bold mb-2">Existing Templates</h3>
        <ul data-testid="template-list">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex justify-between items-center p-2 border-b"
              data-testid={`template-item-${template.id}`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: template.color || "#3B82F6" }}
                  title="Template Color"
                />
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-gray-600">
                    {template.days.join(", ")}: {template.startTime} -{" "}
                    {template.endTime}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleClone(template)}
                  data-testid={`clone-template-${template.id}`}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                  title="Clone Template"
                >
                  Clone
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  data-testid={`edit-template-${template.id}`}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  data-testid={`delete-template-${template.id}`}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ShiftTemplateManager;
