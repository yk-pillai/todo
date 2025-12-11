"use client";

import { TODO_STATUS, Todo, TodoStatus } from "@/types/Todo.type";
import styles from "./TodoCard.module.css";
import { useRef, useState, useEffect, MouseEvent } from "react";
import { useTodo } from "@/contexts/TodoContext";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmModal from "@/components/ConfirmModal";

type TodoCardType = {
  id: Todo["id"];
  name: Todo["name"];
  status: TodoStatus;
  index: number;
};

const TODO_PLACEHOLDER = "Add your todo item here";

/**
 * Detect "fine" pointer (mouse/trackpad) vs "coarse" (touch).
 * true  => desktop-style
 * false => mobile/tablet-style
 */
const useIsPointerFine = () => {
  const [isFine, setIsFine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(pointer: fine)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsFine(event.matches);
    };

    setIsFine(mq.matches);
    mq.addEventListener("change", handleChange);

    return () => {
      mq.removeEventListener("change", handleChange);
    };
  }, []);

  return isFine;
};

const TodoCard = ({ id, name, status }: TodoCardType) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { editTodoName, deleteTodo } = useTodo();

  const [editMode, setEditMode] = useState(name === "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // started life as a brand-new empty todo
  const [isNew, setIsNew] = useState(name === "");
  // last saved non-empty value (for restore on cancel)
  const [lastValue, setLastValue] = useState(name);

  const isPointerFine = useIsPointerFine();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const autoSize = () => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Desktop: double-click to enter edit mode
  const handleDoubleClick = () => {
    if (!isPointerFine) return; // ignore dblclick on touch
    if (!inputRef.current) return;
    setEditMode(true);
  };

  // Desktop: focus textarea after entering edit mode
  useEffect(() => {
    if (!isPointerFine) return; // on mobile, let native tap focus
    if (!editMode || !inputRef.current) return;

    const el = inputRef.current;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editMode, isPointerFine]);

  const handleBlur = () => {
    if (!inputRef.current) return;
    const el = inputRef.current;

    const trimmed = el.value.replace(/\n+$/g, "").trim();

    // Case 1: brand-new todo, still empty → delete silently (no modal)
    if (trimmed === "" && isNew) {
      deleteTodo(id);
      return;
    }

    // Case 2: existing todo cleared to empty → ask for confirmation
    if (trimmed === "") {
      setConfirmOpen(true);
      return;
    }

    // Normal save
    el.value = trimmed;
    autoSize();
    setEditMode(false);
    setIsNew(false); // no longer "new"
    setLastValue(trimmed); // remember last saved value
    editTodoName(id, trimmed);
  };

  const handleInput = () => {
    autoSize();
  };

  // Mobile: tap directly on textarea to edit (no readOnly gating)
  const handleFocus = () => {
    if (status === TODO_STATUS.COMPLETED) return;
    if (!isPointerFine) {
      setEditMode(true);
    }
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    deleteTodo(id);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);

    // restore previous value if user tried to "delete by clearing"
    if (!inputRef.current) return;
    const el = inputRef.current;

    el.value = lastValue;
    autoSize();
    setEditMode(false);
  };

  // Auto-size on mount
  useEffect(() => {
    autoSize();
  }, []);

  // Re-apply height after drag ends / name changes
  useEffect(() => {
    if (!isDragging) {
      autoSize();
    }
  }, [isDragging, name]);

  // Don’t start drag while editing
  const dragListeners = editMode ? {} : listeners;

  // readOnly:
  // - COMPLETED: always read-only
  // - desktop (fine pointer): gated by editMode
  // - mobile (coarse pointer): always editable except COMPLETED
  const isReadOnly =
    status === TODO_STATUS.COMPLETED ? true : isPointerFine ? !editMode : false;

  const titleText = editMode
    ? TODO_PLACEHOLDER
    : isPointerFine
    ? "Double-click to edit"
    : "Tap to edit";

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={styles.todoCard}
        title={titleText}
        {...attributes}
        {...dragListeners} // 🔸 whole card is draggable when not editing
      >
        <div className={styles.todoCardHandle} />

        <textarea
          ref={inputRef}
          defaultValue={name}
          rows={1}
          placeholder={TODO_PLACEHOLDER}
          onInput={handleInput}
          onDoubleClick={isPointerFine ? handleDoubleClick : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={isReadOnly}
          autoFocus={name === ""} // new todos focus initially
          className={`${styles.textarea} ${
            editMode ? styles.textareaEditing : styles.textareaReadOnly
          } ${confirmOpen ? styles.textareaDelete : ""}`}
          disabled={status === TODO_STATUS.COMPLETED}
        />

        <button
          type="button"
          className={styles.todoDeleteButton}
          onClick={handleDeleteClick}
          aria-label="Delete todo"
        >
          ×
        </button>
      </li>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this todo?"
        message="This item will be removed from your board."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

export default TodoCard;
