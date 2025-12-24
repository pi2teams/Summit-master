"use client";
import { CiLogin } from "react-icons/ci";
import { SignInForm } from "./SignInForm";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function SignIn() {
  const { t } = useTranslation();
  return (
    <div className="flex w-full h-[90vh] items-center">
      <div className="m-auto flex justify-center">
        <motion.div 
            initial={{ scaleX: 0, width: 0, scaleY: 0 }}
            animate={{ scaleX: 1, width: 350, scaleY: 1 }}
            transition={{ duration: 0.5 }}
            className="border-[.075rem] dark:border-zinc-700 dark:bg-zinc-900 border-zinc-300 bg-zinc-100 bg-opacity-[65%] backdrop-blur-5 rounded-3xl">
          <div className="p-6 flex flex-col gap-3 text-left ">
            <CiLogin
              size={50}
              className="dark:text-zinc-300 dark:bg-zinc-800 text-zinc-700 bg-zinc-200 scale-x-[-1] rounded-full p-3 h-[4rem] w-[4rem]"
            />
            <h1 className="text-2xl dark:text-zinc-100 text-zinc-900 font-semibold">
              {t("SignIn.title")}
            </h1>
            <p className="text-sm font-semibold dark:text-zinc-400 text-zinc-600">
            {t("SignIn.subtitle")}
            </p>
            <SignInForm />
          </div>
          {/* Additional providers could go here (Google, email, etc.) */}
        </motion.div>
      </div>
    </div>
  );
}
