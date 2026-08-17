import BusinessSetting from "./business-setting.model.js";

/**
 * Get setting value with fallback default
 */
export async function getSettingValue(key, defaultValue = null) {
  const setting = await BusinessSetting.findByPk(key);
  if (!setting || setting.value === undefined || setting.value === null) {
    return defaultValue;
  }
  const val = setting.value;
  // If numeric parse as float
  if (!isNaN(val) && val.trim() !== "") {
    return parseFloat(val);
  }
  return val;
}

export async function listSettings() {
  return await BusinessSetting.findAll({
    order: [["key", "ASC"]],
  });
}

export async function updateSetting(key, value, description = null) {
  const [setting] = await BusinessSetting.findOrCreate({
    where: { key },
    defaults: { key, value: String(value), description },
  });

  const updates = { value: String(value) };
  if (description !== null) updates.description = description;

  await setting.update(updates);
  return setting;
}
