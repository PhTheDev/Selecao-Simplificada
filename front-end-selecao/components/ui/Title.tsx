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
        <header className="bg-white shadow-lg p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
                <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-800 mr-2 sm:mr-3" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                        {title}
                    </h1>
                </div>

                {IconButton && titleButton && (
                    <div className="mt-4 sm:mt-0">
                        {buttonUrl ? (
                            // Se tem URL, usa Link
                            <Link
                                href={buttonUrl}
                                className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                            >
                                <ButtonContent />
                            </Link>
                        ) : onButtonClick ? (
                            // Se tem onButtonClick, usa button
                            <button
                                onClick={onButtonClick}
                                className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
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