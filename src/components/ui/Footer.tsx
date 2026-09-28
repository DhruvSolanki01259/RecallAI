import { COLORS } from "@/utils/colors";

const Footer = () => {
  return (
    <footer
      className="mt-auto shrink-0 border-t px-4 py-5 sm:px-6 sm:py-6"
      style={{
        borderColor: `${COLORS.primary}18`,
        color: `${COLORS.text}70`,
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} RecallAI.</p>
        <p className="max-w-xs sm:max-w-none">Ask questions. Get answers grounded in your documents.</p>
      </div>
    </footer>
  );
};

export default Footer;
