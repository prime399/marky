import React, { useState, useEffect, useContext, useCallback } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

// Context
import { useSandboxState, useSandboxSetter } from "../../context/ContentState";

const noop = () => {};

const Modal = (props) => {
  const contentState = useSandboxState();
  const setContentState = useSandboxSetter();
  const [title, setTitle] = useState("Test");
  const [description, setDescription] = useState("Description here");
  const [button1, setButton1] = useState("Submit");
  const [button2, setButton2] = useState("Cancel");
  const [trigger, setTrigger] = useState(() => noop);
  const [trigger2, setTrigger2] = useState(() => noop);
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(null);
  const [learnmore, setLearnMore] = useState(null);
  const [learnMoreLink, setLearnMoreLink] = useState(() => noop);
  const [colorSafe, setColorSafe] = useState(false);
  const [sideButton, setSideButton] = useState(false);
  const [sideButtonAction, setSideButtonAction] = useState(() => noop);

  const openModal = useCallback(
    (
      title,
      description,
      button1,
      button2,
      action,
      action2,
      image = null,
      learnMore = null,
      learnMoreLink = null,
      colorSafe = false,
      sideButton = false,
      sideButtonAction = () => {}
    ) => {
      setTitle(title);
      setDescription(description);
      setButton1(button1);
      setButton2(button2);
      setShowModal(true);
      setTrigger(() => (typeof action === "function" ? action : noop));
      setTrigger2(() => (typeof action2 === "function" ? action2 : noop));
      setImage(image);
      setLearnMore(learnMore);
      setLearnMoreLink(() =>
        typeof learnMoreLink === "function" ? learnMoreLink : noop,
      );
      setColorSafe(colorSafe);
      setSideButton(sideButton);
      setSideButtonAction(() =>
        typeof sideButtonAction === "function" ? sideButtonAction : noop,
      );
    }
  );

  useEffect(() => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      openModal: openModal,
    }));

    return () => {
      setContentState((prevContentState) => ({
        ...prevContentState,
        openModal: null,
      }));
    };
  }, []);

  return (
    <AlertDialog.Root
      open={showModal}
      onOpenChange={(open) => {
        setShowModal(open);
      }}
    >
      <AlertDialog.Trigger asChild />
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="AlertDialogOverlay" />
        <AlertDialog.Content className="AlertDialogContent">
          <AlertDialog.Title className="AlertDialogTitle">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="AlertDialogDescription">
            {description || ""}
            {learnmore && " "}
            {learnmore && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof learnMoreLink === "function") {
                    learnMoreLink();
                  }
                }}
                target="_blank"
              >
                {learnmore}
              </a>
            )}
          </AlertDialog.Description>
          {image && (
            <img
              src={image}
              style={{
                width: "100%",
                marginBottom: 15,
                marginTop: 5,
                borderRadius: "15px",
              }}
            />
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {sideButton && (
              <button
                className="SideButtonModal"
                onClick={() => {
                  if (typeof sideButtonAction === "function") {
                    sideButtonAction();
                  }
                  setShowModal(false);
                }}
              >
                {sideButton}
              </button>
            )}
            {button2 && (
              <AlertDialog.Cancel asChild>
                <button
                  className="Button grey"
                  onClick={() => {
                    if (typeof trigger2 === "function") {
                      trigger2();
                    }
                  }}
                >
                  {button2}
                </button>
              </AlertDialog.Cancel>
            )}
            {button1 && (
              <AlertDialog.Action asChild>
                <button
                  className={!colorSafe ? "Button red" : "Button blue"}
                  onClick={() => {
                    if (typeof trigger === "function") {
                      trigger();
                    }
                  }}
                >
                  {button1}
                </button>
              </AlertDialog.Action>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default Modal;
