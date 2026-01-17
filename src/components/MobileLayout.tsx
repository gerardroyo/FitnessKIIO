import { cn } from "@/lib/utils";

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function MobileLayout({ children, className }: LayoutProps) {
    return (
        <div className={cn("min-h-screen bg-[var(--color-background)] pb-24 text-[var(--color-text-main)]", className)}>
            <div className="mx-auto max-w-md min-h-screen relative flex flex-col">
                {children}
            </div>
        </div>
    );
}
