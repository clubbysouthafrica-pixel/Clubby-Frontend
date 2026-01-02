const STORAGE_KEY_PREFIX = "club_member_preferences_";

export interface MemberPreferences {
  activeFilterKeys: string[];
  activeColumnKeys: string[];
}

export const saveFilterAndColumnPreferences = (
  clubAccountId: string,
  preferences: Partial<MemberPreferences>
) => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${clubAccountId}`;
    const existingPreferences = getFilterAndColumnPreferences(clubAccountId);
    const updatedPreferences = { ...existingPreferences, ...preferences };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error("Failed to save member preferences:", error);
  }
};

export const getFilterAndColumnPreferences = (
  clubAccountId: string
): Partial<MemberPreferences> => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${clubAccountId}`;
    const saved = localStorage.getItem(storageKey);
    let preferences = saved ? JSON.parse(saved) : {};
    
    // Remove old activeKeys data if it exists (migration from old format)
    if (preferences.activeKeys && !preferences.activeFilterKeys && !preferences.activeColumnKeys) {
      delete preferences.activeKeys;
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    }

    return preferences;
  } catch (error) {
    console.error("Failed to load member preferences:", error);
    return {};
  }
};

export const clearFilterAndColumnPreferences = (clubAccountId: string) => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${clubAccountId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear member preferences:", error);
  }
};
