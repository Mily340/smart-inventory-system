import prisma from "../db/prisma.js";

export const publicCategories = async (_req, res, next) => {
  try {
    const data = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    });
    res.json({ success: true, message: "Public categories fetched", data });
  } catch (e) {
    next(e);
  }
};

export const publicProducts = async (req, res, next) => {
  try {
    const { q, categoryId } = req.query;

    const where = {};
    if (categoryId) where.categoryId = String(categoryId);

    if (q) {
      const s = String(q);
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { sku: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    const data = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        sku: true,
        name: true,
        description: true,
        unit: true,
        price: true,
        imageUrl: true, // ✅ add this
        categoryId: true,
        category: { select: { id: true, code: true, name: true } },
      },
    });

    res.json({ success: true, message: "Public products fetched", data });
  } catch (e) {
    next(e);
  }
};

export const publicProductById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const data = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        sku: true,
        name: true,
        description: true,
        unit: true,
        price: true,
        imageUrl: true, // ✅ add this
        categoryId: true,
        category: { select: { id: true, code: true, name: true } },
        createdAt: true,
      },
    });

    if (!data) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Public product fetched", data });
  } catch (e) {
    next(e);
  }
};