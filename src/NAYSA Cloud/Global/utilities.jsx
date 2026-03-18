export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-300"></div>
        <div className="absolute inset-0 rounded-full border-[5px] border-blue-500 border-t-transparent animate-spin"></div>
        <img
          src="/naysa_logo.png"
          alt="Loading"
          className="w-13 h-12 object-contain"
        />
      </div>
    </div>
  );
}