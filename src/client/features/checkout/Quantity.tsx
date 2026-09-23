import { Minus, Plus } from 'lucide-react';
import { MAX_ITEM_QUANTITY } from '../../../shared/contracts.js';

export function Quantity({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="quantity">
      <button aria-label={'Remove one ' + name} onClick={() => onChange(-1)}>
        <Minus size={15} />
      </button>
      <span aria-label={name + ' quantity'}>{quantity}</span>
      <button
        aria-label={'Add one ' + name}
        disabled={quantity >= MAX_ITEM_QUANTITY}
        onClick={() => onChange(1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
