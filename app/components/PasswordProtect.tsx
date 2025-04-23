"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PASSWORD, isAdminAuthorized, setAdminAuthorized } from "@/utils/auth";

export default function PasswordProtect({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  // Check if already authorized in this session
  useEffect(() => {
    if (isAdminAuthorized()) {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setAdminAuthorized();
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-black text-white">
      <div className="w-full max-w-md p-8 border border-gray-700 rounded-lg bg-black shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-white font-medium">
              Enter Administrator Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            Access Admin Area
          </Button>
        </form>
      </div>
    </div>
  );
} 