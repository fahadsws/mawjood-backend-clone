import { Request, Response } from "express";
import prisma from "../config/database";
import { sendError, sendSuccess } from "../utils/response.util";
import { emailService } from "../services/email.service";
import { uploadToCloudinary } from "../config/cloudinary";

const prismaClient = prisma as any;
const adminEmail = () => process.env.CONTACT_EMAIL || "m.41usaid@gmail.com";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const normalizeEmploymentType = (
  value: unknown,
): "PART_TIME" | "FULL_TIME" | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/[\s-]+/g, "_");
  return normalized === "PART_TIME" || normalized === "FULL_TIME"
    ? normalized
    : undefined;
};

export const getActiveCareerOpenings = async (_req: Request, res: Response) => {
  try {
    const openings = await prismaClient.careerOpening.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(
      res,
      200,
      "Career openings fetched successfully",
      openings,
    );
  } catch (error) {
    console.error("Get careers error:", error);
    return sendError(res, 500, "Failed to fetch career openings", error);
  }
};

export const getAllCareerOpenings = async (_req: Request, res: Response) => {
  try {
    const openings = await prismaClient.careerOpening.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(
      res,
      200,
      "Career openings fetched successfully",
      openings,
    );
  } catch (error) {
    console.error("Get admin careers error:", error);
    return sendError(res, 500, "Failed to fetch career openings", error);
  }
};

export const createCareerOpening = async (req: Request, res: Response) => {
  try {
    const { title, slug, description, requirements, employmentType, isActive } =
      req.body;
    const normalizedEmploymentType = normalizeEmploymentType(employmentType);
    if (!title || !description || !normalizedEmploymentType)
      return sendError(
        res,
        400,
        "Title, description, and employmentType (PART_TIME or FULL_TIME) are required",
      );
    const opening = await prismaClient.careerOpening.create({
      data: {
        title: title.trim(),
        slug: slugify(slug || title),
        description,
        requirements: requirements || null,
        employmentType: normalizedEmploymentType,
        isActive:
          isActive === undefined
            ? true
            : isActive === true || isActive === "true",
      },
    });
    return sendSuccess(
      res,
      201,
      "Career opening created successfully",
      opening,
    );
  } catch (error) {
    console.error("Create career error:", error);
    return sendError(res, 500, "Failed to create career opening", error);
  }
};

export const updateCareerOpening = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prismaClient.careerOpening.findUnique({
      where: { id },
    });
    if (!existing) return sendError(res, 404, "Career opening not found");
    const { title, slug, description, requirements, employmentType, isActive } =
      req.body;
    const normalizedEmploymentType =
      employmentType === undefined
        ? undefined
        : normalizeEmploymentType(employmentType);
    if (employmentType !== undefined && !normalizedEmploymentType)
      return sendError(
        res,
        400,
        "employmentType must be PART_TIME or FULL_TIME",
      );
    const opening = await prismaClient.careerOpening.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(slug !== undefined && { slug: slugify(slug) }),
        ...(description !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(normalizedEmploymentType !== undefined && {
          employmentType: normalizedEmploymentType,
        }),
        ...(isActive !== undefined && {
          isActive: isActive === true || isActive === "true",
        }),
      },
    });
    return sendSuccess(
      res,
      200,
      "Career opening updated successfully",
      opening,
    );
  } catch (error) {
    console.error("Update career error:", error);
    return sendError(res, 500, "Failed to update career opening", error);
  }
};

export const deleteCareerOpening = async (req: Request, res: Response) => {
  try {
    await prismaClient.careerOpening.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, "Career opening deleted successfully");
  } catch (error) {
    console.error("Delete career error:", error);
    return sendError(res, 500, "Failed to delete career opening", error);
  }
};

export const getCareerApplications = async (_req: Request, res: Response) => {
  try {
    const applications = await prismaClient.careerApplication.findMany({
      include: {
        careerOpening: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(
      res,
      200,
      "Career applications fetched successfully",
      applications,
    );
  } catch (error) {
    console.error("Get career applications error:", error);
    return sendError(res, 500, "Failed to fetch career applications", error);
  }
};

export const submitCareerApplication = async (req: Request, res: Response) => {
  try {
    const { careerOpeningId, name, email, phone, coverLetter } = req.body;
    if (!careerOpeningId || !name || !email)
      return sendError(
        res,
        400,
        "Career opening, name, and email are required",
      );
    if (!req.file) return sendError(res, 400, "Resume file is required");
    const opening = await prismaClient.careerOpening.findFirst({
      where: { id: careerOpeningId, isActive: true },
    });
    if (!opening)
      return sendError(res, 404, "Career opening not found or inactive");
    const resumeUrl = await uploadToCloudinary(
      req.file,
      "mawjood/careers/resumes",
    );
    const application = await prismaClient.careerApplication.create({
      data: {
        careerOpeningId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        resumeUrl,
        coverLetter: coverLetter || null,
      },
    });
    try {
      await emailService.sendEmail({
        to: adminEmail(),
        subject: `New Career Application: ${opening.title}`,
        html: `<h2>New Career Application</h2><p><strong>Position:</strong> ${opening.title}</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || "Not provided"}</p><p><strong>Resume:</strong> <a href="${resumeUrl}">View resume</a></p><p><strong>Cover letter:</strong><br/>${coverLetter || "Not provided"}</p>`,
      });
    } catch (emailError) {
      console.error("Career application email error:", emailError);
    }
    return sendSuccess(
      res,
      201,
      "Career application submitted successfully",
      application,
    );
  } catch (error) {
    console.error("Submit career application error:", error);
    return sendError(res, 500, "Failed to submit career application", error);
  }
};
