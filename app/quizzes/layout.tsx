import PasswordProtect from "@/components/PasswordProtect";

export default function QuizzesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasswordProtect>{children}</PasswordProtect>;
} 