"use client";

import dynamic from "next/dynamic";

const TodoBoard = dynamic(() => import("@/components/TodoBoard"), {
  ssr: false,
});

export default function TodoBoardClient() {
  return <TodoBoard />;
}
