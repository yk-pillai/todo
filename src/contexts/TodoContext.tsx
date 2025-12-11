"use client";

import { TODO_STATUS, Todo, TodoStatus } from "@/types/Todo.type";
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const STORAGE_KEY = "todo-board:list:v1";

const initialList: Todo[] = [
  {
    id: crypto.randomUUID(),
    name: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: TODO_STATUS.TODO,
  },
];

type TodoContextType = {
  list: Todo[];
  addTodo: (name: Todo["name"]) => void;
  deleteTodo: (id: Todo["id"]) => void;
  changeTodoStatus: (id: Todo["id"], status: TodoStatus) => void;
  editTodoName: (id: Todo["id"], name: Todo["name"]) => void;
  moveTodo: (id: Todo["id"], toStatus: TodoStatus, toIndex: number) => void;
};

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Todo[]>(initialList);

  // 🔹 Load from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Todo[];
        if (Array.isArray(parsed)) {
          setList(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load todos from localStorage", err);
    }
  }, []);

  // 🔹 Save to localStorage whenever list changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Failed to save todos to localStorage", err);
    }
  }, [list]);

  const addTodo = (name: Todo["name"]) => {
    const time = Date.now();
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      name,
      createdAt: time,
      updatedAt: time,
      status: TODO_STATUS.TODO,
    };
    setList((prevList) => [...prevList, newTodo]);
  };

  const editTodoName = (id: Todo["id"], name: Todo["name"]) => {
    setList((prevList) =>
      prevList.map((todo) =>
        todo.id === id ? { ...todo, name, updatedAt: Date.now() } : todo
      )
    );
  };

  const deleteTodo = (id: Todo["id"]) => {
    setList((prevList) => prevList.filter((todo) => todo.id !== id));
  };

  const changeTodoStatus = (id: Todo["id"], status: TodoStatus) => {
    setList((prevList) =>
      prevList.map((todo) =>
        todo.id === id ? { ...todo, status, updatedAt: Date.now() } : todo
      )
    );
  };

  // reorder by status + index (priority) – used by DnD
  const moveTodo = (id: Todo["id"], toStatus: TodoStatus, toIndex: number) => {
    setList((prev) => {
      const todoToMove = prev.find((t) => t.id === id);
      if (!todoToMove) return prev;

      const without = prev.filter((t) => t.id !== id);
      const updated: Todo = {
        ...todoToMove,
        status: toStatus,
        updatedAt: Date.now(),
      };

      const result: Todo[] = [];
      let inserted = false;
      let seenInStatus = 0;

      for (const todo of without) {
        if (!inserted && todo.status === toStatus && seenInStatus === toIndex) {
          result.push(updated);
          inserted = true;
        }

        result.push(todo);

        if (todo.status === toStatus) {
          seenInStatus++;
        }
      }

      if (!inserted) {
        result.push(updated); // drop at end
      }

      return result;
    });
  };

  return (
    <TodoContext.Provider
      value={{
        list,
        addTodo,
        deleteTodo,
        changeTodoStatus,
        editTodoName,
        moveTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodo must be used within TodoProvider");
  }
  return context;
};
