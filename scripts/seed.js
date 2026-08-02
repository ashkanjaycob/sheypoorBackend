require("dotenv").config();

const { connectDB } = require("../src/config/database.config");
const { syncModels } = require("../src/models");
const categoryService = require("../src/modules/category/category.service");
const optionService = require("../src/modules/option/option.service");

const TREE = [
  {
    name: "املاک",
    slug: "real-estate",
    icon: "home",
    children: [
      { name: "فروش مسکونی", slug: "residential-sell", icon: "building" },
      { name: "اجاره مسکونی", slug: "residential-rent", icon: "key" },
    ],
  },
  {
    name: "وسایل نقلیه",
    slug: "vehicles",
    icon: "car",
    children: [
      { name: "خودرو سواری", slug: "cars", icon: "car-side" },
      { name: "موتورسیکلت", slug: "motorcycles", icon: "motorcycle" },
    ],
  },
];

const OPTIONS = [
  {
    categorySlug: "cars",
    title: "کارکرد",
    key: "mileage",
    type: "number",
    required: true,
  },
  {
    categorySlug: "cars",
    title: "رنگ",
    key: "color",
    type: "string",
    enum: "سفید,مشکی,نقره‌ای",
    required: false,
  },
  {
    categorySlug: "residential-sell",
    title: "متراژ",
    key: "area",
    type: "number",
    required: true,
  },
];

async function seed() {
  await connectDB();
  await syncModels();

  const created = new Map();

  for (const node of TREE) {
    try {
      const parent = await categoryService.create({
        name: node.name,
        slug: node.slug,
        icon: node.icon,
      });
      created.set(node.slug, parent.id);
      console.log(`+ category: ${node.slug}`);

      for (const child of node.children ?? []) {
        const sub = await categoryService.create({
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          parent: parent.id,
        });
        created.set(child.slug, sub.id);
        console.log(`  + child: ${child.slug}`);
      }
    } catch (error) {
      console.log(`= skipped ${node.slug}: ${error.message}`);
    }
  }

  for (const option of OPTIONS) {
    try {
      const categoryId = created.get(option.categorySlug);
      if (!categoryId) {
        console.log(`= skipped option ${option.key}: category not created`);
        continue;
      }
      await optionService.create({ ...option, category: categoryId });
      console.log(`+ option: ${option.key}`);
    } catch (error) {
      console.log(`= skipped option ${option.key}: ${error.message}`);
    }
  }

  console.log("✅ seed done.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ seed failed:", error);
  process.exit(1);
});
