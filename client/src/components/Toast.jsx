import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext(null);

const TYPE_CLASSES = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

function ToastItem({ id, type, message, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in on next tick
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Start slide-out after 4 s
    const exitTimer = setTimeout(() => {
      setVisible(false);
      // Remove from list after transition (300 ms)
      setTimeout(() => onRemove(id), 300);
    }, 4000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [id, onRemove]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded shadow-lg max-w-xs w-full
        transition-all duration-300 ease-in-out
        ${TYPE_CLASSES[type] || TYPE_CLASSES.info}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <span className="flex-1 text-sm leading-snug">{message}</span>
      <button
        onClick={handleClose}
        aria-label="Close notification"
        className="flex-shrink-0 opacity-80 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const toast = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error', msg),
    info:    (msg) => addToast('info', msg),
    warning: (msg) => addToast('warning', msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
