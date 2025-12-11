"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { useTodo } from "@/contexts/TodoContext";
import styles from "./TodoBoard.module.css";
import cardStyles from "./TodoCard.module.css";

import TodoSection from "./TodoSection";
import SectionSeparator from "./SectionSeparator";
import { TODO_STATUS, TodoStatus } from "@/types/Todo.type";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export const TODO_SECTIONS = [
  {
    status: TODO_STATUS.TODO,
    title: "To Do",
  },
  {
    status: TODO_STATUS.IN_PROGRESS,
    title: "In Progress",
  },
  {
    status: TODO_STATUS.COMPLETED,
    title: "Done",
  },
] as const;

const TODO_PLACEHOLDER = "Add your todo item here";

const TodoBoard = () => {
  const { list, moveTodo } = useTodo();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // status -> ids in that column in order
  const columns: Record<TodoStatus, string[]> = {
    [TODO_STATUS.TODO]: list
      .filter((t) => t.status === TODO_STATUS.TODO)
      .map((t) => t.id),
    [TODO_STATUS.IN_PROGRESS]: list
      .filter((t) => t.status === TODO_STATUS.IN_PROGRESS)
      .map((t) => t.id),
    [TODO_STATUS.COMPLETED]: list
      .filter((t) => t.status === TODO_STATUS.COMPLETED)
      .map((t) => t.id),
  };

  const findContainer = (id: string): TodoStatus | null => {
    if (
      id === TODO_STATUS.TODO ||
      id === TODO_STATUS.IN_PROGRESS ||
      id === TODO_STATUS.COMPLETED
    ) {
      return id as TodoStatus;
    }

    for (const [status, ids] of Object.entries(columns)) {
      if (ids.includes(id)) {
        return status as TodoStatus;
      }
    }

    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Same column: reorder within that column
    if (activeContainer === overContainer) {
      const ids = columns[activeContainer];
      const fromIndex = ids.indexOf(activeId);
      const toIndex = ids.indexOf(overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      moveTodo(activeId, activeContainer, toIndex);
      return;
    }

    // Different columns: move to another section
    const overIds = columns[overContainer];
    let targetIndex = overIds.indexOf(overId);

    // Dropping in empty space of the column => go to end
    if (targetIndex === -1) {
      targetIndex = overIds.length;
    }

    moveTodo(activeId, overContainer, targetIndex);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null);
  };

  const activeTodo = activeId
    ? list.find((todo) => todo.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ul className={styles.todoBoard}>
        {TODO_SECTIONS.map((section, index) => {
          const todosInSection = list.filter(
            (todo) => todo.status === section.status
          );

          return (
            <Fragment key={section.status}>
              <SortableContext
                items={columns[section.status]}
                strategy={verticalListSortingStrategy}
              >
                <TodoSection
                  status={section.status}
                  title={section.title}
                  todos={todosInSection}
                />
              </SortableContext>

              {index < TODO_SECTIONS.length - 1 && <SectionSeparator />}
            </Fragment>
          );
        })}
      </ul>

      {/* Drag overlay that keeps approx. the same height as the real card */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "ease-out",
        }}
      >
        {activeTodo ? (
          <TodoCardOverlay name={activeTodo.name} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

type TodoCardOverlayProps = {
  name: string;
};

const TodoCardOverlay = ({ name }: TodoCardOverlayProps) => {
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-size the overlay textarea to match its content
  useEffect(() => {
    if (!textRef.current) return;
    const el = textRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [name]);

  return (
    <li className={cardStyles.todoCard} style={{ opacity: 0.9 }}>
      <div className={cardStyles.todoCardHandle} />
      <textarea
        ref={textRef}
        value={name || TODO_PLACEHOLDER}
        readOnly
        rows={1}
        className={`${cardStyles.textarea} ${cardStyles.textareaReadOnly}`}
      />
    </li>
  );
};

export default TodoBoard;
