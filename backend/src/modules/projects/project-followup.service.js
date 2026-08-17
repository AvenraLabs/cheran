import GovernmentProjectFollowup from "./project-followup.model.js";
import GovernmentProject from "./project.model.js";
import AppError from "../../shared/appError.js";

export async function createFollowup(projectId, { followup_date, remarks, next_action_date, status, created_by }) {
  const project = await GovernmentProject.findByPk(projectId);
  if (!project) {
    throw new AppError(`Project not found with ID ${projectId}`, 404);
  }

  if (!remarks || !remarks.trim()) {
    throw new AppError("Followup remarks are required", 400);
  }

  return await GovernmentProjectFollowup.create({
    project_id: projectId,
    followup_date: followup_date || new Date().toISOString().split("T")[0],
    remarks: remarks.trim(),
    next_action_date: next_action_date || null,
    status: status || "OPEN",
    created_by: created_by ? created_by.trim() : null,
  });
}

export async function listProjectFollowups(projectId) {
  return await GovernmentProjectFollowup.findAll({
    where: { project_id: projectId },
    order: [["followup_date", "DESC"], ["created_at", "DESC"]],
  });
}

export async function updateFollowup(id, { remarks, next_action_date, status }) {
  const followup = await GovernmentProjectFollowup.findByPk(id);
  if (!followup) {
    throw new AppError(`Followup not found with ID ${id}`, 404);
  }

  const updates = {};
  if (remarks !== undefined) updates.remarks = remarks.trim();
  if (next_action_date !== undefined) updates.next_action_date = next_action_date;
  if (status !== undefined) updates.status = status;

  await followup.update(updates);
  return followup;
}
