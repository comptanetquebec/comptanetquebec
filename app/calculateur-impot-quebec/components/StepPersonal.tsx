import styles from "../page.module.css";

type StepPersonalProps = {
  maritalStatus: string;
  setMaritalStatus: (value: string) => void;
  childrenCount: string;
  setChildrenCount: (value: string) => void;
};

export default function StepPersonal({
  maritalStatus,
  setMaritalStatus,
  childrenCount,
  setChildrenCount,
}: StepPersonalProps) {
  return (
    <div className={styles.step}>
      <h2>Votre situation personnelle</h2>
      <p className={styles.stepText}>
        Ces informations servent à produire une estimation plus réaliste.
      </p>

      <div className={styles.grid}>
        <label>
          Année d’imposition
          <input type="text" value="2026" disabled />
        </label>

        <label>
          Province
          <input type="text" value="Québec" disabled />
        </label>

        <label>
          État civil
          <select
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
          >
            <option value="single">Célibataire</option>
            <option value="couple">Conjoint(e)</option>
            <option value="separated">Séparé(e)</option>
            <option value="widowed">Veuf / veuve</option>
          </select>
        </label>

        <label>
          Nombre d’enfants
          <input
            type="number"
            min="0"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
            placeholder="Ex. 0"
          />
        </label>
      </div>
    </div>
  );
}
