import GovernmentProjectDocument from "./project-document.model.js";
import GovernmentProject from "./project.model.js";
import AppError from "../../shared/appError.js";

export async function addProjectDocument(projectId, { document_name, document_type, file_path, file_size, mime_type, notes }) {
  const project = await GovernmentProject.findByPk(projectId);
  if (!project) {
    throw new AppError(`Project not found with ID ${projectId}`, 404);
  }

  return await GovernmentProjectDocument.create({
    project_id: projectId,
    document_name: document_name.trim(),
    document_type: document_type.trim(),
    file_path: file_path.trim(),
    file_size: file_size || null,
    mime_type: mime_type || null,
    notes: notes ? notes.trim() : null,
  });
}

export async function listProjectDocuments(projectId) {
  return await GovernmentProjectDocument.findAll({
    where: { project_id: projectId },
    order: [["uploaded_at", "DESC"]],
  });
}

export async function deleteProjectDocument(id) {
  const doc = await GovernmentProjectDocument.findByPk(id);
  if (!doc) {
    throw new AppError(`Document not found with ID ${id}`, 404);
  }
  await doc.destroy();
  return { message: "Document deleted successfully" };
}
