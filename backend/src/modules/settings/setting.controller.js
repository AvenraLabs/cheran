import asyncHandler from "../../shared/asyncHandler.js";
import * as settingService from "./setting.service.js";

export const listSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.listSettings();
  res.status(200).json({
    status: "success",
    data: { settings },
  });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const setting = await settingService.updateSetting(
    req.params.key,
    req.body.value,
    req.body.description
  );
  res.status(200).json({
    status: "success",
    data: { setting },
  });
});
