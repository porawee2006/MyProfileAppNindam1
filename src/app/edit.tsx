// ===================================================
// ✏️ หน้าแก้ไขข้อมูลสินค้า (edit.tsx)
// ===================================================
// หน้านี้ดึงฟอร์มการทำงานมาจากหน้า add.tsx มาใช้ซ้ำ
// โดยส่งข้อมูลสินค้าเดิม (product) เข้าไป เพื่อให้ฟอร์มแปลงร่างเป็นโหมดแก้ไขครับ! 😊

import React from 'react';
import AddProductScreen, { EditableProduct } from './add';

export type EditProductScreenProps = {
  product: EditableProduct;
  existingCategories?: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function EditProductScreen({
  product,
  existingCategories = [],
  onSuccess,
  onCancel,
}: EditProductScreenProps) {
  return (
    <AddProductScreen
      product={product}
      existingCategories={existingCategories}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
