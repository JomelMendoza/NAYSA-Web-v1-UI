export function LoadingSpinner() {
  return (
    /* Change 'absolute' to 'fixed' to center on the screen regardless of parent layout */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate bg-white/60">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Static Ring */}
        <div className="absolute inset-0 border-[3px] border-slate-300/50 rounded-full"></div>
        
        {/* Animated Ring */}
        <div className="absolute inset-0 border-[4px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Logo */}
        <img 
          src="/naysa_logo.png" 
          alt="Loading" 
          className="w-12 h-12 object-contain" 
          style={{ filter: 'none' }} 
        />
      </div>
    </div>
  );
}