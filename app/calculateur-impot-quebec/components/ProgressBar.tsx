import styles from "../page.module.css";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressHeader}>
        <span>
          Étape {currentStep} sur {totalSteps}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
