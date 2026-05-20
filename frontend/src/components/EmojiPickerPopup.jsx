import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { LuImage, LuX } from "react-icons/lu";

const EmojiPickerPopup = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex flex-col md:flex-row items-start gap-5 mt-[20px]">
      {/* Trigger */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 dark:bg-purple-900/30 text-primary rounded-lg">
          {icon ? (
            <img src={icon} alt="Icon" className="w-12 h-12 rounded-lg" />
          ) : (
            <LuImage />
          )}
        </div>
        <p className="dark:text-gray-300">{icon ? "Change Icon" : "Pick Icon"}</p>
      </div>

      {/* Floating Picker */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-14 right-10 z-[999] bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-gray-200 dark:border-slate-600 w-[300px] sm:w-[320px] max-w-[90vw]"
        >
          <button
            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full absolute -top-2 -right-2 z-10 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <LuX />
          </button>

          <EmojiPicker
            width="100%"
            height={300}
            previewConfig={{ showPreview: false }}
            onEmojiClick={(emoji) => {
              onSelect(emoji?.imageUrl || "");
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerPopup;