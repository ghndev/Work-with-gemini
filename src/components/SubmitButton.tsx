'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: React.ReactNode;
}

export function SubmitButton({
  children,
  pendingText,
  className = '',
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`${className} flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 -ml-1 h-4 w-4 animate-spin text-current" />
          {pendingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
