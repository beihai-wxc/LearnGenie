export function LandingFooter() {
  return (
    <footer className="border-t border-[#cce7ff] bg-white px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2">
          <img
            src="/logo-horizontal.png"
            alt="LearnGenie"
            className="h-5 w-auto opacity-50"
          />
          <span className="text-[13px] text-[#93979f]">
            immersive AI classroom
          </span>
        </div>
        <p className="text-[13px] text-[#93979f]">
          &copy; {new Date().getFullYear()} LearnGenie. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
