import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={`rounded-xl border border-border/60 bg-card/85 shadow-lg shadow-background/15 backdrop-blur-sm ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
