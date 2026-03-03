import { useEffect, useState } from 'react';

import styles from './TypingIndicator.module.scss';

const PROGRESS_STEPS = [
  { text: 'Analyzing your question', duration: 1500 },
  { text: 'Generating SQL query', duration: 2000 },
  { text: 'Executing query', duration: 1500 },
  { text: 'Preparing results', duration: 0 }, // Last step stays until done
];

const TypingIndicator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset when component mounts
    setCurrentStep(0);
    setProgress(0);

    const stepDuration = PROGRESS_STEPS[0].duration;
    const progressInterval = 50; // Update every 50ms for smooth animation
    const progressIncrement = (100 / stepDuration) * progressInterval;

    let currentStepTimer: NodeJS.Timeout | null = null;

    const updateProgress = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return Math.min(prev + progressIncrement, 100);
      });
    };

    const moveToNextStep = () => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep < PROGRESS_STEPS.length) {
          setProgress(0);
          const nextDuration = PROGRESS_STEPS[nextStep].duration;

          if (nextDuration > 0) {
            // Schedule next step transition
            currentStepTimer = setTimeout(() => moveToNextStep(), nextDuration);
          }

          return nextStep;
        }
        return prev;
      });
    };

    // Start progress animation
    const progressTimer = setInterval(updateProgress, progressInterval);

    // Schedule first step transition
    if (PROGRESS_STEPS[0].duration > 0) {
      currentStepTimer = setTimeout(
        () => moveToNextStep(),
        PROGRESS_STEPS[0].duration,
      );
    }

    return () => {
      clearInterval(progressTimer);
      if (currentStepTimer) {
        clearTimeout(currentStepTimer);
      }
    };
  }, []);

  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingContent}>
        <div className={styles.progressContainer}>
          <div className={styles.stepInfo}>
            <span className={styles.typingText}>
              {PROGRESS_STEPS[currentStep].text}
            </span>
            <span className={styles.stepCounter}>
              Step {currentStep + 1}/{PROGRESS_STEPS.length}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${currentStep === PROGRESS_STEPS.length - 1 ? 100 : progress}%`,
              }}
            />
          </div>
        </div>
        <div className={styles.typingDots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
