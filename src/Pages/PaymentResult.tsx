import { Link, useSearchParams } from "react-router-dom";

export function PaymentResultPage({ cancelled = false }: { cancelled?: boolean }) {
  const [params] = useSearchParams();
  const order = params.get("order");

  if (cancelled) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Payment cancelled</p>
        <h1 className="mt-3 text-5xl">Your order is still reserved</h1>
        <p className="mt-5 text-sm leading-7 text-mut">
          {order ? <>Order <strong className="text-fg">{order}</strong> was not paid. Your reservation will expire automatically if you do not return to payment.</> : "Your payment was not completed."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/checkout" className="bg-fg px-7 py-4 text-sm font-semibold text-bg">Return to checkout</Link>
          <Link to="/shop" className="border border-line px-7 py-4 text-sm font-semibold">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Payment received</p>
      <h1 className="mt-3 text-5xl">Thank you</h1>
      <p className="mt-5 text-sm leading-7 text-mut">
        Your payment has been submitted successfully. {order && <>Your order number is <strong className="text-fg">{order}</strong>.</>}
      </p>
      <p className="mt-3 text-sm leading-7 text-mut">
        We are confirming the payment and will use your email address for order updates.
      </p>
      <Link to="/shop" className="mt-8 inline-flex bg-fg px-7 py-4 text-sm font-semibold text-bg">Continue shopping</Link>
    </div>
  );
}
