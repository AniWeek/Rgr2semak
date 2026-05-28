import { X } from "lucide-react";
import { useEffect } from "react";

const escapeHtml = (str: string): string => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'register' | 'login';
}

export function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h2 className="text-foreground text-xl font-bold">
                        {type === 'register' ? 'Добро пожаловать!' : 'Рады видеть снова!'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-5 mb-4">
                        <p className="text-foreground leading-relaxed">
                            <span className="text-primary font-bold text-lg">Вам интересно создавать тесты и тестировать других людей?</span>
                            <br /><br />
                            Тогда обратитесь на почту:
                            <br />
                            <a href="mailto:testing-system_rgr2026@yandex.ru" className="text-primary hover:underline font-mono mt-2 inline-block break-all text-lg">
                                testing-system_rgr2026@yandex.ru
                            </a>
                        </p>
                    </div>

                    <p className="text-muted-foreground text-sm text-center">После получения роли "Тестировщик" вам станут доступны:</p>
                    <ul className="text-muted-foreground text-sm mt-3 space-y-1 list-disc list-inside">
                        <li>Создание собственных тестов</li>
                        <li>Редактирование и удаление тестов</li>
                        <li>Просмотр статистики прохождения</li>
                        <li>Настройка количества попыток для тестов</li>
                    </ul>
                </div>

                <div className="p-5 border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        Понятно, спасибо
                    </button>
                </div>
            </div>
        </div>
    );
}