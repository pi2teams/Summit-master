'use client'
import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import { CreateUsernameForm } from "@/components/SignIn/CreateUsernameForm";
import { Welcome } from "@/components/Welcome/Welcome";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Page() {
    const { t } = useTranslation();
    useDocumentTitle(t("titles.finishSignUp"));
    const [welcome, setWelcome] = useState(false);
    
    const router = useRouter();
    useEffect(() => {
        if(welcome) {
            const timeoutId = setTimeout(() => {
                router.push('/home');
            }, 3000);
            return () => clearTimeout(timeoutId);
        }
    }, [welcome, router]);

    return (
        <>
            <RandomBg />
            <Header isSignedIn={true} />
            <main>
                {welcome ? (
                    <Welcome />
                ) : (
                    <CreateUsernameForm setWelcome={setWelcome}/>
                )}
            </main>
        </>
    )
}
