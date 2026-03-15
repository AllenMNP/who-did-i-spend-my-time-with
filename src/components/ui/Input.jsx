import { cn } from '../../utils/cn';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className, ...props }) {
  return (
    <label
      className={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
        'resize-none',
        className
      )}
      {...props}
    />
  );
}

export default Input;
