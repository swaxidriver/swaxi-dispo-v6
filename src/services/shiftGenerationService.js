import { addDays, format, getDay } from "date-fns";

const dayMapping = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

export function generateShifts(templates) {
  const newShifts = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = addDays(today, i);
    const dayOfWeek = getDay(date);

    templates.forEach((template) => {
      if (template.days.map((d) => dayMapping[d]).includes(dayOfWeek)) {
        newShifts.push({
          id: `${format(date, "yyyy-MM-dd")}-${template.name}`,
          date: format(date, "yyyy-MM-dd"),
          name: template.name,
          startTime: template.startTime,
          endTime: template.endTime,
          status: "Offen",
          assignedTo: null,
        });
      }
    });
  }
  return newShifts;
}
