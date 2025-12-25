'use client'
import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import { SettingsForm } from "@/components/Settings/SettingsForm";
import { api } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Page() {
    const [isSignedIn, setIsSignedIn] = useState(false);

    const { t } = useTranslation();
    useDocumentTitle(t("titles.accountSettings"));
    
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn) return;
        if (typeof window === "undefined") return;
        const validateToken = async () => {
            if(localStorage.getItem("token")) {
                const resp = await api.get("/api/auth/validate-token", {})
                if(resp.status === 200) {
                    setIsSignedIn(true);
                } else {
                    localStorage.removeItem("token");
                    router.push("/signin");
                }
            } else {
                router.push("/signin");
            }
        };
        validateToken();
    }, [isSignedIn, router]);

    return (
        <>
            <RandomBg />
            <Header isSignedIn={true}/>
            <>
                <SettingsForm />
            </>
        </>
    )
}
