interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs:  'w-3 h-3 border',
  sm:  'w-4 h-4 border-2',
  md:  'w-6 h-6 border-2',
  lg:  'w-8 h-8 border-2',
};

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizes[size]} border-slate-200 border-t-indigo-500 rounded-full animate-spin ${className}`}
    />
  );
}
