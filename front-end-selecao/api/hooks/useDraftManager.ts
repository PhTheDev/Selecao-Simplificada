// hooks/useDraftManager.ts
import { DRAFT_EXPIRY_HOURS, DRAFT_STORAGE_KEY } from '@/constants/formFields';
import { useCallback, useEffect, useState } from 'react';

interface DraftData<T> {
    formData: T;
    benefits: Array<{ id: number; value: string }>;
    prerequisites: Array<{ id: number; value: string }>;
    bannerPreview: string | null;
    noticeDocFiles: File[];          // ✅ incluído, mas será vazio ao restaurar
    lastSaved: string;
}

export function useDraftManager<T>(initialData: {
    formData: T;
    benefits: Array<{ id: number; value: string }>;
    prerequisites: Array<{ id: number; value: string }>;
    bannerPreview: string | null;
    noticeDocFiles: File[];          // ✅ adicionado ao parâmetro inicial
}) {
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Verifica se existe rascunho ao montar
    useEffect(() => {
        const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData) as Omit<DraftData<T>, 'noticeDocFiles'>;
                const lastSaved = new Date(parsedData.lastSaved);
                const now = new Date();
                const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < DRAFT_EXPIRY_HOURS) {
                    setShowRestoreDialog(true);
                } else {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                }
            } catch (error) {
                console.error('Erro ao carregar dados salvos:', error);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
    }, []);

    // Salva rascunho (ignora noticeDocFiles, pois File não é serializável)
    const saveDraft = useCallback((data: {
        formData: T;
        benefits: Array<{ id: number; value: string }>;
        prerequisites: Array<{ id: number; value: string }>;
        bannerPreview: string | null;
        noticeDocFiles: File[];      // ✅ aceito, mas não armazenado
    }) => {
        try {
            const { noticeDocFiles, ...rest } = data; // remove os arquivos
            const storageData = {
                ...rest,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storageData));
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
        }
    }, []);

    // Carrega rascunho (arquivos não podem ser restaurados → array vazio)
    const loadDraft = useCallback((): DraftData<T> | null => {
        const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData) as Omit<DraftData<T>, 'noticeDocFiles'>;
                return {
                    ...parsed,
                    noticeDocFiles: [], // ⚠️ arquivos precisam ser reenviados
                };
            } catch (error) {
                console.error('Erro ao carregar dados salvos:', error);
                return null;
            }
        }
        return null;
    }, []);

    // Limpa rascunho
    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasUnsavedChanges(false);
    }, []);

    return {
        showRestoreDialog,
        setShowRestoreDialog,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        saveDraft,
        loadDraft,
        clearDraft,
    };
}