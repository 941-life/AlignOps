"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        {Icon && (
          <div className="mb-4 flex justify-center">
            <Icon className="h-12 w-12 text-slate-400" aria-hidden="true" />
          </div>
        )}
        <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 mb-4 max-w-md mx-auto">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
