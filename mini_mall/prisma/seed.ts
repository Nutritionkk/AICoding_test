import { PrismaClient, type Product } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * 幂等种子数据：按外键依赖顺序清空后重建。
 * 运行方式：npx prisma db seed（package.json 中配置 prisma.seed）
 */

/** 生成订单号：MM-YYYYMMDD-XXXXXX 格式 */
function makeOrderNo(date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `MM-${y}${m}${d}-${String(seq).padStart(6, "0")}`;
}

/** 直接插入一笔已支付订单（含明细快照，不扣库存——演示数据） */
async function createPaidOrder(
  userId: number,
  paidAt: Date,
  seq: number,
  items: { product: Product; quantity: number }[]
) {
  const originalAmount = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  await prisma.order.create({
    data: {
      orderNo: makeOrderNo(paidAt, seq),
      userId,
      status: "PAID",
      originalAmount,
      discountRate: 1,
      totalAmount: originalAmount,
      receiverName: "演示用户",
      receiverPhone: "13800000000",
      receiverAddress: "北京市海淀区演示路 1 号",
      paidAt,
      items: {
        create: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
          imageUrl: it.product.imageUrl,
        })),
      },
    },
  });
}

async function main() {
  // 生产保护：seed 无条件清空全部数据，禁止在生产环境执行
  if (process.env.NODE_ENV === "production") {
    console.error("seed 脚本会清空全部数据，仅限本地开发环境执行");
    process.exit(1);
  }
  console.log("清空旧数据...");
  // 依赖顺序：OrderItem → Order → CartItem → Product → Category → User
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  // 重置 SQLite 自增序列，保证复跑后 id 稳定（否则 id 会持续增长）
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence");

  console.log("创建账号...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@minimall.com",
      name: "管理员",
      passwordHash: bcrypt.hashSync("Admin123456", 12),
      role: "ADMIN",
    },
  });
  const demo = await prisma.user.create({
    data: {
      email: "demo@minimall.com",
      name: "演示用户",
      passwordHash: bcrypt.hashSync("Demo123456", 12),
      role: "USER",
    },
  });

  console.log("创建分类...");
  await prisma.category.createMany({
    data: [
      { name: "手机数码" },
      { name: "服饰鞋包" },
      { name: "家用电器" },
      { name: "食品饮料" },
    ],
  });
  const cats = await prisma.category.findMany();

  console.log("创建商品...");
  const productSeeds: {
    name: string;
    description: string;
    price: number; // 分
    stock: number;
    categoryId: number;
  }[] = [
    // 手机数码（3 个）
    { name: "无线蓝牙耳机 Pro", description: "主动降噪，30 小时续航，佩戴舒适的入耳式蓝牙耳机。", price: 12900, stock: 100, categoryId: cats[0].id },
    { name: "智能手表 S3", description: "血氧心率监测，50 米防水，两周续航的运动智能手表。", price: 39900, stock: 80, categoryId: cats[0].id },
    { name: "轻薄游戏本 X15", description: "旗舰独显，2.5K 高刷屏，畅玩 3A 大作的高性能游戏本。", price: 1299900, stock: 20, categoryId: cats[0].id },
    // 服饰鞋包（3 个）
    { name: "纯棉连帽卫衣", description: "300g 重磅纯棉，宽松落肩版型，秋冬百搭基础款。", price: 9900, stock: 200, categoryId: cats[1].id },
    { name: "直筒牛仔裤", description: "高腰直筒剪裁，弹力面料，显瘦耐穿。", price: 15900, stock: 150, categoryId: cats[1].id },
    { name: "轻便跑步鞋", description: "回弹中底，透气网面，日常通勤与慢跑皆宜。", price: 26900, stock: 120, categoryId: cats[1].id },
    // 家用电器（3 个）
    { name: "智能电饭煲", description: "IH 电磁加热，24 小时预约，4L 大容量。", price: 19900, stock: 60, categoryId: cats[2].id },
    { name: "空气炸锅 5L", description: "无油低脂，360 度热风循环，一键菜单。", price: 29900, stock: 90, categoryId: cats[2].id },
    { name: "无线吸尘器", description: "轻量机身，强劲吸力，40 分钟续航。", price: 89900, stock: 40, categoryId: cats[2].id },
    // 食品饮料（3 个）
    { name: "每日坚果礼盒", description: "30 袋独立包装，七种坚果果干科学配比。", price: 8900, stock: 300, categoryId: cats[3].id },
    { name: "精品咖啡豆", description: "中度烘焙阿拉比卡，500g 装，风味均衡。", price: 6900, stock: 250, categoryId: cats[3].id },
    { name: "香辣小零食", description: "怀旧辣条 20 小包，追剧解馋必备。", price: 990, stock: 500, categoryId: cats[3].id },
  ];
  await prisma.product.createMany({
    data: productSeeds.map((p, i) => ({
      ...p,
      imageUrl: `https://picsum.photos/seed/mm-${i + 1}/600/600`,
    })),
  });
  const products = await prisma.product.findMany();

  console.log("创建演示历史订单（已支付，不扣库存）...");
  // 演示用户两笔历史订单，金额计入会员累计消费
  await createPaidOrder(demo.id, new Date("2026-11-10T10:00:00"), 1, [
    { product: products[0], quantity: 1 },
    { product: products[7], quantity: 1 },
  ]);
  await createPaidOrder(demo.id, new Date("2026-11-20T15:30:00"), 2, [
    { product: products[10], quantity: 2 },
  ]);

  console.log(
    `种子数据完成：用户 2（${admin.email} / ${demo.email}），分类 ${cats.length}，商品 ${products.length}，订单 2`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
