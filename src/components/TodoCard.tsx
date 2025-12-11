"use client";

import { Todo, TodoStatus } from "@/types/Todo.type";
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

const TodoCard = ({ id, name }: TodoCardType) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { editTodoName, deleteTodo } = useTodo();
  const [editMode, setEditMode] = useState(name === "");
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleDoubleClick = () => {
    if (!inputRef.current) return;
    inputRef.current.focus();
    setEditMode(true);
  };

  const handleBlur = () => {
    if (!inputRef.current) return;
    const el = inputRef.current;

    const trimmed = el.value.replace(/\n+$/g, "").trim();

    // Delete on empty edit (fast path, no modal)
    if (trimmed === "") {
      deleteTodo(id);
      return;
    }

    el.value = trimmed;
    autoSize();
    setEditMode(false);
    editTodoName(id, trimmed);
  };

  const handleInput = () => {
    autoSize();
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
  };

  // Auto-size on mount
  useEffect(() => {
    autoSize();
  }, []);

  // Re-apply height after drag ends
  useEffect(() => {
    if (!isDragging) {
      autoSize();
    }
  }, [isDragging, name]);

  // Don’t start drag while editing
  const dragListeners = editMode ? {} : listeners;

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={styles.todoCard}
        title={editMode ? TODO_PLACEHOLDER : "Double-click to edit"}
        {...attributes}
        {...dragListeners}
      >
        <div className={styles.todoCardHandle} />

        <textarea
          ref={inputRef}
          defaultValue={name}
          rows={1}
          placeholder={TODO_PLACEHOLDER}
          onInput={handleInput}
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          readOnly={!editMode}
          autoFocus={editMode}
          className={`${styles.textarea} ${
            editMode ? styles.textareaEditing : styles.textareaReadOnly
          }`}
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
