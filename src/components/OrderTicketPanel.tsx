import React, { useEffect, useState } from 'react';
import { Instrument } from '../types/market';
import { formatCurrency, formatInstrumentPrice, formatRawPrice } from '../utils/formatters';

interface OrderTicketPanelProps {
  instrument: Instrument;
  buyingPower: number;
  heldQuantity: number;
  initialSide?: 'buy' | 'sell';
  prefillLimitPrice?: number | null;
  onSubmitOrder: (payload: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    quantity: number;
    limitPrice?: number;
  }) => void;
  onClose?: () => void;
}

export const OrderTicketPanel: React.FC<OrderTicketPanelProps> = ({
  instrument,
  buyingPower,
  heldQuantity,
  initialSide = 'buy',
  prefillLimitPrice,
  onSubmitOrder,
  onClose,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantityStr, setQuantityStr] = useState<string>(
    instrument.price > 10000 ? '0.1' : instrument.price > 500 ? '2' : '10'
  );
  const [limitPriceStr, setLimitPriceStr] = useState<string>(
    instrument.price.toFixed(instrument.decimals)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  useEffect(() => {
    setLimitPriceStr(instrument.price.toFixed(instrument.decimals));
    setQuantityStr(instrument.price > 10000 ? '0.1' : instrument.price > 500 ? '2' : '10');
    setErrorMsg(null);
  }, [instrument.symbol]);

  useEffect(() => {
    if (prefillLimitPrice !== null && prefillLimitPrice !== undefined) {
      setOrderType('limit');
      setLimitPriceStr(prefillLimitPrice.toFixed(instrument.decimals));
    }
  }, [prefillLimitPrice, instrument.decimals]);

  const parsedQty = parseFloat(quantityStr) || 0;
  const parsedLimit = parseFloat(limitPriceStr) || instrument.price;
  const execPrice = orderType === 'market' ? instrument.price : parsedLimit;
  const estimatedTotal = parsedQty * execPrice;

  const applyPreset = (pct: number) => {
    setErrorMsg(null);
    if (side === 'buy') {
      const budget = buyingPower * pct;
      const rawQty = execPrice > 0 ? budget / execPrice : 0;
      const rounded =
        instrument.price > 1000 ? Number(rawQty.toFixed(4)) : Math.floor(rawQty);
      setQuantityStr(String(Math.max(0, rounded)));
    } else {
      const rawQty = heldQuantity * pct;
      const rounded =
        instrument.price > 1000 ? Number(rawQty.toFixed(4)) : Math.floor(rawQty * 100) / 100;
      setQuantityStr(String(Math.max(0, rounded)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) {
      setErrorMsg('Enter a quantity greater than zero.');
      return;
    }
    if (orderType === 'limit' && parsedLimit <= 0) {
      setErrorMsg('Enter a valid limit price.');
      return;
    }
    if (side === 'buy' && estimatedTotal > buyingPower) {
      setErrorMsg('Insufficient buying power for this order.');
      return;
    }
    if (side === 'sell' && parsedQty > heldQuantity) {
      setErrorMsg(`Available position to sell is ${heldQuantity} ${instrument.symbol}.`);
      return;
    }

    setErrorMsg(null);
    onSubmitOrder({
      symbol: instrument.symbol,
      side,
      type: orderType,
      quantity: parsedQty,
      limitPrice: orderType === 'limit' ? parsedLimit : undefined,
    });
    onClose?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1e222d] border border-[#2a2e39] rounded-[4px] p-3.5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-[#dfe2f2]">
            Order Ticket · {instrument.symbol}
          </h3>
          <p className="text-[12px] text-[#787b86] font-mono tabular-nums">
            Mark {formatInstrumentPrice(instrument)}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-[#787b86] hover:text-[#d1d4dc] px-2 py-1 rounded-[4px] border border-[#2a2e39] cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Buy / Sell Segmented Selector */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#131722] p-1 rounded-[4px] border border-[#2a2e39]">
        <button
          type="button"
          onClick={() => {
            setSide('buy');
            setErrorMsg(null);
          }}
          className={`h-9 rounded-[3px] text-[13px] font-semibold transition-colors cursor-pointer ${
            side === 'buy'
              ? 'bg-[#089981] text-white'
              : 'text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setSide('sell');
            setErrorMsg(null);
          }}
          className={`h-9 rounded-[3px] text-[13px] font-semibold transition-colors cursor-pointer ${
            side === 'sell'
              ? 'bg-[#f23645] text-white'
              : 'text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Market / Limit Order Type */}
      <div className="flex items-center gap-1 bg-[#171b26] p-0.5 rounded-[4px] border border-[#2a2e39]">
        {(['market', 'limit'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`relative flex-1 py-1.5 text-[12px] font-medium capitalize rounded-[3px] transition-colors cursor-pointer ${
              orderType === type
                ? 'bg-[#242835] text-[#d1d4dc]'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            {type} Order
            {orderType === type && (
              <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#2962ff]" />
            )}
          </button>
        ))}
      </div>

      {/* Quantity Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <label htmlFor={`qty-${instrument.symbol}`} className="text-[#787b86]">
            Quantity ({instrument.symbol})
          </label>
          <span className="font-mono tabular-nums text-[11px] text-[#787b86]">
            Held: {heldQuantity}
          </span>
        </div>
        <input
          id={`qty-${instrument.symbol}`}
          type="number"
          step="any"
          min="0"
          value={quantityStr}
          onChange={(e) => {
            setQuantityStr(e.target.value);
            setErrorMsg(null);
          }}
          className="w-full h-10 px-3 bg-[#131722] border border-[#2a2e39] rounded-[4px] font-mono tabular-nums text-[14px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
        />
        <div className="grid grid-cols-4 gap-1.5">
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => applyPreset(pct)}
              className="py-1 bg-[#171b26] hover:bg-[#242835] border border-[#2a2e39] rounded-[3px] font-mono text-[11px] text-[#787b86] hover:text-[#d1d4dc] transition-colors cursor-pointer"
            >
              {pct === 1 ? 'Max' : `${pct * 100}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Limit Price Input */}
      {orderType === 'limit' && (
        <div className="space-y-1.5">
          <label
            htmlFor={`limit-${instrument.symbol}`}
            className="block text-[12px] text-[#787b86]"
          >
            Limit Price
          </label>
          <input
            id={`limit-${instrument.symbol}`}
            type="number"
            step="any"
            min="0"
            value={limitPriceStr}
            onChange={(e) => {
              setLimitPriceStr(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full h-10 px-3 bg-[#131722] border border-[#2a2e39] rounded-[4px] font-mono tabular-nums text-[14px] text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
          />
        </div>
      )}

      {/* Order Summary Breakdown */}
      <div className="pt-2 border-t border-[#2a2e39] space-y-1.5 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-[#787b86]">Execution Price</span>
          <span className="font-mono tabular-nums text-[#d1d4dc]">
            {formatRawPrice(
              execPrice,
              instrument.decimals,
              instrument.unitPrefix ?? '',
              instrument.unitSuffix ?? ''
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#787b86]">Estimated Total</span>
          <span className="font-mono tabular-nums font-semibold text-[#dfe2f2]">
            {formatCurrency(estimatedTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#787b86]">Buying Power</span>
          <span className="font-mono tabular-nums text-[#d1d4dc]">
            {formatCurrency(buyingPower)}
          </span>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[12px] text-[#ffb4ab] bg-[#93000a]/30 border border-[#f23645]/40 rounded-[4px] px-2.5 py-1.5">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        className={`w-full h-10 rounded-[4px] text-[14px] font-semibold text-white transition-opacity active:opacity-85 cursor-pointer ${
          side === 'buy'
            ? 'bg-[#2962ff] hover:bg-[#1e53e5]'
            : 'bg-[#f23645] hover:bg-[#dc2a39]'
        }`}
      >
        {side === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
      </button>
    </form>
  );
};
