import { cn } from '../../utils/cn';

export function Badge({ children, color, className, ...props }) {
  const style = color ? { backgroundColor: color + '20', color: color } : {};
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        !color && 'bg-gray-100 text-gray-800',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
