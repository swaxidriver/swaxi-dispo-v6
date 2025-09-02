import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { ShiftTemplateContext } from "./ShiftTemplateContextCore";

function ShiftTemplateProviderImpl({ children }) {
  const [templates, setTemplates] = useState(() => {
    try {
      const savedTemplates = localStorage.getItem("shiftTemplates");
      return savedTemplates ? JSON.parse(savedTemplates) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("shiftTemplates", JSON.stringify(templates));
    } catch {
      /* ignore quota errors */
    }
  }, [templates]);

  const addTemplate = (template) => {
    const newTemplate = { ...template, id: uuidv4() };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const updateTemplate = (updatedTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
    );
  };

  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const value = useMemo(
    () => ({ templates, addTemplate, updateTemplate, deleteTemplate }),
    [templates],
  );

  return (
    <ShiftTemplateContext.Provider value={value}>
      {children}
    </ShiftTemplateContext.Provider>
  );
}

export function ShiftTemplateProvider(props) {
  return <ShiftTemplateProviderImpl {...props} />;
}
