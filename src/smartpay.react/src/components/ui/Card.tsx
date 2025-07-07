import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, gradient = false, onClick, ...props }) => {
  const baseClasses = "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden";
  const gradientClasses = gradient ? "bg-gradient-to-br from-white to-gray-50" : "";
  const cardContent = (
    <div className={clsx(baseClasses, gradientClasses, className)} onClick={onClick} {...props}>
      {children}
    </div>
  );

  if (hoverable) {
    return (
      <motion.div
        whileHover={{
          scale: 1.02,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={clsx("px-6 py-4 border-b border-gray-200", className)}>{children}</div>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={clsx("px-6 py-4", className)}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={clsx("px-6 py-4 border-t border-gray-200 bg-gray-50", className)}>{children}</div>;
