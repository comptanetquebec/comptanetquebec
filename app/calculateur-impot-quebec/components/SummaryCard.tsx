import styles from "../page.module.css";

type SummaryCardProps = {
  title: string;
  value: string;
  highlight?: boolean;
};

export default function SummaryCard({
  title,
  value,
  highlight = false,
}: SummaryCardProps) {
  return (
    <div
      className={`${styles.summaryCard} ${
        highlight ? styles.summaryHighlight : ""
      }`}
    >
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
