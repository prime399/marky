import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";

import * as ToastEl from "@radix-ui/react-toast";

// Context
import { useContentSetter } from "../../context/ContentState";
import { useContentStateSelector } from "../../state/contentStore";

const noop = () => {};

const Toast = () => {
  const setContentState = useContentSetter();
  const hideUI = useContentStateSelector((s) => s.hideUI);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [trigger, setTrigger] = useState(() => noop);
  const triggerRef = useRef(trigger);
  const openRef = useRef(open);
  const hideUIRef = useRef(hideUI);
  const [toastDuration, setToastDuration] = useState(2000);

  useEffect(() => {
    hideUIRef.current = hideUI;
  }, [hideUI]);

  const openToast = useCallback((title, action, durationMs = 2000) => {
    if (hideUIRef.current) return;
    setTitle(title);
    setOpen(true);
    setTrigger(() => (typeof action === "function" ? action : noop));
    setToastDuration(durationMs);
  }, []);

  useEffect(() => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      openToast: openToast,
    }));

    return () => {
      setContentState((prevContentState) => ({
        ...prevContentState,
        openToast: null,
      }));
    };
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    triggerRef.current = trigger;

    return () => {
      triggerRef.current = noop;
    };
  }, [trigger]);

  return (
    <ToastEl.Provider swipeDirection="down" duration={toastDuration}>
      <ToastEl.Root
        className="ToastRoot"
        open={open}
        onOpenChange={setOpen}
        onEscapeKeyDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (typeof triggerRef.current === "function") {
            triggerRef.current();
          }
          setOpen(false);
        }}
      >
        <ToastEl.Title className="ToastTitle">{title}</ToastEl.Title>
        <ToastEl.Action
          className="ToastAction"
          asChild
          altText="Escape"
          onClick={() => {
            if (typeof trigger === "function") {
              trigger();
            }
          }}
        >
          <button
            className="Button"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof trigger === "function") {
                trigger();
              }
            }}
          >
            Esc
          </button>
        </ToastEl.Action>
      </ToastEl.Root>
      <ToastEl.Viewport className="ToastViewport" />
    </ToastEl.Provider>
  );
};

export default Toast;
