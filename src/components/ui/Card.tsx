import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={`bg-card shadow border border-border rounded-lg ${className}`}{...props}>
      {children}
    </div>
  );
};

export default Card;
