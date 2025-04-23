"use client";

import PasswordProtect from "@/components/PasswordProtect";
import { usePathname } from "next/navigation";

function BrainbeeLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't password protect these paths
  if (pathname.startsWith('/brainbee/passcode') || pathname.startsWith('/brainbee/session')) {
    return <>{children}</>;
  }
  
  // Password protect all other paths under /brainbee
  return <PasswordProtect>{children}</PasswordProtect>;
}

export default function BrainbeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Client-side component to conditionally apply password protection
  return (
    <BrainbeeLayoutClient>
      {children}
    </BrainbeeLayoutClient>
  );
} 