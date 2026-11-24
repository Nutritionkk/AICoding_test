import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_TRANSITIONS,
  checkoutSchema,
  categorySchema,
  isValidTransition,
  loginSchema,
  productSchema,
  registerSchema,
} from "../validations";

const validRegister = {
  name: "张三",
  email: "zhangsan@example.com",
  password: "pass1234",
  confirmPassword: "pass1234",
};

describe("registerSchema（注册表单）", () => {
  it("合法输入校验通过", () => {
    const result = registerSchema.safeParse(validRegister);
    assert.equal(result.success, true);
  });

  it("邮箱格式错误被拒绝", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      email: "not-an-email",
    });
    assert.equal(result.success, false);
  });

  it("密码少于 8 位被拒绝", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "short1",
      confirmPassword: "short1",
    });
    assert.equal(result.success, false);
  });

  it("两次密码不一致时错误挂在 confirmPassword 字段上", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: "different123",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      assert.ok(issues.includes("confirmPassword"));
    }
  });
});

describe("loginSchema（登录表单）", () => {
  it("合法输入校验通过", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anything",
    });
    assert.equal(result.success, true);
  });

  it("空邮箱被拒绝", () => {
    const result = loginSchema.safeParse({ email: "", password: "x" });
    assert.equal(result.success, false);
  });

  it("空密码被拒绝", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    assert.equal(result.success, false);
  });
});

describe("checkoutSchema（收货信息表单）", () => {
  const valid = {
    receiverName: "李四",
    receiverPhone: "13812345678",
    receiverAddress: "北京市朝阳区某街道 1 号",
  };

  it("合法输入校验通过", () => {
    const result = checkoutSchema.safeParse(valid);
    assert.equal(result.success, true);
  });

  it("备注可选且可省略", () => {
    const result = checkoutSchema.safeParse({ ...valid, note: "请放门口" });
    assert.equal(result.success, true);
  });

  it("手机号以 2 开头被拒绝", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      receiverPhone: "23812345678",
    });
    assert.equal(result.success, false);
  });

  it("手机号位数不足被拒绝", () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      receiverPhone: "1381234567",
    });
    assert.equal(result.success, false);
  });

  it("地址少于 5 个字符被拒绝", () => {
    const result = checkoutSchema.safeParse({ ...valid, receiverAddress: "很短" });
    assert.equal(result.success, false);
  });

  it("备注超过 200 字被拒绝", () => {
    const result = checkoutSchema.safeParse({ ...valid, note: "字".repeat(201) });
    assert.equal(result.success, false);
  });
});

describe("productSchema（后台商品表单）", () => {
  const valid = {
    name: "无线鼠标",
    description: "一款好用的无线鼠标",
    price: "19.9",
    stock: "10",
    imageUrl: "https://picsum.photos/seed/mm-1/600/600",
    categoryId: "1",
    isActive: "on",
  };

  it("合法输入校验通过，isActive 转为布尔值", () => {
    const result = productSchema.safeParse(valid);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.isActive, true);
      assert.equal(result.data.stock, 10);
    }
  });

  it("isActive=off 转为 false", () => {
    const result = productSchema.safeParse({ ...valid, isActive: "off" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.isActive, false);
    }
  });

  it("价格不是数字被拒绝", () => {
    const result = productSchema.safeParse({ ...valid, price: "abc" });
    assert.equal(result.success, false);
  });

  it("负价格被拒绝", () => {
    const result = productSchema.safeParse({ ...valid, price: "-1" });
    assert.equal(result.success, false);
  });

  it("负数库存被拒绝", () => {
    const result = productSchema.safeParse({ ...valid, stock: "-5" });
    assert.equal(result.success, false);
  });

  it("小数库存被拒绝", () => {
    const result = productSchema.safeParse({ ...valid, stock: "3.5" });
    assert.equal(result.success, false);
  });

  it("非 http(s) 图片地址被拒绝", () => {
    const result = productSchema.safeParse({
      ...valid,
      imageUrl: "ftp://example.com/a.jpg",
    });
    assert.equal(result.success, false);
  });

  it("分类 id 必须为正整数", () => {
    const result = productSchema.safeParse({ ...valid, categoryId: "0" });
    assert.equal(result.success, false);
  });
});

describe("categorySchema（分类表单）", () => {
  it("合法输入校验通过", () => {
    assert.equal(categorySchema.safeParse({ name: "手机数码" }).success, true);
  });

  it("空名称被拒绝", () => {
    assert.equal(categorySchema.safeParse({ name: "  " }).success, false);
  });

  it("超过 30 字被拒绝", () => {
    assert.equal(categorySchema.safeParse({ name: "类".repeat(31) }).success, false);
  });
});

describe("ORDER_TRANSITIONS（订单状态流转白名单）", () => {
  it("待支付可支付、可取消", () => {
    assert.equal(isValidTransition("PENDING", "PAID"), true);
    assert.equal(isValidTransition("PENDING", "CANCELLED"), true);
  });

  it("待支付不可直接发货", () => {
    assert.equal(isValidTransition("PENDING", "SHIPPED"), false);
  });

  it("已支付可发货、可退款取消", () => {
    assert.equal(isValidTransition("PAID", "SHIPPED"), true);
    assert.equal(isValidTransition("PAID", "CANCELLED"), true);
  });

  it("已发货可确认完成", () => {
    assert.equal(isValidTransition("SHIPPED", "COMPLETED"), true);
  });

  it("终态不可再流转", () => {
    assert.deepEqual(ORDER_TRANSITIONS.COMPLETED, []);
    assert.deepEqual(ORDER_TRANSITIONS.CANCELLED, []);
    assert.equal(isValidTransition("COMPLETED", "SHIPPED"), false);
    assert.equal(isValidTransition("CANCELLED", "PAID"), false);
  });

  it("未知目标状态安全返回 false", () => {
    assert.equal(isValidTransition("PENDING", "UNKNOWN" as never), false);
  });
});
