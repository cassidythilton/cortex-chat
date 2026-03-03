import { CheckCircle2, Database, FileCode2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import styles from './ProcessAnimation.module.scss';

interface ProcessAnimationProps {
  isVisible: boolean;
  database?: string;
  schema?: string;
  onComplete?: () => void;
}

interface ProcessStep {
  id: string;
  label: string;
  detail?: string;
  icon: React.ReactNode;
  duration: number;
}

export const ProcessAnimation: React.FC<ProcessAnimationProps> = ({
  isVisible,
  database,
  schema,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: ProcessStep[] = [
    {
      id: 'connecting',
      label: 'Connecting to Snowflake',
      detail: database ? `${database}${schema ? `.${schema}` : ''}` : undefined,
      icon: <Database className={styles.stepIcon} />,
      duration: 2000,
    },
    {
      id: 'analyzing',
      label: 'Analyzing with Cortex Analyst',
      detail: 'Natural language processing',
      icon: <FileCode2 className={styles.stepIcon} />,
      duration: 4500,
    },
    {
      id: 'generating',
      label: 'Generating SQL Query',
      detail: 'Optimizing for performance',
      icon: <FileCode2 className={styles.stepIcon} />,
      duration: 3500,
    },
    {
      id: 'executing',
      label: 'Executing Query',
      detail: 'Fetching results',
      icon: <Play className={styles.stepIcon} />,
      duration: 3800,
    },
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      return;
    }

    let timer: NodeJS.Timeout;
    let accumulatedTime = 0;

    const progressThroughSteps = () => {
      for (let i = 0; i < steps.length; i++) {
        accumulatedTime += steps[i].duration;

        setTimeout(() => {
          setCurrentStep(i);
        }, accumulatedTime - steps[i].duration);

        setTimeout(() => {
          setCompletedSteps((prev) => new Set([...prev, i]));

          if (i === steps.length - 1) {
            setTimeout(() => {
              onComplete?.();
            }, 400);
          }
        }, accumulatedTime);
      }
    };

    progressThroughSteps();

    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, database, schema, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.snowflakeLogo}>
            <svg viewBox="0 0 32 32" fill="currentColor">
              <path d="M16.8 4.1l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm-12.2 0l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm-12.2 0l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm-12.2 0l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4zm6.1 3.5l-2.4 1.4 2.4 1.4 2.4-1.4-2.4-1.4z" />
            </svg>
          </div>
          <h3>Processing Query</h3>
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`${styles.step} ${
                  isActive ? styles.active : ''
                } ${isCompleted ? styles.completed : ''} ${
                  isPending ? styles.pending : ''
                }`}
              >
                <div className={styles.stepIndicator}>
                  {isCompleted ? (
                    <CheckCircle2 className={styles.checkIcon} />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepLabel}>{step.label}</div>
                  {step.detail && (
                    <div className={styles.stepDetail}>{step.detail}</div>
                  )}
                </div>
                {isActive && (
                  <div className={styles.stepProgress}>
                    <div className={styles.progressBar} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.brandingText}>
            Powered by <span className={styles.highlight}>Cortex Analyst</span>
          </div>
        </div>
      </div>
    </div>
  );
};
