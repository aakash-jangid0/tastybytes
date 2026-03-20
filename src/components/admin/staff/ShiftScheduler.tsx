import React from 'react';
import { Clock, Trash2 } from 'lucide-react';

interface Shift {
  id: string;
  staff_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  break_duration: string;
  notes?: string;
}

interface ShiftSchedulerProps {
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onEditShift: (id: string, shift: Partial<Shift>) => void;
  onDeleteShift: (id: string) => void;
}

const shiftTypeColors: Record<string, string> = {
  morning: 'bg-amber-50 text-amber-700 border-amber-200',
  afternoon: 'bg-blue-50 text-blue-700 border-blue-200',
  evening: 'bg-purple-50 text-purple-700 border-purple-200',
  night: 'bg-gray-50 text-gray-700 border-gray-200',
};

const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ shifts, onDeleteShift }) => {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No shifts scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Shift Schedule
      </h3>
      <div className="grid gap-3">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className={`flex items-center justify-between border rounded-lg p-3 ${shiftTypeColors[shift.shift_type] || 'bg-white border-gray-200'}`}
          >
            <div>
              <span className="text-sm font-medium capitalize">{shift.shift_type} Shift</span>
              <p className="text-xs mt-1">
                {shift.start_time} — {shift.end_time}
                {shift.break_duration && ` (${shift.break_duration}min break)`}
              </p>
              {shift.notes && <p className="text-xs mt-1 opacity-75">{shift.notes}</p>}
            </div>
            <button onClick={() => onDeleteShift(shift.id)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftScheduler;
