import Header from "@/components/header.tsx";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Header />
            <div className="h-full">
                {children}
            </div>
        </div>
    )
}
