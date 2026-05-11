import prisma from "../db/prisma.js";

const mapProductAvailability = (product) => {
  const inventoryItems = product.inventoryItems || [];

  const availableBranches = inventoryItems
    .filter((item) => item.branch && item.branch.isActive !== false && Number(item.quantity || 0) > 0)
    .map((item) => ({
      branchId: item.branch.id,
      code: item.branch.code,
      name: item.branch.name,
      address: item.branch.address,
      phone: item.branch.phone,
      available: true,
    }));

  const { inventoryItems: _inventoryItems, ...safeProduct } = product;

  return {
    ...safeProduct,
    availableBranches,
    availableBranchCount: availableBranches.length,
  };
};

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

    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    if (q) {
      const s = String(q);

      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { sku: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
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
        imageUrl: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        inventoryItems: {
          select: {
            quantity: true,
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                phone: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const data = products.map(mapProductAvailability);

    res.json({ success: true, message: "Public products fetched", data });
  } catch (e) {
    next(e);
  }
};

export const publicProductById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        sku: true,
        name: true,
        description: true,
        unit: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        createdAt: true,
        inventoryItems: {
          select: {
            quantity: true,
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                phone: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const data = mapProductAvailability(product);

    res.json({ success: true, message: "Public product fetched", data });
  } catch (e) {
    next(e);
  }
};