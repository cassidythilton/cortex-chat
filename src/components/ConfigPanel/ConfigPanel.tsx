import { FormEvent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState, useAppDispatch } from '../../reducers';
import {
  addMessage,
  closeConfigPanel,
  saveConfiguration,
} from '../../reducers/chat/slice';
import { SnowflakeConfig } from '../../services/configService';
import styles from './ConfigPanel.module.scss';

const ConfigPanel = () => {
  const dispatch = useAppDispatch();
  const { config } = useSelector((state: RootState) => state.chat);

  const [formData, setFormData] = useState<SnowflakeConfig>({
    snowflake_database: '',
    snowflake_schema: '',
    snowflake_role: '',
    snowflake_warehouse: '',
    snowflake_view: '',
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    await dispatch(saveConfiguration(formData));
    dispatch(
      addMessage({
        sender: 'bot',
        content: 'Configuration saved successfully!',
      }),
    );
  };

  const handleClose = () => {
    dispatch(closeConfigPanel());
  };

  return (
    <div className={`${styles.configPanel} ${styles.show}`}>
      <div className={styles.configModal}>
        <div className={styles.configHeader}>
          <h2>Configuration</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>
        <div className={styles.configContent}>
          <form onSubmit={handleSubmit} className={styles.configForm}>
            <div className={styles.configSection}>
              <h3>Snowflake Configuration</h3>
              <div className={styles.formGroup}>
                <label htmlFor="snowflake_database">Database</label>
                <input
                  type="text"
                  id="snowflake_database"
                  name="snowflake_database"
                  placeholder="e.g., ANALYTICS"
                  value={formData.snowflake_database}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="snowflake_schema">Schema</label>
                <input
                  type="text"
                  id="snowflake_schema"
                  name="snowflake_schema"
                  placeholder="e.g., PUBLIC"
                  value={formData.snowflake_schema}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="snowflake_role">Role</label>
                <input
                  type="text"
                  id="snowflake_role"
                  name="snowflake_role"
                  placeholder="e.g., ANALYST_ROLE"
                  value={formData.snowflake_role}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="snowflake_warehouse">Warehouse</label>
                <input
                  type="text"
                  id="snowflake_warehouse"
                  name="snowflake_warehouse"
                  placeholder="e.g., COMPUTE_WH"
                  value={formData.snowflake_warehouse}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="snowflake_view">View</label>
                <input
                  type="text"
                  id="snowflake_view"
                  name="snowflake_view"
                  placeholder="e.g., CUSTOMER_ANALYTICS_VIEW"
                  value={formData.snowflake_view}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className={styles.configActions}>
              <button type="submit" className={styles.saveButton}>
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
