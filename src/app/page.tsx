
"use client";

import { useState, useEffect } from "react";
import PinLock from "@/components/PinLock";
import Dashboard from "@/components/Dashboard";
import FirstLaunchFlow from "@/components/FirstLaunchFlow";

const PROFILE_KEY = "bolvyapar_profile";
const LANG_KEY = "bolvyapar_lang";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "helper" | null>(null);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as "hi-IN" | "en-IN";
    if (savedLang) {
      setLanguage(savedLang);
    }

    const profile = localStorage.getItem(PROFILE_KEY);
    if (profile) {
      setHasProfile(true);
    }
  }, []);

  const handleAuth = (role: "owner" | "helper") => {
    setUserRole(role);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUserRole(null);
  };

  const handleLanguageChange = (lang: "hi-IN" | "en-IN") => {
    setLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const handleProfileComplete = () => {
    setHasProfile(true);
  };

  if (!authenticated) {
    return (
      <PinLock 
        onAuth={handleAuth} 
        language={language} 
        onLanguageChange={handleLanguageChange} 
      />
    );
  }

  if (!hasProfile && userRole === "owner") {
    return <FirstLaunchFlow onComplete={handleProfileComplete} language={language} />;
  }

  return (
    <Dashboard 
      role={userRole!} 
      language={language} 
      onLogout={handleLogout} 
    />
  );
}
