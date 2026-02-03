import React, { useState } from "react";

const RoomCode = ({ roomCode }) => {
  const [showToast, setShowToast] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      console.log("Copied:", roomCode); // Check your console if it still doesn't show
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative">
      <div className="text-lg opacity-60 mb-8 font-medium">
        Share the code{" "}
        <span
          className="hover:underline text-primary font-bold cursor-pointer active:scale-95 transition-transform inline-block"
          onClick={handleCopy}
        >
          {roomCode}
        </span>
      </div>

      {/* daisyUI Toast - Fixed to viewport */}
      {showToast && (
        <div className="toast toast-bottom toast-end z-[9999]">
          <div className="alert alert-info alert-success shadow-lg">
            <span>Copied to clipboard!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCode;
