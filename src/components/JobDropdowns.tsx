import React from 'react';
import { CustomSelect } from './CustomInput';

interface JobTypeSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  className?: string;
}

export const JobTypeSelect: React.FC<JobTypeSelectProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const jobTypeOptions = [
    { value: 'electricity', label: 'Electricity' },
    { value: 'gas', label: 'Gas' },
    { value: 'water', label: 'Water' },
  ];

  return (
    <CustomSelect
      id="jobType"
      name="jobType"
      label="Job Type"
      value={value}
      onChange={onChange}
      required
      error={error}
      className={className}
      options={jobTypeOptions}
    />
  );
};

interface UserSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  users: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    department: string;
  }>;
  error?: string;
  className?: string;
  loading?: boolean;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  users,
  error,
  className = '',
  loading = false,
}) => {
  const userOptions = [
    { value: '', label: 'Select a user...' },
    ...users
      .filter(user => user.department === 'meter')
      .map(user => ({
        value: user._id,
        label: `${user.firstName} ${user.lastName} (@${user.username})`,
      }))
  ];

  if (loading) {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">
          Assign to User
        </label>
        <div className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-500">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CustomSelect
      id="assignedTo"
      name="assignedTo"
      label="Assign to User"
      value={value}
      onChange={onChange}
      required
      error={error}
      className={className}
      options={userOptions}
    />
  );
};

interface PrioritySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  className?: string;
}

export const PrioritySelect: React.FC<PrioritySelectProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const priorityOptions = [
    { value: 'low', label: '🟢 Low Priority' },
    { value: 'medium', label: '🟡 Medium Priority' },
    { value: 'high', label: '🔴 High Priority' },
  ];

  return (
    <CustomSelect
      id="priority"
      name="priority"
      label="Priority"
      value={value}
      onChange={onChange}
      error={error}
      className={className}
      options={priorityOptions}
    />
  );
};

interface StatusSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  className?: string;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <CustomSelect
      id="status"
      name="status"
      label="Status"
      value={value}
      onChange={onChange}
      error={error}
      className={className}
      options={statusOptions}
    />
  );
};
