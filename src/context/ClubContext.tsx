import {createContext, ReactNode, useEffect, useState} from 'react';

export interface ClubContextType {
    club: Club | null;
    setClub: (club: Club) => void;
    isLoading: boolean;
}

export interface Club {
    club_name: string
    access: string,
    season_cycle: number
    club_account_id: string,
    club_type: string,
    currency: string
    onboarded: boolean
    deregistration_in_progress: boolean
    enable_shop?: boolean
    venues_enabled?: boolean
    registration_form_exists?: boolean
    currency_exists?: boolean
    country_exists?: boolean
    bank_details_exists?: boolean
}

interface ClubProviderProps {
    children: ReactNode;
}

export const ClubContext = createContext<ClubContextType | undefined>(undefined);

const activeClub = "activeClub"

const ClubProvider: React.FC<ClubProviderProps> = ({ children }) => {
    const [club, setActiveClub] = useState<Club | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hasActiveClub = localStorage.getItem(activeClub)
       
        if (hasActiveClub) {
            const parsedClub = JSON.parse(hasActiveClub)
            setActiveClub(parsedClub)
        }
        setIsLoading(false);
    }, [])

    const setClub = (club: Club) => {
        localStorage.setItem(activeClub, JSON.stringify(club))
        setActiveClub(club)
    }

    return (
        <ClubContext.Provider value={{ club, setClub, isLoading }}>
            {children}
        </ClubContext.Provider>
    );
};

export default ClubProvider;
