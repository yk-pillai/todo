import styles from "./page.module.css";
import { TodoProvider } from "@/contexts/TodoContext";
import TodoBoardClient from "@/components/TodoBoardClient";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* TodoProvider is a client component, that's fine */}
      <TodoProvider>
        <TodoBoardClient />
      </TodoProvider>
    </div>
  );
}
