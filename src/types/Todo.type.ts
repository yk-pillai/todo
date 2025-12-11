export const TODO_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
} as const

export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS]

export type Todo = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: TodoStatus;
//   order: number;
};


