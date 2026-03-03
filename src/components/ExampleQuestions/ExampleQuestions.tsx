import { CheckCircle2 } from 'lucide-react';

import styles from './ExampleQuestions.module.scss';

interface ExampleQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const VERIFIED_QUERIES = [
  {
    question:
      'What are the most common categories of agent insights, and which partners receive the most high-priority recommendations?',
  },
  {
    question:
      'Show me the partners with the highest AUM growth percentage and their tier levels.',
  },
  {
    question:
      "What's the average retention rate by partner tier, and how does it relate to revenue contribution?",
  },
  {
    question:
      'Compare forecasted vs actual AUM values for the last 6 months of 2024.',
  },
];

const ExampleQuestions = ({ onSelectQuestion }: ExampleQuestionsProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <CheckCircle2 className={styles.checkIcon} />
        <h3 className={styles.title}>Verified questions (queries)</h3>
      </div>
      <div className={styles.grid}>
        {VERIFIED_QUERIES.map((example, index) => (
          <button
            key={index}
            className={styles.card}
            onClick={() => onSelectQuestion(example.question)}
          >
            <p className={styles.question}>{example.question}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleQuestions;
