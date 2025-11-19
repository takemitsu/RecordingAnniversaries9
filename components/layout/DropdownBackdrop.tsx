interface DropdownBackdropProps {
  onClose: () => void;
}

export function DropdownBackdrop({ onClose }: DropdownBackdropProps) {
  return (
    <button
      type="button"
      className="fixed inset-0 z-10 cursor-default"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      aria-label="メニューを閉じる"
    />
  );
}
