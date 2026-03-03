import { Database } from 'lucide-react';
import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';
import styles from './ConfigStatus.module.scss';

const ConfigStatus = () => {
  const { config } = useSelector((state: RootState) => state.chat);

  if (!config) return null;

  return (
    <div className={styles.container}>
      <Database className={styles.icon} />
      <div className={styles.details}>
        <span className={styles.label}>Connected:</span>
        <span className={styles.value}>
          {config.snowflake_database}.{config.snowflake_schema}
        </span>
        <span className={styles.separator}>•</span>
        <span className={styles.label}>Role:</span>
        <span className={styles.value}>{config.snowflake_role}</span>
        <span className={styles.separator}>•</span>
        <span className={styles.label}>Warehouse:</span>
        <span className={styles.value}>{config.snowflake_warehouse}</span>
        <span className={styles.separator}>•</span>
        <span className={styles.label}>View:</span>
        <span className={styles.value}>{config.snowflake_view}</span>
      </div>
    </div>
  );
};

export default ConfigStatus;
