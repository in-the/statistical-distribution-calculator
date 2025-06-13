import DistributionCalculator from "components/Calculator";
import { distributionSettings } from "math/distribution";
import { useState } from "react";

function DistributionSelect({ settings, setSettings }) {
  return (
    <div className="distribution-select">
      <label htmlFor="settings">Choose Distribution: </label>
      <select
        id="settings"
        name="settings"
        onChange={(e) => setSettings(e.target.value)}
        value={settings}
      >
        {Object.entries(distributionSettings).map(([distribution, setting], index) => (
          <option value={distribution} key={index}>
            {setting.title} Distribution
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Interactable() {
  const [settings, setSettings] = useState("binomial");

  return (
    <>
      <DistributionSelect settings={settings} setSettings={setSettings} />
      <DistributionCalculator settings={distributionSettings[settings]} />
    </>
  );
}
