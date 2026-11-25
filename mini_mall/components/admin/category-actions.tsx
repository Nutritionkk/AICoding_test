"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/admin-category";

/** 新建分类表单（内联） */
export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, {
    success: false,
  });

  return (
    <form action={formAction} className="flex gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <Input name="name" placeholder="新分类名称（最多 30 字）" />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "创建中..." : "创建"}
      </Button>
    </form>
  );
}

/** 编辑分类弹窗表单 */
export function EditCategoryButton({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const action = updateCategory.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(action, {
    success: false,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          编辑
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
          <DialogDescription>修改分类名称</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`cat-${categoryId}`}>分类名称</Label>
            <Input id={`cat-${categoryId}`} name="name" defaultValue={categoryName} />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** 删除分类按钮（有商品的分类会被后端拦截） */
export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        toast.success("分类已删除");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除「{categoryName}」？</AlertDialogTitle>
          <AlertDialogDescription>
            仅空分类可删除；分类下仍有商品时会被拒绝。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">取消</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? "删除中..." : "确认删除"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
