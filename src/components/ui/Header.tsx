import { RefreshCw, Sparkles } from "lucide-react";
import { COLORS } from "@/utils/colors";
import { motion } from "framer-motion";

const Header = () => {
  const resetApplication = () => {
    window.location.reload();
  };

  return (
    <header
      className="sticky top-0 z-50 shrink-0 border-b backdrop-blur-xl"
      style={{
        backgroundColor: "rgba(248, 250, 252, 0.9)",
        borderColor: `${COLORS.primary}20`,
      }}
    >
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={resetApplication}
          className="group min-w-0 flex items-center gap-2.5 sm:gap-3"
          aria-label="Reset RecallAI"
        >
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="grid size-8 shrink-0 place-items-center rounded-xl sm:size-9"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.background,
            }}
          >
            <Sparkles size={18} strokeWidth={2.2} />
          </motion.div>

          <div className="text-left">
            <p className="text-sm font-bold tracking-tight sm:text-base">RecallAI</p>
            <p
              className="hidden text-[11px] font-medium sm:block"
              style={{ color: `${COLORS.text}99` }}
            >
              Ask your documents
            </p>
          </div>
        </button>

        <motion.button
          type="button"
          onClick={resetApplication}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex size-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors sm:size-auto sm:gap-2 sm:px-3 sm:py-2"
          style={{
            borderColor: `${COLORS.primary}25`,
            backgroundColor: COLORS.secondary,
            color: COLORS.text,
          }}
          title="Refresh application"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Reset</span>
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
