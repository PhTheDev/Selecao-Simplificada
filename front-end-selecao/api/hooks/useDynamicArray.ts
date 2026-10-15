// hooks/useDynamicArray.ts
import { useState, useCallback } from 'react';

interface ArrayItem {
    id: number;
    value: string;
}

export function useDynamicArray(initialItems: ArrayItem[] = [{ id: 1, value: '' }]) {
    const [items, setItems] = useState<ArrayItem[]>(initialItems);

    const addItem = useCallback(() => {
        setItems(prev => [...prev, { id: Date.now(), value: '' }]);
    }, []);

    const removeItem = useCallback((id: number) => {
        setItems(prev => {
            if (prev.length > 1) {
                return prev.filter(item => item.id !== id);
            }
            return prev;
        });
    }, []);

    const updateItem = useCallback((id: number, value: string) => {
        setItems(prev =>
            prev.map(item => (item.id === id ? { ...item, value } : item))
        );
    }, []);

    const reset = useCallback(() => {
        setItems([{ id: 1, value: '' }]);
    }, []);

    return {
        items,
        addItem,
        removeItem,
        updateItem,
        reset,
        setItems,
    };
}

