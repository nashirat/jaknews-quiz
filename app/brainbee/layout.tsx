import PasswordProtect from "@/components/PasswordProtect";

export default function BrainbeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasswordProtect>{children}</PasswordProtect>;
} 