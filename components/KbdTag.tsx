interface KbdTagProps {
  children: React.ReactNode;
}

export function KbdTag({ children }: KbdTagProps) {
  return (
    <span className="font-mono text-[12px] sm:text-[13px] bg-[rgba(255,255,255,0.05)] px-[10px] py-[6px] rounded-[8px] border-[1px] border-[rgba(255,255,255,0.08)] text-[#FFFFFF]">
      {children}
    </span>
  );
}
