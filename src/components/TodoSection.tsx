"use client";

import sectionStyles from "./TodoSection.module.css";
import commonStyles from "@/styles/common.module.css";
import TodoCard from "./TodoCard";
import { Todo } from "@/types/Todo.type";
import { TODO_SECTIONS } from "./TodoBoard";
import { useTodo } from "@/contexts/TodoContext";
import { TODO_STATUS } from "@/types/Todo.type";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import Tooltip from "@/components/Tooltip";

type TodoSectionType = {
  status: (typeof TODO_SECTIONS)[number]["status"];
  title: (typeof TODO_SECTIONS)[number]["title"];
  todos: Todo[];
};

const TODO_HELP_TEXT = `How this board works:

• Click the ADD button to create a new To Do item.
• Double-click a To Do to edit it.
• To delete a To Do:
  - Click the delete (×) button on hover, or
  - Clear the entire text and save.

You can also drag and drop To Do items between columns to change their status.`;

const TodoSection = ({ status, title, todos }: TodoSectionType) => {
  const { addTodo } = useTodo();

  // Register the whole column as a droppable area
  const { setNodeRef } = useDroppable({
    id: status,
  });

  // Read current "over" element from DnD context
  const { over } = useDndContext();

  const isActive =
    !!over && (over.id === status || todos.some((todo) => todo.id === over.id));

  const isTodoSection = status === TODO_STATUS.TODO;

  return (
    <li
      ref={setNodeRef}
      className={`${sectionStyles.todoSection} ${
        isActive ? sectionStyles.todoSectionOver : ""
      }`}
    >
      <h1 className={sectionStyles.title}>
        {isTodoSection && (
          <button
            className={`${commonStyles.pillButton} ${sectionStyles.addButton}`}
            onClick={() => addTodo("")}
          >
            ADD
          </button>
        )}

        <span>
          {title} ({todos.length})
        </span>
        {isTodoSection && (
          <Tooltip content={TODO_HELP_TEXT}>
            <span
              className={sectionStyles.infoIcon}
              aria-label="How to use the To Do column"
            >
              ⓘ
            </span>
          </Tooltip>
        )}
      </h1>

      <ul className={sectionStyles.todoCardWrapper}>
        {todos.map((todo, index) => (
          <TodoCard
            key={todo.id}
            id={todo.id}
            name={todo.name}
            status={status}
            index={index}
          />
        ))}
      </ul>
    </li>
  );
};

export default TodoSection;
