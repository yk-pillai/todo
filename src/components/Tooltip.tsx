"use client";

import { ReactNode } from "react";
import styles from "./Tooltip.module.css";

type TooltipProps = {
  content: string | ReactNode;
  children: ReactNode;
};

const Tooltip = ({ content, children }: TooltipProps) => {
  return (
    <span className={styles.wrapper}>
      {children}
      <span className={styles.tooltip} role="tooltip">
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
