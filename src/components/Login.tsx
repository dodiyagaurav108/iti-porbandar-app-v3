import React, { useState } from "react";
import { KeyRound, User as UserIcon, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { User, UserRole } from "../types";
import { getUsers, addAuditLog } from "../utils/storage";
import ItiLogo from "./ItiLogo";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const allUsers = getUsers();
    const user = allUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!user) {
      setErrorMsg("Incorrect username. S.I. accounts must be registered by the Institute Admin.");
      return;
    }

    if (user.password !== password) {
      setErrorMsg("Invalid security password. Please check your credentials.");
      return;
    }

    if (!user.isActive) {
      setErrorMsg("This S.I. account is currently deactivated. Please contact the administrator.");
      return;
    }

    // Success login!
    addAuditLog(user.name, `${user.role === UserRole.ADMIN ? 'Admin' : 'S.I.'} login successful`);
    onLoginSuccess(user);
  };

  const triggerQuickLogin = (userStr: "admin" | "ramesh" | "sonal") => {
    const allUsers = getUsers();
    let targetUser: User | undefined;

    if (userStr === "admin") {
      targetUser = allUsers.find(u => u.username === "admin");
    } else if (userStr === "ramesh") {
      targetUser = allUsers.find(u => u.username === "ramesh_si");
    } else {
      targetUser = allUsers.find(u => u.username === "sonal_si");
    }

    if (targetUser) {
      setUsername(targetUser.username);
      setPassword(targetUser.password || "");
      addAuditLog(targetUser.name, `${targetUser.role === UserRole.ADMIN ? 'Admin' : 'S.I.'} quick login triggered`);
      onLoginSuccess(targetUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between p-6 font-sans antialiased text-[#0F172A]">
      
      {/* Top Bar / Header of Login Screen (Government branding) */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-[#E5E7EB]/80">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
            <span className="text-[#2563EB]">●</span> Government of Gujarat
          </div>
        </div>
        <div className="text-[11px] font-semibold text-[#6B7280]">
          Department of Employment & Training
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        
        {/* Core branding & title */}
        <div className="text-center mb-8 space-y-2 max-w-lg">
          <div className="mx-auto mb-4 flex items-center justify-center p-1.5 bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] w-28 h-28">
            <ItiLogo className="h-full w-full" />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-sm font-extrabold text-[#2563EB] uppercase tracking-wider font-sans">
              SKILL INDIA
            </span>
            <span className="text-xs font-medium text-[#4B5563]">
              કૌશલ ભારત - કુશળ ભારત
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] font-display">
            ITI Porbandar Management System
          </h1>
          <p className="text-sm text-[#4B5563] font-semibold leading-normal">
            Industrial Training Institute, Porbandar
          </p>
          <div className="text-xs font-bold text-[#6B7280]">
            Government of Gujarat
          </div>
        </div>

        {/* Login Card Container */}
        <div className="w-full max-w-md bg-white rounded-[18px] border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
          
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#0F172A] font-display">
                Sign In to Account
              </h2>
              <p className="text-xs text-[#6B7280]">
                Enter your administrative or instructor credentials.
              </p>
            </div>

            {/* Validation Alerts */}
            {errorMsg && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-[12px] text-xs font-semibold flex items-start gap-3">
                <ShieldAlert size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Username ID
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3 text-[#94A3B8]" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g., admin or si_name"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm font-semibold border border-[#E5E7EB] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-all text-[#0F172A]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Security Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3 text-[#94A3B8]" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm font-semibold border border-[#E5E7EB] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-all text-[#0F172A]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[12px] text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,236,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,236,0.35)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 cursor-pointer text-center"
              >
                Sign In to Portal
              </button>
            </form>
          </div>

          {/* Quick Demo Login Panel */}
          <div className="bg-[#F8FAFC] border-t border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4B5563] uppercase tracking-wider">
              <AlertCircle size={15} className="text-[#F59E0B]" />
              Quick Testing Roles
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerQuickLogin("admin")}
                className="py-2 px-1 bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[10px] font-extrabold rounded-[8px] text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB] shadow-sm cursor-pointer transition-all"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => triggerQuickLogin("ramesh")}
                className="py-2 px-1 bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[10px] font-extrabold rounded-[8px] text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB] shadow-sm cursor-pointer transition-all"
              >
                SI RAMESH
              </button>
              <button
                type="button"
                onClick={() => triggerQuickLogin("sonal")}
                className="py-2 px-1 bg-white hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[10px] font-extrabold rounded-[8px] text-[#0F172A] hover:text-[#2563EB] hover:border-[#2563EB] shadow-sm cursor-pointer transition-all"
              >
                SI SONAL
              </button>
            </div>
            <p className="text-[10px] text-[#6B7280] text-center leading-normal">
              Click any button to auto-fill credentials and sign in instantly.
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E7EB]/80 max-w-6xl w-full mx-auto pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B7280] gap-2">
        <div>
          © 2026 INDUSTRIAL TRAINING INSTITUTE PORBANDAR. All Rights Reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#4B5563]">App Developer: Gaurav Dodiya (ITI Porbandar)</span>
        </div>
      </div>

    </div>
  );
}
