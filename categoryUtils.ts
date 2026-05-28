export const getCategoryLabel = (category?: string): string => {
    const labels: Record<string, string> = {
        'CERTIFICATION': 'Аттестация',
        'PROFESSIONAL': 'Профессиональные навыки',
        'LANGUAGE': 'Языковые тесты',
        'GENERAL': 'Общие знания'
    };
    return labels[category || 'GENERAL'] || 'Общие знания';
};

export const getCategoryOptions = (): { value: string; label: string }[] => {
    return [
        { value: 'GENERAL', label: 'Общие знания' },
        { value: 'CERTIFICATION', label: 'Аттестация' },
        { value: 'PROFESSIONAL', label: 'Профессиональные навыки' },
        { value: 'LANGUAGE', label: 'Языковые тесты' }
    ];
};