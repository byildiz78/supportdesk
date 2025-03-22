// Basit bir toast hook
import { useState } from "react";

type ToastVariant = "default" | "success" | "destructive" | "info";

interface ToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

export const toast = (props: ToastProps) => {
  // Gerçek bir toast implementasyonu burada olacak
};
