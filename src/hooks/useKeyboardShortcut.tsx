// src/hooks/useKeyboardShortcut.ts
import { useEffect, useCallback } from 'react';

type ModifierKey = 'ctrl' | 'cmd' | 'shift' | 'alt';

type ShortcutDefinition = {
    key: string;
    modifiers?: ModifierKey[];
    description: string;
    callback: () => void;
};

export const isMacOs = () => {
    if (typeof window === 'undefined') return false;
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export function useKeyboardShortcut(shortcut: ShortcutDefinition) {
    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        const isMac = isMacOs();

        // Check if the pressed key matches
        const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifiers
        const modifiersMatch = shortcut.modifiers?.every(modifier => {
            switch (modifier) {
                case 'cmd':
                    return isMac ? event.metaKey : event.ctrlKey;
                case 'ctrl':
                    return event.ctrlKey;
                case 'shift':
                    return event.shiftKey;
                case 'alt':
                    return event.altKey;
                default:
                    return false;
            }
        });

        if (isKeyMatch && modifiersMatch) {
            event.preventDefault();
            shortcut.callback();
        }
    }, [shortcut]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);
}

// Helper function to format shortcut for display
export function formatShortcutDisplay(shortcut: ShortcutDefinition): string {
    const isMac = isMacOs();
    const modifierSymbols = {
        mac: {
            cmd: '⌘',
            ctrl: '⌃',
            shift: '⇧',
            alt: '⌥',
        },
        windows: {
            cmd: 'Ctrl',
            ctrl: 'Ctrl',
            shift: 'Shift',
            alt: 'Alt',
        }
    };

    const symbols = isMac ? modifierSymbols.mac : modifierSymbols.windows;

    const modifiers = shortcut.modifiers?.map(mod => symbols[mod]) || [];
    const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;

    return [...modifiers, key].join(isMac ? '' : '+');
}