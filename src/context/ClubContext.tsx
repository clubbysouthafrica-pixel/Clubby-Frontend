import {createContext, ReactNode, useEffect, useState} from 'react';

export interface ClubContextType {
    club: Club | null;
    setClub: (club: Club) => void
}

export interface Club {
    club_name: string
    access: string,
    club_account_id: string,
    club_type: string,
    currency: string
    onboarded: boolean
}

interface ClubProviderProps {
    children: ReactNode;
}

export const ClubContext = createContext<ClubContextType | undefined>(undefined);

const activeClub = "activeClub"

const ClubProvider: React.FC<ClubProviderProps> = ({ children }) => {
    const [club, setActiveClub] = useState<Club | null>(null);

    useEffect(() => {
        const hasActiveClub = localStorage.getItem(activeClub)
       
        if (hasActiveClub) {
            setActiveClub(JSON.parse(hasActiveClub))
        }
    }, [])

    const setClub = (club: Club) => {
        localStorage.setItem(activeClub, JSON.stringify(club))
        setActiveClub(club)
    }

    return (
        <ClubContext.Provider value={{ club, setClub }}>
            {children}
        </ClubContext.Provider>
    );
};

export default ClubProvider;
