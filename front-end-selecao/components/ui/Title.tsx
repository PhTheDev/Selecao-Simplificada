import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
    title: string;
    icon: LucideIcon;
    iconButton?: LucideIcon;
    titleButton?: string;
    buttonUrl?: string;
    onButtonClick?: () => void; // Nova prop para clique
}

export function Title({
    title,
    icon: Icon,
    iconButton: IconButton,
    titleButton,
    buttonUrl,
    onButtonClick,
}: HeaderProps) {
    const ButtonContent = () => (
        <div className="flex items-center gap-2">
            {IconButton && <IconButton className="w-4 h-4" />}
            <span className="truncate">{titleButton}</span>
        </div>
    );

    return (
        <header className="bg-card shadow-sm p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 border border-border">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
                <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-foreground mr-2 sm:mr-3" />
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                        {title}
                    </h1>
                </div>

                {IconButton && titleButton && (
                    <div className="mt-4 sm:mt-0">
                        {buttonUrl ? (
                            // Se tem URL, usa Link
                            <Link
                                href={buttonUrl}
                                className="flex items-center gap-2 px-6 py-3 text-primary-foreground bg-primary shadow-sm shadow-primary/30 hover:shadow-primary/40 rounded-2xl font-medium hover:bg-primary-hover-hover transition-all duration-300"
                            >
                                <ButtonContent />
                            </Link>
                        ) : onButtonClick ? (
                            // Se tem onButtonClick, usa button
                            <button
                                onClick={onButtonClick}
                                className="flex items-center gap-2 px-6 py-3 text-primary-foreground bg-primary shadow-sm shadow-primary/30 hover:shadow-primary/40 rounded-2xl font-medium hover:bg-primary-hover-hover transition-all duration-300"
                            >
                                <ButtonContent />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>
        </header>
    );
}