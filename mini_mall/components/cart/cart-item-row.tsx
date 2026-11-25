"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { removeCartItem, updateCartQuantity } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/utils";

type CartItemRowProps = {
  item: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      stock: number;
      imageUrl: string;
    };
  };
};

/** 购物车行（客户端组件：数量步进与删除） */
export function CartItemRow({ item }: CartItemRowProps) {
  const [pending, startTransition] = useTransition();

  const changeQuantity = (quantity: number) => {
    startTransition(async () => {
      await updateCartQuantity(item.id, quantity);
    });
  };

  const remove = () => {
    startTransition(async () => {
      await removeCartItem(item.id);
    });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Link
            href={`/products/${item.product.id}`}
            className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"
          >
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </Link>
          <div>
            <Link
              href={`/products/${item.product.id}`}
              className="line-clamp-1 text-sm font-medium hover:underline"
            >
              {item.product.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              单价 {formatPrice(item.product.price)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-36">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="减少数量"
            disabled={pending}
            onClick={() => changeQuantity(item.quantity - 1)}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="增加数量"
            disabled={pending || item.quantity >= item.product.stock}
            onClick={() => changeQuantity(item.quantity + 1)}
          >
            <Plus />
          </Button>
        </div>
      </TableCell>
      <TableCell className="w-28 text-right font-medium">
        {formatPrice(item.product.price * item.quantity)}
      </TableCell>
      <TableCell className="w-16 text-right">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="删除"
          disabled={pending}
          onClick={remove}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
