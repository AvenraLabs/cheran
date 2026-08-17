import asyncHandler from "../../shared/asyncHandler.js";
import * as authService from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({
    status: "success",
    data: { user },
  });
});
